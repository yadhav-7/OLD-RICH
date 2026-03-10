import User from '../../models/userSchema.js'
import Address from '../../models/addressSchema.js'
import Order from '../../models/orderSchema.js'
import Cart from '../../models/cartSchema.js'
import { uploadToCloudinary } from '../../config/cloudinary.js'
import bcrypt from 'bcrypt'
import generateOtp from '../../utils/otpUtils.js'
import sendVerificationEmail from '../emailService.js'
import logger from '../../utils/logger.js'

const securePass = async (pass) => {
    try {
        const hashedPassword = await bcrypt.hash(pass, 10)
        return hashedPassword
    } catch (error) {
        logger.error(`error from securePass ${error}`)
        throw error
    }
}


const validateForgotEmail = async (email) => {
    try {
        const findEmail = await User.findOne({ email })
        if (!findEmail) {
            return { status: false, render: 'forgotPassword', message: 'User with this email does not exists' }
        }
        if (findEmail.googleId) {
            return {
                status: false,
                render: 'forgotPassword',
                message: 'This account was created with Google. Please sign in using Google.',
            }
        }
        const otp = generateOtp()
        
        const emailSent = await sendVerificationEmail(email, otp)

        if (emailSent) {
            return {
                status: true,
                render: 'forgotPass-otp',
                otp,
                email
            }
        }
        return { status: false, render: 'forgotPassword', message: 'Failed to send OTP, Please try again' }
    } catch (error) {
        console.log('error ',error)
        logger.error(`Error in validateForgotEmail service: ${error}`)
        throw error
    }
}

const verifyOtp = (enteredOtp, sessionOtp) => {
    if (!enteredOtp) return { status: false, statusCode: 400, message: 'OTP is required' }
    if (!sessionOtp) return { status: false, statusCode: 400, message: 'OTP has expired or not set' }

    if (enteredOtp === sessionOtp) {
        return {
            status: true,
            statusCode: 200,
            message: 'OTP verified successfully',
            redirect: '/reset-password'
        }
    }
    return { status: false, statusCode: 400, message: 'Invalid OTP' }
}

const resendOtp = async (email) => {
    try {
        if (!email) return { status: false, statusCode: 400, message: 'Session expired. Please go back and start again.' }
        const otp = generateOtp()
        const emailSent = await sendVerificationEmail(email, otp)

        if (emailSent) {
            return { status: true, statusCode: 200, message: 'OTP has been resent to your email', otp }
        }
        return { status: false, statusCode: 500, message: 'Failed to resent-otp, try again leter' }
    } catch (error) {
        logger.error(`Error in resendOtp service: ${error}`)
        throw error
    }
}

const resetPassword = async (email, newPass) => {
    try {
        const passwordHash = await securePass(newPass)
        await User.updateOne({ email }, { $set: { password: passwordHash } })
        return { status: true, redirect: '/login' }
    } catch (error) {
        logger.error(`Error in resetPassword service: ${error}`)
        throw error
    }
}

const getUserProfile = async (userId, queryParams, isXhr) => {
    try {
        let page = parseInt(queryParams.page, 10) || 1
        const limit = 3
        const skip = (page - 1) * limit

        const filter = queryParams.filter || ''
        const sort = queryParams.sort || ''

        const query = {}
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

        const totalOrders = await Order.countDocuments({ userId })
        const completedOrders = await Order.countDocuments({
            userId,
            status: 'Delivered',
        })
        const cancelledOrders = await Order.countDocuments({
            userId,
            status: 'cancelled',
        })
        const inProgress = await Order.countDocuments({
            userId,
            status: {
                $nin: [
                    'Delivered',
                    'cancelled',
                    'returnRequested',
                    'returned',
                    'reutrnRejected',
                ],
            },
        }).populate('orderedItems.product')

        const cart = await Cart.findOne({ userId })
        let length = cart?.items?.length

        const userData = await User.findById(userId)
        const addressDoc = await Address.findOne({ userId })
        const addressData = addressDoc?.address || []

        if (isXhr) {
            return {
                isJson: true,
                data: { order, totalPage, currentPage: page }
            }
        }

        return {
            isJson: false,
            render: 'userProfile',
            data: {
                user: userData,
                addressData,
                order,
                totalOrders,
                completedOrders,
                cancelledOrders,
                inProgress,
                length,
                totalPage,
                currentPage: page
            }
        }

    } catch (error) {
        logger.error(`Error in getUserProfile service: ${error}`)
        throw error
    }
}

const verifyPasswordForEmailChange = async (userId, password) => {
    try {
        if (!userId) return { success: false, redirect: '/pageNotFound' }

        const user = await User.findById(userId)
        const isMatch = await bcrypt.compare(password, user.password)

        if (!isMatch) {
            return { success: false, render: 'passCheckforEmailchange', message: 'Incorrect Password' }
        }
        return { success: true, redirect: '/newEmail' }
    } catch (error) {
        logger.error(`Error in verifyPasswordForEmailChange service: ${error}`)
        throw error
    }
}

