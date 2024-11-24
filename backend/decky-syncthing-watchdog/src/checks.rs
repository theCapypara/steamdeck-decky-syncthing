use crate::proxy::handle_proxy;
use crate::service::{get_state, init_service, start_service, stop_service, SyncthingState};
use crate::settings::{IsSetup, Mode, Settings, SettingsProvider};
use anyhow::anyhow;
use homedir::get_my_home;
use hyper::http::uri::Scheme;
use hyper::{body, Body, Request, Response, StatusCode, Uri};
use log::debug;
use serde::Serialize;
use std::fs::read_to_string;
use std::net::Ipv4Addr;
use std::time::Duration;
use sxd_xpath::evaluate_xpath;
use tokio::time::sleep;

const TESTING_AUTO_FAIL_SCANS: bool = false;

const START_ROUTE: &str = "/start";
const SCAN_PORT_ROUTE: &str = "/scan_port";
const SCAN_API_KEY_ROUTE: &str = "/scan_api_key";
const SCAN_BASIC_AUTH_ROUTE: &str = "/scan_basic_auth";

pub async fn run_check(
    settings: &SettingsProvider,
    route: &str,
) -> Result<Option<Response<Body>>, anyhow::Error> {
    settings.reload().await?;

    if route.starts_with(START_ROUTE) {
        Ok(Some(to_json_response(
            &start_check(&*settings.settings().await).await?,
        )?))
    } else if route.starts_with(SCAN_PORT_ROUTE) {
        Ok(Some(to_json_response(&scan_port(settings).await?)?))
    } else if route.starts_with(SCAN_API_KEY_ROUTE) {
        Ok(Some(to_json_response(
            &scan_api_key(&*settings.settings().await).await?,
        )?))
    } else if route.starts_with(SCAN_BASIC_AUTH_ROUTE) {
        Ok(Some(to_json_response(
            &basic_auth(&*settings.settings().await).await?,
        )?))
    } else {
        Ok(None)
    }
}

fn to_json_response(to_json: &impl Serialize) -> Result<Response<Body>, anyhow::Error> {
    Response::builder()
        .header("Content-Type", "application/json")
        .body(Body::from(serde_json::to_string(to_json)?))
        .map_err(Into::into)
}

#[derive(Debug, Serialize)]
struct StartResponse {
    success: bool,
    error: Option<String>,
    error_details: Option<String>,
}

async fn start_check(settings: &Settings) -> Result<StartResponse, anyhow::Error> {
    // Pretend to be initialized:
    let mut settings = settings.clone();
    settings.is_setup = IsSetup::Bool(true);

    stop_service(&settings).await.ok();
    sleep(Duration::from_secs(1)).await;

    if let Err(err) = init_service(&settings).await {
        return match settings.mode {
            Mode::Systemd => Ok(StartResponse {
                success: false,
                error: Some(format!(
                    "Failed to setup the Systemd service. Please check the service '{}' exists.",
                    settings.service_name
                )),
                error_details: Some(err.to_string()),
            }),
            Mode::SystemdSystem => Ok(StartResponse {
                success: false,
                error: Some(format!(
                    "Failed to setup the Systemd service. Please check the service '{}' exists and can be managed by the current user (without sudo).",
                    settings.service_name
                )),
                error_details: Some(err.to_string()),
            }),
            Mode::Flatpak => {
                // In Flatpak mode, this shouldn't fail.
                Err(err.into())
            }
        };
    }

    if let Err(err) = start_service(&settings).await {
        return Ok(StartResponse {
            success: false,
            error: Some("Failed to start Syncthing.".to_string()),
            error_details: Some(err.to_string()),
        });
    }

    sleep(Duration::from_secs(3)).await;
    for _ in 0..7 {
        if matches!(get_state(&settings).await, Ok(SyncthingState::Running)) {
            return Ok(StartResponse {
                success: true,
                error: None,
                error_details: None,
            });
        }
        sleep(Duration::from_secs(1)).await;
    }

    let error = match settings.mode {
        Mode::Systemd => "Failed to start Syncthing.".to_string(),
        Mode::SystemdSystem => "Failed to start Syncthing. Please check that the current user has permissions to manage the service.".to_string(),
        Mode::Flatpak => format!(
            "Failed to start Syncthing. Please check the Flatpak '{}' is installed.",
            settings.flatpak_name
        ),
    };

    Ok(StartResponse {
        success: false,
        error: Some(error),
        error_details: None,
    })
}

#[derive(Debug, Serialize)]
struct ScanPortResponse {
    port: Option<u32>,
}

