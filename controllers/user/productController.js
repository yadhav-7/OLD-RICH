const Product = require('../../models/productSchema')
const User = require('../../models/userSchema')
const Category = require('../../models/catagory')
const Cart = require('../../models/cartSchema')

const productDetails = async (req, res) => {
    try {
        const userId = req.session.user;
        const userData = await User.findOne({ _id: userId });
        const productId = req.query.productId;
        const product = await Product.findById(productId).populate('category');
        const priceOftheProduct = req.query.slcPrice
        let cart 
        let length
        if(userId){
            cart = await Cart.findOne({userId:userId})
            if(cart&&cart.items){
            length = cart.items?.length||0
                 }
            }


        let selectedVariantIndex = 0

        if (priceOftheProduct && product.variants?.length) {
            selectedVariantIndex = product.variants.findIndex(variant => {
                if (!variant || variant.salePrice === undefined) {
                    return false;
                }
                return Number(variant.salePrice) === Number(priceOftheProduct);
            })

            
        }


        const findCategory = product.category;
        const categoryOffer = findCategory.categoryOffer || 0;
        const productOffer = product.productOffer || 0;
        const totalOffer = categoryOffer + productOffer;

        res.render('product-details', {
            user: userData,
            product: product,
            quantity: product.quantity,
            totalOffer: totalOffer,
            category: findCategory,
            selectedVariantIndex: selectedVariantIndex,
            length:length
        });
    } catch (error) {
        console.error('Error from productDetails:', error);
        res.redirect('/pageNotFound');
    }
};
module.exports={
    productDetails
}