#!/bin/bash

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}StarWeb Environment Variables Test Script${NC}"
echo -e "This script will test if the .env file is properly mounted in the Docker container."

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

# Check if .env file exists
if [ ! -f .env ]; then
  echo -e "${RED}Error: .env file not found. Please create it with './docker-build.sh build'${NC}"
  exit 1
fi

echo -e "${YELLOW}Testing environment variables in the Docker container...${NC}"

# Get a list of environment variables from the container
ENV_VARS=$(docker exec starweb-app env)

# Check if OPENAI_API_KEY is set
if echo "$ENV_VARS" | grep -q "OPENAI_API_KEY"; then
  OPENAI_KEY=$(echo "$ENV_VARS" | grep "OPENAI_API_KEY" | cut -d'=' -f2)
  if [[ "$OPENAI_KEY" == "placeholder" ]]; then
    echo -e "${RED}Warning: OPENAI_API_KEY is set to the placeholder value.${NC}"
    echo -e "${YELLOW}Please edit your .env file with a valid API key.${NC}"
  else
    echo -e "${GREEN}OPENAI_API_KEY is properly set in the container.${NC}"
  fi
else
  echo -e "${RED}Error: OPENAI_API_KEY is not set in the container.${NC}"
  echo -e "${YELLOW}Check if your .env file contains OPENAI_API_KEY and restart the container.${NC}"
fi

# Check if EMAIL_USER is set
if echo "$ENV_VARS" | grep -q "EMAIL_USER"; then
  EMAIL_USER=$(echo "$ENV_VARS" | grep "EMAIL_USER" | cut -d'=' -f2)
  if [[ "$EMAIL_USER" == "placeholder" ]]; then
    echo -e "${RED}Warning: EMAIL_USER is set to the placeholder value.${NC}"
    echo -e "${YELLOW}Please edit your .env file with a valid email address.${NC}"
  else
    echo -e "${GREEN}EMAIL_USER is properly set in the container.${NC}"
  fi
else
  echo -e "${RED}Error: EMAIL_USER is not set in the container.${NC}"
  echo -e "${YELLOW}Check if your .env file contains EMAIL_USER and restart the container.${NC}"
fi

# Check if EMAIL_PASS is set
if echo "$ENV_VARS" | grep -q "EMAIL_PASS"; then
  EMAIL_PASS=$(echo "$ENV_VARS" | grep "EMAIL_PASS" | cut -d'=' -f2)
  if [[ "$EMAIL_PASS" == "placeholder" ]]; then
    echo -e "${RED}Warning: EMAIL_PASS is set to the placeholder value.${NC}"
    echo -e "${YELLOW}Please edit your .env file with a valid email password.${NC}"
  else
    echo -e "${GREEN}EMAIL_PASS is properly set in the container.${NC}"
  fi
else
  echo -e "${RED}Error: EMAIL_PASS is not set in the container.${NC}"
  echo -e "${YELLOW}Check if your .env file contains EMAIL_PASS and restart the container.${NC}"
fi

echo -e "${YELLOW}Testing email configuration endpoint...${NC}"
EMAIL_CONFIG_RESPONSE=$(curl -s http://localhost:3001/api/test-email-config)

if [[ $EMAIL_CONFIG_RESPONSE == *"success"*"true"* ]]; then
  echo -e "${GREEN}Email configuration endpoint is working correctly.${NC}"
else
  echo -e "${RED}Email configuration endpoint failed. Response: $EMAIL_CONFIG_RESPONSE${NC}"
  echo -e "${YELLOW}Check the logs with './docker-build.sh logs' for more information.${NC}"
fi

echo -e "${GREEN}Environment variables test completed.${NC}"
echo -e "${YELLOW}If you see any warnings or errors, please edit your .env file and restart the container.${NC}" 