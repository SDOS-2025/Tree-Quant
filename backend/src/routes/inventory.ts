import { Router } from 'express';
import { PrismaClient } from '../generated/prisma';

const router = Router();
const prisma = new PrismaClient();

// Create a new inventory item
router.post('/', async (req, res) => {
  const { name, area, treeCount, avgDiameter } = req.body;
  try {
    const item = await prisma.inventoryItem.create({
      data: { name, area, treeCount, avgDiameter }
    });
    res.json(item);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get all inventory items
router.get('/', async (req, res) => {
  const items = await prisma.inventoryItem.findMany({
    orderBy: { timestamp: 'desc' }
  });
  res.json(items);
});

export default router;
