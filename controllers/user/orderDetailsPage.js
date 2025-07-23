const Order = require('../../models/orderSchema');
const User = require('../../models/userSchema')
const Product = require('../../models/productSchema')
const orderDetailPage = async (req, res) => {
  try {
    const userId = req.session.userId
    const user=await User.findOne({userId})
    const id = req.query.orderId;
    const order = await Order.findById(id).populate('orderedItems.product') // or findOne({ orderId: id }) if it's a custom ID

    if (!order) {
      return res.render('orderDetailPages', { order: null ,user:user});
    }

    res.render('orderDetailPages', { order,user });

  } catch (error) {
    console.error('error in orderDetailPages', error);
    res.status(500).send('Internal Server Error');
  }
};


const cencellOrder = async(req,res)=>{
    try {
        const orderId = req.body.orderId
        const userId = req.session.user
        const order = await Order.findOne({orderId})
        if(!order)return res.status(400).json({message:'order not found'})

        const orderedItems = order.orderedItems
        for(let item of orderedItems){
            item.status='cancelled'
        }
        order.status='cancelled'

        await order.save()

        for (let item of orderedItems) {
    let product = await Product.findOne({ _id: item.product });
    
    if (product?.variants) {
      
        const variantIndex = product.variants.findIndex(v => v.size === item.size);
        
        if (variantIndex !== -1) {
            
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

        res.status(200).json({message:'Order cancelled successfull'})
        
    } catch (error) {
     console.error('error in cancell order',error)
     res.status(500).json({message:'Internal server Error'})   
    }
}


const returnReq = async (req, res) => {
    try {
        const { orderId, reason } = req.body;
        console.log(1)

        const order = await Order.findOne({ orderId });
        if (!order) return res.status(400).json({ message: 'Order not found' });

        console.log(2)
        if (order.status !== 'Delivered') {
            return res.status(400).json({ message: 'Order not yet delivered. Return not possible.' });
        }
        console.log(3)

        order.status = 'return Req'; 
        order.returnReason = reason || 'Not specified';
console.log(4)
        await order.save();
console.log(5)
        res.status(200).json({ message: 'Return request submitted successfully' });
    } catch (error) {
        console.error('error in returnReq', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};


module.exports={
    orderDetailPage,
    cencellOrder,
    returnReq
}