import asyncio
import json
import os
import subprocess
from pathlib import Path
from typing import TypedDict

from decky_plugin import (
    logger,
    DECKY_PLUGIN_SETTINGS_DIR,
    DECKY_PLUGIN_RUNTIME_DIR,
    DECKY_PLUGIN_LOG_DIR,
    DECKY_PLUGIN_DIR,
)

# Default port
DEFAULT_PORT = 8384
# Default Flatpak name.
DEFAULT_FLATPAK_NAME = "me.kozec.syncthingtk"
# File that should contain settings.
SETTINGS_PATH = Path(DECKY_PLUGIN_SETTINGS_DIR) / "decky-syncthing.json"
# File that should contain settings.
WATCHDOG_BIN_PATH = Path(DECKY_PLUGIN_DIR) / "bin" / "decky-syncthing-watchdog"
# Path to the watchdog PID file.
# File that should contain settings.
WATCHDOG_PID_PATH = Path(DECKY_PLUGIN_RUNTIME_DIR) / "watchdog.pid"
# Last Syncthing process logfile
SYNCTHING_LOG_PATH = Path(DECKY_PLUGIN_LOG_DIR) / "syncthing.log"


class Settings(TypedDict):
    config_version: int
    autostart: bool
    flatpak_name: str
    port: int
    api_key: str
    basic_auth_user: str
    basic_auth_pass: str


# noinspection PyAttributeOutsideInit
class Plugin:
    settings: Settings

    async def get_settings_json(self) -> str:
        return json.dumps(self.settings)

    async def set_setting(self, setting: str, value: any):
        if setting not in self.settings:
            logger.error(f"Unknown setting: {setting}")
            raise KeyError(f"Unknown setting: {setting}")
        self.settings[setting] = value  # type: ignore
        with open(SETTINGS_PATH, "w") as f:
            json.dump(self.settings, f)
        logger.info("Updated settings.")

    async def get_log(self) -> str:
        if os.path.exists(SYNCTHING_LOG_PATH):
            with open(SYNCTHING_LOG_PATH, "r") as f:
                return f.read()
        return ""

    async def _main(self):
        logger.info("Loaded.")
        self.log_file = None
        self.syncthing = None
        self.settings = load_settings()
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
    without properly unloading it first, which has led to things such as ghost Syncthing processes still running.
    While this could be solved with a PID file etc., all from this Python backend, I found it easier
    to just have a dedicated process responsible for this.
    This watchdog itself is NOT stopped by this plugin, as it's lightweight enough to just keep running.
    Also note, we are always trying to start the watchdog when loading the plugin. The watcher will self-terminate
    if it finds out it's already running (it checks the PID file and sees if that process is alive).

    The watchdog will also watch for running `gamescope-session` processes and exit Syncthing when gamescope is no
    longer running / autostart it if it detects it `gamescope-session` and/or itself have just started and the
    autostart setting is enabled.
    """
    logger.info("Watchdog starting...")
    subprocess.Popen(
        [
            WATCHDOG_BIN_PATH,
            SETTINGS_PATH,
            WATCHDOG_PID_PATH,
            SYNCTHING_LOG_PATH,
        ],
        env=dict(os.environ),
        # do not attach to this process.
        start_new_session=True,
    )


def load_settings() -> Settings:
    if os.path.exists(SETTINGS_PATH):
        try:
            with open(SETTINGS_PATH, "rb") as f:
                settings = json.load(f)
        except Exception as ex:
            logger.error(
                f"Failed reading config, using default. Exception: {ex}",
            )
            return default_settings(save=True)
        if "config_version" not in settings or settings["config_version"] != 1:
            logger.error(f"Unsupported settings version, using default.")
            return default_settings(save=True)
        return settings
    return default_settings(save=True)


def default_settings(*, save=False) -> Settings:
    defaults = Settings(
        config_version=1,
        autostart=False,
        flatpak_name=DEFAULT_FLATPAK_NAME,
        port=DEFAULT_PORT,
        api_key="",
        basic_auth_user="",
        basic_auth_pass="",
    )
    if save:
        with open(SETTINGS_PATH, "w") as f:
            json.dump(defaults, f)
    return defaults
