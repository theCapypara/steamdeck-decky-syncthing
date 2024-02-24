use crate::service::{start_service, stop_service};
use crate::settings::{Autostart, SettingsProvider};
use log::debug;
use std::convert::Infallible;
use std::sync::Arc;
use std::time::Duration;
use sysinfo::{
    set_open_files_limit, Pid, Process, ProcessExt, ProcessRefreshKind, ProcessStatus, System,
    SystemExt,
};
use tokio::time::sleep;

const BACKGROUND_WATCH_INTERVAL_SECS: u64 = 15;

pub struct GamescopeWatchdog {
    settings: Arc<SettingsProvider>,
    gamescope_pid: Option<Pid>,
    system: System,
}

impl GamescopeWatchdog {
    pub fn new(settings: Arc<SettingsProvider>) -> Self {
        // the default sysinfo limit of open files is a bit crazy.
        set_open_files_limit(32);
        Self {
            settings,
            gamescope_pid: None,
            system: System::new(),
        }
    }

    pub async fn background_watch(&mut self) -> Infallible {
        //      - When autostart is enabled & when gamescope (or this watchdog) was not running but now is: Start
        //      - when gamescope is gone: Stop
        self.refresh_gamescope_state();
        let settings_arc = self.settings.clone();
        let autostart = matches!(
            settings_arc.settings().await.autostart,
            Autostart::Gamescope
        );
        if autostart && self.gamescope_process_is_running() {
            debug!("Initial autostart.");
            start_service(&*settings_arc.settings().await).await.ok();
        }
        loop {
            debug!("background loop");
            match self.gamescope_pid {
                None => {
                    debug!("Gamescope was not running");
                    if autostart && self.gamescope_process_is_running() {
                        debug!("Gamescope is now running, starting");
                        start_service(&*settings_arc.settings().await).await.ok();
                    }
                }
                Some(_) => {
                    debug!("Gamescope was running");
                    if !self.gamescope_process_is_running()
                        && !settings_arc.settings().await.keep_running_on_desktop
                    {
                        debug!("Gamescope is no longer running, stopping");
                        stop_service(&*settings_arc.settings().await).await.ok();
                    }
                }
            }
            sleep(Duration::from_secs(BACKGROUND_WATCH_INTERVAL_SECS)).await;
        }
    }

    fn refresh_gamescope_state(&mut self) -> Option<&Process> {
        self.gamescope_pid = None;
        self.system
            .refresh_processes_specifics(ProcessRefreshKind::default());
        for (pid, process) in self.system.processes() {
            if Self::process_is_gamescope(process) {
                self.gamescope_pid = Some(*pid);
                return Some(process);
            }
        }
        None
    }

    fn gamescope_process_is_running(&mut self) -> bool {
        if let Some(pid) = self.gamescope_pid {
            let proc = Self::does_process_exist_and_match_cond(
                &mut self.system,
                pid,
                Self::process_is_gamescope,
            );
            if proc.is_some() {
                true
            } else {
                self.refresh_gamescope_state().is_some()
            }
        } else {
            self.refresh_gamescope_state().is_some()
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
