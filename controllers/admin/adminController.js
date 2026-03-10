import logger from '../../utils/logger.js'
import adminService from '../../services/admin/adminService.js'

const loadlogin = (req, res) => {
  try {
    if (req.session.admin) {
      logger.info(req.session.admin)
      return res.redirect('/admin/dashboard')
    }
    return res.render('admin-login', { message: null })
  } catch (error) {
    logger.error(`Error in loadlogin: ${error}`)
    return res.redirect('/admin/login')
  }
}

const login = async (req, res) => {
  try {
    const { email, password } = req.body

    const result = await adminService.login(email, password)

    switch (result.status) {
      case adminService.LOGIN_STATUS.SUCCESS:
        req.session.admin = result.data._id
        return res.redirect('/admin/dashboard')

      case adminService.LOGIN_STATUS.INVALID_CREDENTIALS:
        return res.render('admin-login', { message: 'Invalid credentials' })

      case adminService.LOGIN_STATUS.NOT_FOUND:
        return res.render('admin-login', { message: 'Invalid credentials' })

      case adminService.LOGIN_STATUS.ERROR:
        throw result.error

      default:
        return res.render('admin-login', {
          message: 'Unexpected error occurred',
        })
    }
  } catch (error) {
    logger.error(`Admin login controller error: ${error}`)
    return res.redirect('/admin/pageError')
  }
}

const pageError = (req, res) => {
  return res.render('pageError')
}

const logout = (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        logger.error(`Error destroying session: ${err}`)
        return res.redirect('/admin/pageError')
      }
      res.redirect('/admin/login')
    })
  } catch (error) {
    logger.error(`Unexpected error during logout: ${error}`)
    res.redirect('/admin/pageError')
  }
}
export default {
  loadlogin,
  login,
  pageError,
  logout,
}
