import multer from 'multer'
import { v2 as cloudinary } from 'cloudinary'
import streamifier from 'streamifier'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export const upload = multer({ storage: multer.memoryStorage() })
export const profileUpload = multer({ storage: multer.memoryStorage() })

export function uploadToCloudinary(fileBuffer, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (err, result) => {
        if (err) reject(err)
        else resolve(result.secure_url) // URL returned
      },
    )

    streamifier.createReadStream(fileBuffer).pipe(stream)
  })
}
