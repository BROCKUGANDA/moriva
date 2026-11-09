#!/usr/bin/env bash
set -u
echo "=== nginx.conf ==="
docker exec edge-router-router-1 cat /etc/nginx/nginx.conf 2>&1
echo "=== conf.d listing ==="
docker exec edge-router-router-1 ls -la /etc/nginx/conf.d 2>&1
echo "=== conf contents ==="
docker exec edge-router-router-1 sh -c 'for f in /etc/nginx/conf.d/*; do echo "---$f---"; cat "$f"; done' 2>&1
echo "=== compose project dirs ==="
docker inspect edge-router-router-1 --format '{{index .Config.Labels "com.docker.compose.project.working_dir"}}' 2>&1
echo "=== disk ==="
df -h /var/lib/docker /mnt/data / 2>&1
echo "=== done ==="
