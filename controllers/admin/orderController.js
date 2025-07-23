const User = require('../../models/userSchema')
const Order = require('../../models/orderSchema')

const getOrderPage =async(req,res)=>{
    try {
        const order = await Order.find().sort({createdOn:-1}).populate('userId')

        res.render('ordermanage',{
            order
        })
    } catch (error) {
        console.error('error in getOrderPage',error)
    }
}



const changeStatus = async (req, res) => {
  
    
    try {
        const { orderId, newStatus } = req.body;

        console.log('--------------===========---------')
        console.log('req.body',req.body)

        console.log('orderID',orderId)
        console.log('newStatus',newStatus)

        console.log('------------one')

        if (!orderId || !newStatus) {
            return res.status(400).json({ message: 'Order ID and new status are required.' });
        }
        console.log(2)

        // Validate newStatus is one of the allowed values
        const allowedStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'cancelled', 'return Req', 'returned']
        if (!allowedStatuses.includes(newStatus)) {
            return res.status(400).json({ message: 'Invalid status value.' });
        }

        console.log(3)

        const order = await Order.findOne({ orderId });

        console.log(4)
        if (!order) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        console.log(5)
        
        if (order.status === 'Delivered' && newStatus !== 'returned') {
            return res.status(400).json({ message: 'Cannot change status from Delivered to another status except return.' });
        }
console.log(6)
        order.status = newStatus;
console.log(7)
        // Optionally set invoice date if shipped or delivered
        if (newStatus === 'Shipped' || newStatus === 'Delivered') {
            order.invoiceDate = new Date();
        }
console.log(8)
        await order.save();
console.log(9)
        res.status(200).json({ message: 'Order status updated successfully' });

    } catch (error) {
        console.error('Error in changeStatus:', error);
        res.status(500).json({ message: 'Server error while updating order status.' });
    }
}


const ordereDetails = async(req,res)=>{
    try {
        console.log('rqreqw',req.query.orderId)
        const orderId = req.query.orderId
        const order = await Order.findOne({orderId})
        if(!order)res.redirect('/pageNotFound')
        res.render('orderDetailPage',{order})
    } catch (error) {
        
    }
} 


module.exports={
    getOrderPage,
    changeStatus,
    ordereDetails
  
}