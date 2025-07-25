use crate::proxy::handle_proxy;
use crate::service::{SyncthingState, get_state, init_service, start_service, stop_service};
use crate::settings::{IsSetup, Mode, Settings, SettingsProvider};
use crate::util::make_unsafe_https_client;
use anyhow::anyhow;
use homedir::my_home;
use hyper::http::uri::Scheme;
use hyper::{Body, Method, Request, Response, StatusCode, Uri, body};
use log::{debug, warn};
use serde::Serialize;
use std::env;
use std::fs::read_to_string;
use std::net::Ipv4Addr;
use std::path::{Path, PathBuf};
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
        Ok(Some(to_json_response(&scan_api_key(settings).await?)?))
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
                Err(err)
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

async fn scan_api_key(settings: &SettingsProvider) -> Result<ScanApiKeyResponse, anyhow::Error> {
    if TESTING_AUTO_FAIL_SCANS {
        return Ok(ScanApiKeyResponse { api_key: None });
    }

    let api_key = get_config(&*settings.settings().await)
        .await
        .and_then(|config| {
            let doc = config.as_document();
            let api_key = evaluate_xpath(&doc, "/configuration/gui/apikey").ok()?;
            Some(api_key.string())
        });

    if let Some(api_key) = api_key.as_ref() {
        if !test_api_key(settings, api_key).await {
            return Ok(ScanApiKeyResponse { api_key: None });
        }
    }

    Ok(ScanApiKeyResponse { api_key })
}

/// Check if an API key is actually usable
async fn test_api_key(settings: &SettingsProvider, key: &str) -> bool {
    let client = make_unsafe_https_client::<Body>();
    match settings.backend_uri().await {
        Ok((_, backend_uri)) => {
            let uri = format!("{backend_uri}rest/system/status");
            debug!("Testing API key against {}", uri);
            let req = hyper::Request::builder()
                .method(Method::GET)
                .uri(uri)
                .header("X-API-Key", key)
                .body(Body::empty())
                .unwrap();
            match client.request(req).await {
                Ok(res) => {
                    if res.status().is_success() {
                        true
                    } else {
                        warn!(
                            "Testing the API key failed due to non 200-response: {}",
                            res.status()
                        );
                        false
                    }
                }
                Err(err) => {
                    warn!("Testing the API key failed due to request failure: {}", err);
                    false
                }
            }
        }
        Err(err) => {
            warn!(
                "Testing the API key failed due to failing to get backend URI: {}",
                err
            );
            false
        }
    }
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
    let home = match my_home() {
        Ok(Some(home)) => home,
        _ => {
            return None;
        }
    };

    let mut possible_paths = Vec::with_capacity(6);
    if settings.mode == Mode::Flatpak || settings._wizard_force_flatpak_config_for.is_some() {
        let flatpak_name = settings
            ._wizard_force_flatpak_config_for
            .as_deref()
            .unwrap_or(&settings.flatpak_name);
        possible_paths.push(
            home.join(".var")
                .join("app")
                .join(flatpak_name)
                .join(".local")
                .join("state")
                .join("syncthing")
                .join("config.xml"),
        );
        possible_paths.push(
            home.join(".var")
                .join("app")
                .join(flatpak_name)
                .join("config")
                .join("syncthing")
                .join("config.xml"),
        );
    }

    if let Ok(var) = env::var("XDG_STATE_HOME") {
        possible_paths.push(PathBuf::from(var).join("syncthing").join("config.xml"));
    }
    if let Ok(var) = env::var("XDG_CONFIG_HOME") {
        possible_paths.push(PathBuf::from(var).join("syncthing").join("config.xml"));
    }
    possible_paths.push(
        home.join(".local")
            .join("state")
            .join("syncthing")
            .join("config.xml"),
    );
    possible_paths.push(home.join(".config").join("syncthing").join("config.xml"));

    for path in possible_paths {
        if let Some(config) = try_read_config(&path) {
            debug!("detected config path: {}", path.display());
            return Some(config);
        }
    }
    warn!("did not find syncthing config file");
    None
}

fn try_read_config(path: &Path) -> Option<sxd_document::Package> {
    sxd_document::parser::parse(&read_to_string(path).ok()?).ok()
}
