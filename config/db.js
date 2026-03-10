import mongoose from 'mongoose'
import dotenv from 'dotenv'
import logger from '../utils/logger.js'

dotenv.config()

const connectdb = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    logger.info('Database is connected')
  } catch (error) {
    logger.error('Database error//')
    logger.error(error)
    process.exit(1)
  }
}
export default { connectdb }
