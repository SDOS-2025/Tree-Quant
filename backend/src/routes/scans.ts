import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();
const scansFilePath = path.join(__dirname, '../data/scans.json');

// Ensure the scans file exists
if (!fs.existsSync(scansFilePath)) {
  fs.writeFileSync(scansFilePath, JSON.stringify({ scans: [] }));
}

// Save a new scan
router.post('/save', (req, res) => {
  try {
    const scanData = req.body;
    const scansData = JSON.parse(fs.readFileSync(scansFilePath, 'utf8'));
    scansData.scans.push(scanData);
    fs.writeFileSync(scansFilePath, JSON.stringify(scansData, null, 2));
    res.json({ success: true, message: 'Scan saved successfully' });
  } catch (error) {
    console.error('Error saving scan:', error);
    res.status(500).json({ success: false, error: 'Failed to save scan' });
  }
});

// Get all scans
router.get('/', (req, res) => {
  try {
    const scansData = JSON.parse(fs.readFileSync(scansFilePath, 'utf8'));
    // Return the scans array directly
    res.json(scansData.scans || []);
  } catch (error) {
    console.error('Error reading scans:', error);
    res.status(500).json({ success: false, error: 'Failed to read scans' });
  }
});

// Get a single scan by ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const scansData = JSON.parse(fs.readFileSync(scansFilePath, 'utf8'));
    const scan = scansData.scans.find((scan: any) => scan.id === id);
    
    if (!scan) {
      return res.status(404).json({ success: false, error: 'Scan not found' });
    }
    
    res.json(scan);
  } catch (error) {
    console.error('Error reading scan:', error);
    res.status(500).json({ success: false, error: 'Failed to read scan' });
  }
});

// Delete a scan by ID
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const scansData = JSON.parse(fs.readFileSync(scansFilePath, 'utf8'));
    const initialLength = scansData.scans.length;
    
    // Filter out the scan with the matching ID
    scansData.scans = scansData.scans.filter((scan: any) => scan.id !== id);
    
    if (scansData.scans.length === initialLength) {
      return res.status(404).json({ success: false, error: 'Scan not found' });
    }
    
    fs.writeFileSync(scansFilePath, JSON.stringify(scansData, null, 2));
    res.json({ success: true, message: 'Scan deleted successfully' });
  } catch (error) {
    console.error('Error deleting scan:', error);
    res.status(500).json({ success: false, error: 'Failed to delete scan' });
  }
});

export default router; 