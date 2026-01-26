#!/bin/bash
# Wrapper script - calls scripts/loop.sh
exec "$(dirname "$0")/scripts/loop.sh" "$@"
