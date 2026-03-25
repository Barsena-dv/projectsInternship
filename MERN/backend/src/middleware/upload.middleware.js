const multer = require('multer');
const path = require('path');

// Memory storage for images to upload to Cloudinary
const storage = multer.memoryStorage();

// File filter to allow only images and videos
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/mpeg',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and videos are allowed.'));
  }
};

// Create multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

/**
 * Middleware for single file upload
 */
const uploadSingle = upload.single('file');

/**
 * Middleware for multiple file uploads
 */
const uploadMultiple = upload.array('files', 5);

module.exports = { uploadSingle, uploadMultiple };
