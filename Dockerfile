# Development image for the app. Node is pinned to an exact version and
# dependencies come from package-lock.json, so every machine runs the same
# toolchain (decision D10).
FROM node:22.23.3-alpine3.23

# Run as the image's unprivileged "node" user (uid 1000), so files written
# into the mounted source folder are not owned by root on the host.
WORKDIR /app
RUN chown node:node /app
USER node

COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY --chown=node:node . .

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173", "--strictPort"]
