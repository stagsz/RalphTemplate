#!/bin/bash

# Ralph Loop Script
# Autonomous AI coding loop
# Based on Geoff Huntley's Ralph methodology

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Set working directory to project root (parent of scripts/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# Configuration
DEFAULT_MODEL="opus"
MAX_ITERATIONS=${2:-0}  # 0 = unlimited
ITERATION=0

# Paths
RALPH_DIR="ralph"
LOGS_DIR="logs"

# Ensure logs directory exists
mkdir -p "$LOGS_DIR"

# Mode selection
MODE=${1:-build}
case $MODE in
    plan|planning)
        PROMPT_FILE="$RALPH_DIR/PROMPT_Plan.md"
        echo -e "${BLUE}🗺️  PLANNING MODE${NC} - Generating/updating implementation plan"
        ;;
    build|building|"")
        PROMPT_FILE="$RALPH_DIR/PROMPT_Build.md"
        echo -e "${GREEN}🔨 BUILDING MODE${NC} - Implementing from plan"
        ;;
    *)
        # If first arg is a number, treat as max iterations for build mode
        if [[ $MODE =~ ^[0-9]+$ ]]; then
            MAX_ITERATIONS=$MODE
            PROMPT_FILE="$RALPH_DIR/PROMPT_Build.md"
            echo -e "${GREEN}🔨 BUILDING MODE${NC} - Max $MAX_ITERATIONS iterations"
        else
            echo -e "${RED}Unknown mode: $MODE${NC}"
            echo "Usage: ./scripts/loop.sh [plan|build] [max_iterations]"
            echo "  ./scripts/loop.sh           # Build mode, unlimited"
            echo "  ./scripts/loop.sh plan      # Planning mode"
            echo "  ./scripts/loop.sh build 20  # Build mode, max 20 iterations"
            echo "  ./scripts/loop.sh 20        # Build mode, max 20 iterations"
            exit 1
        fi
        ;;
esac

# Check required files exist
if [ ! -f "$PROMPT_FILE" ]; then
    echo -e "${RED}Error: $PROMPT_FILE not found${NC}"
    exit 1
fi

if [ ! -f "$RALPH_DIR/AGENTS.md" ]; then
    echo -e "${RED}Error: $RALPH_DIR/AGENTS.md not found${NC}"
    exit 1
fi

# Main loop
echo -e "${YELLOW}Starting Ralph loop...${NC}"
echo "Project root: $PROJECT_ROOT"
echo "Press Ctrl+C to stop"
echo "---"

while true; do
    ITERATION=$((ITERATION + 1))

    # Check max iterations
    if [ $MAX_ITERATIONS -gt 0 ] && [ $ITERATION -gt $MAX_ITERATIONS ]; then
        echo -e "${YELLOW}Max iterations ($MAX_ITERATIONS) reached. Stopping.${NC}"
        break
    fi

    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}Iteration $ITERATION${NC} $(date '+%Y-%m-%d %H:%M:%S')"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

    # Run Claude with the prompt
    LOG_FILE="$LOGS_DIR/ralph_log_$(date '+%Y%m%d').txt"

    echo "Starting Claude at $(date '+%H:%M:%S')..." | tee -a "$LOG_FILE"

    # Run Claude with prompt from stdin
    CLAUDE_CMD="${CLAUDE_CMD:-$(command -v claude 2>/dev/null || echo 'claude')}"
    "$CLAUDE_CMD" -p \
        --dangerously-skip-permissions \
        --model "$DEFAULT_MODEL" \
        --verbose \
        < "$PROMPT_FILE" 2>&1 | tee -a "$LOG_FILE"

    EXIT_CODE=${PIPESTATUS[0]}

    echo "Claude finished at $(date '+%H:%M:%S') with exit code $EXIT_CODE" | tee -a "$LOG_FILE"

    if [ $EXIT_CODE -ne 0 ]; then
        echo -e "${RED}Claude exited with code $EXIT_CODE${NC}"
        echo "Check $LOG_FILE for details"
        echo "Continuing to next iteration in 5 seconds..."
        sleep 5
    fi

    echo ""
    echo -e "${GREEN}Iteration $ITERATION complete. Starting fresh context...${NC}"
    echo ""

    # Small delay between iterations
    sleep 2
done

echo -e "${GREEN}Ralph loop completed after $ITERATION iterations.${NC}"
