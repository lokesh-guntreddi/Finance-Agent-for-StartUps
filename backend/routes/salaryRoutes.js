import express from 'express';
import { getSalaries, createSalary, deleteSalary } from '../controllers/salaryController.js';

const router = express.Router();

router.get('/', getSalaries);
router.post('/', createSalary);
router.delete('/:id', deleteSalary);

export default router;
