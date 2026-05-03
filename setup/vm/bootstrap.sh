#!/usr/bin/env bash
set -euo pipefail

# ---- basics
sudo apt update -y
sudo apt install -y ca-certificates curl git

# ---- docker
curl -fsSL https://get.docker.com | sudo sh

# allow current user to run docker without sudo
sudo usermod -aG docker $USER

# ---- docker compose (plugin is included in modern docker, but ensure)
docker compose version || sudo apt install -y docker-compose-plugin

# ---- create app dirs
sudo mkdir -p /opt/catalystcare
sudo chown -R $USER:$USER /opt/catalystcare

# ---- clone repo (public repo is fine)
cd /opt/catalystcare
git clone https://github.com/<your-username>/<your-repo>.git app

# ---- optional: create env file placeholder
cd app
touch .env

echo "Bootstrap complete. Re-login to apply docker group."