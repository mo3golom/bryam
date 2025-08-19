#!/bin/bash

# Development script for the SvelteKit Application
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Global variables for process management
FRONTEND_PID=""
TUNNEL_PID=""

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --tunnel   Start localtunnel for external access (requires localtunnel to be installed)"
    echo "  --help     Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                # Start the development server"
    echo "  $0 --tunnel       # Start the development server with localtunnel"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is available
is_port_available() {
    local port=$1
    if command_exists lsof; then
        ! lsof -i :$port >/dev/null 2>&1
    elif command_exists netstat; then
        ! netstat -ln | grep -q ":$port "
    else
        # Fallback: try to bind to the port
        (echo >/dev/tcp/localhost/$port) >/dev/null 2>&1 && return 1 || return 0
    fi
}

# Function to check and install localtunnel
check_localtunnel() {
    if ! command_exists lt; then
        print_warning "localtunnel is not installed. Installing globally..."
        npm install -g localtunnel
        if ! command_exists lt; then
            print_error "Failed to install localtunnel. Please install it manually: npm install -g localtunnel"
            exit 1
        fi
        print_success "localtunnel installed successfully"
    else
        print_success "localtunnel is already installed"
    fi
}

# Function to check and install dependencies
check_dependencies() {
    local use_tunnel=${1:-false}

    print_info "Checking dependencies..."

    # Check Node.js
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js 18 or later."
        print_info "Visit: https://nodejs.org/"
        exit 1
    fi

    # Check npm
    if ! command_exists npm; then
        print_error "npm is not installed. Please install npm."
        exit 1
    fi

    print_success "All required tools are available"

    # Check localtunnel if needed
    if [ "$use_tunnel" = "true" ]; then
        check_localtunnel
    fi

    # Check Node.js dependencies
    print_info "Checking Node.js dependencies..."
    if [ ! -d "node_modules" ]; then
        print_info "Installing Node.js dependencies..."
        npm install
    fi

    print_success "Dependencies are up to date"
}

# Function to check port availability
check_ports() {
    # Check frontend port (5173)
    if ! is_port_available 5173; then
        print_error "Port 5173 is already in use. Please stop the service using this port."
        print_info "You can find the process using: lsof -i :5173"
        exit 1
    fi
}

# Function to start localtunnel
start_tunnel() {
    local subdomain="svelte-app"

    print_info "Starting localtunnel with subdomain: $subdomain..."

    # Start localtunnel in background
    lt --port 5173 --subdomain "$subdomain" &
    TUNNEL_PID=$!

    # Wait a moment for tunnel to establish
    sleep 3
    if ! kill -0 $TUNNEL_PID 2>/dev/null; then
        print_error "Failed to start localtunnel"
        exit 1
    fi

    local tunnel_url="https://$subdomain.loca.lt"
    print_success "Localtunnel started (PID: $TUNNEL_PID)"
    print_info "Tunnel URL: $tunnel_url"

    # Store the URL for other functions to use
    TUNNEL_URL="$tunnel_url"
}

# Function to cleanup processes on exit
cleanup() {
    print_info "Shutting down services..."

    if [ -n "$TUNNEL_PID" ]; then
        print_info "Stopping localtunnel (PID: $TUNNEL_PID)..."
        kill $TUNNEL_PID 2>/dev/null || true
        wait $TUNNEL_PID 2>/dev/null || true
    fi

    if [ -n "$FRONTEND_PID" ]; then
        print_info "Stopping SvelteKit frontend (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID 2>/dev/null || true
        wait $FRONTEND_PID 2>/dev/null || true
    fi

    print_success "All services stopped"
    exit 0
}

# Function to start SvelteKit frontend
start_frontend() {
    print_info "Starting SvelteKit frontend server on port 5173..."

    # Start frontend server in background
    npm run dev &
    FRONTEND_PID=$!

    # Wait a moment and check if the process is still running
    sleep 3
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        print_error "Failed to start SvelteKit frontend server"
        exit 1
    fi

    print_success "SvelteKit frontend server started (PID: $FRONTEND_PID)"
}

# Function to start the application
start_app() {
    local use_tunnel=${1:-false}

    print_info "Starting SvelteKit Application..."

    start_frontend

    if [ "$use_tunnel" = "true" ]; then
        start_tunnel
    fi

    echo ""
    print_success "Frontend service is running!"
    print_info "Frontend: http://localhost:5173"

    if [ "$use_tunnel" = "true" ]; then
        print_info "External access: $TUNNEL_URL"
    fi

    print_info "Press Ctrl+C to stop the service"
    echo ""

    # Wait for the frontend process
    wait $FRONTEND_PID
}

# Main script logic
main() {
    # Set up signal handlers for cleanup
    trap cleanup SIGINT SIGTERM EXIT

    # Parse command line arguments
    USE_TUNNEL=false

    # Parse all arguments
    for arg in "$@"; do
        case $arg in
            --tunnel)
                USE_TUNNEL=true
                shift
                ;;
            -h|--help|help)
                show_usage
                exit 0
                ;;
            *)
                # Ignore unknown arguments
                ;;
        esac
    done

    check_dependencies "$USE_TUNNEL"
    check_ports
    start_app "$USE_TUNNEL"
}

# Run main function with all arguments
main "$@"
