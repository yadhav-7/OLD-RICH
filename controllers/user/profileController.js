const User = require('../../models/userSchema')
const Address = require('../../models/addressSchema')
const Order = require('../../models/orderSchema')
const Cart = require('../../models/cartSchema')
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
     
        const mailOptions = {
    from: process.env.NODEMAILER_EMAIL,
    to: email,
    subject: 'OLD RICH | Password Reset OTP',

    text: `Hello,
Your request to reset your OLD RICH account password has been received.
Your OTP is: ${otp}
This OTP is valid for 10 minutes.
If you did not request this, please ignore this email.`,

    html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #d8f3dc; border-radius: 10px; background: #ffffff;">
    
    <h2 style="color: #1b4332; text-align: center; font-weight: 700; margin-bottom: 5px;">
        OLD RICH
    </h2>
    <p style="text-align:center; margin-top:-5px; color:#2d6a4f; font-size:14px;">
        Premium Old Money Clothing for Men
    </p>

    <hr style="border: none; border-top: 1px solid #95d5b2; margin: 20px 0;">

    <p style="font-size: 15px; color: #1b4332;">
        Hi,
        <br><br>
        We received a request to reset your <strong>OLD RICH</strong> account password.  
        Please use the One-Time Password (OTP) below to continue.
    </p>

    <div style="text-align:center; margin: 30px 0;">
        <div style="
            display: inline-block; 
            padding: 15px 25px; 
            background: #2d6a4f; 
            color: #ffffff; 
            font-size: 26px; 
            font-weight: bold; 
            border-radius: 8px; 
            letter-spacing: 3px;
        ">
            ${otp}
        </div>
    </div>

    <p style="font-size: 14px; color: #2d6a4f;">
        This OTP is valid for <strong>10 minutes</strong>.  
        If you did not request this, simply ignore this email.
    </p>

    <hr style="border: none; border-top: 1px solid #95d5b2; margin-top: 30px;">

    <p style="font-size: 13px; color: #40916c; text-align:center;">
        © OLD RICH — Redefining Classic Men's Fashion<br>
        This is an automated message. Please do not reply.
    </p>
</div>
`

};

       
        const info = await transporter.sendMail(mailOptions)
        
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

        const findEmail = await User.findOne({ email: email })
        if (findEmail) {
            const otp = generateOtp()
            const emailSent = await sendVerificationEmail(email, otp)

            if (emailSent) {
                req.session.userOTP = otp
                setTimeout(() => {
                    delete req.session.userOTP
                }, 60000)
                req.session.email = email
                console.log('OTP:', otp)
                return res.render('forgotPass-otp')

            } else {
                res.json({ success: false, message: 'Failed to send OTP, Please try again' })
            }
        } else {
            return res.render('forgotPass-otp', {
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
            setTimeout(() => {
                delete req.session.userOTP
            }, 60000)
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


        let page = req.query.page
        page = parseInt(page) || 1
const limit = 3
const skip = (page - 1) * limit

        
   
        const filter = req.query.filter || ''
       
        const sort = req.query.sort || ''
        const userId = req.session.user;
         res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
        let query = {}
        if (userId) {
            query.userId = userId
            
        }
        if (filter && filter !== 'all') {
            query.status = filter
        }



        const order = await Order.find(query)
            .sort({ createdOn: -1 })
            .skip(skip)
            .limit(limit)

        const totalDoc = await Order.countDocuments(query)

        const totalPage = Math.ceil(totalDoc / limit)
        const totalOrders = await Order.countDocuments({ userId: userId })
        const completedOrders = await Order.countDocuments({ userId: userId, status: 'Delivered' })
        const cancelledOrders = await Order.countDocuments({ userId: userId, status: 'cancelled' })
        const inProgress = await Order.countDocuments({ userId: userId, status: { $nin: ['Delivered', 'cancelled', 'returnRequested', 'returned', 'reutrnRejected'] } })
        .populate('orderedItems.product')

        const cart = await Cart.findOne({ userId: userId })
        let length
    
        if (cart && cart.items?.length) {
            length = cart.items?.length
        }

        const userData = await User.findById(userId)
      
        const addressDoc = await Address.findOne({ userId });
  
        const addressData = addressDoc?.address || []
    
        function getStatusBadgeClass(status) {
            switch (status.toLowerCase()) {
                case 'Failed': return 'bg-danger text-white';
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


        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(200).json({ order: order, totalPage: totalPage, currentPage: page })
        }
        return res.render('userProfile', {
            user: userData,
            addressData: addressData,
            order: order,
            totalOrders: totalOrders,
            completedOrders: completedOrders,
            cancelledOrders: cancelledOrders,
            inProgress: inProgress,
            length: length,
            totalPage: totalPage,
            currentPage: page,
            getStatusBadgeClass
        })
    } catch (error) {
        console.error('Error from userProfile:', error);
        res.redirect('/pageNotFound');
    }
}


const getPassCheckforEmailchange = async (req, res) => {
    try {
        const user = req.session.user
        const userData = await User.findById(user)

        if (userData.googleId) {
            req.session.flash = {
                type: 'error',
                message: "Email can't be changed. This account is linked with Google"
            };
            return res.redirect('/userProfile');
        }

        res.render('passCheckforEmailchange', {
            message: null
        })

    } catch (error) {
        console.error('error from passCheckforEmailchange', error)
    }
}

const passCheckforEmailchange = async (req, res) => {
    try {
        const enteredPass = req.body.password

        const userId = req.session.user

        if (!userId) {
            return redirect('/pageNotFound')
        }



        const user = await User.findById(userId)
        const isMatch = await bcrypt.compare(enteredPass, user.password)

        if (!isMatch) {
            return res.render('passCheckforEmailchange', {
                message: 'Incorrect Password'
            })
        }

        req.session.passwordVerified=true

        res.redirect('/newEmail')

    } catch (error) {
        console.error('error from passCheckEmailChange', error)
        return res.redirect('/pageNotFound')
    }
}


const getNewMail = async (req, res) => {
    try {

        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
        if(req.session.passwordVerified){
         return res.render('newMail')
        }else{
            return res.redirect('/passCheckforEmailchange')
        }
    } catch (error) {
        console.error('error in getNewMail', error)
        res.redirect('/pageNotFound')
    }
}

const changeEmailValid = async (req, res) => {
    try {
        const newEmail = (req.body.newEmail || "").trim();

        req.session.newEmail = newEmail
        const userId = req.session.user;
        const userData = await User.findById(userId);

        if (newEmail === userData.email) {
            return res.render('newMail', {
                message: 'You are already using this email!'
            });
        }

        console.log('newEmail', newEmail || 0)
        const existsUser = await User.findOne({
            email: newEmail,
            _id: { $ne: userId }
        });

        if (existsUser) {
            return res.render('newMail', {
                message: 'This email is already registered. Try another email.'
            });
        }

        await User.findByIdAndUpdate(userId, { email: newEmail });
        res.redirect('/userProfile');

    } catch (error) {
        console.log('error from emailUpdate', error);
        res.redirect('/pageNotFound'); // Optional: Add fallback
    }
}

const verifychangeEmailOtp = async (req, res) => {
    try {
        const email = req.session.userData; // new email stored in session
        const userId = req.session.user; // logged-in user's ID
        const enteredOtp = req.body.otp;

        if (!userId || !email) {
            return res.status(400).json({ message: 'Session expired or invalid request. Try again.' });
        }

        const userData = await User.findById(userId);

        if (!userData) {
            return res.status(404).json({ message: 'User not found. Please try again later.' });
        }

        if (enteredOtp == req.session.otp) {
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { $set: { email: email } },
                { new: true }
            );

            // Clear session data related to email change
            req.session.userData = null;
            req.session.otp = null;

            // Set flash message for UI
            req.session.flash = {
                type: 'success',
                message: 'Email address updated successfully!'
            };

            return res.status(200).json({ url: '/userProfile' });
        } else {
            return res.status(401).json({ message: 'Incorrect OTP. Please try again.' });
        }
    } catch (error) {
        console.error('Error verifying email change OTP:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};


const emailUpdate = async (req, res) => {
    try {
        const { newEmail } = req.body
        console.log('emailUpdate first line', newEmail)
        const userExists = await User.findOne({ email: newEmail })

        console.log('userExists', userExists)
        if (userExists) {
            console.log('im reach hear!')
            return res.render('newMail', {
                message: 'User Already Exists!'
            })
        }


        const otp = generateOtp()

        const emailSent = sendVerificationEmail(newEmail, otp)
        if (emailSent) {
            req.session.otp = otp
            setTimeout(() => {
                delete req.session.otp
            }, 60000)
            req.session.userData = newEmail
            res.redirect('/changeEmailOtp')
            req.session.otpSession = true
            console.log(otp)
            console.log(newEmail)

        } else {
            res.render('newMail', {
                message: 'Something went wrong while otp sent!'
            })
        }
    } catch (error) {
        res.redirect('/pageNotFound')
    }
};

const changeEmailOtp = async (req, res) => {
    try {
        res.render('changeEmailOtp')
    } catch (error) {
        console.error('error in changeEmailOtp', error)
        res.redirect('/pageNotFound')
    }
}

const resendOTPwhileEmailchange = async (req, res) => {

    try {

        console.log('isWorking................')
        const otp = generateOtp()

        console.log('resendOTP:', otp)
        const email = req.session.userData

        if (!email) {
            return res.status(500).json({ message: 'Please try later , Cannot sent Otp again' })
        }
        const emailSent = sendVerificationEmail(email, otp)

        if (emailSent) {
            req.session.otp = otp
            setTimeout(() => {
                delete req.session.otp
            }, 60000)
            return res.status(200).json({ message: 'OTP sent successfull' })
        }

        res.status(500).json({ success: false })

    } catch (error) {
        console.error('error from resendOTP while Emailchange')
        res.status(500).json({ message: 'Internal Server Error!' })
    }
}

const changePassword = async (req, res) => {
    try {
        const user = req.session.user
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');



        if (!user) {
            return res.redirect('/home')
        }
        res.render('changePassword', {
            message: null
        })
    } catch (error) {

    }
}


const updatePassword = async (req, res) => {
    try {
 
        const user = req.session.user
        const userData = await User.findById(user)


        if (!user) return res.redirect('/home')


        const { currentPassword, newPassword, confirmPassword } = req.body


        if (newPassword !== confirmPassword) return res.render('changePassword', { message: 'password is not match' })

        const checkExistsNewPass = await bcrypt.compare(newPassword , userData.password)

        if (checkExistsNewPass) return res.render('changePassword', { message: 'New password cannot be same as current password' })

        const isMatch = await bcrypt.compare(currentPassword, userData.password)


        if (!isMatch) return res.render('changePassword', { message: 'Invalid Password' })

        const hashedPass = await bcrypt.hash(newPassword, 10)

        const addressDoc = await Address.findOne({ user });

        const addressData = addressDoc?.address || [];
        await User.findByIdAndUpdate(
            user,
            { password: hashedPass }
        )
        // res.render('userProfile',{
        //     user:userData,
        //     addressData:addressData
        // })
        res.redirect('/userProfile')

    } catch (error) {
        console.error('error from updatePassword ', error)
        res.redirect('/pageNotFound')
    }
}

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const editProfile = async (req, res) => {

    try {
        const user = req.session.user
        if (!user) return res.status(500).json({ message: 'Somethig went wrong please try again leter' })
        const { username, phone, profileDeleteReq } = req.body;

        let profileImagePath;

        if (req.file) {
            const croppedPath = path.join('public/Uploads/profile', 'cropped-' + req.file.filename);
            await sharp(req.file.path)
                .resize(160, 160)
                .toFile(croppedPath);

            fs.unlinkSync(req.file.path); // Clean up the original

            console.log(req.file.path, 'req.file.path===============>\\')
            console.log(path.basename(croppedPath), ' path.basename(croppedPath)======================>')
            profileImagePath = '/Uploads/profile/' + path.basename(croppedPath);
        }
        const currentImage = await User.findById(user);

        if (currentImage.userProfileImage && profileDeleteReq) {
            const imagePath = path.join(__dirname, '..', 'public', currentImage.userProfileImage);

            // Try removing file safely
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }

            // Remove image path from DB
            currentImage.userProfileImage = undefined; // or null
            await currentImage.save(); // Save updated document
        }




        const updateData = { username, phone };
        if (profileImagePath) updateData.userProfileImage = profileImagePath;

        const updatedUser = await User.findOneAndUpdate(
            { _id: user },
            { $set: updateData },
            { new: true }
        );

        if (!updatedUser) return res.status(404).json({ message: 'User not found' });

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
    changeEmailOtp,
    verifychangeEmailOtp,
    emailUpdate,
    getPassCheckforEmailchange,
    passCheckforEmailchange,
    getNewMail,
    resendOTPwhileEmailchange,
    updatePassword,
    editProfile
}