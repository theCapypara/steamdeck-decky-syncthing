//! Manages the Systemd service.
//! If in Flatpak mode: Installs a custom service and controls it.
//! If not in Flatpak mode: Uninstalls it (if exists) and controls the configured service.

use crate::settings::{Autostart, Mode, Settings};
use homedir::my_home;
use log::{debug, info, warn};
use std::io;
use std::path::PathBuf;
use std::sync::LazyLock;
use std::time::Duration;
use tokio::fs;
use tokio::sync::Mutex;
use tokio::time::Instant;
use which::which;

pub use systemctl::State as SyncthingState;
use systemctl::{SessionType, Systemctl};

static LAST_START: LazyLock<Mutex<Option<Instant>>> = LazyLock::new(Default::default);
static WHICH_FLATPAK: LazyLock<Result<PathBuf, which::Error>> = LazyLock::new(|| which("flatpak"));
static SERVICE_DIR: LazyLock<Option<PathBuf>> = LazyLock::new(|| {
    my_home()
        .transpose()
        .and_then(|x| x.ok())
        .map(|h| h.join(".config").join("systemd").join("user"))
});

pub type ServiceError = anyhow::Error;

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
    let systemctl_user = Systemctl::new(SessionType::Session).await?;
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
            systemctl_user.daemon_reload().await?;
            // Enable or disable the managed service based on autostart settings.
            match settings.autostart {
                Autostart::Boot => {
                    debug!("Enable service {managed_service_name}");
                    systemctl_user.enable(managed_service_name).await?;
                }
                _ => {
                    // if mode is gamescope, this process will start it manually.
                    debug!("Disable service {managed_service_name}");
                    systemctl_user.disable(managed_service_name).await?;
                }
            }
        }
        ServiceType::External { name, user_service } => {
            // Disable & delete the managed service.
            if service_exists_in_config(managed_service_name).await? {
                debug!("Disable and delete managed service");
                systemctl_user.disable(managed_service_name).await.ok();

                let r = delete_managed_service(managed_service_name).await;
                if r.is_ok() {
                    systemctl_user.daemon_reload().await.ok();
                }
            }
            // Enable or disable the external service based on autostart settings.
            let systemctl_client = match *user_service {
                true => systemctl_user,
                false => Systemctl::new(SessionType::System).await?,
            };
            match settings.autostart {
                Autostart::Boot => {
                    debug!("Enable service {name}");
                    if let Err(e) = systemctl_client.enable(name).await {
                        warn!(
                            "failed to enable external service via systemd. Autostart will not work: {e:?}"
                        );
                    }
                }
                _ => {
                    debug!("Disable service {name}");
                    if let Err(e) = systemctl_client.disable(name).await {
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
    let systemctl_client = match is_user_service {
        true => Systemctl::new(SessionType::Session),
        false => Systemctl::new(SessionType::System),
    }
    .await?;
    systemctl_client.state(service_name).await
}

pub async fn start_service(settings: &Settings) -> Result<(), ServiceError> {
    if settings.is_not_setup() {
        info!("Skipping service start: Configuration not setup.");
        return Ok(());
    }
    debug!("start_service");
    let service_type = ServiceType::get_for(settings);
    let (service_name, is_user_service) = service_type.systemd_unit();
    let systemctl_client = match is_user_service {
        true => Systemctl::new(SessionType::Session),
        false => Systemctl::new(SessionType::System),
    }
    .await?;
    let r = systemctl_client.start(service_name).await;
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
    let systemctl_client = match is_user_service {
        true => Systemctl::new(SessionType::Session),
        false => Systemctl::new(SessionType::System),
    }
    .await?;
    systemctl_client.stop(service_name).await
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

pub mod systemctl {
    use anyhow::anyhow;
    use log::{debug, error};
    use systemd_zbus::{ActiveState, JobRemovedArgs, ManagerProxy, Mode, ServiceProxy, UnitProxy};
    use zbus::export::ordered_stream::OrderedStreamExt;
    use zbus::zvariant::OwnedObjectPath;

    pub enum SessionType {
        Session,
        System,
    }

    pub struct Systemctl<'a>(zbus::Connection, ManagerProxy<'a>);

    impl Systemctl<'_> {
        pub async fn new(session_type: SessionType) -> anyhow::Result<Self> {
            debug!("systemd: creating session");
            let conn = match session_type {
                SessionType::Session => zbus::Connection::session().await,
                SessionType::System => zbus::Connection::system().await,
            }?;
            let proxy = ManagerProxy::new(&conn).await?;
            Ok(Self(conn, proxy))
        }

        pub async fn daemon_reload(&self) -> anyhow::Result<()> {
            debug!("systemd: reloading daemon");
            Ok(self.1.reload().await?)
        }

        pub async fn start(&self, unit: &str) -> anyhow::Result<()> {
            debug!("systemd: starting {unit}");
            if !unit.ends_with(".service") {
                let unit = format!("{unit}.service");
                self.run_job(|proxy| proxy.start_unit(&unit, Mode::Replace))
                    .await
            } else {
                self.run_job(|proxy| proxy.start_unit(unit, Mode::Replace))
                    .await
            }
        }

        pub async fn stop(&self, unit: &str) -> anyhow::Result<()> {
            debug!("systemd: stopping {unit}");
            if !unit.ends_with(".service") {
                let unit = format!("{unit}.service");
                self.run_job(|proxy| proxy.stop_unit(&unit, Mode::Replace))
                    .await
            } else {
                self.run_job(|proxy| proxy.stop_unit(unit, Mode::Replace))
                    .await
            }
        }

        pub async fn enable(&self, unit: &str) -> anyhow::Result<()> {
            debug!("systemd: enabling {unit}");
            if !unit.ends_with(".service") {
                let unit = format!("{unit}.service");
                self.1.enable_unit_files(&[&unit], false, false).await?;
            } else {
                self.1.enable_unit_files(&[unit], false, false).await?;
            }
            Ok(())
        }

        pub async fn disable(&self, unit: &str) -> anyhow::Result<()> {
            debug!("systemd: disabling {unit}");
            if !unit.ends_with(".service") {
                let unit = format!("{unit}.service");
                self.1.disable_unit_files(&[&unit], false).await?;
            } else {
                self.1.disable_unit_files(&[unit], false).await?;
            }
            Ok(())
        }

        pub async fn state(&self, unit: &str) -> anyhow::Result<State> {
            debug!("systemd: getting state for {unit}");
            let unit_result = if !unit.ends_with(".service") {
                let unit = format!("{unit}.service");
                self.1.get_unit(&unit).await
            } else {
                self.1.get_unit(unit).await
            };

            let Ok(path) = unit_result else {
                // Could probably also just error out.
                return Ok(State::Failed);
            };

            let unit_obj = UnitProxy::builder(&self.0).path(path)?.build().await?;

            Ok(match unit_obj.active_state().await? {
                ActiveState::Active => State::Running,
                ActiveState::Reloading => State::Running,
                ActiveState::Inactive => State::Stopped,
                ActiveState::Failed => State::Failed,
                ActiveState::Activating => State::Stopped,
                ActiveState::Deactivating => State::Stopped,
                ActiveState::Maintenance => State::Stopped,
            })
        }

        async fn run_job<'a, 'b, F, Fut>(&'a self, job: F) -> anyhow::Result<()>
        where
            F: FnOnce(&'a ManagerProxy<'a>) -> Fut,
            Fut: Future<Output = zbus::Result<OwnedObjectPath>> + 'b,
            'a: 'b,
        {
            let mut job_removed_stream = self.1.receive_job_removed().await?;
            let result_path = job(&self.1).await?.into_inner();
            while let Some(msg) = job_removed_stream.next().await {
                let args = msg.args()?;
                debug!(
                    "systemd: job removed: {} for {}: {}",
                    args.id, args.unit, args.result
                );
                if msg.args()?.job == result_path {
                    debug!("systemd: our job, checking result");
                    return self.check_job_status(args).await;
                }
            }
            Err(anyhow!("failed to wait for job"))
        }

        // See https://github.com/systemd/systemd/blob/main/src/shared/bus-wait-for-jobs.c#L217 for reference
        async fn check_job_status(&self, msg: JobRemovedArgs<'_>) -> anyhow::Result<()> {
            match msg.result {
                "done" | "skipped" => {
                    debug!("systemd: job done or skipped");
                    Ok(())
                }
                "canceled" | "timeout" | "dependency" | "invalid" | "assert" | "unsupported"
                | "collected" | "once" | "frozen" | "concurrency" => {
                    error!("systemd: job failed with status {}", msg.result);
                    Err(anyhow!("systemd job failed with status {}", msg.result))
                }
                _result if _result.ends_with(".service") => {
                    // Check service result
                    let unit_path = self.1.get_unit(msg.unit).await?;
                    let unit_obj = ServiceProxy::builder(&self.0)
                        .path(unit_path)?
                        .build()
                        .await?;
                    match &*unit_obj.result().await? {
                        "success" => {
                            debug!("systemd: service indicates job success");
                            Ok(())
                        }
                        result => {
                            error!(
                                "systemd: job finished with unknown status {} - unit result: {}",
                                msg.result, result
                            );
                            Err(anyhow!(
                                "systemd job finished with unknown status {} - unit result: {}",
                                msg.result,
                                result
                            ))
                        }
                    }
                }
                result => {
                    error!("systemd: job finished with unknown status {}", result);
                    Err(anyhow!(
                        "systemd job finished with unknown status {}",
                        result
                    ))
                }
            }
        }
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
}
