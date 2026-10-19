#!/bin/bash
set -e

PROJECT=~/hyperledger/insurance-kyc

echo "🔍 Checking Fabric network..."
if ! docker ps --format '{{.Names}}' | grep -q "peer0.org1.example.com"; then
    echo "🚀 Network not running — doing a clean rebuild (this wipes any old ledger data and takes a minute)..."
    cd $PROJECT/network
    docker compose down -v || true
    sudo rm -rf organizations/ config/
    ./network.sh up
    echo "📝 Reapplying chaincode v2.0 (payout fix)..."
    docker compose -f docker-compose.yml run --rm cli bash ./scripts/upgradeCC.sh
else
    echo "✅ Network already running."
fi

echo "🚀 Starting backend..."
cd $PROJECT/backend
nohup node server.js > backend.log 2>&1 &
sleep 3
echo "✅ Backend started (logs: $PROJECT/backend/backend.log)"

echo "🚀 Checking nginx..."
sudo systemctl start nginx
echo "✅ nginx running."

echo "🚀 Starting Cloudflare Tunnel..."
nohup cloudflared tunnel --url http://localhost:80 > $PROJECT/tunnel.log 2>&1 &
sleep 6

TUNNEL_URL=$(grep -o 'https://[a-zA-Z0-9.-]*\.trycloudflare\.com' $PROJECT/tunnel.log | head -1)
echo ""
echo "🎉 Everything is up!"
echo "🌐 Public URL: $TUNNEL_URL"
echo ""
echo "Logs:"
echo "  Backend: $PROJECT/backend/backend.log"
echo "  Tunnel:  $PROJECT/tunnel.log"
