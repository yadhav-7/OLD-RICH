const Cart = require('../../models/cartSchema')
const User = require('../../models/userSchema')
const Product = require('../../models/productSchema')
const Category = require('../../models/catagory')
const Address = require('../../models/addressSchema')
const Order = require('../../models/orderSchema')

const checkoutpage = async (req, res) => {
    try {
        console.log('checkout----------------------');
        const cartItemIdsFromClient = req.body.items;
        console.log('Cart item IDs from client:', cartItemIdsFromClient);

        const userId = req.session.user;

        const cart = await Cart.findOne({ userId }).populate({
            path: 'items.productId',
            populate: {
                path: 'category',
            },
        });

        if (!cart || !cart.items || cart.items.length < 1) {
            return res.status(400).json({
                success: false,
                message: 'Your cart is empty. Fill it with treasures before proceeding!',
            });
        }

        const matchedCartItems = cart.items.filter(item =>
            cartItemIdsFromClient.includes(item._id.toString())
        );

        if (matchedCartItems.length < 1) {
            return res.status(403).json({
                success: false,
                message: 'No valid items found in your cart for checkout.',
            });
        }

        const issues = [];

        const validItems = matchedCartItems.filter(item => {
            const product = item.productId;
            const category = product?.category;

            if (!product) {
                issues.push({
                    itemId: item._id,
                    issue: 'Product no longer exists',
                });
                return false;
            }

            if (product.isBlocked) {
                issues.push({
                    itemId: item._id,
                    productId: product._id,
                    productName: product.productName,
                    issue: 'Product is blocked',
                });
                return false;
            }

            if (!category || !category.isListed) {
                issues.push({
                    itemId: item._id,
                    productId: product._id,
                    productName: product.productName,
                    issue: 'Product category is not listed',
                });
                return false;
            }

            if (product.variants && product.variants.length > 0) {
                const selectedVariant = product.variants.find(v => v.size === item.size);
                if (!selectedVariant || selectedVariant.quantity < item.quantity) {
                    issues.push({
                        itemId: item._id,
                        productId: product._id,
                        productName: product.productName,
                        size: item.size,
                        issue: 'Not enough stock for selected variant',
                    });
                    return false;
                }
            } else if (product.quantity < item.quantity) {
                issues.push({
                    itemId: item._id,
                    productId: product._id,
                    productName: product.productName,
                    issue: 'Not enough stock for this product',
                });
                return false;
            }

            return true;
        });

        if (issues.length > 0) {
            // Prepare a user-friendly detailed issue list
            const detailedIssues = issues.map(issue => {
                return ` "${issue.productName || 'Unknown Product'}"${issue.size ? ` (Size: ${issue.size})` : ''} - ${issue.issue}`;
            });

            return res.status(400).json({
                success: false,
                message: 'Some items cannot be checked out. Please review the issues.',
                issues,          // for developer/debug
                detailedIssues,  // for frontend display
            });
        }

        return res.status(200).json({
            success: true,
            message: 'All items are valid and ready for checkout!',
            validItems,

        });

    } catch (error) {
        console.error(' Error in checkoutpage:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred during checkout. Please try again later.',
        });
    }
};

const getCheckoutpage = async (req, res) => {
    try {
        console.log('items from query', req.query.item);
        const itemIds = req.query.item
        console.log('itemIds', itemIds)
        const userId = req.session.user;
        console.log('userID', userId)
        const cart = await Cart.findOne({ userId })
        console.log('cart', cart)
        if (!cart || !cart.items || cart.items.length === 0) {
            return res.redirect('/pageNotFound');
        }

        // Filter only selected items (if needed)
        const selectedItems = cart.items.filter(item =>
            itemIds.includes(item._id.toString())
        );

        const productIds = selectedItems.map((p) => p.productId.toString())
        const products = await Product.find({ _id: { $in: productIds } })

        console.log('selecteditems', selectedItems)
        const userData = await User.findById(userId);
        console.log('userData', userData)


        console.log('final selectedProcuts', products)


        const userAddress = await Address.findOne({ userId: userId })
        console.log('usereAddress', userAddress)

        console.log('selectedItems', selectedItems)

        res.render('checkOutPage', {
            user: userData,
            products,
            selectedItems,
            address: userAddress.address || []
        });
    } catch (error) {
        console.error('error in getCheckOutPage', error);
        res.redirect('/pageNotFound');
    }
};

// const procedToCheckOut = async (req, res) => {
//     try {
//         let selectedItems = req.body.selectedItems;
//         const userId = req.session.user;

//         const cart = await Cart.findOne({ userId });
//         if (!cart || cart.items.length < 1) {
//             return res.status(500).json({ message: 'Your cart is empty' });
//         }

//         const products = [];

//         for (const item of selectedItems) {
//             const product = await Product.findById(item.productId);
//             if (!product) {
//                 return res.status(500).json({ message: `Product with ID ${item.productId} not found.` });
//             }

//             if (product.isBlocked) {
//                 return res.status(500).json({ message: `${product.productName} is currently blocked. Please try again later.` });
//             }

//             const category = await Category.findById(product.category);
//             if (!category) {
//                 return res.status(500).json({ message: `Category not found for product ${product.productName}.` });
//             }

//             if (!category.isListed) {
//                 return res.status(500).json({ message: `Category for ${product.productName} is not available now.` });
//             }

