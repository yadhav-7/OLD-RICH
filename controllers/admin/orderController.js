/* eslint-disable no-restricted-syntax, no-use-before-define, no-plusplus, no-continue, no-await-in-loop, no-unused-vars */
import logger from '../../utils/logger.js'
import orderService from '../../services/admin/orderService.js'

const getOrderPage = async (req, res) => {
  try {
    const result = await orderService.getOrders(req.query)

    if (req.headers['x-requested-by'] === 'frontend-fetch') {
      return res.status(200).json(result)
    }
    return res.render('ordermanage', result)
  } catch (error) {
    logger.error(`error in getOrderPage ${error}`)
    // Should render error page or something
  }
}

const searchOrders = async (req, res) => {
  try {
    const result = await orderService.searchOrders(req.query)
    logger.info(`searchData ${result.searchData}`)
    return res.json(result)
  } catch (error) {
    logger.error(error)
    res.status(500).json({ message: 'Server error while searching orders' })
  }
}

const changeStatus = async (req, res) => {
  try {
    const { orderId, newStatus } = req.body

    const result = await orderService.changeOrderStatus(orderId, newStatus)

    if (!result.status) {
      return res
        .status(result.statusCode)
        .json({ message: result.message })
    }

    res.status(result.statusCode).json({
      message: result.message,
      updatedStatus: result.updatedStatus,
    })
  } catch (error) {
    logger.error(`Error in changeStatus: ${error}`)
    res
      .status(500)
      .json({ message: 'Server error while updating order status.' })
  }
}

const ordereDetails = async (req, res) => {
  try {
    const { orderId } = req.query
    const order = await orderService.getOrderDetails(orderId)

    if (!order) return res.redirect('/pageNotFound')
    return res.render('orderDetailPage', { order })
  } catch (error) {
    logger.error(`error in orderDetails ${error}`)
    res.redirect('/pageNotFound')
  }
}

const handleReturnReq = async (req, res) => {
  try {
    const result = await orderService.handleReturnRequest(req.body)

    if (!result.status) {
      return res.status(result.statusCode).json({ message: result.message })
    }

    return res.status(result.statusCode).json({ message: result.message })
  } catch (error) {
    logger.error(`error in handleReturnReq ${error}`)
    res.status(401).json({ message: 'Internal Server Issue' })
  }
}

export default {
  getOrderPage,
  changeStatus,
  ordereDetails,
  handleReturnReq,
  searchOrders,
}
