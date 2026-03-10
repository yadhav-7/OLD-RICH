import Cart from '../../models/cartSchema.js'
import User from '../../models/userSchema.js'
import Product from '../../models/productSchema.js'
import Category from '../../models/catagory.js'
import Address from '../../models/addressSchema.js'
import Order from '../../models/orderSchema.js'
import Coupon from '../../models/couponSchema.js'
import Wallet from '../../models/walletSchema.js'
import logger from '../../utils/logger.js'
import Razorpay from 'razorpay'
import crypto from 'crypto'
import dotenv from 'dotenv'

dotenv.config()

const validateCheckoutItems = async (userId, cartItemIdsFromClient) => {
    try {
        const cart = await Cart.findOne({ userId }).populate({
            path: 'items.productId',
            populate: {
                path: 'category',
            },
        })

        if (!cart || !cart.items || cart.items.length < 1) {
            return {
                status: false,
                statusCode: 400,
                message: 'Your cart is empty. Fill it with treasures before proceeding!',
            }
        }

        const matchedCartItems = cart.items.filter((item) =>
            cartItemIdsFromClient.includes(item._id.toString())
        )

        if (matchedCartItems.length < 1) {
            return {
                status: false,
                statusCode: 403,
                message: 'No valid items found in your cart for checkout.',
            }
        }

        const issues = []

        const validItems = matchedCartItems.filter((item) => {
            const product = item.productId
            const category = product?.category

            if (!product) {
                issues.push({
                    itemId: item._id,
                    issue: 'Product no longer exists',
                })
                return false
            }

            if (product.isBlocked) {
                issues.push({
                    itemId: item._id,
                    productId: product._id,
                    productName: product.productName,
                    issue: 'Product is blocked',
                })
                return false
            }

            if (!category || !category.isListed) {
                issues.push({
                    itemId: item._id,
                    productId: product._id,
                    productName: product.productName,
                    issue: 'Product category is not listed',
                })
                return false
            }

            if (product.variants && product.variants.length > 0) {
                const selectedVariant = product.variants.find(
                    (v) => v.size === item.size
                )
                if (!selectedVariant || selectedVariant.quantity < item.quantity) {
                    issues.push({
                        itemId: item._id,
                        productId: product._id,
                        productName: product.productName,
                        size: item.size,
                        issue: 'Not enough stock for selected variant',
                    })
                    return false
                }
            } else if (product.quantity < item.quantity) {
                issues.push({
                    itemId: item._id,
                    productId: product._id,
                    productName: product.productName,
                    issue: 'Not enough stock for this product',
                })
                return false
            }

            return true
        })

        if (issues.length > 0) {
            const detailedIssues = issues.map((issue) => {
                return ` "${issue.productName || 'Unknown Product'}"${issue.size ? ` (Size: ${issue.size})` : ''
                    } - ${issue.issue}`
            })

            return {
                status: false,
                statusCode: 400,
                message: 'Some items cannot be checked out. Please review the issues.',
                issues,
                detailedIssues,
            }
        }

        return {
            status: true,
            statusCode: 200,
            message: 'All items are valid and ready for checkout!',
            validItems,
        }
    } catch (error) {
        logger.error(`Error in validateCheckoutItems service: ${error}`)
        throw error
    }
}

