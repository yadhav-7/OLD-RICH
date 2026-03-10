import logger from '../../utils/logger.js'
import couponService from '../../services/admin/couponService.js'

const getCouponPage = async (req, res) => {
  try {
    const result = await couponService.getCoupons(req.query)

    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(200).json(result)
    }
    return res.render('couponManagement', result)
  } catch (error) {
    logger.error(`error in getCouponPage ${error}`)
    res.redirect('/pageNotFound')
  }
}

const addCoupons = async (req, res) => {
  try {
    const { formData } = req.body
    const result = await couponService.addOrUpdateCoupon(formData)

    if (!result.status) {
      return res
        .status(result.statusCode)
        .json({ message: result.message, error: result.error })
    }

    res.status(result.statusCode).json({
      message: result.message,
      coupon: result.coupon,
    })
  } catch (error) {
    logger.error(`Error in addCoupons: ${error}`)
    res.status(500).json({
      message: 'Internal Server Error',
      error: error.message,
    })
  }
}

const listUnlistCoupon = async (req, res) => {
  try {
    const { code } = req.query
    const result = await couponService.toggleCouponStatus(code)

    if (!result.status) {
      return res
        .status(result.statusCode)
        .json({ success: false, message: result.message })
    }

    return res.status(result.statusCode).json({
      success: true,
      message: result.message,
      isListed: result.isList,
    })
  } catch (error) {
    logger.error(`Error toggling coupon: ${error}`)
    return res
      .status(500)
      .json({ success: false, message: 'Something went wrong' })
  }
}

const deleteCoupon = async (req, res) => {
  try {
    const { code } = req.query
    const result = await couponService.deleteCoupon(code)

    if (!result.status) {
      return res
        .status(result.statusCode)
        .json({ success: false, message: result.message })
    }

    return res
      .status(result.statusCode)
      .json({ success: true, message: result.message })
  } catch (error) {
    logger.error(`Error deleting coupon: ${error}`)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
}

const editCoupon = async (req, res) => {
  try {
    const { id } = req.query
    const { couponData } = req.body

    const result = await couponService.editCoupon(id, couponData)

    if (!result.status) {
      return res.status(result.statusCode).json({ message: result.message })
    }

    return res
      .status(result.statusCode)
      .json({ message: result.message, updatedCoupon: result.updatedCoupon })
  } catch (error) {
    logger.error(`error in editCoupon ${error}`)
    // Controller didn't handle error explicitly but service throws
    return res.status(500).json({ message: 'Internal Server Error' })
  }
}

export default {
  getCouponPage,
  addCoupons,
  listUnlistCoupon,
  deleteCoupon,
  editCoupon,
}
