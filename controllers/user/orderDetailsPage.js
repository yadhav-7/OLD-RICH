const Order = require('../../models/orderSchema');
const User = require('../../models/userSchema')
const Product = require('../../models/productSchema')
const mongoose = require('mongoose'); // make sure you imported this
const orderDetailPage = async (req, res) => {
    try {
        const userId = req.session.user
        const user = await User.findOne({ _id: userId, isBlock: false })
        const id = req.query.orderId;
        const order = await Order.findById(id).populate('orderedItems.product') // or findOne({ orderId: id }) if it's a custom ID


        

        res.render('orderDetailPages', { order, user });

    } catch (error) {
        console.error('error in orderDetailPages', error);
        res.redirect('/pageNotFound')
    }
};


const cencellOrder = async (req, res) => {
    try {
        const orderId = req.body.orderId
        const order = await Order.findOne({ orderId })
        if (!order) return res.status(400).json({ message: 'order not found' })

        const orderedItems = order.orderedItems
        const alreadyCancelled=[]
        for (let item of orderedItems) {
            if(item.status==='cancelled'){
                alreadyCancelled.push(item._id)
            }
            item.status = 'cancelled'
        }
        order.status = 'cancelled'

        await order.save()

        for (let item of orderedItems) {
            let product = await Product.findOne({ _id: item.product });

            if (product?.variants) {

                const variantIndex = product.variants.findIndex(v => v.size === item.size);

                if (variantIndex !== -1&&!alreadyCancelled.includes(item._id)) {

                    await Product.updateOne(
                        {
                            _id: item.product,
                            "variants.size": item.size
                        },
                        {
                            $inc: { "variants.$.quantity": item.quantity }
                        }
                    );
                }
            }
        }

        res.status(200).json({ message: 'Order cancelled successfull' })

    } catch (error) {
        console.error('error in cancell order', error)
        res.status(500).json({ message: 'Internal server Error' })
    }
}


const cancelSingleItem = async (req, res) => {
    try {
        const { orderId, itemId } = req.body;

        const order = await Order.findOne({ orderId: orderId });
        if (!order) return res.status(404).json({ message: 'Order not found' });

        const items = order.orderedItems;

        let productId = null;
        let itemSize = null;
        let quantity =0
        let price=0

        const modified = items.map((item) => {
            if (item._id.toString() === itemId) {
                item.status = 'cancelled'
                quantity = item.quantity
                productId = item.product
                itemSize = item.size
                price = item.price
            }
            return item;
        });

        order.finalAmount-=quantity*price
        order.totalPrice-=quantity*price
        order.orderedItems = modified;

        const allCancelled = modified.every((i) => i.status === 'cancelled');
        if (allCancelled) {
            order.status = 'cancelled';
        }

        await order.save();

        const cancelledProduct = await Product.findById(productId);
        if (!cancelledProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const cancellVariant = cancelledProduct.variants.find((v) => v.size === itemSize);
        if (!cancellVariant) {
            return res.status(404).json({ message: 'Variant not found' });
        }

        if (cancellVariant.quantity > 0) {
            cancellVariant.quantity += quantity;
        }

        await cancelledProduct.save();

        return res.status(200).json({ message: 'Item cancelled successfully' ,finalAmount:order.finalAmount,total:order.totalPrice});

    } catch (error) {
        console.error('Error in cancelSingleItem:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};


const returnReq = async (req, res) => {
    try {
       
        const { itemId, orderId, reason } = req.body;

        const order = await Order.findOne({ orderId: orderId });

        if (!order) return res.status(400).json({ message: 'Order not found' });

        if (order.status !== 'Delivered') {
            return res.status(400).json({ message: 'Order not yet delivered. Return not possible.' });
        }
        if (!reason) return res.status(500).json({ message: 'Reason required!' })

        let orderedItems = order.orderedItems

        if (itemId) {
            orderedItems = orderedItems.map((item) => {
                if(item._id.toString()===itemId){
                    item.status = 'returnRequested'
                    
                }
                return item
            })

        } else {
            orderedItems = orderedItems.map((item) => {
                item.status = 'returnRequested'
                return item
            })
            order.status = 'returnRequested'
        }

        let checkAllStatus = orderedItems.every((item)=>item.status==='returnRequested')


        if(checkAllStatus)order.status = 'returnRequested'

        if (!orderedItems) return res.status(500).json({ message: 'something went wrong' })

        order.orderedItems = orderedItems

        

        order.returnReason = reason

        await order.save();

        res.status(200).json({ message: 'Return request submitted successfully' });

    } catch (error) {
        console.error('error in returnReq', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};


module.exports = {
    orderDetailPage,
    cencellOrder,
    cancelSingleItem,
    returnReq
}