const User = require('../../models/userSchema')
const Address = require('../../models/addressSchema')
const Order = require('../../models/orderSchema')
nodemailer = require('nodemailer')
const bcrypt = require('bcrypt')
const env = require('dotenv').config()
const session = require('express-session')
const { findById } = require('../../models/productSchema')

async function securePass(pass) {
    try {
        const hashedPassword = await bcrypt.hash(pass, 10);
        return hashedPassword
    } catch (error) {
        console.error('error from securePass', error)
    }
}

function generateOtp() {
    const digits = '1234567890'
    let otp = ''
    for (let i = 0; i < 6; i++) {
        otp += digits[Math.floor(Math.random() * 10)]
    }
    return otp
}

const sendVerificationEmail = async (email, otp) => {
    try {
        console.log(1)
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD
            }
        })
        console.log(2)
        const mailOptions = {
            from: process.env.NODEMAILER_EMAIL,
            to: email,
            subject: 'Your OTP for password reset',
            text: `Your OTP is ${otp}`,
            html: `<b><h4>Your OTP :${otp}</h4></b>`
        }
        console.log(3)
        const info = await transporter.sendMail(mailOptions)
        console.log('Email Send:', info.messageId)
        return true
    } catch (error) {
        console.error('error from sending email', error)
        return false
    }
}






const getForgotPasspage = async (req, res) => {
    try {
        res.render('forgotPassword')
    } catch (error) {
        console.log('error from getForgotPassPage')
        res.redirect('/page-404')
    }
}

const forgotEmailValid = async (req, res) => {

    try {
        const { email } = req.body
        console.log(email)
        const findEmail = await User.findOne({ email: email })
        if (findEmail) {
            const otp = generateOtp()
            const emailSent = await sendVerificationEmail(email, otp)
            console.log('forgotEmailValid')
            if (emailSent) {
                req.session.userOTP = otp
                req.session.email = email
                res.render('forgotPass-otp')
                console.log('OTP:', otp)
            } else {
                res.json({ success: false, message: 'Failed to send OTP, Please try again' })
            }
        } else {
            res.render('forgotPass-otp', {
                messege: 'User with this email does not exists'
            })
        }
    } catch (error) {
        console.log('error from forgotEmailValid', error)
        res.redirect('/pageError')
    }
}

const verifyForgotPassOtp = async (req, res) => {
    try {
        console.log('start verifyForgotPassotp')
        const enteredOtp = (req.body.otp || '').trim();

        if (!enteredOtp) {
            return res.status(400).json({ message: 'OTP is required' })
        }

        if (!req.session.userOTP) {
            return res.status(400).json({ message: 'OTP has expired or not set' })
        }

        if (enteredOtp === req.session.userOTP) {
            req.session.userOTP = null
            return res.status(200).json({ message: "OTP verified successfully", redirect: "/reset-password" });
        } else {
            return res.status(400).json({ message: "Invalid OTP" });
        }
    } catch (error) {
        console.error('error from verifyForgotPassOtp', error)
        res.status(500).json({ message: 'Internal server error' })
    }
}

const getResetPassPage = async (req, res) => {
    try {
        res.render('reset-password')
    } catch (error) {
        console.error('error from getResetPassPage', error)
        res.redirect('/pageNotFound')
    }
}

const reSentOtp = async (req, res) => {
    try {
        const otp = generateOtp()
        req.session.userOTP = otp
        const email = req.session.email
        if (!email) {
            return res.status(400).json({ message: 'Session expired. Please go back and start again.' })
        }
        const emailSent = await sendVerificationEmail(email, otp)

        if (emailSent) {
            console.log('re-sent-otp:', otp)
            req.session.userOTP = otp
            return res.status(200).json({ message: 'OTP has been resent to your email' })
        }
    } catch (error) {
        console.error('error from reSentOtp', error)
        return res.status(500).json({ message: 'Failed to resent-otp, try again leter' })
    }
}

