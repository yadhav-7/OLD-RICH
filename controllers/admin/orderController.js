const User = require('../../models/userSchema')
const Order = require('../../models/orderSchema')
const Product = require('../../models/productSchema')

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

        console.log('searched data is ',searchData)
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


        // Validate newStatus is one of the allowed values
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

        order.status = newStatus;

        const orderedItems = order.orderedItems
        for (let key of orderedItems) {
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
                select: 'productImage productName variants' // you can add other fields if needed
            });

        if (!order) res.redirect('/pageNotFound')
        res.render('orderDetailPage', { order })
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
        if (newStatus !== 'returned') return res.status(404).json({ message: 'cannot change status' })
        if (order.status === 'cancelled') return res.status(500).json({ message: 'cannot return cancelled order!' })

        let orderedItems
        let promises = []

        if (itemId) {
            orderedItems = order.orderedItems.map((i) => {
                if (i._id.toString() === itemId) {
                    i.status = 'returned'
                    promises.push(incProductQuntity(i.product, i.size, i.quantity))
                    order.finalAmount-=i.price*i.quantity
                    order.totalPrice-=i.price*i.quantity
                }
                return i
            })
        } else {
            order.status = 'returned'
            orderedItems = order.orderedItems.map((i) => {
                i.status = 'returned'
                promises.push(incProductQuntity(i.product, i.size, i.quantity))
                return i
            })
            order.finalAmount=0
            order.totalPrice=0
        }

        let checkTotalStatus = orderedItems.every((i) => i.status === 'returned')
        if (checkTotalStatus) order.status = 'returned'

        
        await Promise.all(promises)

        order.orderedItems = orderedItems
        await order.save()

        res.status(200).json({ message: 'order returned successfully' })

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