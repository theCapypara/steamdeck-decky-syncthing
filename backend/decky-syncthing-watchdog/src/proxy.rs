use crate::settings::SettingsProvider;
use crate::state::State;
use crate::util::make_unsafe_https_client;
use base64::Engine;
use hyper::client::HttpConnector;
use hyper::header::AUTHORIZATION;
use hyper::{Body, Request, Response, Uri};
use hyper_reverse_proxy::ReverseProxy;
use hyper_rustls::HttpsConnector;
use lazy_static::lazy_static;
use log::warn;
use std::convert::Infallible;
use std::fmt::Debug;
use std::mem::take;
use std::net::IpAddr;

const RESPONSE_BAD_GATEWAY: &str =
    "<html><body><h1>Bad Gateway</h1><p>Is Syncthing running?</p></body></html>";
const RESPONSE_TOO_EARLY: &str = "<html><body><h1>Too Early</h1><p>Syncthing is still starting, try again in a moment.</p></body></html>";

lazy_static! {
    static ref REVERSE_CLIENT: ReverseProxy<HttpsConnector<HttpConnector>> =
        ReverseProxy::new(make_unsafe_https_client::<Body>());
}

pub async fn handle_proxy(
    client_ip: IpAddr,
    mut req: Request<Body>,
    settings: &SettingsProvider,
    state: &State,
) -> Result<Response<Body>, Infallible> {
    let settings_lock = settings.settings().await;
    let port = settings_lock.port;
    let mut auth_header = None;
    if !settings_lock.basic_auth_user.is_empty() {
        let raw_auth_header = format!(
            "{}:{}",
            &settings_lock.basic_auth_user, settings_lock.basic_auth_pass
        );
        auth_header = Some(base64::engine::general_purpose::STANDARD.encode(raw_auth_header));
    }
    match settings.backend_uri().await {
        Ok((scheme, backend_uri)) => {
            // fake Host
            let uri = take(req.uri_mut());
            *req.uri_mut() = Uri::builder()
                .scheme(scheme)
                .authority(format!("127.0.0.1:{port}"))
                .path_and_query(uri.path_and_query().unwrap().clone())
                .build()
                .unwrap();
            if let Some(auth_header) = auth_header {
                if !req.headers().contains_key(AUTHORIZATION) {
                    req.headers_mut().insert(
                        AUTHORIZATION,
                        format!("Basic {auth_header}").parse().unwrap(),
                    );
                }
            }
            match REVERSE_CLIENT.call(client_ip, &backend_uri, req).await {
                Ok(response) => Ok(response),
                Err(err) => handle_proxy_error(err, state).await,
            }
        }
        Err(err) => handle_proxy_error(err, state).await,
    }
}

async fn handle_proxy_error(err: impl Debug, state: &State) -> Result<Response<Body>, Infallible> {
    let (status, body) = if state.wait().await {
        (425, Body::from(RESPONSE_TOO_EARLY))
    } else {
        warn!("Proxy failed: {err:?}");
        (502, Body::from(RESPONSE_BAD_GATEWAY))
    };
    Ok(Response::builder().status(status).body(body).unwrap())
}
