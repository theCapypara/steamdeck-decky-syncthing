#!/bin/sh
set -ex

cd /backend/decky-syncthing-watchdog

cargo build #--release

mkdir -p ../out
realpath ../out/
cp target/debug/decky-syncthing-watchdog ../out/decky-syncthing-watchdog
