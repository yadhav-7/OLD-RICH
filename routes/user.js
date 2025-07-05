const express = require('express');
const router = express.Router();
const userController = require('../controllers/user/userController');
const profileController = require('../controllers/user/profileController')
const productController = require('../controllers/user/productController')
const {userAuth,guestAuth,adminAuth} = require('../middlewares/auth')
const passport = require('passport');
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

    if (authState === 'signup' || authState === 'login') {
  req.session.user = req.user._id;
  res.redirect('/home');
}
    
  });
// Handle Google OAuth failure and redirect accordingly
router.get('/handle-auth-failure', (req, res) => {
  const messages = req.session.messages || [];
  req.session.messages = [];

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


//HOME PAGE & SHOPING
router.get('/home',guestAuth,userController.loadHomePage)
router.get('/shop',guestAuth,userController.loadShopingPage)
router.get('/sortAndfilter',userController.sortAndFilter)
router.post('/search',userController.searchProducts)
router.get('/check-user-block',userController.checkUserBlock)


//PRODUCT MANAGEMENT
router.get('/productDetails',productController.productDetails)



module.exports=router 