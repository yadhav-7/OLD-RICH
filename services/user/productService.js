import Product from '../../models/productSchema.js'
import Cart from '../../models/cartSchema.js'
import User from '../../models/userSchema.js'
import logger from '../../utils/logger.js'

const getProductDetails = async (userId, productId, selectedPrice) => {
    try {
        const userData = await User.findOne({ _id: userId })
        const product = await Product.findById(productId).populate('category')

        const relatedProducts = await Product.find({
            category: product.category._id,
            _id: { $ne: product._id },
        })

        let cartLength = 0
        if (userId) {
            const cart = await Cart.findOne({ userId })
            if (cart && cart.items) {
                cartLength = cart.items.length
            }
        }

        let selectedVariantIndex = 0

        if (selectedPrice && Number(selectedPrice) !== 0 && product.variants?.length) {
            const foundIndex = product.variants.findIndex((variant) => {
                if (!variant || variant.salePrice === undefined) {
                    return false
                }
                return Number(variant.salePrice) === Number(selectedPrice)
            })
            if (foundIndex !== -1) selectedVariantIndex = foundIndex
        }

        const category = product.category
        const categoryOffer = category.categoryOffer || 0
        const productOffer = product.productOffer || 0
        const totalOffer = categoryOffer + productOffer

        return {
            user: userData,
            product,
            quantity: product.quantity,
            totalOffer,
            category,
            selectedVariantIndex,
            length: cartLength,
            relatedProducts,
        }
    } catch (error) {
        logger.error(`Error in getProductDetails service: ${error}`)
        throw error
    }
}

export default {
    getProductDetails,
}
