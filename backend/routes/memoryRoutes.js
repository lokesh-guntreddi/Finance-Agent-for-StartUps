import express from 'express';
import { getMemory, createMemory } from '../controllers/memoryController.js';

const router = express.Router();

router.get('/', getMemory);
router.post('/', createMemory);

export default router;
