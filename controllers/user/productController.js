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
        const priceOftheProduct = req.query.slcPrice;
        const cart = await Cart.findOne({userId:userId})
        // const length = cart.items?.length||0

        // Debug logs
        console.log('Price from query:', priceOftheProduct);
        console.log('Product variants:', product.variants);

        let selectedVariantIndex = 0; // Default to first variant

        if (priceOftheProduct && product.variants?.length) {
            // Compare against salePrice instead of price
            selectedVariantIndex = product.variants.findIndex(variant => {
                if (!variant || variant.salePrice === undefined) {
                    return false;
                }
                // Compare as numbers to avoid string comparison issues
                return Number(variant.salePrice) === Number(priceOftheProduct);
            });

            if (selectedVariantIndex === -1) {
                console.log('No variant found with the given price. Defaulting to index 0.');
            } else {
                console.log(`Matching variant found at index: ${selectedVariantIndex}`);
            }
        }


        console.log(`Matching variant found at index: ${selectedVariantIndex}`);
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
            // length:length
        });
    } catch (error) {
        console.error('Error from productDetails:', error);
        res.redirect('/pageNotFound');
    }
};
module.exports={
    productDetails
}