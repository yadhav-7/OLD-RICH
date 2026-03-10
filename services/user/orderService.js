import Order from '../../models/orderSchema.js'
import mongoose from 'mongoose'
import User from '../../models/userSchema.js'
import Product from '../../models/productSchema.js'
import Cart from '../../models/cartSchema.js'
import Wallet from '../../models/walletSchema.js'
import logger from '../../utils/logger.js'
import PDFDocument from 'pdfkit'

const getOrderDetailPage = async (userId, orderId) => {
    try {
        const user = await User.findOne({ _id: userId, isBlock: false })
        const order = await Order.findOne({ orderId }).populate('orderedItems.product')
        const cart = await Cart.findOne({ userId })
        const length = cart?.items?.length || 0

        return {
            status: true,
            render: 'orderDetailPages',
            data: { order, user, length, couponApplied: order.couponApplied }
        }
    } catch (error) {
        logger.error(`Error in getOrderDetailPage service: ${error}`)
        throw error
    }
}

const cancelOrder = async (userId, orderId) => {
    try {
        let refund = 0
        const productIds = []
        let productQuantity = 0
        let newTransactionRefund = 0

        const order = await Order.findOne({ orderId })
        if (!order) return { status: false, statusCode: 400, message: 'Order not found' }

        const alreadyCancelled = []

        /* eslint-disable no-restricted-syntax */
        for (const item of order.orderedItems) {
            if (item.status !== 'Delivered' && item.status !== 'cancelled') {
                if (order.paymentStatus === 'Completed') {
                    refund += item.quantity * item.finalPrice
                    newTransactionRefund += item.quantity * item.finalPrice
                    item.reFund = item.quantity * item.finalPrice
                    item.reFundStatus = 'Completed'
                    productIds.push(item.product)
                    productQuantity++
                }
                item.status = 'cancelled'
            } else if (item.status === 'cancelled') {
                alreadyCancelled.push(item._id)
                refund += item.quantity * item.finalPrice
            }
        }
        /* eslint-disable no-restricted-syntax */
        order.status = 'cancelled'
        if (order.paymentStatus === 'Completed') {
            order.reFund = refund
            order.reFundStatus = 'Completed'
        }

        if (refund > 0) {
            const userWallet = await Wallet.findOne({ userId: order.userId })
            userWallet.balance += refund
            userWallet.totalCredited += refund

            userWallet.transactions.push({
                type: 'credit',
                amount: newTransactionRefund,
                reason: 'Amount credited for cancelled order',
                orderId: order.orderId,
                productId: productIds,
                productQuantity,
                createdAt: new Date(),
            })

            await userWallet.save()
        }

        await order.save()

        /* eslint-disable no-restricted-syntax */
        for (const item of order.orderedItems) {
            if (!alreadyCancelled.includes(item._id)) {
                const product = await Product.findById(item.product)
                if (product?.variants) {
                    const variant = product.variants.find((v) => v.size === item.size)
                    if (variant) {
                        variant.quantity += item.quantity
                        await product.save()
                    }
                }
            }
        }
        /* eslint-enable no-restricted-syntax */

        return { status: true, statusCode: 200, message: 'Order cancelled successfully' }

    } catch (error) {
        logger.error(`Error in cancelOrder service: ${error}`)
        throw error
    }
}

const cancelSingleItem = async (orderId, itemId) => {
    try {
        console.log('cancellSingle item is workig ', orderId)
        const order = await Order.findOne({ _id: orderId })

        console.log('order', order)
        if (!order) return { status: false, statusCode: 404, message: 'Order not found' }

        let refund = 0
        const productIds = []
        let productQuantity = 0

        let productId = null
        let itemSize = null
        let quantity = 0

        order.orderedItems = order.orderedItems.map((item) => {
            if (item._id.toString() === itemId && item.status !== 'cancelled') {
                item.status = 'cancelled'
                productId = item.product
                itemSize = item.size
                quantity = item.quantity

                if (order.paymentStatus === 'Completed') {
                    refund += item.quantity * item.finalPrice
                    item.reFund = item.quantity * item.finalPrice
                    item.reFundStatus = 'Completed'
                    productIds.push(item.product)
                    productQuantity++
                }
            }
            return item
        })

        const allCancelled = order.orderedItems.every((i) => i.status === 'cancelled')
        if (allCancelled) {
            order.status = 'cancelled'
            if (order.paymentStatus === 'Completed') {
                order.reFund = order.orderedItems.reduce((sum, i) => sum + (i.reFund || 0), 0)
                order.reFundStatus = 'Completed'
            }
        }

        if (refund > 0) {
            const userWallet = await Wallet.findOne({ userId: order.userId })
            userWallet.balance += refund
            userWallet.totalCredited += refund

            userWallet.transactions.push({
                type: 'credit',
                amount: refund,
                reason: 'Amount credited for cancelled product',
                orderId: order.orderId,
                productId: productIds,
                productQuantity,
                createdAt: new Date(),
            })

            await userWallet.save()
        }

        await order.save()
        if (productId && itemSize && quantity > 0) {
            const cancelledProduct = await Product.findById(productId)
            if (cancelledProduct) {
                const variant = cancelledProduct.variants.find((v) => v.size === itemSize)
                if (variant) {
                    variant.quantity += quantity
                    await cancelledProduct.save()
                }
            }
        }

        return {
            status: true,
            statusCode: 200,
            message: 'Item cancelled successfully',
            finalAmount: order.finalAmount,
            total: order.totalPrice
        }
    } catch (error) {
        logger.error(`Error in cancelSingleItem service: ${error}`)
        throw error
    }
}

