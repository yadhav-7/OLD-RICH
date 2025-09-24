// const multer = require('multer');
// const path = require('path');

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     // Match the path structure used in your EJS template
//     cb(null, 'public/Uploads'); // Changed from 'public/uploads/product-images'
//   },
//   filename: function (req, file, cb) {
//     const uniqueName = Date.now() + '-' + file.originalname;
//     cb(null, uniqueName);
//   }
// });

// const upload = multer({ storage: storage });

// module.exports = upload;

const multer = require('multer');
const path = require('path');


// For product images (don't change this!)
const productStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/Uploads'); // Keep using same folder
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage: productStorage });


// For profile images
const profileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/Uploads/profile'); // New folder for profile images
  },
  filename: function (req, file, cb) {
    const uniqueName = 'profile-' + Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const profileUpload = multer({ storage: profileStorage });


// 🌾 Export both
module.exports = {
  upload,//this for product image upload 
  profileUpload
};
