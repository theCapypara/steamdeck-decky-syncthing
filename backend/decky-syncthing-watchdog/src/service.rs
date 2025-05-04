//! Manages the Systemd service.
//! If in Flatpak mode: Installs a custom service and controls it.
//! If not in Flatpak mode: Uninstalls it (if exists) and controls the configured service.

use crate::settings::{Autostart, Mode, Settings};
use homedir::get_my_home;
use lazy_static::lazy_static;
use log::{debug, info, warn};
use std::io;
use std::path::PathBuf;
use std::time::Duration;
use tokio::fs;
use tokio::sync::Mutex;
use tokio::time::Instant;
use which::which;

pub use systemctl::State as SyncthingState;

lazy_static! {
    static ref LAST_START: Mutex<Option<Instant>> = Mutex::new(None);
    static ref WHICH_FLATPAK: Result<PathBuf, which::Error> = which("flatpak");
    static ref SERVICE_DIR: Option<PathBuf> = get_my_home()
        .transpose()
        .and_then(|x| x.ok())
        .map(|h| h.join(".config").join("systemd").join("user"));
}

pub type ServiceError = io::Error;

enum ServiceType<'a> {
    Managed,
    External { name: &'a str, user_service: bool },
}

impl<'a> ServiceType<'a> {
    const MANAGED_SERVICE_NAME: &'static str = "decky-syncthing";

    fn get_for(settings: &'a Settings) -> Self {
        match settings.mode {
            Mode::Systemd => Self::External {
                name: &settings.service_name,
                user_service: true,
            },
            Mode::SystemdSystem => Self::External {
                name: &settings.service_name,
                user_service: false,
            },
            Mode::Flatpak => Self::Managed,
        }
    }

    fn systemd_unit(&'a self) -> (&'a str, bool) {
        match self {
            ServiceType::Managed => (Self::MANAGED_SERVICE_NAME, true),
            ServiceType::External { name, user_service } => (name, *user_service),
        }
    }
}

pub async fn init_service(settings: &Settings) -> Result<(), ServiceError> {
    if settings.is_not_setup() {
        info!("Skipping service setup: Configuration not setup.");
        return Ok(());
    }
    debug!("Init service");
    let service_type = ServiceType::get_for(settings);
    let managed_service_name = ServiceType::Managed.systemd_unit().0;
    match &service_type {
        ServiceType::Managed => {
            // Create/Update the managed service.
            debug!("Create managed service service");
            create_managed_service(
                managed_service_name,
                &settings.flatpak_name,
                &settings.flatpak_binary,
            )
            .await?;
            systemctl::daemon_reload().await?;
            // Enable or disable the managed service based on autostart settings.
            match settings.autostart {
                Autostart::Boot => {
                    debug!("Enable service {managed_service_name}");
                    systemctl::enable(managed_service_name, true).await?;
                }
                _ => {
                    // if mode is gamescope, this process will start it manually.
                    debug!("Disable service {managed_service_name}");
                    systemctl::disable(managed_service_name, true).await?;
                }
            }
        }
        ServiceType::External { name, user_service } => {
            // Disable & delete the managed service.
            if service_exists_in_config(managed_service_name).await? {
                debug!("Disable and delete managed service");
                systemctl::disable(managed_service_name, true).await.ok();

                let r = delete_managed_service(managed_service_name).await;
                if r.is_ok() {
                    systemctl::daemon_reload().await.ok();
                }
            }
            // Enable or disable the external service based on autostart settings.
            match settings.autostart {
                Autostart::Boot => {
                    debug!("Enable service {name}");
                    if let Err(e) = systemctl::enable(name, *user_service).await {
                        warn!(
                            "failed to enable external service via systemd. Autostart will not work: {e:?}"
                        );
                    }
                }
                _ => {
                    debug!("Disable service {name}");
                    if let Err(e) = systemctl::disable(name, *user_service).await {
                        warn!(
                            "failed to disable external service via systemd. Service will still autostart: {e:?}"
                        );
                    }
                }
            }
        }
    }
    debug!("Init service done");
    Ok(())
}

pub async fn get_state(settings: &Settings) -> Result<SyncthingState, ServiceError> {
    debug!("get_state");
    let service_type = ServiceType::get_for(settings);
    let (service_name, is_user_service) = service_type.systemd_unit();
    systemctl::state(service_name, is_user_service).await
}

pub async fn start_service(settings: &Settings) -> Result<(), ServiceError> {
    if settings.is_not_setup() {
        info!("Skipping service start: Configuration not setup.");
        return Ok(());
    }
    debug!("start_service");
    let service_type = ServiceType::get_for(settings);
    let (service_name, is_user_service) = service_type.systemd_unit();
    let r = systemctl::start(service_name, is_user_service).await;
    if r.is_ok() {
        *LAST_START.lock().await = Some(Instant::now());
    }
    r
}

pub async fn stop_service(settings: &Settings) -> Result<(), ServiceError> {
    if settings.is_not_setup() {
        info!("Skipping service stop: Configuration not setup.");
        return Ok(());
    }
    debug!("stop_service");
    let service_type = ServiceType::get_for(settings);
    let (service_name, is_user_service) = service_type.systemd_unit();
    systemctl::stop(service_name, is_user_service).await
}

