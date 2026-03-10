import express from 'express'
import passport from 'passport'
import aboutUs from '../controllers/user/aboutUs.js'
import userController from '../controllers/user/userController.js'
import profileController from '../controllers/user/profileController.js'
import productController from '../controllers/user/productController.js'
import addressController from '../controllers/user/addressCondroller.js'
import cartCondroller from '../controllers/user/cartCondroller.js'
import checkOutPageController from '../controllers/user/checkOutPageController.js'
import orderController from '../controllers/user/orderDetailsPage.js'
import wishlistCondroller from '../controllers/user/wishlistCondroller.js'
import walletCondroller from '../controllers/user/walletController.js'
import refferalController from '../controllers/user/refferalController.js'
import { upload } from '../config/cloudinary.js'
import { userAuth, guestAuth } from '../middlewares/auth.js'

const router = express.Router()

// ABOUT US
router.get('/aboutUs', aboutUs.aboutUs)

// ERROR MANAGEMENT
router.get('/pageNOTfound', userController.pageNOTfound)

// REGISTER MANAGEMENT

router.get('/register', userController.loadRegister)
router.post('/register', userController.register)
router.get('/register-OTP', userController.registerOTP)
router.post('/verify-otp', userController.verifyOtp)
router.get('/reSendOtp', userController.reSendOtp)
// For Google Sign In
router.get(
  '/auth/google/login',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state: 'login',
    prompt: 'select_account',
  }),
)
// For Google Register
router.get(
  '/auth/google/register',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state: 'signup',
    prompt: 'select_account',
  }),
)
// Google OAuth callback handler
router.get(
  '/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/handle-auth-failure',
    failureMessage: true,
  }),
  (req, res) => {
    const authState = req.query.state

    if (authState === 'signup') {
      req.session.user = req.user._id
      res.redirect('/refferalCodeEnter')
    } else if (authState === 'login') {
      req.session.user = req.user._id
      res.redirect('/')
    }
  },
)

router.get('/handle-auth-failure', (req, res) => {
  const messages = req.session.messages || []
  req.session.messages = []

  const state = req.query.state || 'signin'
  const message = messages[0] || 'Authentication failed'

  return res.render(state === 'signup' ? 'register' : 'register', { message })
})

// LOGIN MANAGEMENT
router.get('/login', userController.loadlogin)
router.post('/login', userController.login)
router.get('/logout', userController.logout)

// PROFILE MANAGEMENT
router.get('/forgot-password', profileController.getForgotPasspage)
router.post('/forgot-email-valid', profileController.forgotEmailValid)
router.post('/varify-passForgot-otp', profileController.verifyForgotPassOtp)
router.get('/reset-password', profileController.getResetPassPage)
router.post('/reSentOtp', profileController.reSentOtp)
router.patch('/reset-password', profileController.postNewPassword)
router.get('/userProfile', userAuth, profileController.userProfile)
router.get(
  '/passCheckforEmailchange',
  userAuth,
  profileController.getPassCheckforEmailchange,
)
router.post(
  '/passCheckforEmailchange',
  userAuth,
  profileController.passCheckforEmailchange,
)
router.get('/newEmail', userAuth, profileController.getNewMail)
router.post('/update-email', userAuth, profileController.emailUpdate)
router.get('/changeEmailOtp', userAuth, profileController.changeEmailOtp)
router.patch(
  '/verifychangeEmailOtp',
  userAuth,
  profileController.verifychangeEmailOtp,
)

router.get(
  '/resendOTPwhileEmailchange',
  userAuth,
  profileController.resendOTPwhileEmailchange,
)

router.get('/changePassword', userAuth, profileController.changePassword)
router.patch('/updatePassword', userAuth, profileController.updatePassword)
router.patch(
  '/editProfile',
  userAuth,
  upload.single('profilePhoto'),
  profileController.editProfile,
)

// HOME PAGE & SHOPING
router.get('/', guestAuth, userController.loadHomePage)
router.get('/shop', guestAuth, userController.loadShopingPage)
router.get('/check-user-block', userController.checkUserBlock)

// PRODUCT MANAGEMENT
router.get('/productDetails', productController.productDetails)

// ADDRESS MANAGEMENT
router.post('/addAddress', userAuth, addressController.addAddress)
router.delete('/deleteAddress', userAuth, addressController.deleteAddress)
router.patch('/editAddress', userAuth, addressController.editAddress)

// CART MANAGEMENT
router.get('/cart', userAuth, cartCondroller.getCart)
router.get('/addProductToCart', userAuth, cartCondroller.addProductToCart)
router.get(
  '/removeProductFromCart',
  userAuth,
  cartCondroller.removeProductFromCart,
)
router.get('/decreaseCartItems', userAuth, cartCondroller.decreaseCartItems)
router.get('/increaseCartItems', userAuth, cartCondroller.increaseCartItems)

// CHECKOUTPAGE
router.post('/checkoutpage', userAuth, checkOutPageController.checkoutpage)
router.get('/checkOutPage', userAuth, checkOutPageController.getCheckoutpage)
router.post(
  '/procedToCheckOut',
  userAuth,
  checkOutPageController.procedToCheckOut,
)
router.post('/applyCoupon', userAuth, checkOutPageController.applyCoupon)
router.post(
  '/create-razorpay-order',
  userAuth,
  checkOutPageController.createRazorpayOrder,
)
router.post(
  '/verify-razorpay-payment',
  userAuth,
  checkOutPageController.verifyRazorpayPayment,
)
router.get('/paymentFaildPage', userAuth, checkOutPageController.paymentFaild)
router.get(
  '/paymentFaildRetry',
  userAuth,
  checkOutPageController.paymentFaildRetry,
)
router.post(
  '/reCreateRazorpayOrder',
  userAuth,
  checkOutPageController.reCreateOrder,
)

// ORDER SUCCESS PAGE
router.get('/orderSuccess', userAuth, checkOutPageController.orderSuccess)

// ORDER DETAILS PAGE
router.get('/orderDetailPage', userAuth, orderController.orderDetailPage)

// ORDER CANCELL
router.post('/cancellOrder', userAuth, orderController.cencellOrder)
// SINGLE ITEM CANCELL
router.patch('/cancelSingleItem', userAuth, orderController.cancelSingleItem)

// RETURN REQ
router.patch('/returnReq', userAuth, orderController.returnReq)

// ORDER INVOICE
router.get('/generateInvoice', userAuth, orderController.generateInvoice)

// WISHLIST
router.get('/wishlist', userAuth, wishlistCondroller.getWishList)
router.get('/addToWishList', userAuth, wishlistCondroller.addToWishlist)
router.delete(
  '/removeProductFromWishlist',
  userAuth,
  wishlistCondroller.removeProduct,
)

// WALLET MANAGEMENT
router.get('/wallet', userAuth, walletCondroller.getWallet)

// REFFERAL
router.get(
  '/refferalCodeEnter',
  userAuth,
  refferalController.refferalCodeEnterPage,
)
router.get('/applyRefferalCode', userAuth, refferalController.applyRefferalCode)
router.get('/skipRefferal', userAuth, refferalController.skipRefferal)
export default router
