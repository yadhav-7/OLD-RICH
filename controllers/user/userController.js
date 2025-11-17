const User = require('../../models/userSchema');
const Product = require('../../models/productSchema')
const Category = require('../../models/catagory')
const Cart = require('../../models/cartSchema')
const Wishlist = require('../../models/wishlistSchema')
const Wallet = require('../../models/walletSchema')
const mongoose = require('mongoose');
const { ObjectId } = require('mongoose').Types;
const nodemailer = require('nodemailer');
const dotenv = require('dotenv').config();
const bcrypt = require('bcrypt');


// 404 Page
const pageNOTfound = async (req, res) => {
  try {
    res.render('page-404.ejs');
  } catch (error) {
    console.log('pageNOTfound error:', error);
    res.redirect('/pageNOTfound');
  }
};

// Load Home Page
const loadHomePage = async (req, res) => {

  try {
    console.log('helo')
    const user = req.session.user;
    const userData = await User.findOne({ _id: user })
    if (userData && userData?.refferalCodeApplied === 'canUse' && userData?.refferalCodeApplied !== 'used') {
      userData.refferalCodeApplied = 'notUsed'
      await userData.save()
    }

    const categoryData = await Category.find({ isListed: true })
    let productData = await Product.find(
      {
        isBlocked: false,
        category: { $in: categoryData.map(category => category._id) },

      })



    productData.sort((a, b) => new Date(b.createdOn) - new Date(a.createdOn));



    productData = productData.slice(0, 4)

    if (user && !userData.isBlock) {
      const cart = await Cart.findOne({ userId: user })
      res.render('home', { user: userData, products: productData, length: cart?.items?.length })
    } else {
      return res.render('home', { products: productData })
    }

  } catch (error) {
    console.log('home page error:', error);
    res.redirect('/pageNotFound')
  }
};

// Load Register Page
const loadRegister = async (req, res) => {
  try {
    if (req.session.user) {
      return res.redirect('/home')
    } else {
      res.render('register.ejs');

    }
  } catch (error) {
    console.log('register page error:', error);
    res.status(500).send('Server error');
  }
};

const checkUserBlock = async (req, res) => {
  try {
    const userId = req.session.user;
    const findUser = await User.findById(userId);

    if (!findUser) {
      return res.status(404).json({ message: 'User not found' });
    }




    res.json({ findUser });
  } catch (error) {
    console.error('Error from checkUserBlock:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Generate OTP
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send Verification Email
async function sendVerificationEmail(email, otp) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD
      }
    });

    const info = await transporter.sendMail({
      from: process.env.NODEMAILER_EMAIL,
      to: email,
      subject: 'OldRich — Verify Your Account',
      html: `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; padding: 30px;">
    <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
      <div style="background-color: #1a1a1a; color: #f5d384; text-align: center; padding: 20px;">
        <h1 style="margin: 0; font-size: 26px; letter-spacing: 1px;">Old<span style="color:#ffffff;">Rich</span></h1>
        <p style="margin: 5px 0 0; font-size: 14px;">Where timeless style meets modern luxury</p>
      </div>

      <div style="padding: 30px;">
        <h2 style="color: #1a1a1a; text-align: center;">Verify Your Account</h2>
        <p style="color: #444; font-size: 15px; line-height: 1.6;">
          Dear Gentleman,<br><br>
          Welcome to <strong>OldRich</strong> — we’re delighted to have you with us.
          To ensure your account’s security, please use the OTP below to verify your email address.
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <span style="display: inline-block; background-color: #1a1a1a; color: #f5d384; font-size: 24px; letter-spacing: 4px; padding: 15px 25px; border-radius: 8px; font-weight: bold;">
            ${otp}
          </span>
        </div>

        <p style="color: #555; font-size: 14px; line-height: 1.5;">
          This code is valid for <strong>1 minutes</strong>. If you didn’t request this, kindly ignore this email.
        </p>

        <p style="margin-top: 25px; color: #888; font-size: 13px; text-align: center; border-top: 1px solid #eee; padding-top: 15px;">
          Thank you for choosing <strong>OldRich</strong>.<br>
          We value tradition, craftsmanship, and your trust.
        </p>
      </div>
    </div>
  </div>
  `
    });


    return info.accepted.length > 0;
  } catch (error) {
    console.log('Error sending email:', error);
    return false;
  }
}

// Register User
const register = async (req, res) => {

  try {
    const { username, email, phone, password, cpassword } = req.body;
    const findUser = await User.findOne({ email });

    if (findUser) {
      console.log('user Aleady exists')
      return res.render('register', { message: 'User with this email already exists' });
    }


    const otp = generateOtp();
    console.log('Generated OTP:', otp);
    const emailSent = await sendVerificationEmail(email, otp);
    if (!emailSent) {
      return res.json({ success: false, message: 'email-error' });
    }

    // Store OTP and user data in session
    req.session.userOTP = otp;
    req.session.userData = { username, email, phone, password, cpassword };

    res.render('register-OTP');
  } catch (error) {
    console.error('register error:', error);
    res.redirect('/pageNOTfound');
  }
};

