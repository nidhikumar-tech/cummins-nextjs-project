# Start with Node.js 18 Alpine as the base image
FROM node:20-alpine AS base

# Create a new stage named 'deps' based on the 'base' stage
FROM base AS deps
# Install libc6-compat to ensure compatibility with Alpine Linux
RUN apk add --no-cache libc6-compat
# Set the working directory to /app
WORKDIR /app
# Copy package.json and package-lock.json (if it exists) to the working directory
COPY package.json .
COPY package-lock.json .

# Install dependencies using npm ci (clean install)
RUN npm ci

# Create a new stage named 'builder' based on the 'base' stage
FROM base AS builder
# Set the working directory to /app
WORKDIR /app
# Copy node_modules from the 'deps' stage to the current stage
COPY --from=deps /app/node_modules ./node_modules
# Copy all files from the current directory to the working directory
COPY . .

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED 1

# Build the Next.js application
RUN npm run build

# Create a new stage named 'runner' based on the 'base' stage
FROM base AS runner
# Set the working directory to /app
WORKDIR /app
# Set NODE_ENV to production
ENV NODE_ENV production
# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED 1

# Create a system group named 'nodejs' with GID 1001
RUN addgroup --system --gid 1001 nodejs

# Create a system user named 'nextjs' with UID 1001
RUN adduser --system --uid 1001 nextjs

# Copy the standalone output from the builder stage
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# Copy the static files from the builder stage
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Copy the public directory if it exists (use wildcard to avoid error if empty)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Switch to the 'nextjs' user
USER nextjs

# Expose port 8080 (Cloud Run default)
EXPOSE 8080

# Set the PORT environment variable to 8080
ENV PORT 8080
ENV HOSTNAME "0.0.0.0"

# Set the default command to start the Next.js standalone server
CMD ["node", "server.js"]
