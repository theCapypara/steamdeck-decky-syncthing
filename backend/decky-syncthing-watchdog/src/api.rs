use crate::settings::SettingsProvider;
use crate::state::State;
use hyper::{Body, Method, Request, Response, StatusCode};
use std::convert::Infallible;
use std::error::Error;
use std::net::IpAddr;

const STATE_ROUTE: &str = "/__decky-watchdog/state";
const RELOAD_CONFIG_ROUTE: &str = "/__decky-watchdog/reload-config";
const START_ROUTE: &str = "/__decky-watchdog/start";
const STOP_ROUTE: &str = "/__decky-watchdog/stop";

pub async fn handle_api(
    client_ip: &IpAddr,
    req: &Request<Body>,
    settings: &SettingsProvider,
    state: &State,
) -> Option<Result<Response<Body>, Infallible>> {
    if !client_ip.is_loopback() {
        return None;
    }
    match *req.method() {
        Method::GET => {
            if req.uri().path().starts_with(STATE_ROUTE) {
                match state.get().await {
                    Ok(state) => Some(Ok(Response::builder().body(Body::from(state)).unwrap())),
                    Err(err) => Some(make_error_response(&err)),
                }
            } else {
                None
            }
        }
        Method::POST => {
            if req.uri().path().starts_with(RELOAD_CONFIG_ROUTE) {
                match settings.reload().await {
                    Ok(()) => Some(make_empty_response()),
                    Err(err) => Some(make_error_response(&err)),
                }
            } else if req.uri().path().starts_with(START_ROUTE) {
                match state.start().await {
                    Ok(()) => Some(make_empty_response()),
                    Err(err) => Some(make_error_response(&err)),
                }
            } else if req.uri().path().starts_with(STOP_ROUTE) {
                match state.stop().await {
                    Ok(()) => Some(make_empty_response()),
                    Err(err) => Some(make_error_response(&err)),
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

pub fn make_error_response(err: &dyn Error) -> Result<Response<Body>, Infallible> {
    Ok(Response::builder()
        .status(StatusCode::INTERNAL_SERVER_ERROR)
        .body(Body::from(format!(
            "<html><body><h1>Internal Server Error</h1><p><pre>{err}</pre></p></body></html>"
        )))
        .unwrap())
}
