# Use the official Node.js image as a base image
FROM node:14

# Set the working directory inside the container
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Set environment variable to ignore preinstall scripts
ENV npm_config_ignore_scripts=true

# Copy package.json and pnpm-lock.yaml (if you use it)
COPY package.json pnpm-lock.yaml* ./

# Install dependencies using pnpm
RUN pnpm install

# Copy the rest of the application code
COPY . .

# Build the NestJS application
RUN pnpm run build

# Expose the application port
EXPOSE 4000

# Start the NestJS application
CMD ["pnpm", "run", "start:prod"]
