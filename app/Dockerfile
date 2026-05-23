# Use Node.js 20 Alpine — lightweight base image
# Alpine is ~5MB vs ~900MB for full Ubuntu
# Smaller image = faster pulls = faster deployments
FROM node:20-alpine

# Set working directory inside the container
# All commands after this run from /app
WORKDIR /app

# Copy package files first — before copying the rest of the code
# Docker caches layers — if package.json didn't change,
# it won't re-run npm install on every build
# This saves minutes on every CI build
COPY package*.json ./

# Install only production dependencies
# --omit=dev skips devDependencies — keeps image small
RUN npm install --omit=dev

# Now copy the rest of the application code
COPY . .

# Document that the container listens on port 3000
# This doesn't actually open the port — just documents it
EXPOSE 3000

# Health check — Docker itself will ping /health every 30s
# If it fails 3 times, Docker marks the container unhealthy
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "index.js"]
