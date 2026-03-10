import logger from '../../utils/logger.js'
import wishlistService from '../../services/user/wishlistService.js'

const getWishList = async (req, res) => {
  try {
    const userId = req.session.user
    if (!userId) return res.redirect('/login')

    const result = await wishlistService.getWishList(userId)

    return res.render('wishlist', {
      wishList: result.wishList,
      length: result.cartLength,
      user: result.userData,
    })
  } catch (error) {
    logger.error(`error in getWishList ${error}`)
    res.redirect('/pageNotFound')
  }
}

const addToWishlist = async (req, res) => {
  try {
    const userId = req.session.user
    const productId = req.query.productId?.trim()

    // Validate user
    if (!userId) {
      return res.status(401).json({ message: 'Please log in to continue' })
    }

    const result = await wishlistService.addToWishlist(userId, productId)

    if (!result.status) {
      return res.status(result.statusCode).json({ message: result.message })
    }

    return res.status(result.statusCode).json({
      message: result.message,
      wishlist: result.wishlist,
    })
  } catch (error) {
    logger.error(`Error adding to wishlist: ${error}`)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

const removeProduct = async (req, res) => {
  try {
    const { productId } = req.query
    const userId = req.session.user

    logger.info(`productId ${productId}`)

    const result = await wishlistService.removeProduct(userId, productId)

    if (!result.status) {
      return res.status(result.statusCode).json({ message: result.message })
    }

    res.status(result.statusCode).json({ message: result.message })
  } catch (error) {
    logger.error(`error in removeProduct ${error}`)
    res.status(500).json({ message: 'Internal Server Error' })
  }
}
export default {
  getWishList,
  addToWishlist,
  removeProduct,
}
