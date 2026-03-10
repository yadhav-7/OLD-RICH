import logger from '../../utils/logger.js'
import walletService from '../../services/user/walletService.js'

const refferalCodeEnterPage = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.set('Pragma', 'no-cache')
    res.set('Expires', '0')

    const userId = req.session.user

    const result = await walletService.checkReferralStatus(userId)

    if (result.redirect) return res.redirect(result.url)
    return res.render(result.render)
  } catch (error) {
    logger.error(`error in refferalCodeEnterPage ${error}`)
    return res.redirect('/pageNotFound')
  }
}

const applyRefferalCode = async (req, res) => {
  try {
    
    const userId = req.session.user
    const { code } = req.query

    const result = await walletService.applyReferralCode(userId, code)

    if (!result.status) {
      return res.status(result.statusCode).json({ message: result.message })
    }

    return res.status(result.statusCode).json({
      message: result.message,
      wallet: result.wallet,
    })
  } catch (error) {
    logger.error(`Error in applyReferralCode: ${error}`)
    return res.status(500).json({ message: 'Something went wrong!' })
  }
}

const skipRefferal = async (req, res) => {
  try {
    const userId = req.session.user
    const result = await walletService.skipReferral(userId)
    return res.redirect(result.redirectUrl)
  } catch (error) {
    logger.error(`error in skipRefferal ${error}`)
    return res.redirect('/pageNotFound')
  }
}

export default {
  refferalCodeEnterPage,
  applyRefferalCode,
  skipRefferal,
}
