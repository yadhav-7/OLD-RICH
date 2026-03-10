import User from '../../models/userSchema.js'
import bcrypt from 'bcrypt'
import logger from '../../utils/logger.js'

const LOGIN_STATUS = {
  SUCCESS: 'SUCCESS',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  NOT_FOUND: 'NOT_FOUND',
  ERROR: 'ERROR',
}

const login = async (email, password) => {
  try {
    const admin = await User.findOne({ email, isAdmin: true })

    if (!admin) {
      return { status: LOGIN_STATUS.NOT_FOUND }
    }

    const isMatch = await bcrypt.compare(password, admin.password)

    if (!isMatch) {
      return { status: LOGIN_STATUS.INVALID_CREDENTIALS }
    }

    return {
      status: LOGIN_STATUS.SUCCESS,
      data: admin,
    }
  } catch (error) {
    logger.error(`Admin login service error: ${error}`)
    return { status: LOGIN_STATUS.ERROR, error }
  }
}

export default {
  login,
  LOGIN_STATUS,
}
