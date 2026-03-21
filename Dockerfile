# Use an official Node.js runtime as a parent image
FROM node:20

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json if present
COPY package.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build frontend (if using Vite or similar)
RUN if [ -f ./website/package.json ]; then cd website && npm install && npm run build && cd ..; fi

# Expose ports (adjust as needed)
EXPOSE 3000 5173

# Start both backend and frontend (using concurrently)
# Install concurrently globally
RUN npm install -g concurrently

# Start backend and serve frontend build
CMD ["concurrently", "npm run start-backend", "npm run start-frontend"]
