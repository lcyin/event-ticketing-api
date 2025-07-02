# Stage 1: Build
FROM node:18 AS builder

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Compile TypeScript to JavaScript
RUN npm run build

# Stage 2: Runtime
FROM node:18

# Set the working directory
WORKDIR /usr/src/app

# Copy only the compiled JavaScript code and package files
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Expose the application port
EXPOSE 3000

# Run the application
CMD ["node", "dist/index.js"]
