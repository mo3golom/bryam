# Stage 1: Build the SvelteKit frontend
FROM node:24.4-alpine AS frontend-builder

ENV PUBLIC_API_BASE_URL=""
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the application source code
COPY . .
RUN npm run build

# Stage 2: Create the production runtime environment
FROM node:24.4-alpine AS runtime

WORKDIR /app

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy built assets from the builder stage
COPY --from=frontend-builder --chown=nextjs:nodejs /app/build ./build
COPY --from=frontend-builder --chown=nextjs:nodejs /app/package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy and configure startup script
COPY --chown=nextjs:nodejs start.sh ./start.sh
RUN chmod +x start.sh

# Switch to the non-root user
USER nextjs

# Expose port 3000 for the SvelteKit app
EXPOSE 3000

# Start the application
CMD ["./start.sh"]
