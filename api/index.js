import app from "../src/app.js";
import { connectDB } from "../src/config/db.js";
let dbConnection

export default async function handler(req, res) {
  // Handle favicon requests
  if (req.url?.includes('favicon')) {
    return res.status(204).end();
  }

  // Handle root path
  if (req.url === '/' && req.method === 'GET') {
    return res.status(200).json({ 
      message: 'API is running',
      status: 'ok' 
    });
  }

  try {
    if (!dbConnection) {
      dbConnection = connectDB();
    }
    await dbConnection;
  } catch (error) {
    console.error('Database connection failed:', error);
    return res.status(500).json({ 
      error: 'Database connection issues failed'
    });
  }

  return app(req, res);
}