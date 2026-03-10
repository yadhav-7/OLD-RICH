import productService from '../../services/user/productService.js'
import logger from '../../utils/logger.js'

const productDetails = async (req, res) => {
  try {
    const userId = req.session.user
    const { productId } = req.query
    const priceOftheProduct = req.query.slcPrice

    const result = await productService.getProductDetails(
      userId,
      productId,
      priceOftheProduct
    )

    res.render('product-details', result)
  } catch (error) {
    logger.error(`Error from productDetails: ${error}`)
    return res.redirect('/pageNotFound')
  }
}
export default {
  productDetails,
}