const getCheckoutPageData = async (userId, itemIds, orderId) => {
    try {
        const currentDate = new Date()
        const cart = await Cart.findOne({ userId })
        const userData = await User.findById(userId)
        const userAddress = await Address.findOne({ userId })

        if (orderId) {
            const order = await Order.findOne({ orderId })
            if (!order) {
                return { status: false, statusCode: 404, redirectUrl: '/pageNotFound' }
            }
            const productIds = order.orderedItems.map((item) => item.product)
            const products = await Product.find({ _id: { $in: productIds } })

            return {
                status: true,
                render: 'checkOutPage',
                data: {
                    user: userData,
                    products,
                    selectedItems: order.orderedItems,
                    cartTotal: order.finalAmount,
                    address: userAddress?.address || [],
                    coupons: null,
                    savings: order.discount,
                    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
                    retryPayment: true,
                    orderId: order.orderId,
                }
            }
        }

        if (!cart || !cart.items || cart.items.length === 0) {
            return { status: false, statusCode: 404, redirectUrl: '/pageNotFound' }
        }

        const coupons = await Coupon.find({
            minimumPrice: { $lte: cart.total },
            usedBy: { $nin: [userId] },
            isList: true,
            expireOn: { $gt: currentDate },
            $expr: { $lt: [{ $size: '$usedBy' }, '$maxUsage'] },
        }).sort({ createdOn: -1 })

        let selectedItemIds = [];
        if (Array.isArray(itemIds)) {
            selectedItemIds = itemIds;
        } else if (typeof itemIds === 'string' && itemIds) {
            selectedItemIds = itemIds.split(',');
        }

        const selectedItems = cart.items.filter((item) =>
            selectedItemIds.includes(item._id.toString())
        )

        const productIds = selectedItems.map((p) => p.productId.toString())
        const products = await Product.find({ _id: { $in: productIds } })

        let totalPrice = 0
        let savings = 0

        for (let i = 0; i < selectedItems.length; i++) {
            for (let j = 0; j < products.length; j++) {
                if (selectedItems[i].productId.toString() === products[j]._id.toString()) {
                    if (products[j].isBlocked) break

                    const category = await Category.findOne({ _id: products[j].category })
                    if (!category || !category.isListed) break

                    const matchedVariant = products[j].variants.find(
                        (v) =>
                            v.size === selectedItems[i].size &&
                            v.quantity >= selectedItems[i].quantity
                    )

                    if (matchedVariant) {
                        totalPrice += matchedVariant.salePrice * selectedItems[i].quantity
                        savings +=
                            selectedItems[i].quantity *
                            (matchedVariant.regularPrice - matchedVariant.salePrice)
                    }
                    break
                }
            }
        }

        cart.total = totalPrice
        const userWallet = await Wallet.findOne({ userId })
        await cart.save()

        return {
            status: true,
            render: 'checkOutPage',
            data: {
                user: userData,
                products,
                selectedItems,
                cartTotal: cart.total,
                address: userAddress?.address || [],
                coupons,
                savings,
                razorpayKeyId: process.env.RAZORPAY_KEY_ID,
                walletBalance: userWallet?.balance || 0,
            }
        }
    } catch (error) {
        logger.error(`Error in getCheckoutPageData service: ${error}`)
        throw error
    }
}

