import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './db/connect.js';

import salaryRoutes from './routes/salaryRoutes.js';
import billRoutes from './routes/billRoutes.js';
import receivableRoutes from './routes/receivableRoutes.js';
import memoryRoutes from './routes/memoryRoutes.js';
import analysisRoutes from './routes/analysisRoutes.js';
import chatRoutes from './routes/chatRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true
}));
app.use(express.json());

// Connect to Database
connectDB();

// Health Check
app.get('/', (req, res) => {
    res.json({ status: 'active', system: 'FinLy Backend with MongoDB' });
});

// Routes
app.use('/api/salaries', salaryRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/receivables', receivableRoutes);
app.use('/api/memory', memoryRoutes);
app.use('/api/chat', chatRoutes);
app.use('/', analysisRoutes);

// Start server
app.listen(PORT, () => {
    console.log(`🚀 FinLy Backend running on port ${PORT}`);
});
