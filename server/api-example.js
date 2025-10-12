/**
 * Example Server API
 * 
 * This is an example of how you could add a backend API.
 * For a production app, you would run this as a separate server
 * and proxy requests from Vite (see vite.config.ts).
 * 
 * To run this server:
 * 1. Install express: npm install express
 * 2. Run: node server/api.js
 * 3. The API will be available at http://localhost:3001/api/hello
 */

// Uncomment to use:
/*
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Example API endpoint
app.get('/api/hello', (req, res) => {
  res.json({
    message: 'Hello from the server API!',
    timestamp: new Date().toISOString(),
    status: 'success',
  });
});

app.listen(PORT, () => {
  console.log(`Server API running at http://localhost:${PORT}`);
});
*/

console.log('Example API server file - see comments for usage instructions');
