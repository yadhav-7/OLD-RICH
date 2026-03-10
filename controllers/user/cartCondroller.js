import logger from '../../utils/logger.js'
import Cart from '../../models/cartSchema.js'
import Product from '../../models/productSchema.js'
import WishList from '../../models/wishlistSchema.js'
import cartService from '../../services/user/cartService.js'

const getCart = async (req, res) => {
  try {
    const cart = await cartService.getCart(req.session.user)
    return res.render('cart', {
      user: cart?.userData,
      userCart: cart?.userCart?.items || [],
      subTotal: cart?.userCart?.total || 0,
      length: cart?.userCart?.items?.length || 0,
    })
  } catch (error) {
    logger.error(`Error in getCart: ${error.stack || error.message}`)
    return res.redirect('/pageNotFound')
  }
}

const addProductToCart = async (req, res) => {
  try {
    const { productId, selectedSize } = req.query
    const userId = req.session.user

    if (!productId || !userId || !selectedSize) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    const result = await cartService.addProduct(
      userId,
      productId,
      selectedSize
    )

    if (!result.status) {
      return res.status(result.statusCode).json({ message: result.message })
    }

    return res
      .status(result.statusCode)
      .json({
        message: result.message,
        cart: result.cart,
        exists: result.exists,
        success: true,
      })
  } catch (error) {
    logger.error(`Cart Error: ${error}`)
    return res.status(500).json({ message: 'Server error' })
  }
}

const removeProductFromCart = async (req, res) => {
  try {
    const itemId = req.query.indexId
    const userId = req.session.user

    const result = await cartService.removeProduct(userId, itemId)

    if (!result.status) {
      return res
        .status(result.statusCode)
        .json({ success: false, message: result.message })
    }

    return res
      .status(result.statusCode)
      .json({
        success: true,
        message: result.message,
        cart: result.cart,
      })
  } catch (error) {
    logger.error(`Error removing product from cart: ${error}`)
    return res
      .status(500)
      .json({ success: false, message: 'Internal Server Error' })
  }
}

const decreaseCartItems = async (req, res) => {
  try {
    const userId = req.session.user
    const productId = req.query.item

    logger.info(`productId ${productId}`)

    const result = await cartService.decreaseQuantity(userId, productId)

    if (!result.status) {
      return res
        .status(result.statusCode)
        .json({ success: false, message: result.message })
    }

    res.status(result.statusCode).json({
      success: true,
      message: result.message,
      quantity: result.quantity,
      itemTotal: result.itemTotal,
      cartTotal: result.cartTotal,
    })
  } catch (error) {
    logger.error(`Error decreasing item: ${error}`)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

const increaseCartItems = async (req, res) => {
  try {
    const userId = req.session.user
    const itemId = req.query.item

    const result = await cartService.increaseQuantity(userId, itemId)

    if (!result.status) {
      return res
        .status(result.statusCode)
        .json({ success: false, message: result.message })
    }

    res.status(result.statusCode).json({
      success: true,
      message: result.message,
      quantity: result.quantity,
      itemTotal: result.itemTotal,
      cartTotal: result.cartTotal,
    })
  } catch (error) {
    logger.error(`Error increasing item: ${error}`)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

export default {
  getCart,
  addProductToCart,
  removeProductFromCart,
  decreaseCartItems,
  increaseCartItems,
}
