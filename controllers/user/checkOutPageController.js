/* eslint-disable camelcase, no-restricted-syntax, no-await-in-loop, no-plusplus, no-unused-vars */
import logger from '../../utils/logger.js'
import checkoutService from '../../services/user/checkoutService.js'

const checkoutpage = async (req, res) => {
  try {

    const cartItemIdsFromClient = req.body.items

    const userId = req.session.user

    const result = await checkoutService.validateCheckoutItems(
      userId,
      cartItemIdsFromClient
    )

    if (!result.status) {
      return res.status(result.statusCode).json({
        success: false,
        message: result.message,
        issues: result.issues,
        detailedIssues: result.detailedIssues,
      })
    }

    return res.status(result.statusCode).json({
      success: true,
      message: result.message,
      validItems: result.validItems,
    })
  } catch (error) {
    logger.error(` Error in checkoutpage: ${error}`)
    return res.status(500).json({
      success: false,
      message: 'An error occurred during checkout. Please try again later.',
    })
  }
}

const getCheckoutpage = async (req, res) => {
  try {
    const userId = req.session.user
    const itemIds = req.query.item
    const { orderId } = req.query

    const result = await checkoutService.getCheckoutPageData(
      userId,
      itemIds,
      orderId
    )

    if (!result.status) {
      if (result.redirectUrl) return res.redirect(result.redirectUrl)
      return res.redirect('/pageNotFound')
    }

    return res.render(result.render, result.data)
  } catch (error) {
    logger.error(`error in getCheckOutPage ${error}`)
    res.redirect('/pageNotFound')
  }
}

const procedToCheckOut = async (req, res) => {
  try {
    logger.info('start proced to checkout')
    const userId = req.session.user
    const orderData = req.body

    const result = await checkoutService.placeOrder(userId, orderData)

    if (!result.status) {
      return res.status(result.statusCode).json({ message: result.message })
    }

    return res.status(result.statusCode).json({
      success: true,
      message: result.message,
      orderId: result.orderId,
    })
  } catch (error) {
    logger.error(`Error in procedToCheckOut: ${error}`)
    res
      .status(501)
      .json({ message: 'Something went wrong. Please try again later.' })
  }
}

const applyCoupon = async (req, res) => {
  try {
    const userId = req.session.user
    const { code } = req.body

    const result = await checkoutService.applyCoupon(userId, code)

    if (!result.status) {
      return res.status(result.statusCode).json({ message: result.message })
    }

    let { savings } = req.body
    const amount = savings.slice(1)
    savings = parseInt(amount, 10) + result.couponDiscount

    res.status(result.statusCode).json({
      message: 'coupon applied successfull',
      totalCart: result.totalCart,
      savings,
      couponDiscount: result.couponDiscount,
    })
  } catch (error) {
    logger.error(`error in apply coupon ${error}`)
    return res.status(500).json({ message: 'internal server error' })
  }
}

const createRazorpayOrder = async (req, res) => {
  try {
    const userId = req.session.user
    const orderData = req.body

    const result = await checkoutService.createRazorpayOrder(userId, orderData)

    if (!result.status) {
      return res.status(result.statusCode).json({ message: result.message })
    }

    return res.status(result.statusCode).json({
      success: true,
      key: result.key,
      orderId: result.orderId,
      amount: result.amount,
      currency: result.currency,
      products: result.products,
      address: result.address,
      couponApplied: result.couponApplied,
    })
  } catch (error) {
    logger.error(`Error in createRazorpayOrder: ${error}`)
    res.status(500).json({ message: 'Something went wrong' })
  }
}

const verifyRazorpayPayment = async (req, res) => {
  try {
    const result = await checkoutService.verifyRazorpayPayment(req.body)

    if (!result.status) {
      return res
        .status(result.statusCode)
        .json({ success: false, message: result.message })
    }

    return res.status(result.statusCode).json({
      success: true,
      message: result.message,
      orderId: result.orderId,
    })
  } catch (error) {
    logger.error(`Error verifying payment: ${error}`)
    res.status(500).json({ message: 'Payment verification failed' })
  }
}

const paymentFaild = async (req, res) => {
  try {
    const { razorPayOrderId, orderId } = req.query
    const userId = req.session.user
    const id = razorPayOrderId || orderId

    const result = await checkoutService.handlePaymentFailure(id)

    if (!result.status) {
      return res.redirect('/pageNotFound')
    }

    return res.render('retryPayment', {
      order: result.order,
      userId,
    })
  } catch (error) {
    logger.error(`Error in paymentFaild: ${error}`)
    res.redirect('/pageNotFound')
  }
}

const paymentFaildRetry = async (req, res) => {
  try {
    const { orderId } = req.query
    const userId = req.session.user

    const result = await checkoutService.handlePaymentFailure(orderId)

    if (!result.status) {
      return res.redirect('/pageNotFound')
    }

    return res.render('retryPayment', {
      order: result.order,
      userId,
    })
  } catch (error) {
    logger.error(`Error in paymentFaildRetry: ${error}`)
    res.redirect('/pageNotFound')
  }
}

const reCreateOrder = async (req, res) => {
  try {
    const userId = req.session.user
    const { orderId } = req.body

    const result = await checkoutService.reCreateRazorpayOrder(userId, orderId)

    if (!result.status) {
      return res.status(result.statusCode).json({ message: result.message })
    }

    return res.status(result.statusCode).json({
      success: true,
      key: result.key,
      orderId: result.orderId,
      amount: result.amount,
      currency: result.currency,
    })
  } catch (error) {
    logger.error(`Error in reCreateOrder: ${error}`)
    res.status(500).json({ message: 'Something went wrong' })
  }
}

const orderSuccess = async (req, res) => {
  try {
    const { orderId } = req.query
    const userId = req.session.user

    if (!orderId) {
      return res.redirect('/cart')
    }

    const order = await checkoutService.orderSuccess(orderId)

    return res.render('orderSuccessPage', {
      order
    })
  } catch (error) {
    logger.error(`Error in orderSuccess: ${error}`)
    res.redirect('/pageNotFound')
  }
}

export default {
  checkoutpage,
  getCheckoutpage,
  procedToCheckOut,
  applyCoupon,
  createRazorpayOrder,
  verifyRazorpayPayment,
  paymentFaild,
  paymentFaildRetry,
  reCreateOrder,
  orderSuccess,
}
