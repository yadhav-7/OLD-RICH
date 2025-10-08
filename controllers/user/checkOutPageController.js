const Cart = require('../../models/cartSchema')
const User = require('../../models/userSchema')
const Product = require('../../models/productSchema')
const Category = require('../../models/catagory')
const Address = require('../../models/addressSchema')
const Order = require('../../models/orderSchema')
const Coupon = require('../../models/couponSchema')
const Wallet = require('../../models/walletSchema')
const env = require('dotenv').config()
const Razorpay = require("razorpay")
const crypto = require("crypto")


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
        })

        if (issues.length > 0) {

            const detailedIssues = issues.map(issue => {
                return ` "${issue.productName || 'Unknown Product'}"${issue.size ? ` (Size: ${issue.size})` : ''} - ${issue.issue}`;
            });

            return res.status(400).json({
                success: false,
                message: 'Some items cannot be checked out. Please review the issues.',
                issues,
                detailedIssues,
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
}

const getCheckoutpage = async (req, res) => {
    try {
        const currentDate = new Date()
        const coupons = await Coupon.find({
            isList: true,
            expireOn: { $gt: currentDate }
        }).sort({ createdOn: -1 })

        const itemIds = req.query.item

        const userId = req.session.user

        const orderId = req.query.orderId

        const userData = await User.findById(userId)

        const userAddress = await Address.findOne({ userId: userId })
        if (orderId) {
            const order = await Order.findOne({ orderId: orderId })
            if (!order) {
                console.log(`order not found orderId${orderId}`)

                return res.redirect('/pageNotFound')
            }
            const productIds = order.orderedItems.map(item => item.product);
            const products = await Product.find({ _id: { $in: productIds } });
            return res.render('checkOutPage', {
                user: userData,
                products,
                selectedItems: order.orderedItems,
                cartTotal: order.finalAmount,
                address: userAddress?.address || [],
                coupons: null,
                savings: order.discount,
                razorpayKeyId: process.env.RAZORPAY_KEY_ID,
            })
        }
        const cart = await Cart.findOne({ userId })
        if (!cart || !cart.items || cart.items.length === 0) {
            return res.redirect('/pageNotFound');
        }
        const selectedItems = cart.items.filter(item =>
            itemIds.includes(item._id.toString())
        )
        const productIds = selectedItems.map((p) => p.productId.toString())
        const products = await Product.find({ _id: { $in: productIds } })

        let totalPrice = 0

        let savings = 0

        for (let i = 0; i < selectedItems.length; i++) {

            for (let j = 0; j < products.length; j++) {

                if (selectedItems[i].productId.toString() === products[j]._id.toString()) {

                    if (products[j].isBlocked) break

                    let category = await Category.findOne({ _id: products[j].category });
                    if (!category || !category.isListed) break

                    let matchedVariant = products[j].variants.find(
                        (v) =>
                            v.size === selectedItems[i].size &&
                            v.quantity >= selectedItems[i].quantity
                    )

                    if (matchedVariant) {
                        totalPrice += matchedVariant.salePrice * selectedItems[i].quantity
                        savings += selectedItems[i].quantity * (matchedVariant.regularPrice - matchedVariant.salePrice)
                    }

                    break
                }
            }
        }

        cart.total = totalPrice
        const userWallet = await Wallet.findOne({ userId: userId })
        await cart.save()

        return res.render('checkOutPage', {
            user: userData,
            products,
            selectedItems,
            cartTotal: cart.total,
            address: userAddress?.address || [],
            coupons,
            savings,
            razorpayKeyId: process.env.RAZORPAY_KEY_ID,
            walletBalance: userWallet?.balance || 0
        })
    } catch (error) {
        console.error('error in getCheckOutPage', error);
        res.redirect('/pageNotFound');
    }
}

const procedToCheckOut = async (req, res) => {
    try {
        let selectedItems = req.body.selectedItems
        const userId = req.session.user
        const retryPayment = req.body.retryPayment
        const retryOrderId = req.body.orderId
        const paymentMethod = req.body.paymentMethod
        let transaction
        const userWallet = await Wallet.findOne({ userId: userId })


        if (retryPayment) {
            const order = await Order.findOne({ orderId: retryOrderId })
            if (!order) return res.status(401).json({ message: 'Order not found' })
            if (paymentMethod === 'COD') {
                order.status = 'Pending'
                order.paymentStatus = 'Pending'
                for (let item of order.orderedItems) {
                    item.status = 'Pending'
                }
            } else if (paymentMethod === 'WALLET') {
                order.paymentStatus = 'Completed'
                order.paymentMethod='WALLET'
                if (!userWallet) return res.status(401).json({ message: 'Cannot find Your wallet' })
                const balance = userWallet.balance
                if (balance < order.finalAmount) return res.status(401).json({ message: 'Insaficiant balance' })
                userWallet.totalDebited += order.finalAmount
                userWallet.balance -= order.finalAmount
                order.status = 'Pending'
                for (let item of order.orderedItems) {
                    item.status = 'Pending'
                }

                transaction = {
                    type: 'debit',
                    amount: order.finalAmount,
                    reason: 'Amount debited for order',
                    orderId: order.orderId,
                    productId: order.orderedItems?.map(i=>i.product),
                    productQuantity: order.orderedItems?.length,
                    createdAt: new Date()
                }
                userWallet.transactions.push(transaction)
                userWallet.save()
            }
            await order.updateOne({ $unset: { razorPay: '' } })
            await order.save()
            return res.status(200).json({ success: true, message: 'Order placed successfully!', orderId: retryOrderId })
        }


        let addressId = req.body.addressId

        const code = req.body.code
        const couponApplied = req.body.couponApplied
        const couponDiscount = req.body.couponDiscount

        const cart = await Cart.findOne({ userId })

        if (!cart || cart.items.length < 1) {
            return res.status(500).json({ message: 'Your cart is empty' });
        }

        const coupon = await Coupon.findOne({ code: code })
        const products = []
        let totalAmount = 0
        let finalAmount = 0
        let discount = 0
        let discountPerItem

        if (coupon?.amount) {
            discountPerItem = coupon.amount / selectedItems.length
        }
        for (const item of selectedItems) {
            const product = await Product.findById(item.productId);
            if (!product) return res.status(500).json({ message: `Product with ID ${item.productId} not found.` });

            if (product.isBlocked) return res.status(500).json({ message: `${product.productName} is currently blocked.` });

            const category = await Category.findById(product.category);
            if (!category || !category.isListed) return res.status(500).json({ message: `Category unavailable for ${product.productName}.` });

            const variant = product.variants.find(v => v.size === item.size);
            if (!variant) return res.status(500).json({ message: `Size ${item.size} not found for ${product.productName}.` });
            discount += (variant.regularPrice * item.quantity) - (variant.salePrice * item.quantity)
            if (variant.quantity < item.quantity) return res.status(500).json({ message: `Only ${variant.quantity} left for ${product.productName}.` });

            const totalPrice = variant.salePrice * item.quantity;
            totalAmount += totalPrice;
            finalAmount += totalPrice

            let finalPrice = coupon ? variant.salePrice - (discountPerItem / item.quantity) : variant.salePrice
            finalPrice = parseInt(finalPrice)

            products.push({
                productId: product._id,
                name: product.productName,
                size: variant.size,
                categoryId: product.category,
                quantity: item.quantity,
                price: variant.salePrice,
                finalPrice: finalPrice,
                totalPrice: totalPrice
            })
        }



        if (coupon?.amount) {
            finalAmount = finalAmount - coupon.amount
            discount += coupon.amount
        }

      

        if (paymentMethod === 'WALLET') {
            if (!userWallet) return res.status(401).json({ message: 'Cannot find Your wallet' })
            const balance = userWallet.balance
            if (balance < finalAmount) return res.status(401).json({ message: 'Insaficiant balance' })
            userWallet.totalDebited += finalAmount
            userWallet.balance -= finalAmount

            transaction = {
                type: 'debit',
                amount: finalAmount,
                reason: 'Amount debited for order',
                orderId: null,
                productId: [],
                productQuantity: null,
                createdAt: new Date()
            }
        }

        let peymentStatus
        if (paymentMethod === 'COD') peymentStatus = 'Pending'
        if (paymentMethod === 'WALLET') peymentStatus = 'Completed'




        const adrs = await Address.findOne({ userId: userId })
        const selectedAddress = adrs?.address.find(
            ad => ad._id.toString() === addressId.toString()
        )
        if (!selectedAddress) {
            return res.status(500).json({ message: 'Selected address not found' });
        }
        const clonedAddress = structuredClone(selectedAddress.toObject())
        // Check if a pending order already exists
        let existingOrder = await Order.findOne({ userId, status: "Pending", paymentStatus: "Pending" });
        let appliedCoupon = {
            applied: false,
            code: null,
            amount: null
        }
        if (couponApplied) {
            appliedCoupon.applied = true
            appliedCoupon.code = parseInt(code)
            appliedCoupon.amount = parseInt(couponDiscount)
        }
        const newOrder = new Order({
            userId,
            orderedItems: products.map(item => ({
                product: item.productId,
                productName: item.name,
                size: item.size,
                categoryId: item.categoryId,
                quantity: item.quantity,
                price: item.price,
                finalPrice: item.finalPrice,
                status: 'Pending',
                returnStatus: null,
            })),
            totalPrice: totalAmount,
            discount: discount,
            finalAmount: finalAmount,
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
            paymentMethod: paymentMethod,
            paymentStatus: peymentStatus,
            couponApplied: appliedCoupon,
            createdOn: new Date()

        })
        if (coupon) {
            coupon.usedBy?.push(userId)
            await coupon.save()
        }
        await newOrder.save()


        const orderId = newOrder.orderId



        if (paymentMethod === 'WALLET' && transaction) {
            for (let product of newOrder.orderedItems) {
                transaction.productId.push(product.product);
            }
            transaction.productQuantity = newOrder.orderedItems?.length;
            userWallet.transactions.push(transaction);
            await userWallet.save();
        }




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
        for (let item of products) {
            await Cart.updateOne(
                { userId: userId },
                {
                    $pull: {
                        items: {
                            productId: item.productId
                        }
                    }
                }
            )
        }
        console.log('procedToCheckOut end')
        return res.status(200).json({ success: true, message: 'Order placed successfully!', orderId });
    } catch (error) {
        console.error("Error in procedToCheckOut:", error);
        res.status(501).json({ message: "Something went wrong. Please try again later." });
    }
}
const applyCoupon = async (req, res) => {
    try {
        const userId = req.session.user

        const { code } = req.body

        if (!code) return res.status(401).json({ message: 'Coupon Code is required!' })

        const coupon = await Coupon.findOne({ code: code })

        if (!coupon) return res.status(401).json({ message: 'Invalid coupon code' })

        if (coupon.usedBy?.includes(userId)) return res.status(401).json({ message: 'User already used this coupon' })

        if (!coupon.isList) return res.state(401).json({ message: 'Sorry! This coupon is not available now' })

        if (coupon.expireOn < new Date()) return res.status(401).json({ message: 'This coupon is expired' })

        const cart = await Cart.findOne({ userId })
            .populate('items.productId', 'productName isBlocked salePrice variants');


        if (cart.items?.length === 0 || !cart) return res.status(401).json({ message: 'Cart is empty' })

        if (coupon.minimumPrice > cart.total) {
            return res.status(400).json({ message: `Cart total must be at least ₹${coupon.minimumPrice} to use this coupon.` })
        }
        let totalCart = cart.total - coupon.amount
        let savings = req.body.savings


        let amount = savings.slice(2);
        savings = parseInt(amount) + coupon.amount

        couponDiscount = coupon.amount

        res.status(200).json({ message: 'coupon applied successfull', totalCart, savings, couponDiscount })

    } catch (error) {
        console.error('error in apply coupon ', error)
        return res.status(500).json({ message: 'internal server error' })
    }
}

const createRazorpayOrder = async (req, res) => {
    try {
        console.log('createRazorpayOrder start');
        const userId = req.session.user;
        const { selectedItems, addressId, code, couponApplied, couponDiscount } = req.body;

        let appliedCoupon = {
            applied: false,
            code: null,
            amount: null
        };
        if (couponApplied) {
            appliedCoupon.applied = true;
            appliedCoupon.code = code;
            appliedCoupon.amount = parseInt(couponDiscount);
        }

        if (!userId) return res.status(401).json({ message: "User not found" });
        if (!selectedItems || selectedItems.length === 0) return res.status(400).json({ message: "No items selected" });
        if (!addressId) return res.status(400).json({ message: "Address not found" });

        const cart = await Cart.findOne({ userId });
        if (!cart || cart.items.length === 0) return res.status(400).json({ message: "Cart is empty" });

        const coupon = code ? await Coupon.findOne({ code }) : null;

        let totalAmount = 0, finalAmount = 0, discount = 0;
        let products = []
        let totalPrice = 0


        let discountPerItem = coupon?.amount ? coupon.amount / selectedItems.length : 0
        let finalPrice = 0

        for (const item of selectedItems) {
            const product = await Product.findById(item.productId);
            if (!product) return res.status(400).json({ message: `Product ${item.productId} not found` });
            if (product.isBlocked) return res.status(400).json({ message: `${product.productName} is blocked` });

            const category = await Category.findById(product.category);
            if (!category || !category.isListed) return res.status(400).json({ message: `Category unavailable for ${product.productName}` });

            const variant = product.variants.find(v => v.size === item.size);
            if (!variant) return res.status(400).json({ message: `Variant ${item.size} not found for ${product.productName}` });
            if (variant.quantity < item.quantity) return res.status(400).json({ message: `Only ${variant.quantity} left for ${product.productName}` });

            totalPrice += variant.salePrice * item.quantity
            finalPrice = variant.salePrice - (discountPerItem / item.quantity)

            finalAmount += finalPrice * item.quantity
            discount += variant.regularPrice - variant.salePrice
            products.push({
                productId: product._id,
                name: product.productName,
                size: variant.size,
                categoryId: product.category,
                quantity: item.quantity,
                price: variant.salePrice,
                finalPrice,
            })

        }

        if (coupon?.amount) {
            discount += coupon.amount;
        }


        const adrs = await Address.findOne({ userId });
        const selectedAddress = adrs?.address.find(ad => ad._id.toString() === addressId.toString());
        if (!selectedAddress) return res.status(400).json({ message: "Selected address not found" });

        console.log('process.env.RAZORPAY_KEY_ID', process.env.RAZORPAY_KEY_ID);
        console.log('process.env.RAZORPAY_KEY_SECRET', process.env.RAZORPAY_KEY_SECRET);

        const razorPay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        const clonedAddress = structuredClone(selectedAddress.toObject());

        console.log('finalAmount', finalAmount)

        const razorpayOrder = await razorPay.orders.create({
            amount: Math.round(finalAmount * 100),
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
            notes: { userId, addressId, code }
        });


        const newOrder = new Order({
            userId,
            orderedItems: products.map(item => ({
                product: item.productId,
                productName: item.name,
                size: item.size,
                categoryId: item.categoryId,
                quantity: item.quantity,
                price: item.price,
                finalPrice: item.finalPrice,
                status: 'Pending',
                returnStatus: null,
            })),
            totalPrice: totalPrice,
            discount: discount,
            finalAmount: finalAmount,
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
            paymentMethod: 'RPAY',
            paymentStatus: 'Completed',
            razorPay: { orderId: razorpayOrder.id },
            couponApplied: appliedCoupon,
            createdOn: new Date()
        });

        await newOrder.save()

        if (couponApplied) {
            coupon.usedBy.push(newOrder.userId)
            await coupon.save()
        }

        // Update stock quantities
        for (let p of products) {
            const product = await Product.findById(p.productId)
            if (product) {
                let variant = product.variants?.find(v => v.size === p.size);
                if (variant) {
                    variant.quantity -= p.quantity;
                    await product.save();
                } else {
                    console.log(`Variant not found: ${product._id} ${product.productName} size ${p.size}`);
                }
            } else {
                console.log(`Product not found: ${p.productId}`);
            }
        }

        // Remove items from cart
        for (let item of products) {
            await Cart.updateOne(
                { userId: userId },
                { $pull: { items: { productId: item.productId } } }
            );
        }

        console.log('createRazorpayOrder end');

        return res.status(200).json({
            success: true,
            key: process.env.RAZORPAY_KEY_ID,
            orderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            products,
            address: selectedAddress,
            couponApplied: couponApplied ? { applied: true, code, amount: couponDiscount } : { applied: false }
        });

    } catch (error) {
        console.error("Error in createRazorpayOrder:", error);
        res.status(500).json({ message: "Something went wrong" });
    }
}

const verifyRazorpayPayment = async (req, res) => {
    try {

        console.log('verifyRazorpayPayment start')
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature, selectedItems, userId, address, couponApplied, couponCode } = req.body;

        if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
            return res.status(400).json({ message: "Missing Razorpay credentials" });
        }

        const generated_signature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        const order = await Order.findOne({ "razorPay.orderId": razorpay_order_id })
        if (generated_signature !== razorpay_signature) {


            if (!order) return res.status(401).json({ success: false, message: 'Cannot find Your order' })

            order.paymentStatus = 'Failed'
            order.status = 'Failed'
            for (let item of order.orderedItems) {
                item.status = 'Failed'
            }

            await order.save()

            return res.status(400).json({ success: false, message: "Payment verification failed" })

        }
        order.paymentStatus = 'Completed'
        order.status = 'Pending'
        for (let item of order.orderedItems) {
            item.status = 'Pending'
        }
        await order.save()

        console.log('verifyRazorpayPayment end')
        return res.status(200).json({ success: true, message: "Payment verified and order placed", orderId: order.orderId });

    } catch (error) {

        console.error("Error in verifyRazorpayPayment:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

const orderSuccess = async (req, res) => {
    try {
        const userId = req.session.user
        const orderId = req.query.orderId

        const order = await Order.findOne({ orderId }).sort({ createdOn: 1 })
        console.log('orderId', orderId)
        console.log('typeof orderId', typeof orderId)
        console.log('order', order)
        console.log('order.orderedItems', order.orderedItems)
        const products = order.orderedItems
        console.log('order', order)
        res.render('orderSuccessPage', {
            order: order,
            products: products
        })
    } catch (error) {
        console.error('error in orderSuccess', error)
        res.redirect('/pageNotFound')
    }
}

const paymentFaild = async (req, res) => {
    try {
        console.log('paymentFaild')

        const razorPayOrderId = req.query.razorPayOrderId
        console.log("razorPayOrderId", razorPayOrderId)
        console.log('typeof razorPayOrderId', typeof razorPayOrderId)
        const order = await Order.findOne({ "razorPay.orderId": razorPayOrderId })
        console.log('order', order)
        if (!order) {
            console.error('cannot find order in paymentFaild')
            return res.redirect('/pageNotFound')
        }
        order.paymentStatus = 'Failed'
        order.status = 'Failed'
        for (let item of order.orderedItems) {
            item.status = 'Failed'
        }
        await order.save()

        return res.render('retryPayment', { order, retryPayment: true })

    } catch (error) {
        console.error('error in paymentFaild', error)
        return res.redirect('/pageNotFound')
    }
}

const paymentFaildRetry = async (req, res) => {
    try {
        console.log('paymentFaildRetry')
        const orderId = req.query.orderId
        const order = await Order.findOne({ orderId: orderId });
        if (!order) {
            console.error('order Not found')
            return res.redirect('/pageNotFoud')
        }
        const userId = req.session.user
        const user = await User.findOne({ _id: userId })
        if (!user) {
            console.error('user not found')
            return res.redirect('/pageNotFound')
        }

        const currentDate = new Date()
        const coupons = await Coupon.find({
            isList: true,
            expireOn: { $gt: currentDate }
        })

        const productIds = order.orderedItems?.map(items => items.product)
        const products = await Product.find({ _id: { $in: productIds } })

        let selectedItems = []

        for (let item of order.orderedItems) {
            selectedItems.push({
                productId: item.product,
                size: item.size,
                quantity: item.quantity,
                price: item.price,
                totalPrice: item.finalPrice
            })
        }

        const cartTotal = order.finalAmount

        const savings = order.discount

        const userAddress = await Address.findOne({ userId: userId })

        const userWallet = await Wallet.findOne({ userId: userId })

        const walletBalance = userWallet.balance

        return res.render('checkOutPage', {
            user,
            products,
            selectedItems,
            cartTotal,
            address: userAddress?.address || [],
            coupons,
            savings,
            razorpayKeyId: process.env.RAZORPAY_KEY_ID,
            retryPayment: true,
            orderId: order.orderId,
            walletBalance
        })

    } catch (error) {
        console.error('error in paymentFaildRetry', error)
        return res.redirect('/pageNotFound')
    }
}

const reCreateOrder = async (req, res) => {
    try {
        console.log('reCreateOrder start')

        const retryPayment = req.body.retryPayment

        const retryOrderId = req.body.orderId

        const retryOrder = await Order.findOne({ orderId: retryOrderId })
        if (!retryOrder) return res.status(401).json({ message: 'Order Not Found!' })
        if (retryOrder.paymentStatus !== 'Failed') return res.status(401).json({ message: `order status is ${retryOrder.status}` })
        const razorPay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        })
        const razorpayOrder = await razorPay.orders.create({
            amount: Math.round(retryOrder.finalAmount * 100),
            currency: 'INR',
            receipt: `retry_order_rcpt_${Date.now()}`,
            notes: {
                userId: retryOrder.userId,
                orderId: retryOrder.orderId,

            },
        })
        console.log(8)
        retryOrder.razorPay.orderId = razorpayOrder.id
        console.log(9)
        await retryOrder.save()
        console.log(10)
        console.log('razorPayOrderId', razorpayOrder.id)
        console.log(11)
        return res.status(200).json({
            success: true,
            key: process.env.RAZORPAY_KEY_ID,
            orderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            // products,
            // address: selectedAddress,
            // couponApplied: couponApplied ? { applied: true, code, amount: couponDiscount } : { applied: false }
        });

    } catch (error) {
        console.error('error in reCreateOrder', error)
        return res.status(401).json({ message: 'Internal Server Error' })
    }
}
module.exports = {
    checkoutpage,
    getCheckoutpage,
    procedToCheckOut,
    orderSuccess,
    applyCoupon,
    createRazorpayOrder,
    verifyRazorpayPayment,
    paymentFaild,
    paymentFaildRetry,
    reCreateOrder
}