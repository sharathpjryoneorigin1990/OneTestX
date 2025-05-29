import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

// Enable CORS for all image routes
router.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Handle preflight requests
router.options('*', cors());

/**
 * Serve an image file
 */
router.get(['/image', '/visual-tests/image'], (req, res) => {
  try {
    const { path: imagePath } = req.query;
    
    if (!imagePath) {
      return res.status(400).send('Image path is required');
    }

    // Resolve the absolute path
    const absolutePath = path.resolve(imagePath);
    
    // Security check: ensure the path is within the allowed directories
    const allowedDirs = [
      path.resolve(__dirname, '../../visual-tests'),
      // Add other allowed directories if needed
    ];

    const isPathAllowed = allowedDirs.some(allowedDir => 
      absolutePath.startsWith(allowedDir)
    );

    if (!isPathAllowed) {
      return res.status(403).send('Access to the requested image is forbidden');
    }

    // Check if file exists
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).send('Image not found');
    }

    // Get file extension
    const ext = path.extname(absolutePath).toLowerCase();
    
    // Set appropriate content type
    const contentType = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
    }[ext] || 'application/octet-stream';

    // Stream the file
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    
    const stream = fs.createReadStream(absolutePath);
    stream.pipe(res);
    
    // Handle errors
    stream.on('error', (err) => {
      console.error('Error streaming image:', err);
      if (!res.headersSent) {
        res.status(500).send('Error serving image');
      }
    });

  } catch (error) {
    console.error('Error serving image:', error);
    res.status(500).send('Internal server error');
  }
});

export default router;
