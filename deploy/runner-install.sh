#!/usr/bin/env bash
set -euo pipefail
# Install a GitHub self-hosted runner on the OVH VPS (labels: self-hosted, moriva).
# Usage: RUNNER_TOKEN=<registration token> bash deploy/runner-install.sh
# Get the token: gh api -X POST repos/BROCKUGANDA/moriva/actions/runners/registration-token --jq .token

RUNNER_VERSION="${RUNNER_VERSION:-2.328.0}"
RUNNER_DIR="${RUNNER_DIR:-/mnt/data/moriva-runner}"
LABELS="${RUNNER_LABELS:-self-hosted,moriva}"

if [ -z "${RUNNER_TOKEN:-}" ]; then
  echo "RUNNER_TOKEN is required (registration token, single use)." >&2
  exit 1
fi

sudo mkdir -p "$RUNNER_DIR"
sudo chown -R "$(whoami)":"$(whoami)" "$RUNNER_DIR"
cd "$RUNNER_DIR"

ARCH="$(uname -m)"
case "$ARCH" in
  x86_64) RUNNER_ARCH="x64" ;;
  aarch64|arm64) RUNNER_ARCH="arm64" ;;
  *) echo "unsupported arch: $ARCH" >&2; exit 1 ;;
esac

if [ ! -f "bin/Runner.Listener" ]; then
  curl -fsSLO "https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-linux-${RUNNER_ARCH}-${RUNNER_VERSION}.tar.gz"
  tar xzf "actions-runner-linux-${RUNNER_ARCH}-${RUNNER_VERSION}.tar.gz"
fi

./config.sh remove --token "${RUNNER_TOKEN}" 2>/dev/null || true
./config.sh --unattended \
  --url "https://github.com/BROCKUGANDA/moriva" \
  --token "${RUNNER_TOKEN}" \
  --name "ovh-moriva-01" \
  --labels "$LABELS" \
  --work "_work"

sudo ./svc.sh install
sudo ./svc.sh start
./svc.sh status