const returnRequest = async (orderId, itemId, reason) => {
    try {


        const order = await Order.findOne(mongoose.Types.ObjectId.isValid(orderId) ? { _id: orderId } : { orderId: orderId })


        if (!order) return { status: false, statusCode: 400, message: 'Order not found' }

        if (order.status !== 'Delivered') {
            return { status: false, statusCode: 400, message: 'Order not yet delivered. Return not possible.' }
        }
        if (!reason) return { status: false, statusCode: 500, message: 'Reason required!' }

        let { orderedItems } = order

        if (itemId) {
            orderedItems = orderedItems.map((item) => {
                if (item._id.toString() === itemId) {
                    if (item.status === 'returned' || item.status === 'cancelled')
                        return item

                    item.status = 'returnRequested'
                    item.returnReason = reason
                }
                return item
            })
        } else {
            orderedItems = orderedItems.map((item) => {
                if (item.status === 'returned' || item.status === 'cancelled')
                    return item
                item.status = 'returnRequested'
                return item
            })
            order.status = 'returnRequested'
            order.returnReason = reason
        }

        const checkAllStatus = orderedItems.every((item) => item.status === 'returnRequested')

        if (checkAllStatus) order.status = 'returnRequested'

        if (!orderedItems) return { status: false, statusCode: 500, message: 'something went wrong' }

        order.orderedItems = orderedItems
        await order.save()

        return { status: true, statusCode: 200, message: 'Return request submitted successfully' }
    } catch (error) {
        logger.error(`Error in returnRequest service: ${error}`)
        throw error
    }
}

const generateInvoiceStream = async (orderId, res) => {
    try {
        const order = await Order.findOne({ orderId })
            .populate('userId')
            .populate('orderedItems.product')

        if (!order) {
            throw new Error('Order not found')
        }

        const invoiceName = `invoice_${order.orderId}.pdf`

        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${invoiceName}"`,
        )

        const doc = new PDFDocument({ margin: 50 })

        doc.registerFont('Noto', 'fonts/NotoSans-Regular.ttf')
        doc.font('Noto')

        doc.pipe(res)

        // HEADER
        doc
            .fontSize(28)
            .fillColor('#000')
            .text('OLD RICH', { align: 'center', underline: true })

        doc.moveDown(0.5)
        doc
            .fontSize(14)
            .fillColor('#333')
            .text('Luxury Fashion & Lifestyle', { align: 'center' })
            .moveDown(1.5)

        doc.fontSize(22).fillColor('#000').text('INVOICE', { align: 'center' })
        doc.moveDown()

        // ORDER INFO
        doc.fontSize(12).fillColor('#000')
        doc.text(`Invoice Date: ${order.invoiceDate || new Date().toDateString()}`)
        doc.text(`Order ID: ${order.orderId}`)
        doc.text(`Payment Method: ${order.paymentMethod}`)
        doc.moveDown()

        // CUSTOMER DETAILS
        doc.fontSize(14).text('Customer Details', { underline: true })
        doc.moveDown(0.5)

        doc
            .fontSize(12)
            .text(`Name: ${order.address.name}`)
            .text(`Phone: ${order.address.phone}`)
            .text(
                `Address: ${order.address.street}, ${order.address.city}, ${order.address.state}`,
            )
            .moveDown()

        // TABLE HEADER
        const tableTop = doc.y + 10

        doc.rect(50, tableTop, 500, 30).fill('#f2f2f2').stroke()
        doc.fillColor('#000').fontSize(12)

        doc.text('Item', 60, tableTop + 10)
        doc.text('Size', 220, tableTop + 10)
        doc.text('Qty', 300, tableTop + 10)
        doc.text('Price (₹)', 360, tableTop + 10)
        doc.text('Total (₹)', 450, tableTop + 10)

        doc.moveDown(2)

        let yPos = tableTop + 40

        // TABLE ROWS
        order.orderedItems.forEach((item) => {
            doc.rect(50, yPos, 500, 30).stroke()

            doc.text(item.productName, 60, yPos + 10)
            doc.text(item.size, 220, yPos + 10)
            doc.text(item.quantity.toString(), 300, yPos + 10)
            doc.text(`₹${item.price.toFixed(2)}`, 360, yPos + 10)
            doc.text(`₹${item.finalPrice.toFixed(2)}`, 450, yPos + 10)

            yPos += 30
        })

        doc.moveDown(2)

        // SUMMARY BOX
        const summaryTop = yPos + 20

        doc.rect(300, summaryTop, 250, 90).fill('#f2f2f2').stroke()
        doc.fillColor('#000').fontSize(12)

        doc.text(`Subtotal: ₹${order.totalPrice}`, 320, summaryTop + 10)
        doc.text(`Discount: ₹${order.discount}`, 320, summaryTop + 35)
        doc
            .fontSize(14)
            .text(`Final Amount: ₹${order.finalAmount}`, 320, summaryTop + 60)

        // FOOTER
        doc.moveDown(4)
        doc
            .fontSize(11)
            .fillColor('#666')
            .text('Thank you for shopping with OLD RICH.', { align: 'center' })
        doc.text('Luxury Delivered To Your Doorstep.', { align: 'center' })

        doc.end()

        return { status: true }

    } catch (err) {
        logger.error(err)
        throw err
    }
}

export default {
    getOrderDetailPage,
    cancelOrder,
    cancelSingleItem,
    returnRequest,
    generateInvoiceStream
}