const placeOrder = async (userId, orderData) => {
    try {
        const {
            selectedItems,
            retryPayment,
            orderId: retryOrderId,
            paymentMethod,
            addressId,
            code,
            couponApplied,
            couponDiscount
        } = orderData

        const userWallet = await Wallet.findOne({ userId })
        let transaction

        if (retryPayment) {
            const order = await Order.findOne({ orderId: retryOrderId })
            if (!order) return { status: false, statusCode: 401, message: 'Order not found' }

            if (paymentMethod === 'COD') {
                if (order.finalAmount > 1000)
                    return { status: false, statusCode: 401, message: 'Order above Rs 1000 not be allowed for COD' }

                order.status = 'Pending'
                order.paymentStatus = 'Pending'
                for (const item of order.orderedItems) {
                    item.status = 'Pending'
                }
                order.paymentMethod = 'COD'
            } else if (paymentMethod === 'WALLET') {
                order.paymentStatus = 'Completed'
                order.paymentMethod = 'WALLET'

                if (!userWallet) return { status: false, statusCode: 401, message: 'Cannot find Your wallet' }

                if (userWallet.balance < order.finalAmount)
                    return { status: false, statusCode: 401, message: 'Insaficiant balance' }

                userWallet.totalDebited += order.finalAmount
                userWallet.balance -= order.finalAmount
                order.status = 'Pending'

                for (const item of order.orderedItems) {
                    item.status = 'Pending'
                }

                transaction = {
                    type: 'debit',
                    amount: order.finalAmount,
                    reason: 'Amount debited for order',
                    orderId: order.orderId,
                    productId: order.orderedItems?.map((i) => i.product),
                    productQuantity: order.orderedItems?.length,
                    createdAt: new Date(),
                }
                userWallet.transactions.push(transaction)
                await userWallet.save()
            }
            await order.updateOne({ $unset: { razorPay: '' } })
            await order.save()

            return { status: true, statusCode: 200, message: 'Order placed successfully!', orderId: retryOrderId }
        }

        const cart = await Cart.findOne({ userId })

        if (!cart || cart.items.length < 1) {
            return { status: false, statusCode: 500, message: 'Your cart is empty' }
        }

        if (paymentMethod === 'COD' && cart.total > 1000)
            return { status: false, statusCode: 401, message: 'Order above Rs 1000 not be allowed for COD' }

        const coupon = await Coupon.findOne({ code })
        const products = []
        let totalAmount = 0
        let finalAmount = 0
        let discount = 0
        let discountPerItem = 0

        if (coupon?.amount) {
            discountPerItem = coupon.amount / selectedItems.length
        }

        for (const item of selectedItems) {
            const product = await Product.findById(item.productId)
            if (!product) return { status: false, statusCode: 500, message: `Product with ID ${item.productId} not found.` }
            if (product.isBlocked) return { status: false, statusCode: 500, message: `${product.productName} is currently blocked.` }

            const category = await Category.findById(product.category)
            if (!category || !category.isListed) return { status: false, statusCode: 500, message: `Category unavailable for ${product.productName}.` }

            const variant = product.variants.find((v) => v.size === item.size)
            if (!variant) return { status: false, statusCode: 500, message: `Size ${item.size} not found for ${product.productName}.` }

            discount += variant.regularPrice * item.quantity - variant.salePrice * item.quantity
            if (variant.quantity < item.quantity) return { status: false, statusCode: 500, message: `Only ${variant.quantity} left for ${product.productName}.` }

            const totalPrice = variant.salePrice * item.quantity
            totalAmount += totalPrice
            finalAmount += totalPrice

            let finalPrice = coupon ? variant.salePrice - discountPerItem / item.quantity : variant.salePrice
            finalPrice = parseInt(finalPrice, 10)

            products.push({
                productId: product._id,
                name: product.productName,
                size: variant.size,
                categoryId: product.category,
                quantity: item.quantity,
                regularPrice: variant.regularPrice,
                price: variant.salePrice,
                finalPrice,
                totalPrice,
            })
        }

        if (coupon?.amount) {
            finalAmount -= coupon.amount
            discount += coupon.amount
        }

        if (paymentMethod === 'WALLET') {
            if (!userWallet) return { status: false, statusCode: 401, message: 'Cannot find Your wallet' }
            if (userWallet.balance < finalAmount) return { status: false, statusCode: 401, message: 'Insaficiant balance' }

            userWallet.totalDebited += finalAmount
            userWallet.balance -= finalAmount

            transaction = {
                type: 'debit',
                amount: finalAmount,
                reason: 'Amount debited for order',
                orderId: null,
                productId: [],
                productQuantity: null,
                createdAt: new Date(),
            }
        }

        let peymentStatus
        if (paymentMethod === 'COD') peymentStatus = 'Pending'
        if (paymentMethod === 'WALLET') peymentStatus = 'Completed'

        const adrs = await Address.findOne({ userId })
        const selectedAddress = adrs?.address.find(
            (ad) => ad._id.toString() === addressId.toString(),
        )
        if (!selectedAddress) {
            return { status: false, statusCode: 500, message: 'Selected address not found' }
        }

        const clonedAddress = selectedAddress.toObject ? structuredClone(selectedAddress.toObject()) : structuredClone(selectedAddress)

        const appliedCouponData = {
            applied: false,
            code: null,
            amount: null,
        }

        if (couponApplied) {
            appliedCouponData.applied = true
            appliedCouponData.code = code
            appliedCouponData.amount = parseInt(couponDiscount, 10)
        }

        const newOrder = new Order({
            userId,
            orderedItems: products.map((item) => ({
                product: item.productId,
                productName: item.name,
                size: item.size,
                categoryId: item.categoryId,
                quantity: item.quantity,
                regularPrice: item.regularPrice,
                price: item.price,
                finalPrice: item.finalPrice,
                status: 'Pending',
                returnStatus: null,
            })),
            totalPrice: totalAmount,
            discount,
            finalAmount,
            address: {
                addressType: clonedAddress.addressType,
                name: clonedAddress.name,
                country: clonedAddress.country,
                state: clonedAddress.state,
                city: clonedAddress.city,
                street: clonedAddress.street,
                pincode: clonedAddress.pincode,
                phone: clonedAddress.phone,
                altPhone: clonedAddress.altPhone,
            },
            status: 'Pending',
            returnStatus: null,
            paymentMethod,
            paymentStatus: peymentStatus,
            couponApplied: appliedCouponData,
            createdOn: new Date(),
        })

        if (coupon) {
            coupon.usedBy?.push(userId)
            await coupon.save()
        }
        await newOrder.save()
        const { orderId } = newOrder

        if (paymentMethod === 'WALLET' && transaction) {
            for (const product of newOrder.orderedItems) {
                transaction.productId.push(product.product)
            }
            transaction.productQuantity = newOrder.orderedItems?.length
            userWallet.transactions.push(transaction)
            await userWallet.save()
        }

        // Reduce stock
        let totalQuantityofProduct
        for (const item of products) {
            const product = await Product.findById(item.productId)
            if (product) {
                const variant = product.variants.find((v) => v.size === item.size)
                if (variant) {
                    variant.quantity -= item.quantity
                    await product.save()
                }
                totalQuantityofProduct = product.variants?.reduce((acc, curr) => acc + curr.quantity, 0)
            }
            if (totalQuantityofProduct === 0) {
                product.status = 'out of stock'
                await product.save()
            }
        }

        // Remove from cart
        for (const item of products) {
            await Cart.updateOne(
                { userId },
                { $pull: { items: { productId: item.productId, size: item.size } } }
            )
        }

        return { status: true, statusCode: 200, message: 'Order placed successfully!', orderId }

    } catch (error) {
        logger.error(`Error in placeOrder service: ${error}`)
        throw error
    }
}

