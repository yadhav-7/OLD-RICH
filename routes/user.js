const express = require('express');
const router = express.Router()
const aboutUs = require('../controllers/user/aboutUs')
const userController = require('../controllers/user/userController')
const profileController = require('../controllers/user/profileController')
const productController = require('../controllers/user/productController')
const addressController = require('../controllers/user/addressCondroller')
const cartCondroller = require('../controllers/user/cartCondroller')
const checkOutPageController = require('../controllers/user/checkOutPageController')
const orderController = require('../controllers/user/orderDetailsPage')
const wishlistCondroller = require('../controllers/user/wishlistCondroller')
const walletCondroller = require('../controllers/user/walletController')
const refferalController = require('../controllers/user/refferalController')

const {upload,profileUpload} = require('../middlewares/multer')
const {userAuth,guestAuth,adminAuth} = require('../middlewares/auth')
const passport = require('passport')

//ABOUT US
router.get('/aboutUs',aboutUs.aboutUs)

//ERROR MANAGEMENT
router.get('/pageNOTfound',userController.pageNOTfound)

//REGISTER MANAGEMENT

router.get('/register',userController.loadRegister)
router.post('/register',userController.register)
router.get('/register-OTP',userController.registerOTP)
router.post("/verify-otp",userController.verifyOtp)
router.get('/reSendOtp',userController.reSendOtp)
// For Google Sign In
router.get('/auth/google/login',passport.authenticate('google', {scope: ['profile', 'email'],state: 'login',prompt: 'select_account'}));
// For Google Register
router.get('/auth/google/register',passport.authenticate('google', {scope: ['profile', 'email'],state: 'signup', prompt: 'select_account'}));
// Google OAuth callback handler
router.get('/auth/google/callback',passport.authenticate('google', {failureRedirect: '/handle-auth-failure',
failureMessage: true
}),
  (req, res) => {
    const authState = req.query.state;

    if (authState === 'signup' ) {
  req.session.user = req.user._id;
  res.redirect('/refferalCodeEnter');
}else if(authState === 'login'){
  req.session.user = req.user._id;
  res.redirect('/home');
}
    
  });
// Handle Google OAuth failure and redirect accordingly
router.get('/handle-auth-failure', (req, res) => {
  const messages = req.session.messages || []
  req.session.messages = []

  const state = req.query.state || 'signin'; // Fallback to signin
  const message = messages[0] || 'Authentication failed';

  return res.render(state === 'signup' ? 'register' : 'register', { message });

});




//LOGIN MANAGEMENT
router.get('/login',userController.loadlogin)
router.post('/login',userController.login)
router.get('/logout',userController.logout)

//PROFILE MANAGEMENT
router.get('/forgot-password',profileController.getForgotPasspage)
router.post('/forgot-email-valid',profileController.forgotEmailValid)
router.post('/varify-passForgot-otp',profileController.verifyForgotPassOtp)
router.get('/reset-password',profileController.getResetPassPage)
router.post('/reSentOtp',profileController.reSentOtp)
router.post('/reset-password',profileController.postNewPassword)
router.get('/userProfile',userAuth,profileController.userProfile)
router.get('/passCheckforEmailchange',userAuth,profileController.getPassCheckforEmailchange)
router.post('/passCheckforEmailchange',userAuth,profileController.passCheckforEmailchange)
router.get('/newEmail',userAuth,profileController.getNewMail)
router.post('/update-email',userAuth,profileController.emailUpdate)
router.get('/changeEmailOtp',userAuth,profileController.changeEmailOtp)
router.patch('/verifychangeEmailOtp',userAuth,profileController.verifychangeEmailOtp)


router.get('/resendOTPwhileEmailchange',userAuth,profileController.resendOTPwhileEmailchange)


router.get('/changePassword',userAuth,profileController.changePassword)
router.patch('/updatePassword',userAuth,profileController.updatePassword)
router.patch('/editProfile', userAuth, profileUpload.single('profilePhoto'), profileController.editProfile);



//HOME PAGE & SHOPING
router.get('/home',guestAuth,userController.loadHomePage)
router.get('/shop',guestAuth,userController.loadShopingPage)
router.get('/check-user-block',guestAuth,userController.checkUserBlock)


//PRODUCT MANAGEMENT
router.get('/productDetails',productController.productDetails)

//ADDRESS MANAGEMENT
router.post('/addAddress',userAuth,addressController.addAddress)
router.delete('/deleteAddress',userAuth,addressController.deleteAddress)
router.patch('/editAddress',userAuth,addressController.editAddress)


//CART MANAGEMENT 
router.get('/cart',userAuth,cartCondroller.getCart)
router.get('/addProductToCart',userAuth,cartCondroller.addProductToCart)
router.get('/removeProductFromCart',userAuth,cartCondroller.removeProductFromCart)
router.get('/decreaseCartItems',userAuth,cartCondroller.decreaseCartItems)
router.get('/increaseCartItems',userAuth,cartCondroller.increaseCartItems)

//CHECKOUTPAGE 
router.post('/checkoutpage',userAuth,checkOutPageController.checkoutpage)
router.get('/getCheckoutpage',userAuth,checkOutPageController.getCheckoutpage)
router.post('/procedToCheckOut',userAuth,checkOutPageController.procedToCheckOut)
router.post('/applyCoupon',userAuth,checkOutPageController.applyCoupon)
router.post('/create-razorpay-order',userAuth,checkOutPageController.createRazorpayOrder)
router.post('/verify-razorpay-payment',userAuth,checkOutPageController.verifyRazorpayPayment)
router.get('/paymentFaildPage',userAuth,checkOutPageController.paymentFaild)
router.get('/paymentFaildRetry',userAuth,checkOutPageController.paymentFaildRetry)
router.post('/reCreateRazorpayOrder',userAuth,checkOutPageController.reCreateOrder)


//ORDER SUCCESS PAGE
router.get('/orderSuccess',userAuth,checkOutPageController.orderSuccess)

//ORDER DETAILS PAGE
router.get('/orderDetailPage',userAuth,orderController.orderDetailPage)

//ORDER CANCELL 
router.post('/cancellOrder',userAuth,orderController.cencellOrder)
//SINGLE ITEM CANCELL
router.patch('/cancelSingleItem',userAuth,orderController.cancelSingleItem)

//RETURN REQ
router.patch('/returnReq',userAuth,orderController.returnReq)

//ORDER INVOICE
router.get('/generateInvoice',userAuth,orderController.generateInvoice)

//WISHLIST 
router.get('/wishlist',userAuth,wishlistCondroller.getWishList)
router.get('/addToWishList',userAuth,wishlistCondroller.addToWishlist)
router.delete('/removeProductFromWishlist',userAuth,wishlistCondroller.removeProduct)

//WALLET MANAGEMENT
router.get('/wallet',userAuth,walletCondroller.getWallet)

//REFFERAL
router.get('/refferalCodeEnter',userAuth,refferalController.refferalCodeEnterPage)
router.get('/applyRefferalCode',userAuth,refferalController.applyRefferalCode)
router.get('/skipRefferal',userAuth,refferalController.skipRefferal)
module.exports=router 
