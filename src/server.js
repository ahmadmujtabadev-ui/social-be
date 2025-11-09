// src/server.js
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import app from './app.js';

connectDB()
  .then(() => {
    app.listen(env.PORT, () => console.log(`API running on :${env.PORT}`));
  })
  .catch((e) => {
    console.error('Failed to bootstrap', e);
    process.exit(1);
  });
