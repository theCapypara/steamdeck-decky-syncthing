use crate::settings::SettingsProvider;
use errno::errno;
use lazy_static::lazy_static;
use log::{debug, error, info};
use std::convert::Infallible;
use std::io;
use std::path::PathBuf;
use std::process::Command;
use std::sync::Arc;
use std::time::{Duration, Instant};
use sysinfo::{
    set_open_files_limit, Pid, PidExt, Process, ProcessExt, ProcessRefreshKind, ProcessStatus,
    System, SystemExt,
};
use thiserror::Error;
use tokio::sync::Mutex;
use tokio::time::sleep;
use which::which;

const BACKGROUND_WATCH_INTERVAL_SECS: u64 = 30;

lazy_static! {
    static ref WHICH_FLATPAK: Result<PathBuf, ::which::Error> = which("flatpak");
}

pub struct ProcessWatchdog {
    settings: Arc<SettingsProvider>,
    syncthing_pid: Option<Pid>,
    syncthing_should_be_running: bool,
    gamescope_pid: Option<Pid>,
    system: System,
    wait_timer: Option<Instant>,
}

#[derive(Debug, Error)]
pub enum WatchdogError {
    #[error("error looking for a command path: {0}")]
    Which(#[from] which::Error),
    #[error("I/O error: {0}")]
    Io(#[from] io::Error),
    #[error("Syncthing died")]
    ProcessDied,
}

#[derive(Debug, Clone, Copy)]
pub enum SyncthingState {
    Running,
    Stopped,
    Failed,
}

impl SyncthingState {
    pub fn as_static_str(self) -> &'static str {
        match self {
            SyncthingState::Running => "running",
            SyncthingState::Stopped => "stopped",
            SyncthingState::Failed => "failed",
        }
    }
}

impl ProcessWatchdog {
    pub fn new(settings: Arc<SettingsProvider>) -> Arc<Mutex<Self>> {
        // the default sysinfo limit of open files is a bit crazy.
        set_open_files_limit(32);
        Arc::new(Mutex::new(Self {
            settings,
            syncthing_pid: None,
            syncthing_should_be_running: false,
            gamescope_pid: None,
            system: System::new(),
            wait_timer: None,
        }))
    }

    pub async fn syncthing_state(&mut self) -> Result<SyncthingState, WatchdogError> {
        let syncthing_process = self.syncthing_process().await?.is_some();
        Ok(
            match (syncthing_process, self.syncthing_should_be_running) {
                (true, _) => SyncthingState::Running,
                (false, true) => SyncthingState::Failed,
                (false, false) => SyncthingState::Stopped,
            },
        )
    }

    pub async fn syncthing_start(&mut self) -> Result<(), WatchdogError> {
        // before starting, even if syncthing_pid is None, check if there's any process
        // already on the system!
        debug!("Request to start Syncthing");
        self.refresh_state().await?;
        if !matches!(self.syncthing_state().await?, SyncthingState::Running) {
            self.wait_timer = Some(Instant::now() + Duration::from_secs(15));
            let flatpak_bin = WHICH_FLATPAK.as_ref().map_err(Clone::clone)?;
            info!("Starting Syncthing");
            Command::new(flatpak_bin)
                .arg("run")
                .arg("--command=syncthing")
                .arg(self.settings.settings().await.flatpak_name.clone())
                .arg("--no-browser")
                .spawn()?;
            // The pid of the child is the PID of the Flatpak bwrap wrapper. We want the actual PID. So let's do refresh do the trick!
            sleep(Duration::from_millis(500)).await;
            self.refresh_state().await?;
            self.syncthing_should_be_running = true;
            if self.syncthing_pid.is_none() {
                return Err(WatchdogError::ProcessDied);
            }
        }
        Ok(())
    }

