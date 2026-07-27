# Use Node LTS Alpine
FROM node:20-alpine

# Install OpenSSL - REQUIRED for Prisma on Alpine
RUN apk add --no-cache openssl

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json tsconfig.json ./

# Install dependencies (use npm ci for better reliability)
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client (must happen before TypeScript build)
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 4000

# Start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/app.js"]