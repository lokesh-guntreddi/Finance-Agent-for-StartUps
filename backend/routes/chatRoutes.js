import express from 'express';
import { chatWithAssistant, getChatHistory, clearChatHistory } from '../controllers/chatController.js';

const router = express.Router();

router.post('/chat', chatWithAssistant);
router.get('/history', getChatHistory);
router.post('/clear', clearChatHistory);

export default router;
