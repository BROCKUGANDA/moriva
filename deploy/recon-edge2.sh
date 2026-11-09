#!/usr/bin/env bash
set -u
echo "=== edge.d maps ==="
docker exec edge-router-router-1 sh -c 'ls -la /etc/nginx/edge.d; for f in /etc/nginx/edge.d/*; do echo "---$f---"; cat "$f"; done' 2>&1
echo "=== edge compose dir ==="
ls -la /home/ubuntu/edge 2>&1
echo "=== edge compose file ==="
cat /home/ubuntu/edge/compose.y*ml 2>/dev/null || cat /home/ubuntu/edge/docker-compose.y*ml 2>/dev/null
echo "=== loopback listeners 808x/844x ==="
ss -tlnp 2>/dev/null | grep -E '808[0-9]|844[0-9]' || true
echo "=== caddy sidecar containers ==="
docker ps --format '{{.Names}} {{.Ports}}' | grep -i caddy || true
echo "=== done ==="
