// src/infrastructure/web/routes/orderRoutes.js
import express from 'express';
import { createOrder } from '../../../interfaces/controllers/Staff/OrderController.js';
import  protect  from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, createOrder);

export default router;