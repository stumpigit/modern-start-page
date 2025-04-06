# Build stage
FROM node:23.11.0-slim as builder

# Add security-related labels
LABEL org.opencontainers.image.source="https://github.com/ericblue/modern-start-page"
LABEL org.opencontainers.image.description="A modern, customizable browser start page"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.title="Modern Start Page"
LABEL org.opencontainers.image.vendor="Eric Blue"
LABEL org.opencontainers.image.authors="Eric Blue <ericblue76@gmail.com>"

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev) for build
RUN npm install && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:23.11.0-slim

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Set working directory
WORKDIR /app

# Copy built files and production dependencies from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Clean up unnecessary files and tools
RUN apt-get update && \
    apt-get remove -y npm && \
    apt-get autoremove -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    rm -rf /usr/local/lib/node_modules && \
    find /app/node_modules -type f -name "*.md" -delete && \
    find /app/node_modules -type f -name "*.ts" -delete && \
    find /app/node_modules -type f -name "*.map" -delete && \
    find /app/node_modules -type d -name "test" -exec rm -rf {} + 2>/dev/null || true && \
    find /app/node_modules -type d -name "tests" -exec rm -rf {} + 2>/dev/null || true && \
    find /app/node_modules -type d -name "docs" -exec rm -rf {} + 2>/dev/null || true && \
    find /app/node_modules -type d -name "doc" -exec rm -rf {} + 2>/dev/null || true && \
    find /app/node_modules -type d -name "example" -exec rm -rf {} + 2>/dev/null || true && \
    find /app/node_modules -type d -name "examples" -exec rm -rf {} + 2>/dev/null || true

# Set ownership to non-root user
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose the port the app runs on
EXPOSE 4000

# Start the application (removed --host flag as it's not supported)
CMD ["node", "dist/server/entry.mjs"]