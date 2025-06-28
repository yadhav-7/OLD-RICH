const Product = require('../../models/productSchema')
const User = require('../../models/userSchema')
const Category = require('../../models/catagory')

const productDetails = async(req,res)=>{
    try {
        const userId = req.session.user
        const userData = await User.findOne({_id:userId})
        const productId = req.query.productId
        const product = await Product.findById(productId).populate('category')
        const findCategory = product.category
        const categoryOffer = findCategory.categoryOffer || 0
        const productOffer = product.productOffer || 0

        const totalOffer = categoryOffer+productOffer

        res.render('product-details',{
            user:userData,
            product:product,
            quantity:product.quantity,
            totalOffer:totalOffer,
            category:findCategory
        })
    } catch (error) {
        console.error('error from productDetails',error)
        res.redirect('/pageNotFound')
    }
}

module.exports={
    productDetails
}