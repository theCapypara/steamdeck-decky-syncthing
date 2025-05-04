use crate::checks::run_check;
use crate::service::{get_state, init_service, start_service, stop_service};
use crate::settings::SettingsProvider;
use hyper::{Body, Method, Request, Response, StatusCode};
use log::debug;
use std::collections::HashMap;
use std::convert::Infallible;
use std::fmt::Display;
use std::net::IpAddr;

const STATE_ROUTE: &str = "/__decky-watchdog/state";
const RELOAD_CONFIG_ROUTE: &str = "/__decky-watchdog/reload-config";
const START_ROUTE: &str = "/__decky-watchdog/start";
const STOP_ROUTE: &str = "/__decky-watchdog/stop";
const CHECK_ROUTE: &str = "/__decky-watchdog/check";

pub async fn handle_api(
    client_ip: &IpAddr,
    req: &Request<Body>,
    settings: &SettingsProvider,
) -> Option<Result<Response<Body>, Infallible>> {
    if !client_ip.is_loopback() {
        return None;
    }
    match *req.method() {
        Method::GET => {
            if req.uri().path().starts_with(STATE_ROUTE) {
                match get_state(&*settings.settings().await).await {
                    Ok(state) => Some(Ok(Response::builder()
                        .body(Body::from(state.as_static_str()))
                        .unwrap())),
                    Err(err) => Some(make_error_response(&err)),
                }
            } else {
                None
            }
        }
        Method::POST => {
            if req.uri().path().starts_with(RELOAD_CONFIG_ROUTE) {
                debug!("Reload config request");
                let response = match settings.reload().await {
                    Ok(()) => {
                        debug!("Reloaded config. Re-init service.");
                        match init_service(&*settings.settings().await).await {
                            Ok(()) => Some(make_empty_response()),
                            Err(err) => Some(make_error_response(&err)),
                        }
                    }
                    Err(err) => Some(make_error_response(&err)),
                };
                debug!("Reload config done: {:?}", response);
                response
            } else if req.uri().path().starts_with(START_ROUTE) {
                match start_service(&*settings.settings().await).await {
                    Ok(()) => Some(make_empty_response()),
                    Err(err) => Some(make_error_response(&err)),
                }
            } else if req.uri().path().starts_with(STOP_ROUTE) {
                match stop_service(&*settings.settings().await).await {
                    Ok(()) => Some(make_empty_response()),
                    Err(err) => Some(make_error_response(&err)),
                }
            } else if req.uri().path().starts_with(CHECK_ROUTE) {
                match run_check(settings, req.uri().path().trim_start_matches(CHECK_ROUTE)).await {
                    Ok(Some(res)) => Some(Ok(res)),
                    Ok(None) => Some(make_json_error_response(
                        "Unknown check.",
                        StatusCode::BAD_REQUEST,
                    )),
                    Err(err) => Some(make_json_error_response(
                        &err.to_string(),
                        StatusCode::INTERNAL_SERVER_ERROR,
                    )),
                }
            } else {
                None
            }
        }
        _ => None,
    }
}

pub fn make_empty_response() -> Result<Response<Body>, Infallible> {
    Ok(Response::builder()
        .status(StatusCode::NO_CONTENT)
        .body(Body::empty())
        .unwrap())
}

pub fn make_error_response(err: &dyn Display) -> Result<Response<Body>, Infallible> {
    Ok(Response::builder()
        .status(StatusCode::INTERNAL_SERVER_ERROR)
        .body(Body::from(format!(
            "<html><body><h1>Internal Server Error</h1><p><pre>{err}</pre></p></body></html>"
        )))
        .unwrap())
}

pub fn make_json_error_response(
    err: &str,
    status: StatusCode,
) -> Result<Response<Body>, Infallible> {
    let mut resp = HashMap::with_capacity(1);
    resp.insert("error", err);
    Ok(Response::builder()
        .status(status)
        .body(Body::from(serde_json::to_string(&resp).unwrap()))
        .unwrap())
}