const postNewPassword = async (req, res) => {
    try {
        const { newPass1, newPass2 } = req.body
        const email = req.session.email

        if (newPass1 === newPass2) {
            const passwordHash = await securePass(newPass1)

            await User.updateOne({ email: email }, { $set: { password: passwordHash } })
            res.redirect("/login")
        } else {
            res.render("reset-password", { message: 'Password do not match' })
        }
    } catch (error) {
        console.error('error from postNewPassword', error)
        res.redirect('/pageNotFound')
    }
}

const userProfile = async (req, res) => {
    try {
        // Clear sensitive session data
        delete req.session.otp;
        delete req.session.email;

        const userId = req.session.user;

        const order = await Order.find({ userId: userId })
    .populate('orderedItems.product');


        const userData = await User.findById(userId);
        const addressDoc = await Address.findOne({ userId });

        const addressData = addressDoc?.address || []; // Safely extract the embedded address array
        function getStatusBadgeClass(status) {
  switch (status.toLowerCase()) {
    case 'pending': return 'bg-warning text-dark';
    case 'processing': return 'bg-info text-white';
    case 'shipped': return 'bg-primary text-white';
    case 'delivered': return 'bg-success';
    case 'cancelled': return 'bg-danger';
    case 'return req': return 'bg-secondary';
    case 'returned': return 'bg-dark';
    default: return 'bg-light text-dark';
  }
}

res.render('userProfile', {
  user: userData,
  addressData: addressData,
  order: order,
  getStatusBadgeClass
});


     

    } catch (error) {
        console.error('Error from userProfile:', error);
        res.redirect('/pageNotFound');
    }
};


const getPassCheckforEmailchange = async(req,res)=>{
    try {
        
  
    res.render('passCheckforEmailchange',{
        message:null
       })
  
    } catch (error) {
        console.error('error from passCheckforEmailchange',error)
    }
}

const passCheckforEmailchange = async(req,res)=>{
    try {
   const enteredPass = req.body.password
        
        const userId = req.session.user
        
        if(!userId){
            return redirect('/pageNotFound')
        }
        
        const user = await User.findById(userId)
        const isMatch = await bcrypt.compare(enteredPass,user.password)
        
        if(!isMatch){
            return res.render('passCheckforEmailchange',{
                message:'Incorrect Password'
            })
        }
        
        res.render('changeEmail',{
            message:null
        })

         res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');     
        
    } catch (error) {
        console.error('error from passCheckEmailChange',error)
        return res.redirect('/pageNotFound')
    }
}


const changeEmailValid = async(req,res)=>{
    try {
       const {email}=req.body
        const userExists = await User.findOne({email})
        const userId = req.session.user
        const userData = await User.findById(userId)
        
        if(userExists){
            if(email!==userData.email){
            return res.render('changeEmail',{
                message:'Wrong email'
            })
        }
            const otp = generateOtp()
            const emailSent = sendVerificationEmail(email,otp)
            if(emailSent){
                req.session.otp = otp
                req.session.userData =email
                // req.session.newEmail = email
                
                res.render('changeEmailOtp',{
                    message:null
                })
                req.session.otpSession=true
                console.log(otp)
                console.log(email)
             
            }else{
                return res.render('changeEmail',{
                    message:'User does not exists!'
                })
            }
        }else{
            res.render('changeEmail',{
                message:'User with this email not exists'
            })
        }
    } catch (error) {
        res.redirect('/pageNotFound')
    }
}

const verifychangeEmailOtp = async(req,res)=>{
    try {

 
        const enteredOtp = req.body.otp
        
        if(enteredOtp==req.session.otp){
            
            req.session.userData = req.body.userData
            
            res.render('newMail',{
                message:null
            })


        }else{
            res.render('changeEmailOtp',{
                message:'OTP not matching',
            })
        }
    } catch (error) {
        console.error('error from verfy change email otp',error)
        res.redirect('pageNotFound')
    }
}

