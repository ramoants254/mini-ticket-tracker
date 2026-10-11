# ---- build stage: install all deps and compile TypeScript ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- runtime stage: production deps + compiled output only ----
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
# migrate.ts reads the schema from src/db/schema.sql (relative to the project root)
COPY src/db/schema.sql ./src/db/schema.sql
USER node
EXPOSE 3000
# Apply the (idempotent) schema, then start the API.
CMD ["sh", "-c", "node dist/db/migrate-cli.js && node dist/server.js"]