const applyCoupon = async (userId, code) => {
    try {
        if (!code) return { status: false, statusCode: 401, message: 'Coupon Code is required!' }

        const coupon = await Coupon.findOne({ code })

        if (!coupon) return { status: false, statusCode: 401, message: 'Invalid coupon code' }

        if (coupon.usedBy?.includes(userId))
            return { status: false, statusCode: 401, message: 'User already used this coupon' }

        if (!coupon.isList)
            return { status: false, statusCode: 401, message: 'Sorry! This coupon is not available now' }

        if (coupon.expireOn < new Date())
            return { status: false, statusCode: 401, message: 'This coupon is expired' }

        if (coupon.maxUsage === coupon.usedBy.length)
            return { status: false, statusCode: 401, message: 'This coupon coupon not available' }

        const cart = await Cart.findOne({ userId }).populate(
            'items.productId',
            'productName isBlocked salePrice variants',
        )

        if (cart.items?.length === 0 || !cart)
            return { status: false, statusCode: 401, message: 'Cart is empty' }

        if (coupon.minimumPrice > cart.total) {
            return {
                status: false,
                statusCode: 400,
                message: `Cart total must be at least ₹${coupon.minimumPrice} to use this coupon.`,
            }
        }

        const totalCart = cart.total - coupon.amount

        return {
            status: true,
            statusCode: 200,
            coupon,
            totalCart,
            couponDiscount: coupon.amount
        }
    } catch (error) {
        logger.error(`Error in applyCoupon service: ${error}`)
        throw error
    }
}