// Load OTP Verification Page
const registerOTP = async (req, res) => {
  try {
    if (!req.session.userData || !req.session.userOTP) {
      return res.redirect('/register');
    }
    res.render('register-OTP');
  } catch (error) {
    console.error('register OTP page error:', error);
    res.redirect('/pageNOTfound');
  }
};

// Resend OTP
const resendOtp = async (req, res) => {
  try {
    const { email } = req.session.userData || {};
    if (!email) {
      return res.json({ success: false, message: 'Session expired. Please try registering again.' });
    }

    // Check if email already exists
    const findUser = await User.findOne({ email });
    if (findUser) {
      return res.json({ success: false, message: 'User with this email already exists' });
    }

    // Generate and send new OTP
    const otp = generateOtp();
    const emailSent = await sendVerificationEmail(email, otp);
    if (!emailSent) {
      return res.json({ success: false, message: 'Error sending email' });
    }

    req.session.userOTP = otp;
    console.log('New OTP sent:', otp);
    res.json({ success: true, message: 'New OTP sent successfully' });
  } catch (error) {
    console.error('resend OTP error:', error);
    res.json({ success: false, message: 'An error occurred while resending OTP' });
  }
};

// Hash Password
const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.error('password hashing error:', error);
    throw error;
  }
};

// Verify OTP
const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!req.session.userData || !req.session.userOTP) {
      return res.status(400).json({ success: false, message: 'Session expired. Please try registering again.' });
    }
    if (!otp.trim()) {
      return res.status(400).json({ success: false, message: 'Enter OTP for verification' })
    }

    if (otp === req.session.userOTP) {
      const user = req.session.userData;

      // Re-check if email already exists
      const findUser = await User.findOne({ email: user.email });

      if (findUser) {

        return res.status(400).json({ success: false, message: 'User with this email already exists' });

      }
      function genarateRefferalCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
      }
      const refferalCode = genarateRefferalCode()
      const passwordHash = await securePassword(user.password)
      const saveUserData = new User({
        username: user.username,
        email: user.email,
        phone: user.phone,
        password: passwordHash,
        referralCode: refferalCode
      })

      await saveUserData.save()

      const wallet = new Wallet({
        userId: saveUserData._id
      })

      console.log('wallet', wallet)

      await wallet.save()
      req.session.user = saveUserData._id
      return res.json({ success: true, redirectUrl: '/refferalCodeEnter' })

    } else {

      return res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' });
    }
  } catch (error) {

    console.error('verify OTP error:', error);
    if (error.code === 11000) {

      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    return res.status(500).json({ success: false, message: 'An error occurred during OTP verification' });
  }
};

//resend OTP
const reSendOtp = async (req, res) => {
  try {
    const { email } = req.session.userData
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email not found in session' })
    }
    const otp = generateOtp()
    req.session.userOTP = otp
    const emailSend = await sendVerificationEmail(email, otp)
    if (emailSend) {
      console.log('resend otp', otp)
      res.status(200).json({ success: true, message: 'otp resend successfully' })
    } else {
      res.status(500).json({ success: false, message: 'Failed to resend OTP Please try agian' })
    }
  } catch (error) {
    console.log('reSend otp', error)
    res.stats(500).json({ success: false, message: 'Internal Server Error, Please try again letter' })
  }
}

//load login
const loadlogin = async (req, res) => {
  try {
    console.log('🧩 Entered loadLogin')
    if (req.session.user) {
      console.log('🧩 User found in session -> redirect home')
      return res.redirect('/home')
    } else {
      console.log('🧩 No session user -> render login page')
      return res.render('login')
    }
  } catch (error) {
    console.log('🧩 Error in loadLogin', error)
    res.redirect('/pageNOTfound')
  }
}


//login
const login = async (req, res) => {
  try {
    if (req.session.user) {
      return res.render('login', { message: 'User Logged' })
    }
    const { email, password } = req.body;
    const findUser = await User.findOne({ isAdmin: 0, email: email });

    if (!findUser) {

      return res.render('login', { message: 'User not found' });
    }

    if (findUser.isBlock) {

      return res.render('login', { message: 'User is blocked by admin' });
    }

    const passwordMatch = await bcrypt.compare(password, findUser.password)

    if (!passwordMatch) {
      console.log('Incorrect password');
      return res.render('login', { message: 'Invalid Information' });
    }

    req.session.user = findUser._id;


    res.redirect('/home');
  } catch (error) {
    console.log('login error', error);
    res.render('login', { message: 'login failed Please try again leter' });
  }
}

