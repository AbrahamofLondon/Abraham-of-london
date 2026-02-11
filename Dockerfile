FROM node:20-slim
RUN apt-get update && apt-get install -y libreoffice fonts-liberation libnss3 libatk-bridge2.0-0 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libasound2 libpangocairo-1.0-0 libxshmfence1 wget ca-certificates --no-install-recommends && apt-get clean && rm -rf /var/lib/apt/lists/*
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
WORKDIR /app
COPY package*.json ./
# Added --ignore-scripts to bypass Prisma generation during build
RUN npm install --legacy-peer-deps --ignore-scripts
COPY . .
CMD ["node", "--loader", "ts-node/esm", "scripts/pdf/unified-pdf-generator.ts", "--overwrite", "--strict"]
