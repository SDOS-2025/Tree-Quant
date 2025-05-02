import { Router } from 'express';
import treeDetectionRouter from './treeDetection';

const router = Router();

// Health check route
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Tree detection routes
router.use('/tree-detection', treeDetectionRouter);

export default router; 