const createRazorpayOrder = async (userId, orderData) => {
    try {
        const { selectedItems, addressId, code, couponApplied, couponDiscount } = orderData

        const appliedCoupon = {
            applied: false,
            code: null,
            amount: null,
        }
        if (couponApplied) {
            appliedCoupon.applied = true
            appliedCoupon.code = code
            appliedCoupon.amount = parseInt(couponDiscount, 10)
        }

        if (!userId) return { status: false, statusCode: 401, message: 'User not found' }
        if (!selectedItems || selectedItems.length === 0) return { status: false, statusCode: 400, message: 'No items selected' }
        if (!addressId) return { status: false, statusCode: 400, message: 'Address not found' }

        const cart = await Cart.findOne({ userId })
        if (!cart || cart.items.length === 0) return { status: false, statusCode: 400, message: 'Cart is empty' }

        const coupon = code ? await Coupon.findOne({ code }) : null

        let finalAmount = 0
        let discount = 0
        const products = []
        let totalPrice = 0

        const discountPerItem = coupon?.amount ? coupon.amount / selectedItems.length : 0
        let finalPrice = 0

        for (const item of selectedItems) {
            const product = await Product.findById(item.productId)
            if (!product) return { status: false, statusCode: 400, message: `Product ${item.productId} not found` }
            if (product.isBlocked) return { status: false, statusCode: 400, message: `${product.productName} is blocked` }

            const category = await Category.findById(product.category)
            if (!category || !category.isListed) return { status: false, statusCode: 400, message: `Category unavailable for ${product.productName}` }

            const variant = product.variants.find((v) => v.size === item.size)
            if (!variant) return { status: false, statusCode: 400, message: `Variant ${item.size} not found for ${product.productName}` }
            if (variant.quantity < item.quantity) return { status: false, statusCode: 400, message: `Only ${variant.quantity} left for ${product.productName}` }

            totalPrice += variant.salePrice * item.quantity
            finalPrice = variant.salePrice - discountPerItem / item.quantity
            finalAmount += finalPrice * item.quantity
            discount += (variant.regularPrice - variant.salePrice) * item.quantity

            products.push({
                productId: product._id,
                name: product.productName,
                size: variant.size,
                categoryId: product.category,
                quantity: item.quantity,
                regularPrice: variant.regularPrice,
                price: variant.salePrice,
                finalPrice,
            })
        }

        if (coupon?.amount) {
            discount += coupon.amount
        }

        const adrs = await Address.findOne({ userId })
        const selectedAddress = adrs?.address.find(
            (ad) => ad._id.toString() === addressId.toString(),
        )
        if (!selectedAddress) return { status: false, statusCode: 400, message: 'Selected address not found' }

        const razorPay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        })

        const clonedAddress = selectedAddress.toObject ? structuredClone(selectedAddress.toObject()) : structuredClone(selectedAddress)

        const razorpayOrder = await razorPay.orders.create({
            amount: Math.round(finalAmount * 100),
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
            notes: { userId, addressId, code },
        })

        const newOrder = new Order({
            userId,
            orderedItems: products.map((item) => ({
                product: item.productId,
                productName: item.name,
                size: item.size,
                categoryId: item.categoryId,
                quantity: item.quantity,
                regularPrice: item.regularPrice,
                price: item.price,
                finalPrice: item.finalPrice,
                status: 'Pending',
                returnStatus: null,
            })),
            totalPrice,
            discount,
            finalAmount,
            address: {
                addressType: clonedAddress.addressType,
                name: clonedAddress.name,
                country: clonedAddress.country,
                state: clonedAddress.state,
                city: clonedAddress.city,
                street: clonedAddress.street,
                pincode: clonedAddress.pincode,
                phone: clonedAddress.phone,
                altPhone: clonedAddress.altPhone,
            },
            status: 'Pending',
            returnStatus: null,
            paymentMethod: 'RPAY',
            paymentStatus: 'Pending',
            razorPay: { orderId: razorpayOrder.id },
            couponApplied: appliedCoupon,
            createdOn: new Date(),
        })

        await newOrder.save()

        if (couponApplied) {
            coupon.usedBy?.push(newOrder.userId)
            await coupon.save()
        }

        return {
            status: true,
            statusCode: 200,
            key: process.env.RAZORPAY_KEY_ID,
            orderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            products,
            address: selectedAddress,
            couponApplied: couponApplied ? { applied: true, code, amount: couponDiscount } : { applied: false },
        }
    } catch (error) {
        logger.error(`Error in createRazorpayOrder service: ${error}`)
        throw error
    }
}

const verifyRazorpayPayment = async (data) => {
    try {
        const {
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature,
        } = data

        if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
            return { status: false, statusCode: 400, message: 'Missing Razorpay credentials' }
        }

        const generated_signature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex')

        const order = await Order.findOne({ 'razorPay.orderId': razorpay_order_id })

        if (generated_signature !== razorpay_signature) {
            if (!order) return { status: false, statusCode: 401, message: 'Cannot find Your order' }

            order.paymentStatus = 'Failed'
            order.status = 'Failed'
            for (const item of order.orderedItems) {
                item.status = 'Failed'
            }
            await order.save()

            // Clean cart even on payment failure so items don't linger
            for (const item of order.orderedItems) {
                await Cart.updateOne(
                    { userId: order.userId },
                    { $pull: { items: { productId: item.product, size: item.size } } }
                )
            }

            return { status: false, statusCode: 200, message: 'Payment verification failed', orderId: order.orderId }
        }

        if (!order) return { status: false, statusCode: 401, message: 'Cannot find Your order' }

        // Guard: Only deduct stock if this order has not been paid before (prevents double deduction on retries)
        const alreadyCompleted = order.paymentStatus === 'Completed'

        order.paymentStatus = 'Completed'
        order.paymentMethod = 'RPAY'
        order.status = 'Pending'

        for (const item of order.orderedItems) {
            item.status = 'Pending'
        }
        await order.save()

        // Only reduce stock & clean cart if this is the FIRST successful payment, not a retry of an already-completed one
        if (!alreadyCompleted) {
            let totalQuantityofProduct
            for (const item of order.orderedItems) {
                const product = await Product.findById(item.product)
                if (product) {
                    const variant = product.variants.find((v) => v.size === item.size)
                    if (variant) {
                        variant.quantity -= item.quantity
                        await product.save()
                    }
                    totalQuantityofProduct = product.variants?.reduce((acc, curr) => acc + curr.quantity, 0)
                }
                if (totalQuantityofProduct === 0) {
                    product.status = 'out of stock'
                    await product.save()
                }
            }

            for (const item of order.orderedItems) {
                await Cart.updateOne(
                    { userId: order.userId },
                    { $pull: { items: { productId: item.product, size: item.size } } }
                )
            }
        }

        return { status: true, statusCode: 200, message: 'Payment verified successfully', orderId: order.orderId }

    } catch (error) {
        logger.error(`Error in verifyRazorpayPayment service: ${error}`)
        throw error
    }
}

