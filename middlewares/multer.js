import multer from 'multer'

// For product images (don't change this!)
const productStorage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'public/Uploads')
  },
  filename(req, file, cb) {
    const uniqueName = `${Date.now()}-${file.originalname}`
    cb(null, uniqueName)
  },
})

export const upload = multer({ storage: productStorage })

// For profile images
const profileStorage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'public/Uploads/profile')
  },
  filename(req, file, cb) {
    const uniqueName = `profile-${Date.now()}-${file.originalname}`
    cb(null, uniqueName)
  },
})

export const profileUpload = multer({ storage: profileStorage })
