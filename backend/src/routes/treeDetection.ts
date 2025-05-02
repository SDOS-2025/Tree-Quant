import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { TreeDetectionService } from '../services/treeDetectionService';
import fs from 'fs';

const router = Router();

// Test endpoint
router.get('/test', (req: Request, res: Response) => {
  res.json({ message: 'Tree detection API is working!' });
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory:', uploadsDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
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
    console.log('Received file:', file.originalname);
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      console.log('Invalid file type:', file.originalname);
      return cb(new Error('Only image files are allowed!'));
    }
    cb(null, true);
  }
});

// Error handling for multer
const handleMulterError = (err: any, req: Request, res: Response, next: any) => {
  console.error('Multer error details:', {
    error: err,
    stack: err?.stack,
    code: err?.code,
    field: err?.field,
    message: err?.message
  });

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
      console.log('Received request headers:', req.headers);
      console.log('Received request body:', req.body);
      
      if (!req.file) {
        console.log('No file received in request');
        return res.status(400).json({ error: 'No image file provided' });
      }

      console.log('Processing image:', req.file.path);
      console.log('File details:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      });

      // Verify file exists
      if (!fs.existsSync(req.file.path)) {
        console.error('File not found after upload:', req.file.path);
        return res.status(500).json({ error: 'File not found after upload' });
      }

      const imagePath = req.file.path;
      const treeDetectionService = TreeDetectionService.getInstance();
      const result = await treeDetectionService.processImage(imagePath);

      console.log('Processing completed successfully');
      res.json(result);
    } catch (error) {
      console.error('Error processing image:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      res.status(500).json({ 
        error: 'Failed to process image',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
});

export default router; 