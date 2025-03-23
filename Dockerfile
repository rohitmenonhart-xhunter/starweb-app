# Build stage
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Install build dependencies and Puppeteer dependencies
RUN apk update && apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    python3 \
    make \
    g++

# Tell Puppeteer to skip installing Chrome. We'll be using the installed package.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Create a placeholder .env file if it doesn't exist
RUN if [ ! -f .env ]; then \
    echo "# This is a placeholder .env file. Please provide actual values via docker-compose volume." > .env; \
    echo "OPENAI_API_KEY=placeholder" >> .env; \
    echo "EMAIL_USER=placeholder" >> .env; \
    echo "EMAIL_PASS=placeholder" >> .env; \
    echo "EMAIL_SERVICE=gmail" >> .env; \
    fi

# Build the frontend
RUN npm run build

# Production stage
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install production dependencies and Puppeteer dependencies
RUN apk update && apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    wget \
    dumb-init

# Tell Puppeteer to skip installing Chrome. We'll be using the installed package.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV NODE_ENV=production
ENV HOST=0.0.0.0

# Create a non-root user to run the application
RUN addgroup -S appuser && adduser -S -G appuser appuser

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built assets from the build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/server.js ./server.js
COPY --from=build /app/src/api ./src/api
COPY --from=build /app/src/utils ./src/utils

# Create a placeholder .env file that will be overridden by the volume mount
RUN echo "# This is a placeholder .env file. Please provide actual values via docker-compose volume." > .env && \
    echo "OPENAI_API_KEY=placeholder" >> .env && \
    echo "EMAIL_USER=placeholder" >> .env && \
    echo "EMAIL_PASS=placeholder" >> .env && \
    echo "EMAIL_SERVICE=gmail" >> .env

# Set proper permissions
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose the port the app runs on
EXPOSE 3001

# Use dumb-init as the entry point to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Command to run the application
CMD ["node", "server.js"] 