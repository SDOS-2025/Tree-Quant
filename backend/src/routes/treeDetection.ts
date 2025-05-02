import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { TreeDetectionService } from '../services/treeDetectionService';

const router = Router();

// Test endpoint
router.get('/test', (req: Request, res: Response) => {
  res.json({ message: 'Tree detection API is working!' });
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'));
    }
    cb(null, true);
  }
});

// Error handling for multer
const handleMulterError = (err: any, req: Request, res: Response, next: any) => {
  if (err instanceof multer.MulterError) {
    console.error('Multer Error:', err);
    return res.status(400).json({ 
      error: 'File upload error',
      details: err.message
    });
  } else if (err) {
    console.error('Upload Error:', err);
    return res.status(400).json({ 
      error: 'Upload error',
      details: err.message
    });
  }
  next();
};

router.post('/process-image', 
  upload.single('image'),
  handleMulterError,
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        console.log('No file received in request');
        return res.status(400).json({ error: 'No image file provided' });
      }

      console.log('Processing image:', req.file.path);
      console.log('File details:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });

      const imagePath = req.file.path;
      const treeDetectionService = TreeDetectionService.getInstance();
      const result = await treeDetectionService.processImage(imagePath);

      console.log('Processing completed successfully');
      res.json(result);
    } catch (error) {
      console.error('Error processing image:', error);
      res.status(500).json({ 
        error: 'Failed to process image',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
});

export default router; 