//             const variant = product.variants.find(v => v.size === item.size);
//             if (!variant) {
//                 return res.status(500).json({ message: `Size ${item.size} not found for ${product.productName}.` });
//             }

//             if (variant.quantity < item.quantity) {
//                 return res.status(500).json({ message: `Only ${variant.quantity} items left in stock for ${product.productName}.` });
//             }

//             // Push valid product
//             products.push({
//                 productId: product._id,
//                 name: product.productName,
//                 size: variant.size,
//                 quantity: item.quantity,
//                 price: variant.salePrice,
//                 totalPrice: item.totalPrice
//             });
//         }


//         // console.log(" Final products:", products);

//         const newOrder = new Order({
//             userId:userId,
//         })


//     } catch (error) {
//         console.error("Error in procedToCheckOut:", error);
//         res.status(500).json({ message: "Something went wrong. Please try again later." });
//     }
// };


const procedToCheckOut = async (req, res) => {
    try {
        let selectedItems = req.body.selectedItems;
        const userId = req.session.user;
        let addressId = req.body.addressId;
        const paymentMethod = req.body.paymentMethod;

        const cart = await Cart.findOne({ userId });
        if (!cart || cart.items.length < 1) {
            return res.status(500).json({ message: 'Your cart is empty' });
        }

        const products = [];
        let totalAmount = 0;

        for (const item of selectedItems) {
            const product = await Product.findById(item.productId);
            if (!product) return res.status(500).json({ message: `Product with ID ${item.productId} not found.` });

            if (product.isBlocked) return res.status(500).json({ message: `${product.productName} is currently blocked.` });

            const category = await Category.findById(product.category);
            if (!category || !category.isListed) return res.status(500).json({ message: `Category unavailable for ${product.productName}.` });

            const variant = product.variants.find(v => v.size === item.size);
            if (!variant) return res.status(500).json({ message: `Size ${item.size} not found for ${product.productName}.` });

            if (variant.quantity < item.quantity) return res.status(500).json({ message: `Only ${variant.quantity} left for ${product.productName}.` });

            const totalPrice = variant.salePrice * item.quantity;
            totalAmount += totalPrice;

            products.push({
                productId: product._id,
                name: product.productName,
                size: variant.size,
                quantity: item.quantity,
                price: variant.salePrice,
                totalPrice: totalPrice
            });
        }

        const adrs = await Address.findOne({ userId: userId });
        const selectedAddress = adrs?.address.find(
            ad => ad._id.toString() === addressId.toString()
        );

        if (!selectedAddress) {
            return res.status(500).json({ message: 'Selected address not found' });
        }

        const clonedAddress = selectedAddress.toObject();

        if (paymentMethod !== 'cod') {
            return res.status(500).json({ message: 'Now only available cash on delivery' });
        }

        // Check if a pending order already exists
        let existingOrder = await Order.findOne({ userId, status: "Pending", paymentStatus: "Pending" });

            // Create new order
            const newOrder = new Order({
                userId,
                orderedItems: products.map(item => ({
                    product: item.productId,
                    productName:item.name,
                    size: item.size,
                    quantity: item.quantity,
                    price: item.price,
                    status: 'Pending',
                    returnStatus: null,
                })),
                totalPrice: totalAmount,
                discount: 0,
                finalAmount: totalAmount,
                address: {
                    addressType: clonedAddress.addressType,
                    name: clonedAddress.name,
                    country: clonedAddress.country,
                    state: clonedAddress.state,
                    city: clonedAddress.city,
                    street: clonedAddress.street,
                    pincode: clonedAddress.pincode,
                    phone: clonedAddress.phone,
                    altPhone: clonedAddress.altPhone
                },
                status: "Pending",
                returnStatus: null,
                paymentMethod: 'COD',
                paymentStatus: 'Pending',
                createdOn: new Date()
            });

            await newOrder.save();
            console.log("New order created.");
      

        // Update stock
        for (const item of products) {
            const product = await Product.findById(item.productId);
            if (product) {
                const variant = product.variants.find(v => v.size === item.size);
                if (variant) {
                    variant.quantity -= item.quantity;
                    await product.save();
                    console.log(`Updated product variant for size ${item.size}`);
                } else {
                    console.log(`Variant with size ${item.size} not found in product.`);
                }
            } else {
                console.log('Product not found!');
            }
        }

        for(let item of products){
            await Cart.updateOne(
                {userId:userId},
                {
                    $pull:{
                        items:{
                            productId:item.productId
                        }
                    }
                }
            )
        }
        return res.status(200).json({ message: 'Order placed successfully!' });

    } catch (error) {
        console.error("Error in procedToCheckOut:", error);
        res.status(500).json({ message: "Something went wrong. Please try again later." });
    }
};

const orderSuccess =async(req,res)=>{
    try {
        const userId = req.session.user
        const order = await Order.findOne({userId}).sort({createdOn:1})
        const products = order.orderedItems
        res.render('orderSuccessPage',{
            order:order,
            products:products
        })
    } catch (error) {
        console.error('error in orderSuccess',error)
        res.redirect('/pageNotFound')
    }
}

module.exports = {
    checkoutpage,
    getCheckoutpage,
    procedToCheckOut,
    orderSuccess
}