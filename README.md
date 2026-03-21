# Wizard Royale

This project contains both the backend (Node.js/Express) and frontend (React/Vite) for the game Wizard Royale.

## Getting Started

### 1. Clone the repository

```
git clone https://github.com/Mudasir33/Wizard-project.git
cd Wizard-project
```

Or use GitHub Desktop for an easier setup.

### 2. Build and Run with Docker

1. Make sure Docker Desktop is installed and running.

2. Build the Docker image:
   ```
   docker build -t wizard-royale .
   ```

3. Start the container:
   ```
   docker run -p 3000:3000 -p 5173:5173 wizard-royale
   ```

- The site will be available at: http://localhost:3000

### 3. Without Docker (optional)

- In the main folder, open a terminal and run the command `npm run build`.
- When finished, use the command `npm start` to start the game in the future.

## Troubleshooting
- Make sure Docker is running if you get errors about the "docker daemon".
- Make sure ports 3000 and 5173 are available.