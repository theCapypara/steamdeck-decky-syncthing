use crate::util::make_unsafe_https_client;
use hyper::http::uri::Scheme;
use hyper::{Body, Method, Request, Uri};
use serde::de::Unexpected;
use serde::{Deserialize, Deserializer};
use std::io;
use std::ops::Deref;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use thiserror::Error;
use tokio::fs::read_to_string;
use tokio::join;
use tokio::sync::RwLock;

#[derive(Debug, Error)]
pub enum SettingsError {
    #[error("I/O error: {0}")]
    Io(#[from] io::Error),
    #[error("Error reading settings JSON: {0}")]
    SerdeJson(#[from] serde_json::Error),
    #[error("Was not able to determine backend scheme due to a request not being sucessful to either HTTPS or HTTP.")]
    BackendOffline,
    #[error("Error during an HTTP request: {0}")]
    Hyper(#[from] hyper::http::Error),
    #[error("Unsupported config version. Is: {0}, Need: {1}")]
    UnsupportedVersion(u32, u32),
}

#[derive(Debug, Deserialize, PartialEq, Eq, Clone, Copy)]
#[serde(rename_all = "lowercase")]
pub enum Mode {
    Systemd,
    Flatpak,
}

#[derive(Debug, Deserialize, PartialEq, Eq, Clone, Copy)]
#[serde(rename_all = "lowercase")]
pub enum Autostart {
    No,
    Boot,
    Gamescope,
}

#[derive(Debug, Deserialize, PartialEq, Eq, Clone)]
#[serde(untagged)]
pub enum IsSetup {
    Bool(bool),
    Other(String),
}

#[derive(Debug, Deserialize, Clone)]
#[allow(unused)]
// v2
pub struct Settings {
    #[serde(deserialize_with = "try_deserialize_u32_from_str")]
    config_version: u32,
    pub mode: Mode,
    // Mode: systemd
    pub service_name: String,
    // Mode: flatpak
    pub flatpak_name: String,
    pub flatpak_binary: String,
    // General:
    pub autostart: Autostart,
    pub keep_running_on_desktop: bool,
    #[serde(deserialize_with = "try_deserialize_u32_from_str")]
    pub port: u32,
    api_key: String,
    pub basic_auth_user: String,
    pub basic_auth_pass: String,
    pub is_setup: IsSetup,
}

impl Settings {
    pub const SUPPORTED_VERSION: u32 = 2;

    async fn new(path: &Path) -> Result<Self, SettingsError> {
        let slf: Self = serde_json::from_str(&read_to_string(path).await?)?;
        if slf.config_version != Self::SUPPORTED_VERSION {
            return Err(SettingsError::UnsupportedVersion(
                slf.config_version,
                Self::SUPPORTED_VERSION,
            ));
        }
        Ok(slf)
    }

    pub fn is_not_setup(&self) -> bool {
        self.is_setup != IsSetup::Bool(true)
    }
}

pub struct SettingsProvider {
    settings_path: PathBuf,
    current_settings: RwLock<Settings>,
    backend_uri_cache: RwLock<Option<(Scheme, String)>>,
}

impl SettingsProvider {
    pub async fn new(settings_path: PathBuf) -> Result<Arc<Self>, SettingsError> {
        let current_settings = RwLock::new(Settings::new(&settings_path).await?);
        Ok(Arc::new(Self {
            settings_path,
            current_settings,
            backend_uri_cache: RwLock::default(),
        }))
    }
    pub async fn backend_uri(&self) -> Result<(Scheme, String), SettingsError> {
        let backend_uri_cache_read = self.backend_uri_cache.read().await;
        match &*backend_uri_cache_read {
            Some((scheme, uri)) => Ok((scheme.clone(), uri.clone())),
            None => {
                drop(backend_uri_cache_read);
                let mut backend_uri_cache_write = self.backend_uri_cache.write().await;
                let settings_read = self.current_settings.read().await;

                // try https first, if that fails, http, if that also fails, eh
                let client = make_unsafe_https_client::<Body>();

                let https_uri = Uri::builder()
                    .scheme(Scheme::HTTPS)
                    .authority(format!("127.0.0.1:{}", settings_read.port))
                    .path_and_query("/")
                    .build()?;
                let https_req = Request::builder()
                    .method(Method::HEAD)
                    .uri(https_uri.clone())
                    .body(Body::empty())?;
                match client.request(https_req).await {
                    Ok(_) => {
                        *backend_uri_cache_write = Some((Scheme::HTTPS, https_uri.to_string()));
                        Ok((Scheme::HTTPS, https_uri.to_string()))
                    }
                    Err(_) => {
                        // http time!
                        let http_uri = Uri::builder()
                            .scheme(Scheme::HTTP)
                            .authority(format!("127.0.0.1:{}", settings_read.port))
                            .path_and_query("/")
                            .build()?;
                        let http_req = Request::builder()
                            .method(Method::HEAD)
                            .uri(http_uri.clone())
                            .body(Body::empty())?;
                        match client.request(http_req).await {
                            Ok(_) => {
                                *backend_uri_cache_write =
                                    Some((Scheme::HTTP, http_uri.to_string()));
                                Ok((Scheme::HTTP, http_uri.to_string()))
                            }
                            Err(_) => Err(SettingsError::BackendOffline),
                        }
                    }
                }
            }
        }
    }

    pub async fn reload(&self) -> Result<(), SettingsError> {
        let (mut cs_lock, mut buc_lock) = join!(
            self.current_settings.write(),
            self.backend_uri_cache.write()
        );
        *cs_lock = Settings::new(&self.settings_path).await?;
        *buc_lock = None;
        Ok(())
    }

    pub async fn settings(&self) -> impl Deref<Target = Settings> + '_ {
        self.current_settings.read().await
    }
}

/// Try to deserialize an u32 from a string if it is a string for some reasons. Otherwise
/// deserialize directly.
fn try_deserialize_u32_from_str<'de, D>(deserializer: D) -> Result<u32, D::Error>
where
    D: Deserializer<'de>,
{
    #[derive(Deserialize)]
    #[serde(untagged)]
    enum MaybeU32<'a> {
        String(&'a str),
        U32(u32),
    }

    match MaybeU32::deserialize(deserializer)? {
        MaybeU32::String(string) => {
            if let Ok(num) = string.parse::<u32>() {
                return Ok(num);
            }
            Err(serde::de::Error::invalid_type(
                Unexpected::Str(string),
                &"an u32 integer",
            ))
        }
        MaybeU32::U32(v) => Ok(v),
    }
}
