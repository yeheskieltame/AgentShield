FROM node:20-slim

WORKDIR /app

# Copy package files first for better Docker cache
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --omit=dev && npm install tsx

# Copy source code
COPY lib/ ./lib/
COPY agents/ ./agents/
COPY hf-space/ ./hf-space/
COPY tsconfig.json ./

# HF Spaces expects port 7860
ENV PORT=7860
EXPOSE 7860

# Health check for HF Spaces
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD curl -f http://localhost:7860/health || exit 1

CMD ["npx", "tsx", "hf-space/server.ts"]
