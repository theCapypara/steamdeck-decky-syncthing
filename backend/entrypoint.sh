#!/bin/sh
set -ex

cd /backend/decky-syncthing-watchdog

cargo build --release

mkdir -p ../out
realpath ../out/
cp target/release/decky-syncthing-watchdog ../out/decky-syncthing-watchdog