async fn scan_port(
    settings_provider: &SettingsProvider,
) -> Result<ScanPortResponse, anyhow::Error> {
    static TRY_PORTS: &[u32] = &[8384, 8080];

    if TESTING_AUTO_FAIL_SCANS {
        return Ok(ScanPortResponse { port: None });
    }

    // First just try to check the config.
    if let Some(port) = get_config(&*settings_provider.settings().await)
        .await
        .and_then(|config| {
            let doc = config.as_document();
            let port = evaluate_xpath(&doc, "/configuration/gui/address")
                .ok()?
                .string();
            let parts = port.split(':');
            let port = parts.into_iter().nth(1);
            port.and_then(|port_str| port_str.parse::<u32>().ok())
        })
    {
        debug!("Found port {port} in config. Trying it.");
        // Try it out:
        Ok(ScanPortResponse {
            port: try_port(port, settings_provider).await.ok(),
        })
    } else {
        // Fall back to trying.
        for port in TRY_PORTS {
            if let Ok(port) = try_port(*port, settings_provider).await {
                return Ok(ScanPortResponse { port: Some(port) });
            }
        }
        Ok(ScanPortResponse { port: None })
    }
}

async fn try_port(port: u32, settings_provider: &SettingsProvider) -> Result<u32, anyhow::Error> {
    debug!("Trying port {port}.");
    let body = Request::builder()
        .uri(
            Uri::builder()
                .scheme(Scheme::HTTP)
                .authority(format!("127.0.0.1:{port}"))
                .path_and_query("/")
                .build()
                .unwrap(),
        )
        .header("User-Agent", "watchdog")
        .body(Body::empty())
        .unwrap();
    let proxy_reponse =
        handle_proxy(Ipv4Addr::new(127, 0, 0, 1).into(), body, settings_provider).await?;
    if proxy_reponse.status() == StatusCode::OK {
        let (_, rbody) = proxy_reponse.into_parts();
        let content = String::from_utf8(body::to_bytes(rbody).await?.to_vec())?;
        if content.contains("syncthing/app.js") {
            debug!("Port check request OK!");
            Ok(port)
        } else {
            debug!("Port check request succeeded but doesn't seem to be Syncthing.");
            Err(anyhow!("Port not found"))
        }
    } else {
        debug!("Port check request failed.");
        Err(anyhow!("Request failed"))
    }
}

#[derive(Debug, Serialize)]
struct ScanApiKeyResponse {
    api_key: Option<String>,
}

async fn scan_api_key(settings: &Settings) -> Result<ScanApiKeyResponse, anyhow::Error> {
    if TESTING_AUTO_FAIL_SCANS {
        return Ok(ScanApiKeyResponse { api_key: None });
    }

    Ok(ScanApiKeyResponse {
        api_key: get_config(settings).await.and_then(|config| {
            let doc = config.as_document();
            let api_key = evaluate_xpath(&doc, "/configuration/gui/apikey").ok()?;
            Some(api_key.string())
        }),
    })
}

#[derive(Debug, Serialize)]
struct BasicAuthResponse {
    basic_auth_user: Option<String>,
}

async fn basic_auth(settings: &Settings) -> Result<BasicAuthResponse, anyhow::Error> {
    if TESTING_AUTO_FAIL_SCANS {
        return Ok(BasicAuthResponse {
            basic_auth_user: Some("foobar".to_string()),
        });
    }
    // we may actually check if basic_auth is needed later. For now we just check if
    // it's configured.

    Ok(BasicAuthResponse {
        basic_auth_user: get_config(settings).await.and_then(|config| {
            let doc = config.as_document();
            let maybe_user = evaluate_xpath(&doc, "/configuration/gui/user")
                .ok()?
                .string();
            if maybe_user.trim().is_empty() {
                None
            } else {
                Some(maybe_user)
            }
        }),
    })
}

async fn get_config(settings: &Settings) -> Option<sxd_document::Package> {
    let home = match get_my_home() {
        Ok(Some(home)) => home,
        _ => {
            return None;
        }
    };

    let probable_path_to_settings = match settings.mode {
        Mode::Systemd | Mode::SystemdSystem => {
            home.join(".config").join("syncthing").join("config.xml")
        }
        Mode::Flatpak => home
            .join(".var")
            .join("app")
            .join(&settings.flatpak_name)
            .join("config")
            .join("syncthing")
            .join("config.xml"),
    };

    sxd_document::parser::parse(&read_to_string(probable_path_to_settings).ok()?).ok()
}
