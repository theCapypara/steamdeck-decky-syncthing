mod api;
mod panic_util;
mod process_watchdog;
mod proxy;
mod settings;
mod state;
mod util;

use crate::api::handle_api;
use crate::panic_util::register_panic_hook;
use crate::process_watchdog::ProcessWatchdog;
use crate::proxy::handle_proxy;
use crate::settings::SettingsProvider;
use crate::state::State;
use hyper::header::{ACCESS_CONTROL_ALLOW_HEADERS, ACCESS_CONTROL_ALLOW_ORIGIN};
use hyper::server::conn::AddrStream;
use hyper::service::{make_service_fn, service_fn};
use hyper::{Body, Request, Response, Server};
use log::{error, info, LevelFilter};
use log4rs::append::rolling_file::policy::compound::roll::fixed_window::FixedWindowRoller;
use log4rs::append::rolling_file::policy::compound::trigger::size::SizeTrigger;
use log4rs::append::rolling_file::policy::compound::CompoundPolicy;
use log4rs::append::rolling_file::RollingFileAppender;
use log4rs::config::{Appender, Root};
use log4rs::encode::pattern::PatternEncoder;
use log4rs::filter::threshold::ThresholdFilter;
use log4rs::Config;
use std::convert::Infallible;
use std::env::args;
use std::fs::{read_to_string, write};
use std::net::IpAddr;
use std::ops::Deref;
use std::path::{Path, PathBuf};
use std::process;
use std::process::ExitCode;
use std::time::Duration;
use sysinfo::{Pid, PidExt, ProcessExt, System, SystemExt};
use tokio::time::sleep;

const LOGFILE_WATCHDOG_ROLLING: &str = "watchdog.{}.log";
const LOGFILE_WATCHDOG: &str = "watchdog.log";
const BIND_ADDR: &str = "127.0.0.1:58384";

#[tokio::main(flavor = "current_thread")]
async fn main() -> ExitCode {
    let mut args_iter = args();
    let settings_path = PathBuf::from(args_iter.nth(1).unwrap());
    let watchdog_pid_path = PathBuf::from(args_iter.next().unwrap());
    let watchdog_log_dir_path = PathBuf::from(args_iter.next().unwrap());

    if other_process_already_running(&watchdog_pid_path) {
        return ExitCode::SUCCESS;
    }

    update_pid_file(&watchdog_pid_path);
    // To avoid race conditions on start, we check again.
    sleep(Duration::from_millis(50)).await;
    if other_process_already_running(&watchdog_pid_path) {
        return ExitCode::SUCCESS;
    }

    setup_self_logging(&watchdog_log_dir_path);
    register_panic_hook(&watchdog_log_dir_path);
    info!("started.");

    let settings = SettingsProvider::new(settings_path).await.unwrap();
    let watchdog = ProcessWatchdog::new(settings.clone());
    let state = State::new(watchdog.clone());

    let make_svc = make_service_fn(|conn: &AddrStream| {
        let settings = settings.clone();
        let state = state.clone();
        let remote_addr = conn.remote_addr().ip();
        async move {
            Ok::<_, Infallible>(service_fn(move |req| {
                handle(remote_addr, req, settings.clone(), state.clone())
            }))
        }
    });

    let server = Server::bind(&BIND_ADDR.parse().unwrap()).serve(make_svc);
    let watcher = ProcessWatchdog::background_watch(watchdog.clone());

    let (r1, r2) = tokio::join!(server, watcher);

    error!("server exited with: {r1:?} & {r2:?}");
    ExitCode::FAILURE
}

async fn handle<SP, ST>(
    client_ip: IpAddr,
    req: Request<Body>,
    settings: SP,
    state: ST,
) -> Result<Response<Body>, Infallible>
where
    SP: Deref<Target = SettingsProvider>,
    ST: Deref<Target = State>,
{
    let mut response = match handle_api(&client_ip, &req, &settings, &state).await {
        Some(v) => v,
        None => handle_proxy(client_ip, req, &settings, &state).await,
    }?;
    // XXX: since we are only ever listening on localhost and are pretty niche,
    //      this is probably fine enough, but really
    //      we should eventually make this more strict.
    let headers_mut = response.headers_mut();
    headers_mut.insert(ACCESS_CONTROL_ALLOW_ORIGIN, "*".parse().unwrap());
    headers_mut.insert(ACCESS_CONTROL_ALLOW_HEADERS, "*".parse().unwrap());
    Ok(response)
}

fn update_pid_file(pid_file_path: &Path) {
    write(pid_file_path, process::id().to_string()).unwrap();
}

fn other_process_already_running(pid_file_path: &Path) -> bool {
    if pid_file_path.exists() {
        let pid_in_file = read_to_string(pid_file_path)
            .unwrap()
            .trim()
            .parse::<u32>()
            .unwrap_or_default();
        if process::id() == pid_in_file {
            // If we are ourselves in the PID file, then we continue as if no other instance
            // was running.
            return false;
        }
        let mut system = System::new();
        let pid_in_file_as_pid = Pid::from_u32(pid_in_file);

        ProcessWatchdog::does_process_exist_and_match_cond(
            &mut system,
            pid_in_file_as_pid,
            |proc| {
                // we check if the process matches the binary name, it could be it's just another
                // unrelated process after restart.
                proc.exe()
                    .as_os_str()
                    .to_string_lossy()
                    .contains(env!("CARGO_BIN_NAME"))
            },
        )
        .is_some()
    } else {
        false
    }
}

fn setup_self_logging(dir: &Path) {
    let threshold = if cfg!(debug_assertions) {
        LevelFilter::Debug
    } else {
        LevelFilter::Info
    };

    let window_size = 3;
    let fixed_window_roller = FixedWindowRoller::builder()
        .build(
            dir.join(LOGFILE_WATCHDOG_ROLLING).to_str().unwrap(),
            window_size,
        )
        .unwrap();
    let size_limit = 5 * 1024; // 5KB as max log file size to roll
    let size_trigger = SizeTrigger::new(size_limit);
    let compound_policy =
        CompoundPolicy::new(Box::new(size_trigger), Box::new(fixed_window_roller));

    let config = Config::builder()
        .appender(
            Appender::builder()
                .filter(Box::new(ThresholdFilter::new(threshold)))
                .build(
                    "logfile",
                    Box::new(
                        RollingFileAppender::builder()
                            .encoder(Box::new(PatternEncoder::new("{d} {l}::{m}{n}")))
                            .build(dir.join(LOGFILE_WATCHDOG), Box::new(compound_policy))
                            .unwrap(),
                    ),
                ),
        )
        .build(Root::builder().appender("logfile").build(threshold))
        .unwrap();

    log4rs::init_config(config).unwrap();
}
