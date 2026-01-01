const multer = require('multer');
const path = require('path');

// For product images (don't change this!)
const productStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/Uploads')
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname
    cb(null, uniqueName);
  }
})

const upload = multer({ storage: productStorage });


// For profile images
const profileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/Uploads/profile')
  },
  filename: function (req, file, cb) {
    const uniqueName = 'profile-' + Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
})

const profileUpload = multer({ storage: profileStorage });


// 🌾 Export both
module.exports = {
  upload,//this for product image upload 
  profileUpload
};
