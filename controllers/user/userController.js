const User = require('../../models/userSchema');
const Product = require('../../models/productSchema')
const Category = require('../../models/catagory')
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
        const user = req.session.user;
        const userData = await User.findOne({_id:user})
        const categoryData = await Category.find({ isListed: true })
        let productData = await Product.find(
            {
                isBlocked: false,
                category: { $in: categoryData.map(category => category._id) },
                
            })

            console.log('product data first',productData)

            productData.sort((a,b)=>{
                new Date(b.createdOn)-new Date(a.createdOn)
            })
            
            
            productData = productData.slice(0,4)
            console.warn('productData length',productData.lenght)
            console.warn('productData',productData)
        if (user&&!userData.isBlock) {
            const userData = await User.findOne({ _id: user })
            res.render('home', { user: userData , products:productData })
        } else {
            return res.render('home',{products:productData})
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
            subject: 'Verify your account',
            text: `Your OTP is ${otp}`,
            html: `<b>Your OTP: ${otp}</b>`
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
        // Check if email already exists
        const findUser = await User.findOne({ email });

        if (findUser) {
            console.log('user Aleady exists')
            return res.render('register', { message: 'User with this email already exists' });
        }


        // Generate and send OTP
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
        console.log(1)

        if (!req.session.userData || !req.session.userOTP) {
            return res.status(400).json({ success: false, message: 'Session expired. Please try registering again.' });
        }
        console.log(2)
        if(!otp.trim()){
            return res.status(400).json({success:false,message:'Enter OTP for verification'})
        }
        console.log(3)
        if (otp === req.session.userOTP) {
            const user = req.session.userData;
console.log(4)
            // Re-check if email already exists
            const findUser = await User.findOne({ email: user.email });
console.log(5)
            if (findUser) {
console.log(6)
                return res.status(400).json({ success: false, message: 'User with this email already exists' });

            }
            console.log(7)

            const passwordHash = await securePassword(user.password);
            const saveUserData = new User({
                username: user.username,
                email: user.email,
                phone: user.phone,
                password: passwordHash
            });
console.log(8)
            await saveUserData.save();
console.log(9)
            req.session.user = saveUserData._id;
            res.json({ success: true, redirectUrl: '/home' });
            console.log(9)
        } else {
            console.log(10)
            return res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' });
        }
    } catch (error) {
        console.log(11)
        console.error('verify OTP error:', error);
        if (error.code === 11000) {
            console.log(12)
            return res.status(400).json({ success: false, message: 'User with this email already exists' });
        }
        console.log(13)
        res.status(500).json({ success: false, message: 'An error occurred during OTP verification' });
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
        
             res.render('login')
        
    } catch (error) {
        console.log('loadlogin',error)
        res.redirect('/pageNOTfound')
    }
}

//login
const login = async (req, res) => {
    try {
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
};

//logout
const logout = async (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.log('session destruction err', err.message)
                return res.redirect('/pageNOTfound')
            }
        })
        return res.redirect('/login')
    } catch (error) {
        console.log('logout function error', error)
    }
}

//Get shoping page
const loadShopingPage = async(req,res)=>{
    try {
        
        const user = req.session.user
        const userData = await User.findOne({_id:user,isBlock:false})
        const categories = await Category.find({isListed:true})
        const categoryIds = categories.map((cat)=>cat._id.toString())
        const page = parseInt(req.query.page)||1
        console.log('pageNumber',page)
        const limit = 6
        
        let skip = (page-1)*limit
        console.log('skip',skip);
        
        const products = await Product.find({
            isBlocked:false,
            category:{$in:categoryIds},
            
        }).sort({createdAt:-1}).skip(skip).limit(limit)

        const totalProducts = await Product.countDocuments({
            isBlocked:false,
            category:{$in:categoryIds},
        })

        const totalPages = Math.ceil(totalProducts/limit)
        const categorieWithIds = categories.map((category)=>({_id:category._id,name:category.name}))

        console.log(userData)
            res.render('shop',{
            user:userData,
            products:products,
            category:categorieWithIds,
            selectedCategories:[],
            selectedPriceFilters:[],
            sortBy:[],
            totalProducts:totalProducts,
            currentPage:page,
            totalPages:totalPages,
            query: req.query.search || '',
            sortBy: req.query.sortBy || ''
        })
       
        
    } catch (error) {
        console.error('error from loadShopingPage',error)
        res.redirect('/pageNOTfound')
    }
}




