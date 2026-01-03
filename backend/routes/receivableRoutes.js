import express from 'express';
import { getReceivables, createReceivable, deleteReceivable } from '../controllers/receivableController.js';

const router = express.Router();

router.get('/', getReceivables);
router.post('/', createReceivable);
router.delete('/:id', deleteReceivable);

export default router;