//logout
const logout = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.log('session destruction err', err.message)
        res.setHeader('Cache-Control', 'no-store');
        res.redirect('/login');

        return res.redirect('/pageNOTfound')
      }
    })
    return res.redirect('/login')
  } catch (error) {
    console.log('logout function error', error)
  }
}

const loadShopingPage = async (req, res) => {
  try {
    const user = req.session.user
    const page = parseInt(req.query.page) || 1
    const query = req.query.query || ''
    const sort = req.query.sort
    const priceFilter = req.query.priceFilter
    const category = req.query.category
    const limit = 8
    const wishList = await Wishlist.findOne({ userId: user })
    const wishListArray = wishList?.products ?? []
    const userData = await User.findOne({ _id: user, isBlock: false })
    const categories = await Category.find({ isListed: true })

    const allCategoryIds = categories.map(cat => cat._id.toString())

    let categoryIds

    if (category) {

      const selectedIds = category.split(',');
      categoryIds = selectedIds.filter(id => allCategoryIds.includes(id));
    } else {
      categoryIds = allCategoryIds;
    }
    const filter = {
      isBlocked: false,
      category: { $in: categoryIds },
      productName: { $regex: query, $options: 'i' }
    }

    console.log('priceFilter',priceFilter)
   if (priceFilter) {
  const ranges = Array.isArray(priceFilter)
    ? priceFilter
    : priceFilter.split(',');

  const validRanges = ranges
    .map(range => {
      const [min, max] = range.split('-').map(Number);
      if (!isNaN(min) && !isNaN(max)) {
        return { 'variants.salePrice': { $gte: min, $lte: max } };
      }
      return null
    })
    .filter(Boolean);

  if (validRanges.length > 0) {
    filter.$or = validRanges;
  }
}


        let sortOption = {}

    if (sort) {
      switch (sort) {
        case 'priceLowHigh':
          sortOption = { 'variants.0.salePrice': 1 };
          break;
        case 'priceHighLow':
          sortOption = { 'variants.0.salePrice': -1 };
          break;
        case 'nameAZ':
          sortOption = { 'productName': 1 };
          break;
        case 'nameZA':
          sortOption = { 'productName': -1 };
          break;
        default:
          sortOption = { createdAt: -1 };
      }
    }else{
      sortOption = { createdAt: -1 };
    }

    let skip = (page - 1) * limit

    const products = await Product.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean()

    const totalProducts = await Product.countDocuments(filter)

    const totalPages = Math.ceil(totalProducts / limit)

    const categorieWithIds = categories.map((category) => ({ _id: category._id, name: category.name }))
    const cart = await Cart.findOne({ userId: user })

   if(req.headers['x-requested-by'] === 'frontend-fetch'){
     const transformedProducts = products.map(product => {

      const variants = Array.isArray(product.variants) ? product.variants : [];

      let displayVariant = {
        salePrice: 0,
        regularPrice: 0,
        size: '',
        quantity: 0
      };

      if (variants.length > 0) {
        displayVariant = {
          ...variants[0]
        }
      }


      if (priceFilter && variants.length > 0) {
        const ranges = Array.isArray(priceFilter) ? priceFilter : [priceFilter];
        for (const range of ranges) {
          const [min, max] = range.split('-').map(Number);
          const matchingVariant = variants.find(v =>
            v && v.salePrice && (v.salePrice >= min && v.salePrice <= max)
          );
          if (matchingVariant) {
            displayVariant = {
              ...matchingVariant
            };
            break;
          }
        }
      }

      return {
        ...product,
        displayVariant
      };
    });

    return res.status(200).json({
      message:'success',
      user: userData,
      products: transformedProducts,
      category: categorieWithIds,
      selectedCategories: [],
      selectedPriceFilters: [],
      sortBy: [],
      totalProducts: totalProducts,
      currentPage: page,
      totalPages: totalPages,
      query: req.query.search || '',
      sortBy: req.query.sortBy || '',
      length: cart?.items?.length,
      wishListArray: wishListArray
    })
   }else{
     
     return res.render('shop', {
      user: userData,
      products: products,
      category: categorieWithIds,
      selectedCategories: [],
      selectedPriceFilters: [],
      sortBy: [],
      totalProducts: totalProducts,
      currentPage: page,
      totalPages: totalPages,
      query: req.query.search || '',
      sort: req.query.sort || '',
      length: cart?.items?.length,
      wishListArray: wishListArray
    })
   }


  } catch (error) {
    console.error('error from loadShopingPage', error)
    res.redirect('/pageNOTfound')
  }
}


module.exports = {
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
  checkUserBlock
};