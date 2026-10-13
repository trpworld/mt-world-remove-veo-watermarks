# Use Node 20 Debian slim image
FROM node:20-bookworm-slim

# Install system dependencies including FFmpeg
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install npm dependencies
RUN npm install

# Copy application source code
COPY . .

# Build Vite frontend assets into dist/
RUN npm run build

# Default environment variables
ENV NODE_ENV=production
ENV PORT=10000

# Expose port (Render automatically routes this)
EXPOSE 10000

# Start unified server
CMD ["node", "server/index.js"]
