#!/usr/bin/env bash
# Starts Expo with the proxy URL plus the owner's Expo login (from root .env).
cd "$(dirname "$0")"
set -a
. ./.env
for k in EXPO_TOKEN EXPO_DEV_EAS_PROJECT_ID EXPO_DEV_OWNER; do
  v=$(grep "^$k=" ../../.env | cut -d= -f2- | sed -e "s/^[\"']//" -e "s/[\"']$//"); [ -n "$v" ] && export "$k=$v"
done
set +a
exec bunx expo start --port "${1:-4300}" "${@:2}"
