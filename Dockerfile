FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json ./
COPY server/package.json server/package-lock.json ./server/
COPY client/package.json client/package-lock.json ./client/

RUN npm install --prefix server && npm install --prefix client

COPY . .

RUN npm run build --prefix client

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV OLLAMA_DISABLED=true
ENV GROQ_DISABLED=true

EXPOSE 8080

CMD ["node", "server/index.js"]
