/* eslint-disable no-unused-vars, eqeqeq, no-empty */
import logger from '../../utils/logger.js'
import profileService from '../../services/user/profileService.js'
import User from '../../models/userSchema.js'

const getForgotPasspage = async (req, res) => {
  try {
    res.render('forgotPassword', { message: null })
  } catch (error) {
    logger.error('error from getForgotPassPage')
    res.redirect('/page-404')
  }
}

const forgotEmailValid = async (req, res) => {
  try {
    const { email } = req.body
    const result = await profileService.validateForgotEmail(email)

    if (result.status) {
      req.session.userOTP = result.otp
      setTimeout(() => {
        delete req.session.userOTP
      }, 60000)
      req.session.email = result.email
      logger.info(`OTP: ${result.otp}`)
      return res.render(result.render)
    }

   

    return res.render(result.render, { message: result.message })
  } catch (error) {
    logger.error(`error from forgotEmailValid ${error}`)
    res.redirect('/pageNotFound')
  }
}

const verifyForgotPassOtp = async (req, res) => {
  try {
    const enteredOtp = (req.body.otp || '').trim()
    const sessionOtp = req.session.userOTP

    const result = profileService.verifyOtp(enteredOtp, sessionOtp)

    if (result.status) {
      req.session.userOTP = null
      return res
        .status(result.statusCode)
        .json({ message: result.message, redirect: result.redirect })
    }
    return res.status(result.statusCode).json({ message: result.message })
  } catch (error) {
    logger.error(`error from verifyForgotPassOtp ${error}`)
    res.status(500).json({ message: 'Internal server error' })
  }
}

const getResetPassPage = async (req, res) => {
  try {
    res.render('reset-password',{message:null})
  } catch (error) {
    logger.error(`error from getResetPassPage ${error}`)
    res.redirect('/pageNotFound')
  }
}

const reSentOtp = async (req, res) => {
  try {
    const { email } = req.session
    const result = await profileService.resendOtp(email)

    if (result.status) {
      req.session.userOTP = result.otp
      setTimeout(() => {
        delete req.session.userOTP
      }, 60000)
      return res.status(result.statusCode).json({ message: result.message })
    }
    return res.status(result.statusCode).json({ message: result.message })
  } catch (error) {
    logger.error(`error from reSentOtp ${error}`)
    return res
      .status(500)
      .json({ message: 'Failed to resend OTP, try again later' })
  }
}

const postNewPassword = async (req, res) => {
  try {
    const { newPassword } = req.body
    const { email } = req.session

    const result = await profileService.resetPassword(email, newPassword)

    if (!result.status) {
      return res.render(result.render, { message: result.message })
    }
    res.redirect(result.redirect)
  } catch (error) {
    logger.error(`error from postNewPassword ${error}`)
    res.redirect('/pageNotFound')
  }
}

const userProfile = async (req, res) => {
  try {
    const userId = req.session.user
    const isXhr = req.xhr || req.headers.accept.indexOf('json') > -1

    const result = await profileService.getUserProfile(
      userId,
      req.query,
      isXhr
    )

    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')

    if (result.isJson) {
      return res.status(200).json(result.data)
    }

    return res.render(result.render, {
      ...result.data,
      getStatusBadgeClass: (status) => {
        switch (status.toLowerCase()) {
          case 'failed':
            return 'bg-danger text-white'
          case 'pending':
            return 'bg-warning text-dark'
          case 'processing':
            return 'bg-info text-white'
          case 'shipped':
            return 'bg-primary text-white'
          case 'delivered':
            return 'bg-success text-white'
          case 'cancelled':
            return 'bg-danger text-white'
          case 'return req':
          case 'returnrequested':
            return 'bg-secondary text-white'
          case 'returned':
            return 'bg-dark text-white'
          case 'returnrejected':
          case 'reutrnrejected':
            return 'bg-danger text-white'
          default:
            return 'bg-light text-dark'
        }
      },
    })
  } catch (error) {
    logger.error(`Error from userProfile: ${error}`)
    res.redirect('/pageNotFound')
  }
}

const getPassCheckforEmailchange = async (req, res) => {
  try {
    const { user } = req.session
    const userData = await User.findById(user)

    if (userData.googleId) {
      req.session.flash = {
        type: 'error',
        message: "Email can't be changed. This account is linked with Google",
      }
      return res.redirect('/userProfile')
    }

    res.render('passCheckforEmailchange', {
      message: null,
    })
  } catch (error) {
    logger.error(`error from passCheckforEmailchange ${error}`)
  }
}

const passCheckforEmailchange = async (req, res) => {
  try {
    const userId = req.session.user
    const enteredPass = req.body.password

    const result = await profileService.verifyPasswordForEmailChange(
      userId,
      enteredPass
    )

    if (!result.success) {
      if (result.redirect) return res.redirect(result.redirect)
      return res.render(result.render, { message: result.message })
    }

    req.session.passwordVerified = true
    res.redirect(result.redirect)
  } catch (error) {
    logger.error(`error from passCheckEmailChange ${error}`)
    return res.redirect('/pageNotFound')
  }
}

