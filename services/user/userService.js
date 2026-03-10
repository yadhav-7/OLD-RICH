import Product from "../../models/productSchema.js";
import Cart from "../../models/cartSchema.js";
import User from "../../models/userSchema.js";
import Wishlist from "../../models/wishlistSchema.js";
import Wallet from "../../models/walletSchema.js";
import Catagory from "../../models/catagory.js";
import logger from "../../utils/logger.js";
import generateOtp from "../../utils/otpUtils.js";
import sendVerificationEmail from "../emailService.js";
import { securePassword } from "../../utils/passwordUtil.js";
import bcrypt from "bcrypt";
const loadHomePage = async (user) => {
    try {
        const userData = await User.findOne({ _id: user })
        if (
            userData &&
            userData?.refferalCodeApplied === 'canUse' &&
            userData?.refferalCodeApplied !== 'used'
        ) {
            userData.refferalCodeApplied = 'notUsed'
            await userData.save()
        }

        const categoryData = await Catagory.find({ isListed: true }).sort({
            createdOn: 1,
        })
        let productData = await Product.find({
            isBlocked: false,
            category: { $in: categoryData.map((category) => category._id) },
        })

        productData.sort((a, b) => new Date(b.createdOn) - new Date(a.createdOn))

        if (productData.length > 3) productData = productData.slice(0, 4)

        if (user && !userData.isBlock) {
            const cart = await Cart.findOne({ userId: user })

            return {
                user: userData,
                products: productData,
                length: cart?.items?.length,
            }
        } else {
            return { products: productData }
        }
    } catch (error) {
        logger.error(`error in loadHomePage serive ${error}`)
        throw new Error(error)
    }
}

const checkUserBlock = async (userId) => {
    try {

        if (!userId) {
            return { statusCode: 404, status: false, message: 'User not found' }
        }

        const findUser = await User.findById(userId)

        if (!findUser) {
            return { statusCode: 404, status: false, message: 'User not found' }
        }


        return findUser
    } catch (error) {
        logger.error(`error in checkUserBlock service ${error}`)
        throw new Error(error)
    }
}

const register = async (body) => {
    try {

        logger.info(`jldldjldldjldldjldjldjldjldjld`)

        logger.info(`process.env.NODEMAILER_EMAIL`, process.env.NODEMAILER_EMAIL)


        logger.info(`process.env.NODEMAILER_PASSWORD`, process.env.NODEMAILER_PASSWORD)

        const { username, email, phone, password, cpassword } = body
        const findUser = await User.findOne({ email })
        if (findUser) return { findUser: true }

        const otp = generateOtp()
        logger.info(`Generated OTP: ${otp}`)

        const emailSent = await sendVerificationEmail(email, otp)
        if (!emailSent) return { emailSent: false }

        return { success: true, otp }
    } catch (error) {
        logger.error(`error in register Service ${error}`)
        throw new Error(error)
    }
}

const registerOTP = async (email) => {
    try {
        if (!email) return { email: false }

        const findUser = await User.findOne({ email })
        if (findUser) return { findUser: true }

        const otp = generateOtp()
        const emailSent = await sendVerificationEmail(email, otp)
        if (!emailSent) return { emailSent: false }

        logger.info(`New OTP sent: ${otp}`)
        return { success: true, otp }

    } catch (error) {
        logger.error(`error in registerOTP service ${error}`)
        throw new Error(error)
    }
}

async function verifyOtp(body, userData, userOTP) {
    try {
        const { otp } = body

        if (!otp.trim()) {

            return { statusCode: 400, success: false, message: 'Enter OTP for verification' }
        }

        if (otp === userOTP) {

            const user = userData

            const findUser = await User.findOne({ email: user.email })


            if (findUser) {

                return {
                    statusCode: 400,
                    success: false,
                    message: 'User with this email already exists',
                }
            }

            const genarateRefferalCode = () => {

                return Math.floor(100000 + Math.random() * 900000).toString()
            }

            const refferalCode = genarateRefferalCode()

            const passwordHash = await securePassword(user.password)

            const saveUserData = new User({
                username: user.username,
                email: user.email,
                phone: user.phone,
                password: passwordHash,
                referralCode: refferalCode,
            })


            await saveUserData.save()

            const wallet = new Wallet({
                userId: saveUserData._id,
            })


            await wallet.save()

            return { statusCode: 200, success: true, redirectUrl: '/refferalCodeEnter', userData: saveUserData }
        }

        return { statusCode: 400, success: false, message: 'Invalid OTP. Please try again.' }
    } catch (error) {
        logger.error(`error in verify otp service ${error}`)
        throw new Error(error);

    }
}

const reSendOtp = async (userData) => {
    try {
        const { email } = userData
        if (!email) {
            return { statusCode: 400, success: false, message: 'Email not found in session' }
        }
        const otp = generateOtp()

        const emailSend = await sendVerificationEmail(email, otp)
        if (emailSend) {
            logger.info(`resend otp ${otp}`)
            return {
                statusCode: 200,
                success: true,
                message: 'otp resend successfully',
                otp
            }
        } else {
            return {
                statusCode: 500,
                success: false,
                message: 'Failed to resend OTP Please try agian',
                otp
            }
        }
    } catch (error) {
        logger.error(`error in reSendOtp service ${error}`)
        throw new Error(error)

    }
}

