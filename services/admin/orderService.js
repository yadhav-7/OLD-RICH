import Order from '../../models/orderSchema.js'
import Product from '../../models/productSchema.js'
import Wallet from '../../models/walletSchema.js'
import logger from '../../utils/logger.js'

const getOrders = async (queryParams) => {
    try {
        const page = queryParams.page || 1
        const limit = 6
        const skip = (page - 1) * limit

        const order = await Order.find()
            .sort({ createdOn: -1 })
            .skip(skip)
            .limit(limit)
            .populate('userId', 'username')

        const totalOrder = await Order.countDocuments()
        const totalPage = Math.ceil(totalOrder / limit)

        return {
            order,
            currentPage: page,
            totalPage
        }
    } catch (error) {
        logger.error(`Error in getOrders service: ${error}`)
        throw error
    }
}

const searchOrders = async (queryParams) => {
    try {
        const search = queryParams.searchvalue || ''
        const page = queryParams.page || 1
        const limit = 6
        const skip = (page - 1) * limit

        const searchData = await Order.find({
            $or: [
                { orderId: { $regex: search, $options: 'i' } },
                { status: { $regex: search, $options: 'i' } },
                { 'address.name': { $exists: true, $regex: search, $options: 'i' } },
            ],
        })
            .populate('userId', 'username')
            .lean()

        const totalOrder = await Order.countDocuments({
            $or: [
                { orderId: { $regex: search, $options: 'i' } },
                { status: { $regex: search, $options: 'i' } },
                { 'address.name': { $exists: true, $regex: search, $options: 'i' } },
            ],
        })

        const totalPage = Math.ceil(totalOrder / limit)

        return {
            searchData,
            totalPage,
            currentPage: page
        }
    } catch (error) {
        logger.error(`Error in searchOrders service: ${error}`)
        throw error
    }
}

const changeOrderStatus = async (orderId, newStatus) => {
    try {
        if (!orderId || !newStatus) return { status: false, statusCode: 400, message: 'Order ID and new status are required.' }

        const allowedStatuses = [
            'Pending',
            'Processing',
            'Shipped',
            'Delivered',
            'cancelled',
            'returnRequested',
            'returned',
            'reutrnRejected',
        ]
        if (!allowedStatuses.includes(newStatus)) {
            return { status: false, statusCode: 400, message: 'Invalid status value.' }
        }

        const order = await Order.findOne({ orderId })

        if (!order) {
            return { status: false, statusCode: 404, message: 'Order not found.' }
        }

        if (
            order.status === 'Delivered' ||
            order.status === 'returned' ||
            order.status === 'cancelled'
        ) {
            return {
                status: false,
                statusCode: 400,
                message: 'Cannot change status from Delivered to another status except return.',
            }
        }

        order.status = newStatus
        if (newStatus === 'Delivered') order.paymentStatus = 'Completed'

        const { orderedItems } = order
        for (const item of orderedItems) {
            if (item.status === 'cancelled') continue
            item.status = newStatus
        }

        if (newStatus === 'Shipped' || newStatus === 'Delivered') {
            order.invoiceDate = new Date()
        }

        await order.save()

        return {
            status: true,
            statusCode: 200,
            message: 'Order status updated successfully',
            updatedStatus: order.status,
        }
    } catch (error) {
        logger.error(`Error in changeOrderStatus service: ${error}`)
        throw error
    }
}

const getOrderDetails = async (orderId) => {
    try {
        const order = await Order.findOne({ orderId }).populate({
            path: 'orderedItems.product',
            select: 'productImage productName variants',
        })
        return order
    } catch (error) {
        logger.error(`Error in getOrderDetails service: ${error}`)
        throw error
    }
}

