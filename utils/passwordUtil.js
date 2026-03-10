import bcrypt from 'bcrypt'
export const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10)
    return passwordHash
  } catch (error) {
    logger.error(`password hashing error: ${error}`)
    throw error
  }
}