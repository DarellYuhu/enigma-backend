# Use the official Node.js image as the base image
FROM node:22-alpine3.20 AS base

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the application dependencies
RUN npm install
RUN npm i -g prisma

# Copy the rest of the application files
COPY . .
COPY .env.staging .env

RUN npx prisma generate

# Build the NestJS application
RUN npm run build

# Expose the application port
EXPOSE 2000

# Command to run the application
CMD ["node", "dist/src/main"]