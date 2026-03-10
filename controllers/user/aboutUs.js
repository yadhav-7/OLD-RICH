import userService from '../../services/user/userService.js'
import logger from '../../utils/logger.js'

const aboutUs = async (req, res) => {
  try {
    const userId = req.session.user
    const user = await userService.getUserData(userId)

    return res.render('aboutUs', { user })
  } catch (error) {
    logger.error(`error in about us Page ${error}`)
    return res.redirect('/pageNotFound')
  }
}

export default { aboutUs }
