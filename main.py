import asyncio
import json
import os
import shutil
import subprocess
import tempfile
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, Tuple, TypedDict

from settings import SettingsManager  # type: ignore

from decky_plugin import logger, DECKY_PLUGIN_SETTINGS_DIR

# Default port
DEFAULT_PORT = 8384
# Default Flatpak name.
DEFAULT_FLATPAK_NAME = "me.kozec.syncthingtk"
# File that should contain settings.
SETTINGS_PATH = Path(DECKY_PLUGIN_SETTINGS_DIR) / "decky-syncthing.json"
# State: Syncthing is not running (or at least not running & managed by the backend).
STATE_STOPPED = "stopped"
# State: Syncthing should be running.
STATE_RUNNING = "running"
# State: Syncthing should be up soon, or maybe it already is.
STATE_WAIT = "wait"
# State: The Syncthing process somehow exited without us trying to exit it.
STATE_FAILED = "failed"
# Time to wait before switching from waiting state to running.
WAIT_TIME_SEC = 30


class Settings(TypedDict):
    config_version: int
    autostart: bool
    flatpak_name: str
    port: int
    api_key: str


# noinspection PyAttributeOutsideInit
class Plugin:
    log_file: Optional[tempfile.NamedTemporaryFile]
    settings: Settings
    syncthing: Optional[Tuple[subprocess.Popen, datetime]]

    async def start(self):
        # recreate log-file
        if self.log_file is not None:
            try:
                self.log_file.close()
            except Exception as ex:
                logger.warning(f"Failed cleaning up temp log file: {ex}")
        self.log_file = tempfile.NamedTemporaryFile()

        logger.info("Syncthing starting...")
        flatpak_bin = shutil.which("flatpak")
        self.syncthing = (
            subprocess.Popen(
                [
                    flatpak_bin,
                    "run",
                    "--command=syncthing",
                    self.settings["flatpak_name"],
                ],
                env=dict(os.environ),
                stdout=self.log_file.file,
                stderr=subprocess.STDOUT
            ),
            datetime.now(),
        )

    async def stop(self):
        if self.syncthing is not None:
            backend_proc, _ = self.syncthing
            logger.info("Syncthing stopping...")
            backend_proc.terminate()
            try:
                backend_proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                backend_proc.kill()
            self.syncthing = None

    async def state(self) -> str:
        if self.syncthing is not None:
            process, time = self.syncthing
            logger.debug("Should be running. Poll result: {poll}...")
            if process.poll() is not None:
                return STATE_FAILED
            if time < datetime.now() + timedelta(0, WAIT_TIME_SEC):
                return STATE_WAIT
            return STATE_RUNNING
        else:
            return STATE_STOPPED

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
        if self.log_file is not None:
            with open(self.log_file.name, "r") as f:
                return f.read()
        return ""

    async def _main(self):
        logger.info("Loaded.")
        self.log_file = None
        self.syncthing = None
        self.settings = load_settings()
        if self.settings["autostart"]:
            await Plugin.start(self)  # decky is a bit weird here.
        while True:
            await asyncio.sleep(1)

    async def _unload(self):
        logger.info("Unloading.")
        await Plugin.stop(self)  # decky is a bit weird here.
        if self.log_file is not None:
            try:
                self.log_file.file.close()
                self.log_file = None
            except Exception as ex:
                logger.warning(f"Failed cleaning up temp log file: {ex}")


def load_settings() -> Settings:
    if os.path.exists(SETTINGS_PATH):
        try:
            with open(SETTINGS_PATH, "rb") as f:
                settings = json.load(f)
        except Exception as ex:
            logger.error(
                f"Failed reading config, using default. Exception: {ex}",
            )
            return default_settings()
        if "config_version" not in settings or settings["config_version"] != 1:
            logger.error(f"Unsupported settings version, using default.")
            return default_settings()
        return settings
    return default_settings()


def default_settings() -> Settings:
    return Settings(
        config_version=1,
        autostart=False,
        flatpak_name=DEFAULT_FLATPAK_NAME,
        port=DEFAULT_PORT,
        api_key=""
    )
