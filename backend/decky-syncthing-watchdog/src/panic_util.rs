use backtrace::Backtrace;
use log::error;
use std::any::Any;
use std::fs::File;
use std::io::Write;
use std::panic;
use std::path::Path;

/// Registers the panic hook that captures the backtrace.
pub fn register_panic_hook(log_dir: &Path) {
    let out_file = log_dir.join("last_panic.txt");
    panic::set_hook(Box::new(move |panic_info| {
        let mut w = File::create(&out_file).unwrap();
        let panic_str = panic_to_string(panic_info.payload());
        writeln!(&mut w, "{}", panic_str).unwrap();
        writeln!(&mut w, "{:?}", Backtrace::new()).unwrap();
        error!("panicked: {}", panic_str)
    }));
}

pub fn panic_to_string(panic: &(dyn Any + Send)) -> String {
    match panic.downcast_ref::<String>() {
        Some(v) => v.clone(),
        None => match panic.downcast_ref::<&str>() {
            Some(v) => v.to_string(),
            _ => "Unknown Source of Panic".to_owned(),
        },
    }
}
