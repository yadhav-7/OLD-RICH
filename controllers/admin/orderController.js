const User = require('../../models/userSchema')
const Order = require('../../models/orderSchema')
const Product = require('../../models/productSchema')
const Wallet = require('../../models/walletSchema')
const getOrderPage = async (req, res) => {
    try {
        const order = await Order.find().sort({ createdOn: -1 }).populate('userId')

        res.render('ordermanage', {
            order
        })
    } catch (error) {
        console.error('error in getOrderPage', error)
    }
}

const searchOrders = async (req, res) => {
    try {
        const search = req.query.searchvalue || '';

        const searchData = await Order.find({
            $or: [
                { orderId: { $regex: search, $options: 'i' } },
                { status: { $regex: search, $options: 'i' } },
                { 'address.name': { $exists: true, $regex: search, $options: 'i' } }
            ]
        })
            .populate('userId', 'username')
            .lean();

        console.log('searched data is ', searchData)
        res.json(searchData);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while searching orders' });
    }
};


const changeStatus = async (req, res) => {


    try {

        const { orderId, newStatus } = req.body;

        if (!orderId || !newStatus) {
            return res.status(400).json({ message: 'Order ID and new status are required.' });
        }



        const allowedStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'cancelled', 'returnRequested', 'returned', 'reutrnRejected']
        if (!allowedStatuses.includes(newStatus)) {
            return res.status(400).json({ message: 'Invalid status value.' });
        }


        const order = await Order.findOne({ orderId });


        if (!order) {
            return res.status(404).json({ message: 'Order not found.' });
        }


        if (order.status === 'Delivered' || order.status === 'returned' || order.status === 'cancelled') {
            return res.status(400).json({ message: 'Cannot change status from Delivered to another status except return.' });
        }

        order.status = newStatus
        console.log('order.status', order.status)
        console.log('newStatus', newStatus)
        if (newStatus === 'Delivered') order.paymentStatus = 'Completed'

        const orderedItems = order.orderedItems
        for (let key of orderedItems) {
            if (key.status === 'cancelled') continue
            key.status = newStatus
        }

        if (newStatus === 'Shipped' || newStatus === 'Delivered') {
            order.invoiceDate = new Date();
        }

        await order.save();

        res.status(200).json({ message: 'Order status updated successfully', updatedStatus: order.status });

    } catch (error) {
        console.error('Error in changeStatus:', error);
        res.status(500).json({ message: 'Server error while updating order status.' });
    }
}


const ordereDetails = async (req, res) => {
    try {

        const orderId = req.query.orderId
        const order = await Order.findOne({ orderId })
            .populate({
                path: 'orderedItems.product',
                select: 'productImage productName variants'
            });

        console.log('order.returnReason', order.returnReason)

        if (!order) res.redirect('/pageNotFound')
        return res.render('orderDetailPage', { order })
    } catch (error) {
        console.error('error in orderDetails', error)
        res.redirect('/pageNotFound')
    }
}

const handleReturnReq = async (req, res) => {
    try {
        const { itemId, orderId, newStatus } = req.body
        const order = await Order.findOne({ orderId: orderId })

        if (!order) return res.status(404).json({ message: 'order not found' })
        //if (newStatus !== 'returned'&&newStatus!=='reutrnRejected') return res.status(404).json({ message: 'cannot change status' })
        if (order.status === 'cancelled') return res.status(500).json({ message: 'cannot return cancelled order!' })

        let orderedItems
        let promises = []
        let reFund = 0
        let productIds = []
        let productQuantity = 0
        let newTransactionRefund = 0
        let isReject = false


        if (itemId) {

            if (newStatus === 'returnRejected') {
                    orderedItems = order.orderedItems.map((i) => {
                       
                    if (i._id.toString() === itemId && i.status !== 'cancelled' && i.status !== 'returned') {
                        
                         i.status = 'reutrnRejected'
                        isReject = true
                     
                    }
                    return i
                })
                  
               

            } else if (newStatus === 'returned') {
              
                orderedItems = order.orderedItems.map((i) => {
                    if (i._id.toString() === itemId && i.status !== 'cancelled' && i.status !== 'returned') {
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
        } else {
            if (newStatus === 'reutrnRejected') {
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
                    if ((i.status !== 'cancelled' || i.status === 'returned') && i.reFundStatus !== 'Completed') {
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
        }

        await Promise.all(promises)

        order.orderedItems = orderedItems



        console.log('orderedItems',orderedItems)
        let checkTotalReturn = orderedItems.every((i) => i.status === 'returned')
        if (checkTotalReturn) order.status = 'returned'

        let checkTotalReject = orderedItems.every((i) => i.status === 'reutrnRejected')
        if (checkTotalReject) {
            order.status = 'reutrnRejected'
        }




        await order.save()

        if (!isReject) {
            const userWallet = await Wallet.findOne({ userId: order.userId })
            userWallet.balance += newTransactionRefund
            userWallet.totalCredited += newTransactionRefund
            let transaction = {
                type: 'credit',
                amount: newTransactionRefund,
                reason: 'Amount credited for returned product',
                orderId: order.orderId,
                productId: productIds,
                productQuantity: productQuantity,
                createdAt: new Date()
            }

            userWallet.transactions?.push(transaction)
            if (order.paymentStatus === 'Completed') await userWallet.save()
        } else if (isReject) {
            return res.status(200).json({ message: 'order return rejection is successfull' })
        }


        return res.status(200).json({ message: 'order returned successfully' })

    } catch (error) {
        console.error('error in handleReturnReq', error)
        res.status(401).json({ message: 'Internal Server Issue' })
    }
};

async function incProductQuntity(productId, size, quantity) {
    let product = await Product.findOne({ _id: productId })
    if (!product) return
    let variant = product.variants?.find((v) => v.size === size)
    if (variant) {
        variant.quantity += quantity
        await product.save();
    }
}
module.exports = {
    getOrderPage,
    changeStatus,
    ordereDetails,
    handleReturnReq,
    searchOrders
}