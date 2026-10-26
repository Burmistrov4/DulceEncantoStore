# Imagen de producción para Cloud Run, Railway, Fly.io o cualquier host de contenedores.
# node:22-slim (Debian) usa los binarios precompilados de better-sqlite3 sin compilar nada.
FROM node:22-slim

ENV NODE_ENV=production
# next start respeta el PORT que inyecta Cloud Run/Railway
ENV PORT=3000

WORKDIR /app

# Dependencias primero (capa cacheable)
COPY package.json package-lock.json ./
RUN npm ci

# Código y build
COPY . .
RUN npm run build

EXPOSE 8080

# La BD (db/dulces.db) se crea y siembra sola al primer arranque.
# IMPORTANTE: monta un volumen persistente en /app/db y /app/public/uploads,
# o tu base de datos y fotos se perderán al redesplegar.
CMD ["npm", "run", "start"]
