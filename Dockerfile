FROM node:20-slim

# 1. Install LibreOffice, System Dependencies, and actual Chromium
RUN apt-get update && apt-get install -y \
    libreoffice \
    fonts-liberation \
    chromium \
    libnss3 \
    libatk-bridge2.0-0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpangocairo-1.0-0 \
    libxshmfence1 \
    wget \
    ca-certificates \
    --no-install-recommends \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# 2. Point Puppeteer to the Debian Chromium binary
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# 3. Copy only package files first to leverage Docker cache
COPY package.json pnpm-lock.yaml* ./

# 4. Install dependencies (including the new marked/gray-matter bridges)
# Note: Using --ignore-scripts to prevent puppeteer from trying to download its own chrome
RUN npm install --legacy-peer-deps --ignore-scripts

# 5. Copy the rest of the source
COPY . .

# 6. Global install for the runner
RUN npm install -g tsx 

# 7. Execute the Unified Generator
# --scan-content is added to ensure it finds your 75 briefs
CMD ["tsx", "scripts/pdf/unified-pdf-generator.ts", "--scan-content", "--overwrite", "--strict"]