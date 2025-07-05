// 
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Match the path structure used in your EJS template
    cb(null, 'public/Uploads'); // Changed from 'public/uploads/product-images'
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage: storage });

module.exports = upload;