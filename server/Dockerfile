# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /usr/src/node-app

COPY package.json yarn.lock ./
RUN yarn install --pure-lockfile

COPY . .

# Stage 2: Production runtime stage
FROM node:20-alpine

WORKDIR /usr/src/node-app

COPY package.json yarn.lock ./
RUN yarn install --pure-lockfile --production

# Copy source code and uploads folder template
COPY --from=builder /usr/src/node-app/src ./src

# Ensure uploads directory exists and is owned by the node user
RUN mkdir -p uploads && chown -R node:node /usr/src/node-app

USER node

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "src/index.js"]