const getRetryPaymentData = async (userId, orderId) => {
    try {
        if (!orderId) {
            return { status: false, statusCode: 400, message: 'Order ID is required' }
        }

        const order = await Order.findOne({ orderId })

        if (!order) {
            return { status: false, statusCode: 404, message: 'Order not found' }
        }

        if (order.userId.toString() !== userId.toString()) {
            return { status: false, statusCode: 403, message: 'Unauthorized access to order' }
        }

        if (order.paymentStatus === 'Completed') {
            return { status: false, statusCode: 400, message: 'Payment already completed' }
        }

        return {
            status: true,
            statusCode: 200,
            order,
            key: process.env.RAZORPAY_KEY_ID,
        }
    } catch (error) {
        logger.error(`Error in getRetryPaymentData service: ${error}`)
        throw error
    }
}

const reCreateRazorpayOrder = async (userId, orderId) => {
    try {
        if (!orderId) {
            return { status: false, statusCode: 400, message: 'Order ID is required' }
        }

        const order = await Order.findOne({ orderId })

        if (!order) {
            return { status: false, statusCode: 404, message: 'Order not found' }
        }

        if (order.userId.toString() !== userId.toString()) {
            return { status: false, statusCode: 403, message: 'Unauthorized access to order' }
        }

        if (order.paymentStatus === 'Completed') {
            return { status: false, statusCode: 400, message: 'Payment already completed' }
        }

        const razorPay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        })

        const razorpayOrder = await razorPay.orders.create({
            amount: Math.round(order.finalAmount * 100),
            currency: 'INR',
            receipt: `retry_receipt_${Date.now()}`,
            notes: { userId, orderId, retry: true },
        })

        // Update order with new Razorpay order ID. 
        // We DO NOT set status to 'Pending' here; it remains 'Failed' until verification succeeds.
        order.razorPay = { orderId: razorpayOrder.id }
        await order.save()

        return {
            status: true,
            statusCode: 200,
            key: process.env.RAZORPAY_KEY_ID,
            orderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
        }
    } catch (error) {
        logger.error(`Error in reCreateRazorpayOrder service: ${error}`)
        throw error
    }
}

const orderSuccess = async (orderId) => {
    try {
        const orderData = await Order.findOne({ orderId: orderId })
        return orderData
    } catch (error) {
        logger.error(`Error in orderSuccess service: ${error}`)
        throw error
    }
}

const handlePaymentFailure = async (id) => {
    try {
        // Find by app orderId OR razorpay orderId
        const order = await Order.findOne({ $or: [{ orderId: id }, { 'razorPay.orderId': id }] })
        if (!order) return { status: false, statusCode: 404, message: 'Order not found' }

        if (order.status !== 'Failed') {
            order.paymentStatus = 'Failed'
            order.status = 'Failed'
            for (const item of order.orderedItems) {
                item.status = 'Failed'
            }
            await order.save()

            // Clean cart items on failure
            for (const item of order.orderedItems) {
                await Cart.updateOne(
                    { userId: order.userId },
                    { $pull: { items: { productId: item.product, size: item.size } } }
                )
            }
        }

        return { status: true, statusCode: 200, order }
    } catch (error) {
        logger.error(`Error in handlePaymentFailure service: ${error}`)
        throw error
    }
}

export default {
    validateCheckoutItems,
    getCheckoutPageData,
    placeOrder,
    applyCoupon,
    createRazorpayOrder,
    verifyRazorpayPayment,
    getRetryPaymentData,
    reCreateRazorpayOrder,
    orderSuccess,
    handlePaymentFailure
}
