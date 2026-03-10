import logger from '../../utils/logger.js'
import orderService from '../../services/user/orderService.js'

const orderDetailPage = async (req, res) => {
  try {
    const userId = req.session.user
    const id = req.query.orderId

    const result = await orderService.getOrderDetailPage(userId, id)
    return res.render(result.render, result.data)
  } catch (error) {
    logger.error(`error in orderDetailPages ${error}`)
    res.redirect('/pageNotFound')
  }
}

const cencellOrder = async (req, res) => {
  try {
    const { orderId } = req.body
    const userId = req.session.user // Ensure userId is available, though maybe not needed if passed from session in logic or if service handles it. Service looks up userWallet from order.userId.

    const result = await orderService.cancelOrder(userId, orderId)

    if (!result.status) {
      return res.status(result.statusCode).json({ message: result.message })
    }

    return res.status(result.statusCode).json({ message: result.message })
  } catch (error) {
    logger.error(`Error in cancelOrder: ${error}`)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

const cancelSingleItem = async (req, res) => {
  try {
    const { orderId, itemId } = req.body

    console.log('req.body', req.body)
    const result = await orderService.cancelSingleItem(orderId, itemId)

    if (!result.status) {
      return res.status(result.statusCode).json({ message: result.message })
    }

    return res.status(result.statusCode).json({
      message: result.message,
      finalAmount: result.finalAmount,
      total: result.total,
    })
  } catch (error) {
    logger.error(`Error in cancelSingleItem: ${error}`)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

const returnReq = async (req, res) => {
  try {
    const { itemId, orderId, reason } = req.body

    const result = await orderService.returnRequest(orderId, itemId, reason)

    if (!result.status) {
      return res.status(result.statusCode).json({ message: result.message })
    }

    res.status(result.statusCode).json({ message: result.message })
  } catch (error) {
    logger.error(`error in returnReq ${error}`)
    res.status(500).json({ message: 'Internal Server Error' })
  }
}

const generateInvoice = async (req, res) => {
  try {
    const { orderId } = req.query
    await orderService.generateInvoiceStream(orderId, res)
  } catch (err) {
    logger.error(err)
    if (!res.headersSent) {
      res.status(500).json({
        message: 'Invoice generation failed',
        error: err.message,
      })
    }
  }
}

export default {
  orderDetailPage,
  cencellOrder,
  cancelSingleItem,
  returnReq,
  generateInvoice,
}
