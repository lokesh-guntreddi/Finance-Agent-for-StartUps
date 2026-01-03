import express from 'express';
import { getBills, createBill, deleteBill } from '../controllers/billController.js';

const router = express.Router();

router.get('/', getBills);
router.post('/', createBill);
router.delete('/:id', deleteBill);

export default router;