const emailUpdate = async (req, res) => {
  try {

    console.log('emailUpdate is working');
    
    
    const newEmail = (req.body.newEmail || "").trim();

    req.session.newEmail = newEmail
    const userId = req.session.user;
    const userData = await User.findById(userId);

    if (newEmail === userData.email) {
      return res.render('newMail', {
        message: 'You are already using this email!'
      });
    }

    console.log('newEmail',newEmail||0)
    const existsUser = await User.findOne({
      email: newEmail,
      _id: { $ne: userId }
    });

    if (existsUser) {
      return res.render('newMail', {
        message: 'This email is already registered. Try another email.'
      });
    }
     res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
    await User.findByIdAndUpdate(userId, { email: newEmail });
    res.redirect('/userProfile');

  } catch (error) {
    console.log('error from emailUpdate', error);
    res.redirect('/pageNotFound'); // Optional: Add fallback
  }
};

const resendOTPwhileEmailchange = async(req,res)=>{

    try {

        console.log('isWorking................')
        const otp = generateOtp()
        console.log('resendOTP:',otp)
        const email = req.session.userData
        
        if(!email){
            return res.redirect('/pageNotFound')
        }
        const emailSent = sendVerificationEmail(email,otp)

        if(emailSent){
            req.session.otp=otp
            return res.status(200).json({success:true})
        }

        res.status(500).json({success:false})

    } catch (error) {
        console.error('error from resendOTP while Emailchange')
        res.redirect('/pageNotFound')
    }
}

const changePassword = async (req, res) => {
    try {
        const user = req.session.user
        
        if (!user) {
          return res.redirect('home')
        }
        res.render('changePassword',{
            message:null
        })
    } catch (error) {

    }
}


const updatePassword = async(req,res)=>{
    try {
        console.error('updatePassword is working------------------------')
        const user = req.session.user
       const userData = await User.findById(user)
      
       
        if(!user) return res.redirect('/home')
      

            const {currentPassword,newPassword,confirmPassword}=req.body
    

        if(newPassword!==confirmPassword)return res.render('changePassword',{message:'password is not match'})

            const checkExistsNewPass = await bcrypt.compare(userData.password,newPassword)

            if(checkExistsNewPass)return res.render('changePassword',{message:'New password cannot be same as current password'})

               const isMatch = await bcrypt.compare(currentPassword,userData.password)
               

               if(!isMatch)return res.render('changePassword',{message:'Invalid Password'})
            
                const hashedPass = await bcrypt.hash(newPassword,10)

 const addressDoc = await Address.findOne({ user });

        const addressData = addressDoc?.address || []; // Safely extract the embedded address array
                await User.findByIdAndUpdate(
                    user,
                    {password:hashedPass}
                )
                // res.render('userProfile',{
                //     user:userData,
                //     addressData:addressData
                // })
                res.redirect('/userProfile')

    } catch (error) {
        console.error('error from updatePassword ',error)
        res.redirect('/pageNotFound')
    }
}

const editProfile = async (req, res) => {
  try {
    console.log('editProfile is working............');
    console.log('req.query.userId', req.query.userId);
    console.log('req.body', req.body);

    const { username, email, phone } = req.body;
    const uId = req.query.userId; 

    if (!uId) {
      return res.status(400).json({ message: 'Missing userId' });
    }

    const updatedUser = await User.findOneAndUpdate(
      { _id: uId },
      { $set: { username, email, phone } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'Profile updated successfully!' });

  } catch (error) {
    console.error('Error in editProfile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
    getForgotPasspage,
    forgotEmailValid,
    verifyForgotPassOtp,
    getResetPassPage,
    reSentOtp,
    postNewPassword,
    userProfile,
    changePassword,
    changeEmailValid,
    verifychangeEmailOtp,
    emailUpdate,
    getPassCheckforEmailchange,
    passCheckforEmailchange,
    resendOTPwhileEmailchange,
    updatePassword,
    editProfile
}