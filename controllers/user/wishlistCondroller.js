const Product = require('../../models/productSchema')
const Wishlist = require('../../models/wishlistSchema')
const Cart = require('../../models/cartSchema')
const User = require('../../models/userSchema')
const mongoose = require('mongoose');
const getWishList = async (req, res) => {
    try {
        const userId = req.session.user
        const cart = await Cart.findOne({ userId })
        const userData = await User.findById(userId)


        let wishList = await Wishlist.findOne({ userId: userId })
            .populate({
                path: 'products.productId',
                select: 'productName productImage description variants status' // keep it lean
            }).lean()
            let length
            if(cart && cart.items){
                length = cart.items?.length < 1 ? 0 : cart.items?.length
            }
         wishList.products?.sort((a,b)=>b.addedOn-a.addedOn)

        return res.render('wishlist', { wishList, length, user: userData })
    } catch (error) {
        console.error('error in getWishList', error)
        res.redirect('/pageNotFound')
    }
}


const addToWishlist = async (req, res) => {
    try {
        const userId = req.session.user;
        const productId = req.query.productId?.trim();

        // Validate user
        if (!userId) {
            return res.status(401).json({ message: 'Please log in to continue' });
        }

        // Validate productId
        if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: 'Valid product ID is required' });
        }

        // Convert to ObjectId - FIXED: Remove toString() wrapper
        const productObjectId = new mongoose.Types.ObjectId(productId);

        // Verify product exists
        const productExists = await Product.exists({ _id: productObjectId });
        if (!productExists) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Convert userId to ObjectId as well for consistency
        const userObjectId = new mongoose.Types.ObjectId(userId);

        const checkWishExists = await Wishlist.findOne({
            userId: userObjectId,
            "products.productId": productObjectId
        });

        if (checkWishExists) return res.status(400).json({ message: 'Product is already exists in wishlist!' })
        // Find or create wishlist
        let wishlist = await Wishlist.findOneAndUpdate(
            { userId: userObjectId },
            {
                $addToSet: {
                    products: {
                        productId: productObjectId,
                        addedOn: new Date()
                    }
                }
            },
            { upsert: true, new: true }
        );

        return res.status(200).json({
            message: 'Product added to wishlist',
            wishlist
        });

    } catch (error) {
        console.error('Error adding to wishlist:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};


const removeProduct = async (req, res) => {
    try {
        const productId = req.query.productId
        const userId = req.session.user

        const remove = await Wishlist.updateOne(
            { userId: userId },
            { $pull: { products: { productId: productId } } },
            { new: true }
        )
        if (!remove) return res.status(400).json({ message: 'try again!' })

        console.log('removed Wishlist item', remove)
        res.status(200).json({ message: 'successfully removed' })
    } catch (error) {
        console.error('error in removeProduct', error)
        res.status(500).json({ message: 'Internal Server Error' })
    }
}
module.exports = {
    getWishList,
    addToWishlist,
    removeProduct
}
