const Order = require('../../models/orderSchema');
const User = require('../../models/userSchema')
const Product = require('../../models/productSchema')
const Cart = require('../../models/cartSchema')
const Wallet = require('../../models/walletSchema')
const mongoose = require('mongoose'); // make sure you imported this
const orderDetailPage = async (req, res) => {
    try {
        const userId = req.session.user
        const user = await User.findOne({ _id: userId, isBlock: false })

        const id = req.query.orderId;
        console.log('req.query.orderId', req.query.orderId)
        console.log('id', id)
        const order = await Order.findOne({ orderId: id }).populate('orderedItems.product') // or findOne({ orderId: id }) if it's a custom ID

        const cart = await Cart.findOne({ userId: userId })

        const length = cart.items?.length

        res.render('orderDetailPages', { order, user, length });

    } catch (error) {
        console.error('error in orderDetailPages', error);
        res.redirect('/pageNotFound')
    }
};


// const cencellOrder = async (req, res) => {
//     try {
//         const orderId = req.body.orderId
//         let reFund = 0
//         let productIds = []
//         let productQuantity = 0
//         const order = await Order.findOne({ orderId })
//         if (!order) return res.status(400).json({ message: 'order not found' })

//         const orderedItems = order.orderedItems
//         const alreadyCancelled = []
//         for (let item of orderedItems) {
//             if (item.status !== 'Delivered' && item.status !== 'cancelled') {
//                 reFund += item.quantity * item.finalPrice
//                 productIds.push(item.product)
//                 productQuantity++
//                 item.reFund = item.quantity * item.finalPrice
//                 item.reFundStatus = 'Completed'
//             }
//             if (item.status === 'cancelled') {
//                 alreadyCancelled.push(item._id)
//             }

//             item.status = 'cancelled'
//         }
//         order.status = 'cancelled'
//         order.reFund = reFund
//         order.reFundStatus = 'Completed'

//         if (order.paymentStatus === 'Completed') reFund += order.finalAmount
//         const userWallet = await Wallet.findOne({ userId: order.userId })
//         userWallet.balance += reFund
//         userWallet.totalCredited += reFund
//         let transaction = {
//             type: 'credit',
//             amount: reFund,
//             reason: 'Amount credited for cancell product',
//             orderId: order.orderId,
//             productId: productIds,
//             productQuantity: productQuantity,
//             createdAt: new Date()
//         }
//         userWallet.transactions?.push(transaction)
//         if(order.paymentStatus==='Completed')await userWallet.save()
//         await order.save()

//         for (let item of orderedItems) {
//             let product = await Product.findOne({ _id: item.product });

//             if (product?.variants) {

//                 const variantIndex = product.variants.findIndex(v => v.size === item.size);

//                 if (variantIndex !== -1 && !alreadyCancelled.includes(item._id)) {

//                     await Product.updateOne(
//                         {
//                             _id: item.product,
//                             "variants.size": item.size
//                         },
//                         {
//                             $inc: { "variants.$.quantity": item.quantity }
//                         }
//                     );
//                 }
//             }
//         }

//         res.status(200).json({ message: 'Order cancelled successfull' })

//     } catch (error) {
//         console.error('error in cancell order', error)
//         res.status(500).json({ message: 'Internal server Error' })
//     }
// }


// const cancelSingleItem = async (req, res) => {
//     try {
//         const { orderId, itemId } = req.body;

//         const order = await Order.findOne({ orderId: orderId });
//         if (!order) return res.status(404).json({ message: 'Order not found' })
//         let productIds = []
//         let productQuantity = 0
//         let reFund = 0 
//         const items = order.orderedItems;

//         let productId = null;
//         let itemSize = null;
//         let quantity = 0
//         let price = 0

//         const modified = items.map((item) => {
//             if (item._id.toString() === itemId) {
//                 item.status = 'cancelled'
//                 productId = item.product
//                 itemSize = item.size
//                 if(order.paymentStatus==='Completed'){
//                 reFund += item.quantity * item.finalPrice
//                 productIds.push(item.product)
//                 productQuantity++
//                 item.reFund = item.quantity * item.finalPrice
//                 item.reFundStatus = 'Completed'
//                 }
//             }
//             return item
//         });

        
//         order.orderedItems = modified

//         const allCancelled = modified.every((i) => i.status === 'cancelled')
//         if (allCancelled) {
//             order.status = 'cancelled'
//             if(order.paymentStatus==='Completed'){
//             order.reFund=order.finalAmount
//             order.reFundStatus='Completed'
//             }
//         }

//         const userWallet = await Wallet.findOne({userId:order.userId})
//         userWallet.totalCredited+=reFund
//         userWallet.balance+=reFund
//         let transaction = {
//             type: 'credit',
//             amount: reFund,
//             reason: 'Amount credited for cancell product',
//             orderId: order.orderId,
//             productId: productIds,
//             productQuantity: productQuantity,
//             createdAt: new Date()
//         }
//         userWallet.transactions.push(transaction)
//         await order.save()
//         await userWallet.save()

//         const cancelledProduct = await Product.findById(productId)
//         if (!cancelledProduct) {
//             return res.status(404).json({ message: 'Product not found' })
//         }

//         const cancellVariant = cancelledProduct.variants.find((v) => v.size === itemSize)
//         if (!cancellVariant) {
//             return res.status(404).json({ message: 'Variant not found' })
//         }