    pub async fn syncthing_stop(&mut self) -> Result<(), WatchdogError> {
        debug!("Request to stop Syncthing");
        self.refresh_state().await?;
        if matches!(self.syncthing_state().await?, SyncthingState::Running) {
            if let Some(syncthing_pid) = self.syncthing_pid {
                const WAIT_TIME_MS: usize = 50;
                const MAX_LOOPS: usize = 7500 / WAIT_TIME_MS;
                let mut need_to_kill = true;
                info!("Stopping Syncthing");
                debug!("SIGTERM to Syncthing");
                handle_libc_error(unsafe {
                    libc::kill(syncthing_pid.as_u32() as i32, libc::SIGTERM)
                })?;
                for _ in 0..MAX_LOOPS {
                    // todo waitpid instead?
                    if handle_libc_error_raw(unsafe {
                        libc::kill(syncthing_pid.as_u32() as i32, 0)
                    }) == Err(libc::ESRCH)
                    {
                        debug!("Syncthing terminated");
                        need_to_kill = false;
                        break;
                    }
                    sleep(Duration::from_millis(WAIT_TIME_MS as u64)).await;
                }
                if need_to_kill {
                    debug!("SIGKILL to Syncthing");
                    dbg!(syncthing_pid.as_u32());
                    handle_libc_error(unsafe {
                        let x = libc::kill(syncthing_pid.as_u32() as i32, libc::SIGKILL);
                        dbg!(x);
                        x
                    })?;
                    for _ in 0..MAX_LOOPS {
                        if handle_libc_error_raw(unsafe {
                            libc::kill(syncthing_pid.as_u32() as i32, 0)
                        }) == Err(libc::ESRCH)
                        {
                            debug!("Syncthing is gone");
                            break;
                        }
                    }
                }
                self.syncthing_should_be_running = false;
                self.refresh_state().await?;
            }
            Ok(())
        } else {
            Ok(())
        }
    }
    pub async fn should_wait_for_start(&self) -> bool {
        if !self.syncthing_should_be_running {
            return false;
        }
        match &self.wait_timer {
            None => false,
            Some(timer) => timer > &Instant::now(),
        }
    }

    pub async fn background_watch(slf: Arc<Mutex<Self>>) -> Infallible {
        //      - When autostart is enabled & when gamescope (or this watchdog) was not running but now is: Start
        //      - when gamescope is gone: Stop
        let mut slf_lock = slf.lock().await;
        slf_lock.refresh_gamescope_state().ok();
        if slf_lock.settings.settings().await.autostart && slf_lock.gamescope_process_is_running() {
            debug!("Initial autostart.");
            slf_lock.syncthing_start().await.ok();
        }
        drop(slf_lock);
        loop {
            debug!("background loop");
            let mut slf_lock = slf.lock().await;
            match slf_lock.gamescope_pid {
                None => {
                    debug!("Gamescope was not running");
                    if slf_lock.settings.settings().await.autostart
                        && slf_lock.gamescope_process_is_running()
                    {
                        debug!("Gamescope is now running, starting");
                        slf_lock.syncthing_start().await.ok();
                    }
                }
                Some(_) => {
                    debug!("Gamescope was running");
                    if !slf_lock.gamescope_process_is_running()
                        && !slf_lock.settings.settings().await.keep_running_on_desktop
                    {
                        debug!("Gamescope is no longer running, stopping");
                        slf_lock.syncthing_stop().await.ok();
                    }
                }
            }
            drop(slf_lock);
            sleep(Duration::from_secs(BACKGROUND_WATCH_INTERVAL_SECS)).await;
        }
    }

    /// 1. If self.syncthing_pid is set: Check if the process is running,
    ///     - if yes do nothing,
    ///     - otherwise continue at 2.
    /// 2. Search for any process matching the syncthing process we should be observing
    ///     - if found: set self.syncthing_pid to it's PID
    ///     - else do nothing.
    async fn refresh_state(&mut self) -> Result<(), WatchdogError> {
        if self.syncthing_pid.is_some()
            && matches!(self.syncthing_state().await?, SyncthingState::Running)
        {
            debug!("Syncthing was running");
            return Ok(());
        }
        debug!("Syncthing was not known to be running");
        self.system
            .refresh_processes_specifics(ProcessRefreshKind::default());
        for (pid, process) in self.system.processes() {
            if Self::process_is_syncthing(process) {
                debug!("Found a running Syncthing: {pid}");
                self.syncthing_pid = Some(*pid);
                break;
            }
        }
        Ok(())
    }

