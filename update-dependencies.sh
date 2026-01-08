#!/bin/bash

# Script to update yarn dependencies when vulnerabilities are detected
# Usage: ./update-dependencies.sh [options]
# Options:
#   --auto        Automatically apply updates without confirmation
#   --interactive Update packages interactively
#   --help        Show this help message

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default mode
AUTO_MODE=false
INTERACTIVE_MODE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --auto)
            AUTO_MODE=true
            shift
            ;;
        --interactive)
            INTERACTIVE_MODE=true
            shift
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --auto        Automatically apply updates without confirmation"
            echo "  --interactive Update packages interactively (uses yarn upgrade-interactive)"
            echo "  --help        Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Directories to check
DIRECTORIES=("service" "event" "mc-app")

echo -e "${BLUE}=== Yarn Dependency Vulnerability Scanner ===${NC}\n"

# Function to check and update dependencies in a directory
check_and_update() {
    local dir=$1
    
    if [[ ! -d "$dir" ]]; then
        echo -e "${YELLOW}Directory $dir not found, skipping...${NC}"
        return
    fi
    
    if [[ ! -f "$dir/package.json" ]]; then
        echo -e "${YELLOW}No package.json in $dir, skipping...${NC}"
        return
    fi
    
    echo -e "${BLUE}Checking $dir...${NC}"
    cd "$dir"
    
    # Run yarn audit and capture output
    if yarn audit --json > audit-output.json 2>&1; then
        echo -e "${GREEN}✓ No vulnerabilities found in $dir${NC}\n"
        rm -f audit-output.json
        cd ..
        return
    fi
    
    # Parse audit results
    local high_vulns=$(grep -o '"severity":"high"' audit-output.json 2>/dev/null | wc -l || echo 0)
    local moderate_vulns=$(grep -o '"severity":"moderate"' audit-output.json 2>/dev/null | wc -l || echo 0)
    local low_vulns=$(grep -o '"severity":"low"' audit-output.json 2>/dev/null | wc -l || echo 0)
    local critical_vulns=$(grep -o '"severity":"critical"' audit-output.json 2>/dev/null | wc -l || echo 0)
    
    echo -e "${RED}⚠ Vulnerabilities found in $dir:${NC}"
    [[ $critical_vulns -gt 0 ]] && echo -e "  ${RED}Critical: $critical_vulns${NC}"
    [[ $high_vulns -gt 0 ]] && echo -e "  ${RED}High: $high_vulns${NC}"
    [[ $moderate_vulns -gt 0 ]] && echo -e "  ${YELLOW}Moderate: $moderate_vulns${NC}"
    [[ $low_vulns -gt 0 ]] && echo -e "  ${YELLOW}Low: $low_vulns${NC}"
    echo ""
    
    rm -f audit-output.json
    
    # Handle update based on mode
    if [[ "$INTERACTIVE_MODE" == true ]]; then
        echo -e "${BLUE}Starting interactive upgrade for $dir...${NC}"
        yarn upgrade-interactive --latest
    elif [[ "$AUTO_MODE" == true ]]; then
        echo -e "${BLUE}Automatically updating dependencies in $dir...${NC}"
        yarn upgrade
        echo -e "${GREEN}✓ Dependencies updated in $dir${NC}\n"
    else
        read -p "$(echo -e ${YELLOW}Do you want to update dependencies in $dir? [y/N]:${NC} )" -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${BLUE}Updating dependencies...${NC}"
            yarn upgrade
            echo -e "${GREEN}✓ Dependencies updated in $dir${NC}\n"
        else
            echo -e "${YELLOW}Skipping $dir${NC}\n"
        fi
    fi
    
    # Run audit again to check if vulnerabilities were fixed
    echo -e "${BLUE}Verifying fix...${NC}"
    if yarn audit > /dev/null 2>&1; then
        echo -e "${GREEN}✓ All vulnerabilities resolved in $dir${NC}\n"
    else
        echo -e "${YELLOW}⚠ Some vulnerabilities may still exist. You may need to update manually.${NC}\n"
    fi
    
    cd ..
}

# Main execution
echo "Scanning directories: ${DIRECTORIES[*]}"
echo ""

for dir in "${DIRECTORIES[@]}"; do
    check_and_update "$dir"
done

echo -e "${GREEN}=== Scan complete ===${NC}"
echo ""
echo "To run this script:"
echo "  Normal mode (with prompts):  ./update-dependencies.sh"
echo "  Auto mode:                   ./update-dependencies.sh --auto"
echo "  Interactive mode:            ./update-dependencies.sh --interactive"
