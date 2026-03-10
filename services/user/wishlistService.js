import LinkWishlist from '../../models/wishlistSchema.js'
import User from '../../models/userSchema.js'
import Cart from '../../models/cartSchema.js'
import Product from '../../models/productSchema.js'
import mongoose from 'mongoose'
import logger from '../../utils/logger.js'

const getWishList = async (userId) => {
    try {
        const cart = await Cart.findOne({ userId })
        const userData = await User.findById(userId)

        let wishList = await LinkWishlist.findOne({ userId: new mongoose.Types.ObjectId(userId) })
            .populate({
                path: 'products.productId',
                select: 'productName productImage description variants status', // keep it lean
            })
            .lean()

        let cartLength = 0
        if (cart && cart.items) {
            cartLength = cart.items.length
        }

        if (wishList) {
            wishList.products?.sort((a, b) => b.addedOn - a.addedOn)
        } else {
            wishList = { products: [] }
        }

        return {
            status: true,
            statusCode: 200,
            wishList,
            cartLength,
            userData
        }
    } catch (error) {
        logger.error(`Error in getWishList service: ${error}`)
        throw error
    }
}

const addToWishlist = async (userId, productId) => {
    try {
        // Validate productId
        if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
            return { status: false, statusCode: 400, message: 'Valid product ID is required' }
        }

        // Convert to ObjectId
        const productObjectId = new mongoose.Types.ObjectId(productId)

        // Verify product exists
        const productExists = await Product.exists({ _id: productObjectId })
        if (!productExists) {
            return { status: false, statusCode: 404, message: 'Product not found' }
        }

        // Convert userId to ObjectId
        const userObjectId = new mongoose.Types.ObjectId(userId)

        const checkWishExists = await LinkWishlist.findOne({
            userId: userObjectId,
            'products.productId': productObjectId,
        })

        if (checkWishExists)
            return { status: false, statusCode: 400, message: 'Product is already exists in wishlist!' }

        // Find or create wishlist
        const wishlist = await LinkWishlist.findOneAndUpdate(
            { userId: userObjectId },
            {
                $addToSet: {
                    products: {
                        productId: productObjectId,
                        addedOn: new Date(),
                    },
                },
            },
            { upsert: true, new: true },
        )

        return {
            status: true,
            statusCode: 200,
            message: 'Product added to wishlist',
            wishlist
        }
    } catch (error) {
        logger.error(`Error in addToWishlist service: ${error}`)
        throw error
    }
}

const removeProduct = async (userId, productId) => {
    try {
        const remove = await LinkWishlist.updateOne(
            { userId: new mongoose.Types.ObjectId(userId) },
            { $pull: { products: { productId: new mongoose.Types.ObjectId(productId) } } }
        )
        if (!remove) return { status: false, statusCode: 400, message: 'try again!' }

        return { status: true, statusCode: 200, message: 'successfully removed' }
    } catch (error) {
        logger.error(`Error in removeProduct service: ${error}`)
        throw error
    }
}

export default {
    getWishList,
    addToWishlist,
    removeProduct
}
