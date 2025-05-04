use decky_syncthing_watchdog::service::systemctl::{SessionType, Systemctl};
use log::LevelFilter;
use log4rs::Config;
use log4rs::append::console::{ConsoleAppender, Target};
use log4rs::config::{Appender, Root};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let stderr = ConsoleAppender::builder().target(Target::Stderr).build();
    let config = Config::builder()
        .appender(Appender::builder().build("stderr", Box::new(stderr)))
        .build(Root::builder().appender("stderr").build(LevelFilter::Debug))?;

    log4rs::init_config(config)?;

    let client = Systemctl::new(SessionType::Session).await?;

    println!("daemon reload:    {:?}", client.daemon_reload().await);
    println!("state unknown:    {:?}", client.state("unknown").await);
    println!("start unknown:    {:?}", client.start("unknown").await);
    println!("stop unknown:     {:?}", client.stop("unknown").await);
    println!("state syncthing:  {:?}", client.state("syncthing").await);
    println!("stop syncthing:   {:?}", client.stop("syncthing").await);
    println!("state syncthing:  {:?}", client.state("syncthing").await);
    println!("start syncthing:  {:?}", client.start("syncthing").await);
    println!("state syncthing:  {:?}", client.state("syncthing").await);
    println!("disable unknown:  {:?}", client.disable("unknown").await);
    println!("disable syncthing:{:?}", client.disable("syncthing").await);
    println!("disable syncthing:{:?}", client.disable("syncthing").await);
    println!("enable unknown:   {:?}", client.enable("unknown").await);
    println!("enable syncthing: {:?}", client.enable("syncthing").await);
    println!("enable syncthing: {:?}", client.enable("syncthing").await);
    println!("disable syncthing: {:?}", client.disable("syncthing").await);

    Ok(())
}
