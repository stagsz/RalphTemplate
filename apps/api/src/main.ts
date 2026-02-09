import express from 'express';
import { fileURLToPath } from 'url';

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'hazop-api' });
});

app.get('/', (_req, res) => {
  res.json({ message: 'HazOp Assistant API' });
});

// Only start the server when this file is run directly (not imported for testing)
const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);
if (isMainModule) {
  app.listen(port, () => {
    console.log(`API server running on port ${port}`);
  });
}

export default app;
