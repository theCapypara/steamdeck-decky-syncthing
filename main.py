import asyncio
import json
import os
import subprocess
from pathlib import Path
from typing import TypedDict, Literal, Union

from decky_plugin import (
    logger,
    DECKY_PLUGIN_SETTINGS_DIR,
    DECKY_PLUGIN_RUNTIME_DIR,
    DECKY_PLUGIN_LOG_DIR,
    DECKY_PLUGIN_DIR,
)

# File that should contain settings.
SETTINGS_PATH = Path(DECKY_PLUGIN_SETTINGS_DIR) / "decky-syncthing.json"
# File that should contain settings.
WATCHDOG_BIN_PATH = Path(DECKY_PLUGIN_DIR) / "bin" / "decky-syncthing-watchdog"
# Path to the watchdog PID file.
# File that should contain settings.
WATCHDOG_PID_PATH = Path(DECKY_PLUGIN_RUNTIME_DIR) / "watchdog.pid"


# Old configs:
class SettingsV1(TypedDict):
    config_version: Literal[1]
    autostart: bool
    flatpak_name: str
    port: int
    api_key: str
    basic_auth_user: str
    basic_auth_pass: str
    keep_running_on_desktop: bool


# See `backend/decky-syncthing-watchdog/src/settings.rs` for details.
class SettingsV2(TypedDict):
    config_version: Literal[2]
    mode: Union[Literal["systemd"], Literal["systemd_system"], Literal["flatpak"]]
    # Mode: systemd OR systemd_system
    service_name: str
    # Mode: flatpak
    flatpak_name: str
    flatpak_binary: str
    # General:
    autostart: Union[Literal["no"], Literal["boot"], Literal["gamescope"]]
    keep_running_on_desktop: bool
    port: int
    api_key: str
    basic_auth_user: str
    basic_auth_pass: str
    # if not True, show wizard and do not run any services.
    # If "migrating" the UI will be optimized for migrating to V2:
    is_setup: Union[bool, Literal["migratingV2"]]


# noinspection PyAttributeOutsideInit
class Plugin:
    settings: SettingsV2

    async def get_settings_json(self) -> str:
        return json.dumps(self.settings)

    async def restart_watchdog(self):
        await reset_all_processes()
        start_watchdog()

    async def set_setting(self, setting: str, value: any):
        if setting not in self.settings:
            logger.error(f"Unknown setting: {setting}")
            raise KeyError(f"Unknown setting: {setting}")
        # Sometimes the frontend lib doesn't properly convert the data types, make sure it's correct
        if setting == "port":
            value = int(value)
        if value == "true":
            value = True
        if value == "false":
            value = False
        self.settings[setting] = value  # type: ignore
        with open(SETTINGS_PATH, "w") as f:
            json.dump(self.settings, f)
        logger.info("Updated settings.")

    async def _main(self):
        logger.info("Loaded.")
        self.log_file = None
        self.syncthing = None
        self.settings = await load_settings()
        start_watchdog()
        while True:
            await asyncio.sleep(1)


def start_watchdog():
    """
    We start a background watchdog process, that keeps track of Syncthing and also acts
    as a proxy server to Syncthing (so that the end-user doesn't have to worry about having to
    disable SSL or importing the certificate to make it work). It also makes it easier to deal with the delay
    when starting up from the frontend code.

    It exists because it's easier to keep track of the Syncthing process with something that isn't
    directly tied to this plugin being loaded by Decky, as Decky sporadically seems to reload the plugin
    without properly unloading it first.
    It manages Systemd services to control Syncthing (it may also create/uninstall them if needed in Flatpak mode)
    and acts as a HTTP proxy server for the web UI
    This watchdog itself is NOT stopped by this plugin, as it's lightweight enough to just keep running.
    Also note, we are always trying to start the watchdog when loading the plugin. The watcher will self-terminate
    if it finds out it's already running (it checks the PID file and sees if that process is alive).
    """
    logger.info("Watchdog starting...")
    env = dict(os.environ)
    # On the real Deck the session bus variable may not be set. This is not bulletproof, but what can you do:
    if "DBUS_SESSION_BUS_ADDRESS" not in env:
        env["DBUS_SESSION_BUS_ADDRESS"] = f"unix:path=/run/user/{os.getuid()}/bus"
    subprocess.Popen(
        [
            WATCHDOG_BIN_PATH,
            SETTINGS_PATH,
            WATCHDOG_PID_PATH,
            DECKY_PLUGIN_LOG_DIR,
        ],
        env=env,
        # do not attach to this process.
        start_new_session=True,
    )


async def load_settings() -> SettingsV2:
    if os.path.exists(SETTINGS_PATH):
        try:
            with open(SETTINGS_PATH, "rb") as f:
                settings = json.load(f)
        except Exception as ex:
            logger.error(
                f"Failed reading config, using default. Exception: {ex}",
            )
            return default_settings(save=True)
        if "config_version" not in settings:
            logger.error(f"Unsupported settings version, using default.")
            return default_settings(save=True)
        if settings["config_version"] == 1:
            logger.error(f"Running settings migration to V2.")
            return await migrate_settings_v2(settings)
        return settings
    return default_settings(save=True)


def default_settings(*, save=False) -> SettingsV2:
    defaults = SettingsV2(
        config_version=2,
        mode="systemd",
        service_name="",
        flatpak_name="",
        flatpak_binary="syncthing",
        autostart="no",
        keep_running_on_desktop=False,
        port=8384,
        api_key="",
        basic_auth_user="",
        basic_auth_pass="",
        is_setup=False,
    )
    if save:
        with open(SETTINGS_PATH, "w") as f:
            json.dump(defaults, f)
    return defaults


async def migrate_settings_v2(old: SettingsV1) -> SettingsV2:
    settings = SettingsV2(
        config_version=2,
        mode="flatpak",
        service_name="",
        flatpak_name=old["flatpak_name"],
        flatpak_binary="syncthing",
        autostart="gamescope" if old["autostart"] else "no",
        keep_running_on_desktop=old["keep_running_on_desktop"],
        port=old["port"],
        api_key=old["api_key"],
        basic_auth_user=old["basic_auth_user"],
        basic_auth_pass=old["basic_auth_pass"],
        is_setup="migratingV2"
    )

    await reset_all_processes()
    with open(SETTINGS_PATH, "w") as f:
        json.dump(settings, f)
    return settings


async def reset_all_processes():
    # Force exit all Syncthing related processes. This will also exit the (old) watchdog.
    subprocess.Popen(
        [
            "/usr/bin/killall",
            '-r',
            '.*syncthing.*'
        ],
        env=dict(os.environ),
        start_new_session=True,
    )
    await asyncio.sleep(2)
