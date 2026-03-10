import User from '../models/userSchema.js'
import logger from '../utils/logger.js'

export const userAuth = async (req, res, next) => {
  try {
    if (req.session.user) {
      const user = await User.findById(req.session.user)

      if (user && !user.isBlock) {
        return next()
      }
      if (req.xhr || req.headers.accept?.includes('json')) {
        return res.status(401).json({ redirect: '/login' })
      }
      return res.redirect('/login')
    }
    if (req.xhr || req.headers.accept?.includes('json')) {
      return res.status(401).json({ redirect: '/login' })
    }
    return res.redirect('/login')
  } catch (error) {
    logger.error(`Error in userAuth middleware: ${error}`)
    return res.status(500).send('Internal Server Error')
  }
}

export const guestAuth = async (req, res, next) => {
  try {
    if (!req.session.user) {
      res.locals.user = null
      return next()
    }

    const user = await User.findById(req.session.user)

    if (!user || user.isBlock) {
      logger.info('no user or isBlocked')
      delete req.session.user
      return res.redirect('/login')
    }

    res.locals.user = user
    next()
  } catch (err) {
    logger.error(`guestAuth Error: ${err}`)
    next() // don't block page
  }
}

export const adminAuth = async (req, res, next) => {
  try {
    const userId = req.session.admin
    if (!userId) {
      return res.redirect('/admin/login')
    }

    const data = await User.findOne({ _id: userId })

    if (data.isAdmin) {
      next()
    } else {
      return res.redirect('/admin/login')
    }
  } catch (error) {
    logger.error(`error from adminAuth ${error}`)
    res.redirect('/admin/pageError')
  }
}
