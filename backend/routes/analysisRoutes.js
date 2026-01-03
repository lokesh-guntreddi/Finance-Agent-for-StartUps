import express from 'express';
import { getAnalysisResults, getLatestAnalysisResult, runAnalysis } from '../controllers/analysisController.js';

const router = express.Router();

// Specific API routes
router.get('/api/analysis-results', getAnalysisResults);
router.get('/api/analysis-results/latest', getLatestAnalysisResult);

// Root level routes (as per original server.js)
router.post('/run-analysis', runAnalysis);

export default router;