const login = async (body) => {
    try {
        const { email, password } = body
        const findUser = await User.findOne({ isAdmin: 0, email })

        if (!findUser) {
            return { statusCode: 400, status: false, message: 'User not found' }
        }

        if (findUser.isBlock) {
            return { statusCode: 400, status: false, message: 'User is blocked by admin' }
        }

        const passwordMatch = await bcrypt.compare(password, findUser.password)

        if (!passwordMatch) {
            return { statusCode: 400, status: false, message: 'Invalid Information' }
        }

        return { statusCode: 200, status: true, message: 'Login successfull', userData: findUser }

    } catch (error) {
        logger.error(`error in login service ${error}`)
        throw new Error(error);

    }
}

const getUserData = async (userId) => {
    try {
        if (!userId) return null
        return await User.findOne({ _id: userId })
    } catch (error) {
        logger.error(`Error in getUserData service: ${error}`)
        throw error
    }
}

const loadShopingPage = async (userId, queryParams, isFetch) => {
    try {
        const page = parseInt(queryParams.page, 10) || 1
        const query = queryParams.query || ''
        const { sort, priceFilter, category: categoryParam } = queryParams
        const limit = 8

        const user = userId

        let wishListArray = []
        if (user) {
            const wishList = await Wishlist.findOne({ userId: user })
            wishListArray = wishList?.products ?? []
        }

        let userData = null
        if (user) {
            userData = await User.findOne({ _id: user, isBlock: false })
        }

        const categories = await Catagory.find({ isListed: true })
        const allCategoryIds = categories.map((cat) => cat._id.toString())

        let categoryIds
        if (categoryParam) {
            const selectedIds = categoryParam.split(',')
            categoryIds = selectedIds.filter((id) => allCategoryIds.includes(id))
        } else {
            categoryIds = allCategoryIds
        }

        const filter = {
            isBlocked: false,
            category: { $in: categoryIds },
            productName: { $regex: query, $options: 'i' },
        }

        if (priceFilter) {
            const ranges = Array.isArray(priceFilter)
                ? priceFilter
                : priceFilter.split(',')
            const validRanges = ranges
                .map((range) => {
                    const [min, max] = range.split('-').map(Number)
                    if (!Number.isNaN(min) && !Number.isNaN(max)) {
                        return { 'variants.salePrice': { $gte: min, $lte: max } }
                    }
                    return null
                })
                .filter(Boolean)
            if (validRanges.length > 0) {
                filter.$or = validRanges
            }
        }

        let sortOption = {}
        if (sort) {
            switch (sort) {
                case 'priceLowHigh':
                    sortOption = { 'variants.0.salePrice': 1 }
                    break
                case 'priceHighLow':
                    sortOption = { 'variants.0.salePrice': -1 }
                    break
                case 'nameAZ':
                    sortOption = { productName: 1 }
                    break
                case 'nameZA':
                    sortOption = { productName: -1 }
                    break
                default:
                    sortOption = { createdAt: -1 }
            }
        } else {
            sortOption = { createdAt: -1 }
        }

        const skip = (page - 1) * limit
        const products = await Product.find(filter)
            .sort(sortOption)
            .skip(skip)
            .limit(limit)
            .lean()

        const totalProducts = await Product.countDocuments(filter)
        const totalPages = Math.ceil(totalProducts / limit)

        const categorieWithIds = categories.map((c) => ({ _id: c._id, name: c.name }))

        let cartLength = 0
        if (user) {
            const cart = await Cart.findOne({ userId: user })
            cartLength = cart?.items?.length || 0
        }

        const responseData = {
            user: userData,
            category: categorieWithIds,
            totalProducts,
            currentPage: page,
            totalPages,
            query,
            length: cartLength,
            wishListArray,
            selectedCategories: [],
            selectedPriceFilters: [],
            sortBy: [],
        }

        const transformedProducts = products.map((product) => {
            const variants = Array.isArray(product.variants) ? product.variants : []
            let displayVariant = {
                salePrice: 0,
                regularPrice: 0,
                size: '',
                quantity: 0,
            }
            if (variants.length > 0) {
                displayVariant = { ...variants[0] }
            }
            if (priceFilter && variants.length > 0) {
                const ranges = Array.isArray(priceFilter) ? priceFilter : [priceFilter]
                for (const range of ranges) {
                    const [min, max] = range.split('-').map(Number)
                    const matchingVariant = variants.find(
                        (v) => v && v.salePrice && v.salePrice >= min && v.salePrice <= max,
                    )
                    if (matchingVariant) {
                        displayVariant = { ...matchingVariant }
                        break
                    }
                }
            }
            return { ...product, displayVariant }
        })

        if (isFetch) {
            responseData.products = transformedProducts
            return { isFetch: true, data: responseData }
        }

        responseData.products = transformedProducts
        responseData.sort = sort || ''
        return { isFetch: false, data: responseData }

    } catch (error) {
        logger.error(`error in loadShopingPage service ${error}`)
        throw new Error(error)
    }
}

const userService = {
    loadHomePage,
    checkUserBlock,
    register,
    registerOTP,
    reSendOtp,
    loadShopingPage,
    getUserData,
    login,
    verifyOtp
};

export default userService;