const sortAndFilter = async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    const { category, priceFilter, sort } = req.query;
    const limit = 6;
    let skip = (page - 1) * limit;

    // Build filter object
    let filter = {};

    // Handle categories
    if (category) {
      const categoryArray = Array.isArray(category) ? category : [category];
      const validateCategory = categoryArray
        .filter(catId => ObjectId.isValid(catId))
        .map(catId => new ObjectId(catId));
      
      if (validateCategory.length > 0) {
        filter.category = { $in: validateCategory };
      }
    }

    // Handle price ranges
    if (priceFilter) {
      const ranges = Array.isArray(priceFilter) ? priceFilter : [priceFilter];
      filter.$or = ranges.map(range => {
        const [min, max] = range.split('-').map(Number);
        return { 'variants.salePrice': { $gte: min, $lte: max } };
      });
    }

    // Build sort object
    let sortOption = {};

    if (sort) {
      switch (sort) {
        case 'priceLowHigh':
          sortOption = { 'variants.0.salePrice': 1 }; // Sort by first variant's price
          break;
        case 'priceHighLow':
          sortOption = { 'variants.0.salePrice': -1 }; // Sort by first variant's price
          break;
        case 'nameAZ':
          sortOption = { 'productName': 1 }; // Explicit string field
          break;
        case 'nameZA':
          sortOption = { 'productName': -1 }; // Explicit string field
          break;
        default:
          sortOption = { createdAt: -1 };
      }
    }

    const categories = await Category.find({});
    const products = await Product.find(filter)
      .collation({ locale: 'en', strength: 2 }) // Case-insensitive sorting
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    // Get correct total count
    const totalProduct = await Product.countDocuments(filter);
    const totalPage = Math.ceil(totalProduct / limit);

    // Render template
    res.render('shop', {
      products,
      category: categories,
      selectedCategories: category ? (Array.isArray(category) ? category : [category]) : [],
      selectedPriceFilters: priceFilter ? (Array.isArray(priceFilter) ? priceFilter : [priceFilter]) : [],
      sortBy: sort || '',
      totalPages: totalPage,
      currentPage: page
    });

  } catch (error) {
    console.error('error from sortAndFilter', error);
    res.status(500).redirect('/pageNotFound');
  }
};


const searchProducts = async(req,res)=>{
    try {
        const user = req.session.user
        const userData = await User.findOne(user)
        let search = req.body.query

        const categories = await Category.find({isListed:true}).lean()
        const categoryIds = categories.map((cat)=>cat._id.toString())
        let searchResult = []

        if(req.session.filterProduct&&req.session.filterProduct.lenght>0){
            searchResult = req.session.filterProducts.filter((product)=>{
                product.productName.toLowerCase().includes(search.toLowerCase())
            })
        }else{
            searchResult = await Product.find({
                productName:{$regex:".*"+search+".*",$options:"i"},
                isBlocked:false,
                quantity:{$gt:0},
                category:{$in:categoryIds}
            })
        }

        searchResult.sort((a,b)=>new Date(b.createdOn)-new Date(a.createdOn))
        let itemsPerPage=6
        let currentPage = parseInt(req.query.page)||1
        let startIndex = (currentPage-1)*itemsPerPage
        let endIndex = startIndex+itemsPerPage
        let totalPages = Math.ceil(searchResult.length/itemsPerPage)

        let currentProduct = searchResult.slice(startIndex,endIndex)

        res.render('shop',{
            user:userData,
            products:currentProduct,
            totalPages,
            currentPage,
            category:categories
        })
    } catch (error) {
        console.error('error from searchProducts',error)
        res.redirect('/pageNotFound')
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
    searchProducts,
    checkUserBlock,
    sortAndFilter
};