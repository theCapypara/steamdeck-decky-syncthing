#!/usr/bin/env bash
CLI_LOCATION="$(pwd)/cli"
echo "Building plugin in $(pwd)"

$CLI_LOCATION/decky plugin build $(pwd)