pub async fn last_start_ago() -> Duration {
    debug!("last_start_ago");
    let last_update = LAST_START.lock().await;
    match &*last_update {
        None => Duration::from_secs(999),
        Some(last_update) => Instant::now().duration_since(*last_update),
    }
}

fn service_path(unit: &str) -> Result<PathBuf, io::Error> {
    SERVICE_DIR
        .as_ref()
        .map(|x| x.join(format!("{unit}.service")))
        .ok_or_else(|| io::Error::new(io::ErrorKind::NotFound, "home dir not found"))
}

async fn create_managed_service(
    unit: &str,
    flatpak: &str,
    flatpak_exec: &str,
) -> Result<(), io::Error> {
    let path = service_path(unit)?;
    fs::create_dir_all(path.parent().unwrap()).await?;
    let flatpak_cmd = WHICH_FLATPAK
        .as_ref()
        .map_err(|e| io::Error::new(io::ErrorKind::Other, *e))?
        .to_str()
        .unwrap();
    fs::write(
        path,
        format!(
            "[Unit]
Description=Decky managed Syncthing starter - Open Source Continuous File Synchronization

[Service]
ExecStart={} run --die-with-parent --command={} {} -no-browser -no-restart
Restart=on-failure
SuccessExitStatus=3 4
RestartForceExitStatus=3 4

[Install]
WantedBy=default.target",
            flatpak_cmd, flatpak_exec, flatpak
        ),
    )
    .await
}

async fn delete_managed_service(unit: &str) -> Result<(), io::Error> {
    fs::remove_file(service_path(unit)?).await
}

async fn service_exists_in_config(unit: &str) -> Result<bool, io::Error> {
    Ok(service_path(unit)?.exists())
}

mod systemctl {
    use lazy_static::lazy_static;
    use log::debug;
    use std::io;
    use std::iter::once;
    use std::path::PathBuf;
    use std::process::ExitStatus;
    use tokio::io::AsyncReadExt;
    use tokio::process::{Child, Command};
    use which::which;

    lazy_static! {
        static ref WHICH_SYSTEMCTL: Result<PathBuf, which::Error> = which("systemctl");
    }

    #[derive(Debug, Clone, Copy)]
    pub enum State {
        Running,
        Stopped,
        Failed,
    }

    impl State {
        pub fn as_static_str(self) -> &'static str {
            match self {
                State::Running => "running",
                State::Stopped => "stopped",
                State::Failed => "failed",
            }
        }
    }

    /// Invokes `systemctl $args`
    fn spawn_child(args: &[&str], is_user_service: bool) -> io::Result<Child> {
        if is_user_service {
            debug!("systemctl: --user {}", args.join(" "));
            Command::new(
                WHICH_SYSTEMCTL
                    .as_ref()
                    .map_err(|e| io::Error::new(io::ErrorKind::Other, *e))?,
            )
            .args(once("--user").chain(args.iter().copied()))
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::piped())
            .spawn()
        } else {
            debug!("systemctl: {}", args.join(" "));
            Command::new(
                WHICH_SYSTEMCTL
                    .as_ref()
                    .map_err(|e| io::Error::new(io::ErrorKind::Other, *e))?,
            )
            .args(args.iter().copied())
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::piped())
            .spawn()
        }
    }

    async fn systemctl_raw(args: Vec<&str>, is_user_service: bool) -> io::Result<ExitStatus> {
        spawn_child(&args, is_user_service)?.wait().await
    }

    async fn systemctl(args: Vec<&str>, is_user_service: bool) -> io::Result<()> {
        let mut child = spawn_child(&args, is_user_service)?;
        let exit = child.wait().await?;
        if exit.success() {
            Ok(())
        } else {
            let mut stderr: Vec<u8> = Vec::new();
            child.stderr.unwrap().read_to_end(&mut stderr).await?;
            let stderr_str =
                String::from_utf8(stderr).unwrap_or_else(|_| "<invalid/empty stderr>".to_string());
            Err(io::Error::new(
                io::ErrorKind::Other,
                format!(
                    "Failed to run systemctl command ('{}'): {}. Stderr: {}",
                    args.first().unwrap(),
                    exit,
                    stderr_str
                ),
            ))
        }
    }

    pub async fn daemon_reload() -> io::Result<()> {
        systemctl(vec!["daemon-reload"], true).await
    }

    pub async fn start(unit: &str, is_user_service: bool) -> io::Result<()> {
        systemctl(vec!["start", unit], is_user_service).await
    }

    pub async fn stop(unit: &str, is_user_service: bool) -> io::Result<()> {
        systemctl(vec!["stop", unit], is_user_service).await
    }

    pub async fn enable(unit: &str, is_user_service: bool) -> io::Result<()> {
        systemctl(vec!["enable", unit], is_user_service).await
    }

    pub async fn disable(unit: &str, is_user_service: bool) -> io::Result<()> {
        systemctl(vec!["disable", unit], is_user_service).await
    }

    pub async fn state(unit: &str, is_user_service: bool) -> io::Result<State> {
        if systemctl_raw(vec!["is-active", unit], is_user_service)
            .await?
            .success()
        {
            Ok(State::Running)
        } else if systemctl_raw(vec!["is-failed", unit], is_user_service)
            .await?
            .success()
        {
            Ok(State::Failed)
        } else {
            Ok(State::Stopped)
        }
    }
}
