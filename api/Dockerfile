FROM oven/bun:latest

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy the rest of the code
COPY . .

# Set environment to production
ENV NODE_ENV=production

# Expose the port (Railway will provide PORT env var)
EXPOSE 3000

# Start the application
CMD ["bun", "run", "index.ts"]
