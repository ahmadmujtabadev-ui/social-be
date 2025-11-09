// src/app.js
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));
app.get('/', (req, res) => {
    res.json({
        message: 'API is running',
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});
app.use(routes);
app.use(errorHandler);


export default app;
