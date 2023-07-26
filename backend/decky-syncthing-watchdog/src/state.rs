use crate::process_watchdog::{ProcessWatchdog, WatchdogError};
use std::sync::Arc;
use tokio::sync::Mutex;

pub struct State {
    watchdog: Arc<Mutex<ProcessWatchdog>>,
}

impl State {
    pub fn new(watchdog: Arc<Mutex<ProcessWatchdog>>) -> Arc<Self> {
        Arc::new(Self { watchdog })
    }

    pub async fn get(&self) -> Result<&'static str, WatchdogError> {
        let mut watchdog = self.watchdog.lock().await;
        watchdog
            .syncthing_state()
            .await
            .map(|s| s.as_static_str())
            .map_err(Into::into)
    }

    pub async fn wait(&self) -> bool {
        self.watchdog.lock().await.should_wait_for_start().await
    }

    pub async fn start(&self) -> Result<(), WatchdogError> {
        let mut watchdog = self.watchdog.lock().await;
        watchdog.syncthing_start().await
    }

    pub async fn stop(&self) -> Result<(), WatchdogError> {
        let mut watchdog = self.watchdog.lock().await;
        watchdog.syncthing_stop().await
    }
}
