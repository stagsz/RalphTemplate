import express from 'express';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.routes.js';

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'hazop-api' });
});

// API info endpoint
app.get('/', (_req, res) => {
  res.json({ message: 'HazOp Assistant API' });
});

// Authentication routes
app.use('/auth', authRoutes);

// Only start the server when this file is run directly (not imported for testing)
const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);
if (isMainModule) {
  app.listen(port, () => {
    console.log(`API server running on port ${port}`);
  });
}

export default app;