const validateNewEmail = async (userId, newEmail) => {
    try {
        const userData = await User.findById(userId)
        if (newEmail === userData.email) {
            return { status: false, message: 'You are already using this email!' }
        }

        const existsUser = await User.findOne({
            email: newEmail,
            _id: { $ne: userId },
        })

        if (existsUser) {
            return { status: false, message: 'This email is already registered. Try another email.' }
        }

        // Logic in controller was: User.findByIdAndUpdate(userId, { email: newEmail }) immediately?
        // Wait, looking at controller `changeEmailValid`:
        // It updates email directly: await User.findByIdAndUpdate(userId, { email: newEmail })
        // Then redirects to userProfile.
        // BUT there are other functions: `verifychangeEmailOtp`, `emailUpdate`?
        // `changeEmailValid` seems to skip OTP if implemented as in controller line 442. 

        // Yet `emailUpdate` (line 496) generates OTP and sends it.
        // And `verifychangeEmailOtp` verifies it.

        // It seems `changeEmailValid` is maybe strictly checking validity and Update? 
        // Or is it a naming confusion in controller?
        // Let's look at `changeEmailValid` in controller (Step 135, line 416). 
        // It checks if email used by others. If not, UPDATES IT.
        // Line 442: await User.findByIdAndUpdate(userId, { email: newEmail })
        // Line 443: res.redirect('/userProfile')

        // This implies NO OTP for this specific route/function.
        // But there is `getPassCheckforEmailchange` -> `passCheckforEmailchange` -> `getNewMail` -> `changeEmailValid`.
        // So this flow just asks for password then updates email directly? That seems insecure/odd if OTP exists elsewhere.

        // But `emailUpdate` function (line 496) does OTP. What route uses `emailUpdate`?
        // `verifychangeEmailOtp` (line 450) verifies it.

        // I will implement `changeEmail` which updates it directly as per `changeEmailValid`.

        await User.findByIdAndUpdate(userId, { email: newEmail })
        return { status: true, redirect: '/userProfile' }

    } catch (error) {
        logger.error(`Error in validateNewEmail service: ${error}`)
        throw error
    }
}

// There is `emailUpdate` in controller logic which sends OTP. 
// Maybe that's another flow? I'll implement `initiateEmailUpdate` for that.
const initiateEmailUpdate = async (newEmail) => {
    try {
        const userExists = await User.findOne({ email: newEmail })
        if (userExists) {
            return { status: false, render: 'newMail', message: 'User Already Exists!' }
        }
        const otp = generateOtp()
        const emailSent = await sendVerificationEmail(newEmail, otp)

        if (emailSent) {
            return { status: true, otp, redirect: '/changeEmailOtp' }
        }
        return { status: false, render: 'newMail', message: 'Something went wrong while otp sent!' }
    } catch (error) {
        logger.error(`Error in initiateEmailUpdate: ${error}`)
        throw error
    }
}

const verifyEmailChangeOtp = async (userId, email, enteredOtp, sessionOtp) => {
    try {
        if (!userId || !email) {
            return { status: false, statusCode: 400, message: 'Session expired or invalid request. Try again.' }
        }

        if (enteredOtp == sessionOtp) {
            await User.findByIdAndUpdate(
                userId,
                { $set: { email } },
                { new: true },
            )
            return { status: true, statusCode: 200, url: '/userProfile' }
        }
        return { status: false, statusCode: 401, message: 'Incorrect OTP. Please try again.' }
    } catch (error) {
        logger.error(`Error in verifyEmailChangeOtp: ${error}`)
        throw error
    }
}

const updatePassword = async (userId, currentPassword, newPassword, confirmPassword) => {
    try {
        const userData = await User.findById(userId)

        if (newPassword !== confirmPassword)
            return { status: false, render: 'changePassword', message: 'password is not match' }

        const checkExistsNewPass = await bcrypt.compare(
            newPassword,
            userData.password,
        )

        if (checkExistsNewPass)
            return { status: false, render: 'changePassword', message: 'New password cannot be same as current password' }

        const isMatch = await bcrypt.compare(currentPassword, userData.password)

        if (!isMatch)
            return { status: false, render: 'changePassword', message: 'Invalid Password' }

        const hashedPass = await securePass(newPassword)
        await User.findByIdAndUpdate(userId, { password: hashedPass })

        return { status: true, redirect: '/userProfile' }
    } catch (error) {
        logger.error(`Error in updatePassword service: ${error}`)
        throw error
    }
}

const editProfile = async (userId, body, file) => {
    try {
        const { username, phone, profileDeleteReq } = body
        let imageUrl

        if (file) {
            imageUrl = await uploadToCloudinary(file.buffer, 'profiles')
        }

        const updateData = { $set: { username, phone } }

        if (imageUrl) {
            updateData.$set.userProfileImage = imageUrl
        }

        if (profileDeleteReq && !imageUrl) {
            updateData.$unset = { userProfileImage: '' }
        }

        const updatedUser = await User.findOneAndUpdate({ _id: userId }, updateData, {
            new: true,
        })

        if (!updatedUser) return { status: false, statusCode: 404, message: 'User not found' }

        return { status: true, statusCode: 200, message: 'Profile updated successfully!' }
    } catch (error) {
        logger.error(`Error in editProfile service: ${error}`)
        throw error
    }
}

export default {
    validateForgotEmail,
    verifyOtp,
    resendOtp,
    resetPassword,
    getUserProfile,
    verifyPasswordForEmailChange,
    validateNewEmail,
    initiateEmailUpdate,
    verifyEmailChangeOtp,
    updatePassword,
    editProfile
}
