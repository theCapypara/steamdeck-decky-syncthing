export const WATCHDOG_PROXY_URL = "http://127.0.0.1:58384/";
export const WATCHDOG_STATE_ROUTE = "__decky-watchdog/state";
export const WATCHDOG_RELOAD_CONFIG_ROUTE = "__decky-watchdog/reload-config";
export const WATCHDOG_START_ROUTE = "__decky-watchdog/start";
export const WATCHDOG_STOP_ROUTE = "__decky-watchdog/stop";
export const PLUGIN_API_GET_SETTINGS_JSON = "get_settings_json";
export const PLUGIN_API_SET_SETTING = "set_setting";
export const PLUGIN_API_GET_LOG = "get_log";

export enum SyncthingProcessState {
    Stopped = "stopped",
    Running = "running",
    Wait = "wait",
    Failed = "failed",
    Unknown = "unknown"
}