//         if (cancellVariant.quantity > 0) {
//             cancellVariant.quantity += quantity
//         }

//         await cancelledProduct.save()

//         return res.status(200).json({ message: 'Item cancelled successfully', finalAmount: order.finalAmount, total: order.totalPrice })

//     } catch (error) {
//         console.error('Error in cancelSingleItem:', error);
//         return res.status(500).json({ message: 'Internal server error' });
//     }
// }



// Cancel Whole Order
const cencellOrder = async (req, res) => {
    try {
        const orderId = req.body.orderId;
        let refund = 0
        let productIds = [];
        let productQuantity = 0
        let newTransactionRefund = 0

        const order = await Order.findOne({ orderId });
        if (!order) return res.status(400).json({ message: 'Order not found' });

        const alreadyCancelled = [];
        for (let item of order.orderedItems) {
            if (item.status !== 'Delivered' && item.status !== 'cancelled') {
          
                if (order.paymentStatus === 'Completed') {
                    refund += item.quantity * item.finalPrice;
                    newTransactionRefund+=item.quantity * item.finalPrice
                    item.reFund = item.quantity * item.finalPrice;
                    item.reFundStatus = 'Completed';
                    productIds.push(item.product);
                    productQuantity++;
                }
                item.status = 'cancelled';
            } else if (item.status === 'cancelled') {
                alreadyCancelled.push(item._id)
                refund += item.quantity * item.finalPrice;
            }
        }

        order.status = 'cancelled';
        if (order.paymentStatus === 'Completed') {
            order.reFund = refund;
            order.reFundStatus = 'Completed';
        }


        if (refund > 0) {
            const userWallet = await Wallet.findOne({ userId: order.userId });
            userWallet.balance += refund;
            userWallet.totalCredited += refund;

            userWallet.transactions.push({
                type: 'credit',
                amount: newTransactionRefund,
                reason: 'Amount credited for cancelled order',
                orderId: order.orderId,
                productId: productIds,
                productQuantity: productQuantity,
                createdAt: new Date()
            });

            await userWallet.save();
        }

        await order.save();

        for (let item of order.orderedItems) {
            if (!alreadyCancelled.includes(item._id)) {
                let product = await Product.findById(item.product);
                if (product?.variants) {
                    const variant = product.variants.find(v => v.size === item.size);
                    if (variant) {
                        variant.quantity += item.quantity;
                        await product.save();
                    }
                }
            }
        }

        return res.status(200).json({ message: 'Order cancelled successfully' });
    } catch (error) {
        console.error('Error in cancelOrder:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};



const cancelSingleItem = async (req, res) => {
    try {
        const { orderId, itemId } = req.body;

        const order = await Order.findOne({ orderId });
        if (!order) return res.status(404).json({ message: 'Order not found' });

        let refund = 0;
        let productIds = [];
        let productQuantity = 0;

        let productId = null;
        let itemSize = null;
        let quantity = 0;

        order.orderedItems = order.orderedItems.map(item => {
            if (item._id.toString() === itemId && item.status !== 'cancelled') {
                item.status = 'cancelled';
                productId = item.product;
                itemSize = item.size;
                quantity = item.quantity;

                if (order.paymentStatus === 'Completed') {
                    refund += item.quantity * item.finalPrice;
                    item.reFund = item.quantity * item.finalPrice;
                    item.reFundStatus = 'Completed';
                    productIds.push(item.product);
                    productQuantity++;
                }
            }
            return item;
        });


        const allCancelled = order.orderedItems.every(i => i.status === 'cancelled');
        if (allCancelled) {
            order.status = 'cancelled';
            if (order.paymentStatus === 'Completed') {
                order.reFund = order.orderedItems.reduce((sum, i) => sum + (i.reFund || 0), 0);
                order.reFundStatus = 'Completed';
            }
        }

    
        if (refund > 0) {
            const userWallet = await Wallet.findOne({ userId: order.userId });
            userWallet.balance += refund;
            userWallet.totalCredited += refund;

            userWallet.transactions.push({
                type: 'credit',
                amount: refund,
                reason: 'Amount credited for cancelled product',
                orderId: order.orderId,
                productId: productIds,
                productQuantity: productQuantity,
                createdAt: new Date()
            });

            await userWallet.save();
        }

        await order.save()
        if (productId && itemSize && quantity > 0) {
            const cancelledProduct = await Product.findById(productId);
            if (cancelledProduct) {
                const variant = cancelledProduct.variants.find(v => v.size === itemSize);
                if (variant) {
                    variant.quantity += quantity;
                    await cancelledProduct.save();
                }
            }
        }

        return res.status(200).json({
            message: 'Item cancelled successfully',
            finalAmount: order.finalAmount,
            total: order.totalPrice
        });
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
                if (item._id.toString() === itemId) {
                    if(item.status==='returned'||item.status==='cancelled')return item

                    item.status = 'returnRequested'
                    item.returnReason = reason
                }
                return item
            })

        } else {
            orderedItems = orderedItems.map((item) => {
                if(item.status==='returned'||item.status==='cancelled')return item
                item.status = 'returnRequested'
                return item
            })
            order.status = 'returnRequested'
            order.returnReason = reason
        }

        let checkAllStatus = orderedItems.every((item) => item.status === 'returnRequested')


        if (checkAllStatus) order.status = 'returnRequested'

        if (!orderedItems) return res.status(500).json({ message: 'something went wrong' })

        order.orderedItems = orderedItems





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