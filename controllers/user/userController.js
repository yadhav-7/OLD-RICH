/* eslint-disable no-unused-vars, no-restricted-globals, no-restricted-syntax, no-shadow, no-dupe-keys */

import dotenv from 'dotenv'
import User from '../../models/userSchema.js'
import Product from '../../models/productSchema.js'
import Category from '../../models/catagory.js'
import Cart from '../../models/cartSchema.js'
import Wishlist from '../../models/wishlistSchema.js'
import Wallet from '../../models/walletSchema.js'
import logger from '../../utils/logger.js'
import userService from '../../services/user/userService.js'

dotenv.config()

// 404 Page
const pageNOTfound = async (req, res) => {
  try {
    return res.render('page-404.ejs')
  } catch (error) {
    logger.error(`pageNOTfound error: ${error}`)
    return res.redirect('/pageNOTfound')
  }
}

const loadHomePage = async (req, res) => {
  try {
    const { user } = req.session
    const result = await userService.loadHomePage(user)

    return res.render('home', {
      ...result
    })

  } catch (error) {
    logger.error(`home page error: ${error}`)
    res.redirect('/pageNotFound')
  }
}


const loadRegister = async (req, res) => {
  try {
    if (req.session.user) {
      return res.redirect('/')
    }
    return res.render('register.ejs')
  } catch (error) {
    logger.error(`register page error: ${error}`)
    return res.status(500).send('Server error')
  }
}

const checkUserBlock = async (req, res) => {
  try {
    const result = await userService.checkUserBlock(req.session.user)
    if (result.isBlock) delete req.session.user
    
    return res.json({ result })
  } catch (error) {
    logger.error(`Error from checkUserBlock: ${error}`)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

// Register User
const register = async (req, res) => {
  try {
    const { username, email, phone, password, cpassword } = req.body
    const result = await userService.register(req.body)

    if (result.findUser) {
      return res.render('register', {
        message: 'User with this email already exists',
      })
    }

    if (result.emailSent === false) {
      return res.render('register', {
        message: 'Something went wrong please try again later',
      })
    }

    req.session.userOTP = result.otp
    req.session.userData = { username, email, phone, password, cpassword }

    return res.render('register-OTP')
  } catch (error) {
    logger.error(`register error: ${error}`)
    return res.redirect('/pageNOTfound')
  }
}


const registerOTP = async (req, res) => {
  try {
    if (!req.session.userData || !req.session.userOTP) {
      return res.redirect('/register')
    }
    return res.render('register-OTP')
  } catch (error) {
    logger.error(`register OTP page error: ${error}`)
    return res.redirect('/pageNOTfound')
  }
}

// Resend OTP
const resendOtp = async (req, res) => {
  try {
    const { email } = req.session.userData || {}
    const result = await userService.registerOTP(email)

    if (result.email === false) {
      return res.json({
        success: false,
        message: 'Session expired. Please try registering again.',
      })
    }

    if (result.findUser) {
      return res.json({
        success: false,
        message: 'User with this email already exists',
      })
    }

    if (result.emailSent === false) {
      return res.json({ success: false, message: 'Error sending email' })
    }

    req.session.userOTP = result.otp

    return res.json({ success: true, message: 'New OTP sent successfully' })
  } catch (error) {
    logger.error(`resend OTP error: ${error}`)
    return res.json({
      success: false,
      message: 'An error occurred while resending OTP',
    })
  }
}

// Verify OTP
const verifyOtp = async (req, res) => {
  try {

    if (!req.session.userData || !req.session.userOTP) {

      return res.status(400).json({
        success: false,
        message: 'Session expired. Please try registering again.',
      })
    }


    const result = await userService.verifyOtp(req.body, req.session.userData, req.session.userOTP)



    if (!result.success) {

      return res.status(result.statusCode).json({
        success: result.success,
        message: result.message,
      })
    }

    if (result.success) {
      req.session.user = result?.userData?._id
      return res.status(result.statusCode).json({
        success: result.success,
        message: result.message,
        redirectUrl: result.redirectUrl
      })
    }
  } catch (error) {
    logger.error(`verify OTP error: ${error}`)
    if (error.code === 11000) {
      logger.info('error 11000')
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      })
    }

    return res.status(500).json({
      success: false,
      message: 'An error occurred during OTP verification',
    })
  }
}

// resend OTP
const reSendOtp = async (req, res) => {
  try {
    const result = await userService.reSendOtp(req.session.userData)


    req.session.userOTP = result.otp


    res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
    })

  } catch (error) {
    logger.error(`reSend otp ${error}`)
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error, Please try again later',
    })
  }
}

// load login
const loadlogin = async (req, res) => {
  try {
    if (req.session.user) {
      return res.redirect('/')
    }
    return res.render('login')
  } catch (error) {
    logger.error(`🧩 Error in loadLogin ${error}`)
    res.redirect('/pageNOTfound')
  }
}

// login
const login = async (req, res) => {
  try {
    if (req.session.user) {
      return res.render('login', { message: 'User Logged' })
    }
    const result = await userService.login(req.body)

    if (!result.status) {
      return res.render('login', { status: result.status, message: result.message })
    } else {
      req.session.user = result?.userData?._id
      return res.redirect('/')
    }
  } catch (error) {
    logger.error(`login error ${error}`)
    return res.render('login', { message: 'login failed Please try again later' })
  }
}

// logout
const logout = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        logger.error(`session destruction err ${err.message}`)
        res.setHeader('Cache-Control', 'no-store')
        res.redirect('/login')

        return res.redirect('/pageNOTfound')
      }
    })
    return res.redirect('/login')
  } catch (error) {
    logger.error(`logout function error ${error}`)
  }
}

const loadShopingPage = async (req, res) => {
  try {
    const isFetch = req.headers['x-requested-by'] === 'frontend-fetch'
    const result = await userService.loadShopingPage(
      req.session.user,
      req.query,
      isFetch
    )

    if (result.isFetch) {
      return res.status(200).json({
        message: 'success',
        ...result.data,
      })
    }

    return res.render('shop', result.data)
  } catch (error) {
    logger.error(`error from loadShopingPage ${error}`)
    res.redirect('/pageNOTfound')
  }
}

export default {
  pageNOTfound,
  loadHomePage,
  loadRegister,
  register,
  registerOTP,
  resendOtp,
  verifyOtp,
  reSendOtp,
  loadlogin,
  login,
  logout,
  loadShopingPage,
  checkUserBlock,
}
