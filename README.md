# Decky Syncthing plugin.
A [Decky](https://decky.xyz/) plugin to manage [Syncthing](https://syncthing.net/) from your Steam Deck.

This plugin allows you to start and stop Syncthing from the Quick Access panel of your Steam Deck.

It also has some basic stats and allows you to access the web UI. It can also be configured to automatically start
Syncthing with Gamescope (the Steam Deck main UI).

The plugin works no matter if you have HTTPS enabled or not and also no matter if you have basic auth enabled.

Since the Steam Deck UI has no support for self-signed HTTPS certificates or Basic Auth, this plugin starts a proxy
server on port 58384 (HTTP, localhost only) that forwards requests to the Sy
ncthing Web UI and API. 