# Decky Syncthing plugin.
A [Decky](https://decky.xyz/) plugin to manage [Syncthing](https://syncthing.net/) from your Steam Deck.

This plugin allows you to start and stop Syncthing from the Quick Access panel of your Steam Deck.

The plugin supports controlling an existing Syncthing Systemd service, but it can also create and manage a service
for any Syncthing Flatpak, such as the 'Syncthing GTK' flatpak, which you can install from Discover. 

An installation wizard guides you through the setup.

The plugin provides some basic stats and allows you to access the web UI. It can also be configured to automatically 
start Syncthing with Gamescope (the Steam Deck main UI) or boot.

The plugin works no matter if you have HTTPS enabled or not and also no matter if you have basic auth enabled.

There is a background process `decky-syncthing-watchdog` started by this plugin, which runs all the time if Gamescope
and the plugin is active and acts as a backend for controlling the main Syncthing service and.
Since the Steam Deck UI has no support for self-signed HTTPS certificates or Basic Auth, it also acts as a
proxy server on port 58384 (HTTP, localhost only) that forwards requests to the Syncthing Web UI and API.

## Setup instructions

### Using Syncthing GTK Flatpak (Recommended)

- Install the Syncthing GTK Flatpak: https://flathub.org/apps/me.kozec.syncthingtk
- Launch the Syncthing GTK
- **(Very important)** Stop syncthing and quit Syncthing GTK
  - Right click on the tray icon and hit "Stop Syncthing"
  - Hit "Quit" on the "Syncthing has been shut down" popup
- Switch back to Gamescope and open the Decky syncthing
- In the setup, select `Installed via the "Syncthing GTK" Flatpak`
- This should auto-populate everything and just follow the setup process

**Note:** If the web interface fails to load, try setting the Port to `8081`

### Installing Syncthing as Systemd (via Pacman)

**IMPORTANT**: You will have redo this process every time SteamOS updates, as it replaces all the systemd files

- Install syncthing via pacman: https://wiki.archlinux.org/title/Syncthing
- Follow the arch wiki above to do the initial setup
- Stop the syncthing process
- Now switch back to Gamescope and open the Decky syncthing
- In the setup, select `Installed directly on the System`
- This should auto-populate everything and just follow the setup process
