#!/bin/bash

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to display help
show_help() {
  echo -e "${YELLOW}StarWeb Docker Build Script${NC}"
  echo -e "Usage: ./docker-build.sh [OPTION]"
  echo -e "Options:"
  echo -e "  ${GREEN}build${NC}    Build and start the Docker container"
  echo -e "  ${GREEN}start${NC}    Start existing Docker container"
  echo -e "  ${GREEN}stop${NC}     Stop Docker container"
  echo -e "  ${GREEN}restart${NC}  Restart Docker container"
  echo -e "  ${GREEN}logs${NC}     Show Docker container logs"
  echo -e "  ${GREEN}clean${NC}    Remove Docker container, images, and volumes"
  echo -e "  ${GREEN}help${NC}     Show this help message"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
  echo -e "${RED}Error: Docker is not installed. Please install Docker first.${NC}"
  exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
  echo -e "${RED}Error: Docker Compose is not installed. Please install Docker Compose first.${NC}"
  exit 1
fi

# Function to create or check .env file
setup_env_file() {
  if [ ! -f .env ]; then
    echo -e "${YELLOW}Warning: .env file not found. Creating a sample .env file...${NC}"
    cat > .env << EOL
# OpenAI API Key (required for AI analysis)
OPENAI_API_KEY=your_openai_api_key

# Email configuration (required for email sharing)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_SERVICE=gmail
EOL
    echo -e "${YELLOW}Please edit the .env file with your actual API keys and settings before continuing.${NC}"
    echo -e "${YELLOW}Would you like to edit the .env file now? (y/n)${NC}"
    read -r EDIT_ENV
    if [[ $EDIT_ENV == "y" || $EDIT_ENV == "Y" ]]; then
      if command -v nano &> /dev/null; then
        nano .env
      elif command -v vim &> /dev/null; then
        vim .env
      elif command -v vi &> /dev/null; then
        vi .env
      else
        echo -e "${YELLOW}No text editor found. Please edit the .env file manually.${NC}"
      fi
    fi
  else
    # Check if the .env file contains the required variables
    if ! grep -q "OPENAI_API_KEY" .env || ! grep -q "EMAIL_USER" .env || ! grep -q "EMAIL_PASS" .env; then
      echo -e "${YELLOW}Warning: .env file may be missing required variables.${NC}"
      echo -e "${YELLOW}Please ensure your .env file contains OPENAI_API_KEY, EMAIL_USER, and EMAIL_PASS.${NC}"
    fi
  fi
}

# Process command line arguments
case "$1" in
  build)
    setup_env_file
    echo -e "${GREEN}Building and starting Docker container...${NC}"
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d
    echo -e "${GREEN}Docker container is now running.${NC}"
    echo -e "${GREEN}The application is available at http://localhost:3001${NC}"
    ;;
  start)
    setup_env_file
    echo -e "${GREEN}Starting Docker container...${NC}"
    docker-compose up -d
    echo -e "${GREEN}Docker container is now running.${NC}"
    echo -e "${GREEN}The application is available at http://localhost:3001${NC}"
    ;;
  stop)
    echo -e "${YELLOW}Stopping Docker container...${NC}"
    docker-compose down
    echo -e "${GREEN}Docker container stopped.${NC}"
    ;;
  restart)
    setup_env_file
    echo -e "${YELLOW}Restarting Docker container...${NC}"
    docker-compose restart
    echo -e "${GREEN}Docker container restarted.${NC}"
    echo -e "${GREEN}The application is available at http://localhost:3001${NC}"
    ;;
  logs)
    echo -e "${GREEN}Showing Docker container logs...${NC}"
    docker-compose logs -f
    ;;
  clean)
    echo -e "${YELLOW}Removing Docker container, images, and volumes...${NC}"
    docker-compose down --rmi all --volumes --remove-orphans
    echo -e "${GREEN}Docker cleanup completed.${NC}"
    ;;
  help|*)
    show_help
    ;;
esac 