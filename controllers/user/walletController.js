import walletService from '../../services/user/walletService.js'
import logger from '../../utils/logger.js'

const getWallet = async (req, res) => {
  try {
    const userId = req.session.user
    const result = await walletService.getWallet(userId)

    return res.render(result.render, result.data)
  } catch (error) {
    logger.error(`error in getWallet ${error}`)
    return res.redirect('/pageNotFound')
  }
}

export default {
  getWallet,
}
