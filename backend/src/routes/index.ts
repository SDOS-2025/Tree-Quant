import { Router } from 'express';
import treeDetectionRouter from './treeDetection';
import inventoryRouter from './inventory';
const router = Router();

// Health check route
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});


// Inventory routes
router.use('/inventory', inventoryRouter);

// Tree detection routes
router.use('/tree-detection', treeDetectionRouter);

export default router; 