    fn refresh_gamescope_state(&mut self) -> Result<Option<&Process>, WatchdogError> {
        self.gamescope_pid = None;
        self.system
            .refresh_processes_specifics(ProcessRefreshKind::default());
        for (pid, process) in self.system.processes() {
            if Self::process_is_gamescope(process) {
                self.gamescope_pid = Some(*pid);
                return Ok(Some(process));
            }
        }
        Ok(None)
    }

    fn gamescope_process_is_running(&mut self) -> bool {
        self.try_gamescope_process_is_running()
            .unwrap_or_else(|err| {
                error!("Could not find path to gamescope-session: {err}");
                false
            })
    }

    fn try_gamescope_process_is_running(&mut self) -> Result<bool, WatchdogError> {
        if let Some(pid) = self.gamescope_pid {
            let proc = Self::does_process_exist_and_match_cond(
                &mut self.system,
                pid,
                Self::process_is_gamescope,
            );
            if proc.is_some() {
                Ok(true)
            } else {
                Ok(self.refresh_gamescope_state()?.is_some())
            }
        } else {
            Ok(self.refresh_gamescope_state()?.is_some())
        }
    }

    async fn syncthing_process(&mut self) -> Result<Option<&Process>, WatchdogError> {
        if let Some(pid) = self.syncthing_pid {
            Ok(Self::does_process_exist_and_match_cond(
                &mut self.system,
                pid,
                Self::process_is_syncthing,
            ))
        } else {
            Ok(None)
        }
    }

    pub fn does_process_exist_and_match_cond<F>(
        sys: &mut System,
        pid: Pid,
        cond: F,
    ) -> Option<&Process>
    where
        F: Fn(&Process) -> bool,
    {
        Self::try_does_process_exist_and_match_cond::<_, Infallible>(sys, pid, |p| Ok(cond(p)))
            .unwrap()
    }

    pub fn try_does_process_exist_and_match_cond<F, E>(
        sys: &mut System,
        pid: Pid,
        cond: F,
    ) -> Result<Option<&Process>, E>
    where
        F: Fn(&Process) -> Result<bool, E>,
    {
        if sys.refresh_process_specifics(pid, ProcessRefreshKind::default()) {
            if let Some(proc) = sys.process(pid) {
                if proc.status() != ProcessStatus::Dead && cond(proc)? {
                    return Ok(Some(proc));
                }
            }
        }
        Ok(None)
    }

    fn process_is_syncthing(proc: &Process) -> bool {
        // TODO: Ehhhh this may really easily break.
        proc.cmd()
            .first()
            .map(|cmd| cmd == "syncthing")
            .unwrap_or_default()
    }

    fn process_is_gamescope(proc: &Process) -> bool {
        // TODO: Ehhhh this may really easily break. But the gamescope process exe symlink can't be read.
        for cmd in proc.cmd() {
            if cmd == "/usr/bin/gamescope-session" {
                return true;
            }
        }
        false
    }
}

fn handle_libc_error(exit_code: i32) -> Result<(), io::Error> {
    handle_libc_error_raw(exit_code)
        .or_else(|err| {
            // Ignore ESRCH
            match err {
                libc::ESRCH => Ok(()),
                _ => Err(err),
            }
        })
        .map_err(io::Error::from_raw_os_error)
}

fn handle_libc_error_raw(exit_code: i32) -> Result<(), i32> {
    if exit_code < 0 {
        Err(errno().0)
    } else {
        Ok(())
    }
}