const getNewMail = async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')
    if (req.session.passwordVerified) {
      return res.render('newMail')
    }
    return res.redirect('/passCheckforEmailchange')
  } catch (error) {
    logger.error(`error in getNewMail ${error}`)
    res.redirect('/pageNotFound')
  }
}

const changeEmailValid = async (req, res) => {
  try {
    const newEmail = (req.body.newEmail || '').trim()
    const userId = req.session.user

    req.session.newEmail = newEmail

    const result = await profileService.validateNewEmail(userId, newEmail)

    if (!result.status) {
      return res.render('newMail', { message: result.message })
    }

    res.redirect(result.redirect)
  } catch (error) {
    logger.error(`error from emailUpdate ${error}`)
    res.redirect('/pageNotFound')
  }
}

const verifychangeEmailOtp = async (req, res) => {
  try {
    const email = req.session.userData
    const userId = req.session.user
    const enteredOtp = req.body.otp
    const sessionOtp = req.session.otp

    const result = await profileService.verifyEmailChangeOtp(
      userId,
      email,
      enteredOtp,
      sessionOtp
    )

    if (result.status) {
      req.session.userData = null
      req.session.otp = null
      req.session.flash = {
        type: 'success',
        message: 'Email address updated successfully!',
      }
      return res.status(result.statusCode).json({ url: result.url })
    }
    return res.status(result.statusCode).json({ message: result.message })
  } catch (error) {
    logger.error(`Error verifying email change OTP: ${error}`)
    return res.status(500).json({ message: 'Internal Server Error' })
  }
}

const emailUpdate = async (req, res) => {
  try {
    const { newEmail } = req.body
    const result = await profileService.initiateEmailUpdate(newEmail)

    if (result.status) {
      req.session.otp = result.otp
      setTimeout(() => {
        delete req.session.otp
      }, 60000)
      req.session.userData = newEmail
      req.session.otpSession = true
      logger.info(result.otp)
      res.redirect(result.redirect)
    } else {
      res.render(result.render, { message: result.message })
    }
  } catch (error) {
    res.redirect('/pageNotFound')
  }
}

const changeEmailOtp = async (req, res) => {
  try {
    res.render('changeEmailOtp')
  } catch (error) {
    logger.error(`error in changeEmailOtp ${error}`)
    res.redirect('/pageNotFound')
  }
}

const resendOTPwhileEmailchange = async (req, res) => {
  try {
    const email = req.session.userData
    if (!email) {
      return res
        .status(500)
        .json({ message: 'Please try later , Cannot sent Otp again' })
    }

    const { otp, status } = await profileService.initiateEmailUpdate(email)

    if (status) {
      req.session.otp = otp
      setTimeout(() => {
        delete req.session.otp
      }, 60000)
      return res.status(200).json({ message: 'OTP sent successfull' })
    }

    res.status(500).json({ success: false })
  } catch (error) {
    logger.error('error from resendOTP while Emailchange')
    res.status(500).json({ message: 'Internal Server Error!' })
  }
}

const changePassword = async (req, res) => {
  try {
    const { user } = req.session
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')

    if (!user) {
      return res.redirect('/')
    }
    res.render('changePassword', {
      message: null,
    })
  } catch (error) { }
}

const updatePassword = async (req, res) => {
  try {
    const { user } = req.session
    if (!user) return res.redirect('/')

    const { currentPassword, newPassword, confirmPassword } = req.body

    const result = await profileService.updatePassword(
      user,
      currentPassword,
      newPassword,
      confirmPassword
    )

    if (!result.status) {
      return res.render(result.render, { message: result.message })
    }
    res.redirect(result.redirect)
  } catch (error) {
    logger.error(`error from updatePassword  ${error}`)
    res.redirect('/pageNotFound')
  }
}

const editProfile = async (req, res) => {
  try {
    const { user } = req.session
    if (!user)
      return res
        .status(500)
        .json({ message: 'Something went wrong please try again later' })

    const result = await profileService.editProfile(user, req.body, req.file)

    if (!result.status) {
      return res.status(result.statusCode).json({ message: result.message })
    }

    return res.status(result.statusCode).json({ message: result.message })
  } catch (error) {
    logger.error(`Error in editProfile: ${error}`)
    res.status(500).json({ message: 'Server error' })
  }
}

export default {
  getForgotPasspage,
  forgotEmailValid,
  verifyForgotPassOtp,
  getResetPassPage,
  reSentOtp,
  postNewPassword,
  userProfile,
  changePassword,
  changeEmailValid,
  changeEmailOtp,
  verifychangeEmailOtp,
  emailUpdate,
  getPassCheckforEmailchange,
  passCheckforEmailchange,
  getNewMail,
  resendOTPwhileEmailchange,
  updatePassword,
  editProfile,
}
