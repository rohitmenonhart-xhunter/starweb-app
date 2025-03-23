#!/bin/bash

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}StarWeb Docker Test Script${NC}"
echo -e "This script will test if the Docker container is working correctly."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}Error: Docker is not running. Please start Docker first.${NC}"
  exit 1
fi

# Check if the container is running
if ! docker ps | grep -q "starweb-app"; then
  echo -e "${RED}Error: StarWeb container is not running. Please start it with './docker-build.sh start'${NC}"
  exit 1
fi

# Test the health endpoint
echo -e "${YELLOW}Testing health endpoint...${NC}"
HEALTH_RESPONSE=$(curl -s http://localhost:3001/health)

if [[ $HEALTH_RESPONSE == *"status"*"ok"* ]]; then
  echo -e "${GREEN}Health check passed! The server is running correctly.${NC}"
else
  echo -e "${RED}Health check failed. Response: $HEALTH_RESPONSE${NC}"
  echo -e "${YELLOW}Check the logs with './docker-build.sh logs' for more information.${NC}"
  exit 1
fi

# Test a simple analysis (optional, will take longer)
echo -e "${YELLOW}Would you like to test a website analysis? This may take a minute or two. (y/n)${NC}"
read -r TEST_ANALYSIS

if [[ $TEST_ANALYSIS == "y" || $TEST_ANALYSIS == "Y" ]]; then
  echo -e "${YELLOW}Testing website analysis with example.com...${NC}"
  ANALYSIS_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d '{"url":"https://example.com"}' http://localhost:3001/analyze)
  
  if [[ $ANALYSIS_RESPONSE == *"mainPage"* ]]; then
    echo -e "${GREEN}Analysis test passed! The analysis functionality is working correctly.${NC}"
  else
    echo -e "${RED}Analysis test failed. Check the logs with './docker-build.sh logs' for more information.${NC}"
    exit 1
  fi
fi

echo -e "${GREEN}All tests passed! The Docker container is working correctly.${NC}"
echo -e "${GREEN}You can access the application at http://localhost:3001${NC}" 