const handleReturnRequest = async (body) => {
    try {
        const { itemId, orderId, newStatus } = body
        const order = await Order.findOne({ orderId })

        if (!order) return { status: false, statusCode: 404, message: 'order not found' }
        if (order.status === 'cancelled')
            return { status: false, statusCode: 500, message: 'cannot return cancelled order!' }

        let orderedItems
        const promises = []
        let reFund = 0
        const productIds = []
        let productQuantity = 0
        let newTransactionRefund = 0
        let isReject = false

        if (itemId) {
            if (newStatus === 'returnRejected') {
                orderedItems = order.orderedItems.map((i) => {
                    if (
                        i._id.toString() === itemId &&
                        i.status !== 'cancelled' &&
                        i.status !== 'returned'
                    ) {
                        i.status = 'reutrnRejected'
                        isReject = true
                    }
                    return i
                })
            } else if (newStatus === 'returned') {
                orderedItems = order.orderedItems.map((i) => {
                    if (
                        i._id.toString() === itemId &&
                        i.status !== 'cancelled' &&
                        i.status !== 'returned'
                    ) {
                        i.status = 'returned'
                        promises.push(incProductQuntity(i.product, i.size, i.quantity))
                        i.reFund = i.quantity * i.finalPrice
                        i.reFundStatus = 'Completed'
                        reFund += i.quantity * i.finalPrice
                        newTransactionRefund += reFund
                        productIds.push(i.product)
                        productQuantity++
                    }
                    return i
                })
            }
        } else if (newStatus === 'reutrnRejected') {
            order.status = 'reutrnRejected'
            orderedItems = order.orderedItems.map((i) => {
                if (i.status !== 'cancelled' || i.status === 'returned') {
                    i.status = 'reutrnRejected'
                    isReject = true
                }
                return i
            })
        } else if (newStatus === 'returned') {
            order.status = 'returned'
            order.reFundStatus = 'Completed'
            orderedItems = order.orderedItems.map((i) => {
                if (
                    (i.status !== 'cancelled' || i.status === 'returned') &&
                    i.reFundStatus !== 'Completed'
                ) {
                    newTransactionRefund += i.quantity * i.finalPrice
                    i.reFund = i.quantity * i.finalPrice
                    i.reFundStatus = 'Completed'
                    i.status = 'returned'
                    reFund += i.quantity * i.finalPrice
                    order.reFund += i.quantity * i.finalPrice
                    productIds.push(i.product)
                    productQuantity++
                    promises.push(incProductQuntity(i.product, i.size, i.quantity))
                } else if (i.reFund > 0) {
                    reFund += i.reFund
                    order.reFund += i.quantity * i.finalPrice
                }
                return i
            })
        }

        await Promise.all(promises)

        order.orderedItems = orderedItems

        const checkTotalReturn = orderedItems.every((i) => i.status === 'returned')
        if (checkTotalReturn) order.status = 'returned'

        const checkTotalReject = orderedItems.every(
            (i) => i.status === 'reutrnRejected',
        )
        if (checkTotalReject) {
            order.status = 'reutrnRejected'
        }

        await order.save()

        if (!isReject) {
            const userWallet = await Wallet.findOne({ userId: order.userId })
            userWallet.balance += newTransactionRefund
            userWallet.totalCredited += newTransactionRefund
            const transaction = {
                type: 'credit',
                amount: newTransactionRefund,
                reason: 'Amount credited for returned product',
                orderId: order.orderId,
                productId: productIds,
                productQuantity,
                createdAt: new Date(),
            }

            userWallet.transactions?.push(transaction)
            if (order.paymentStatus === 'Completed') await userWallet.save()
        } else if (isReject) {
            return { status: true, statusCode: 200, message: 'order return rejection is successfull' }
        }

        return { status: true, statusCode: 200, message: 'order returned successfully' }
    } catch (error) {
        logger.error(`Error in handleReturnRequest service: ${error}`)
        throw error
    }
}

async function incProductQuntity(productId, size, quantity) {
    const product = await Product.findOne({ _id: productId })
    if (!product) return
    const variant = product.variants?.find((v) => v.size === size)
    if (variant) {
        variant.quantity += quantity
        await product.save()
    }
}

export default {
    getOrders,
    searchOrders,
    changeOrderStatus,
    getOrderDetails,
    handleReturnRequest
}
