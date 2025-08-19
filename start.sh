#!/bin/sh

# Service startup orchestration script for Docker container
# Runs the Node.js SSR server with proper process management

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_PORT=${PORT:-3000}
SHUTDOWN_TIMEOUT=10

# Process ID
FRONTEND_PID=""

# Cleanup function for graceful shutdown
cleanup() {
    echo -e "${YELLOW}Received shutdown signal, initiating graceful shutdown...${NC}"

    if [ -n "$FRONTEND_PID" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
        echo -e "${BLUE}Stopping SvelteKit SSR server (PID: $FRONTEND_PID)...${NC}"
        kill -TERM "$FRONTEND_PID" 2>/dev/null || true
    fi

    # Wait for graceful shutdown with timeout
    local timeout=$SHUTDOWN_TIMEOUT
    while [ $timeout -gt 0 ]; do
        if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
            echo -e "${GREEN}Service stopped gracefully${NC}"
            exit 0
        fi

        sleep 1
        timeout=$((timeout - 1))
    done

    # Force kill if graceful shutdown failed
    echo -e "${RED}Graceful shutdown timeout, force killing process...${NC}"
    if [ -n "$FRONTEND_PID" ]; then
        kill -KILL "$FRONTEND_PID" 2>/dev/null || true
    fi

    exit 1
}

# Set up signal handlers
trap cleanup TERM INT QUIT

# Function to check if port is available
check_port() {
    local port=$1
    if netstat -ln 2>/dev/null | grep -q ":$port "; then
        echo -e "${RED}Error: Port $port is already in use${NC}"
        return 1
    fi
    return 0
}

# Main startup sequence
echo -e "${GREEN}=== SvelteKit App Docker Container Startup ===${NC}"
echo -e "${BLUE}Frontend port: $FRONTEND_PORT${NC}"

# Check if port is available (in case of restart)
if ! check_port "$FRONTEND_PORT"; then
    echo -e "${YELLOW}Warning: Frontend port $FRONTEND_PORT appears to be in use${NC}"
fi

# Start SvelteKit SSR server
echo -e "${GREEN}Starting SvelteKit SSR server on port $FRONTEND_PORT...${NC}"
export PORT="$FRONTEND_PORT"
node build/index.js &
FRONTEND_PID=$!

if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
    echo -e "${RED}Failed to start SvelteKit SSR server${NC}"
    exit 1
fi

echo -e "${BLUE}SvelteKit SSR server started with PID: $FRONTEND_PID${NC}"

echo -e "${GREEN}=== Service started successfully ===${NC}"
echo -e "${GREEN}Frontend: http://localhost:$FRONTEND_PORT${NC}"
echo -e "${BLUE}Container is ready to serve requests${NC}"

# Wait for the process to exit
wait $FRONTEND_PID
# If wait returns, the process has exited.
EXIT_CODE=$?
echo -e "${RED}SvelteKit SSR server (PID: $FRONTEND_PID) has stopped unexpectedly with exit code $EXIT_CODE${NC}"
exit $EXIT_CODE
