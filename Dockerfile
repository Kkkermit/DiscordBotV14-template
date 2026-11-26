# syntax=docker/dockerfile:1

FROM node:24-alpine

WORKDIR /app
ENV NODE_ENV=production

# Install production dependencies first so this layer is cached between code changes.
COPY package.json package-lock.json .npmrc ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY src ./src

# Run as the unprivileged user that ships with the Node.js image.
USER node

CMD ["node", "src/index.js"]
