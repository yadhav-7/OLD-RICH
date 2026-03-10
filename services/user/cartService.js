import User from '../../models/userSchema.js'
import Cart from '../../models/cartSchema.js'

import Product from '../../models/productSchema.js'
import WishList from '../../models/wishlistSchema.js'
import mongoose from 'mongoose'
import logger from '../../utils/logger.js'

/* eslint-disable no-restricted-syntax, no-continue */
const getCart = async (userId) => {
  const userData = await User.findById(userId)

  const userCart = await Cart.findOne({ userId: new mongoose.Types.ObjectId(userId) }).populate({
    path: 'items.productId',
    populate: {
      path: 'category',
      model: 'Category',
    },
  })

  if (
    !userCart ||
    !Array.isArray(userCart.items) ||
    userCart.items.length === 0
  ) {
    return { userData }
  }

  userCart.items?.sort((a, b) => b.addedOn - a.addedOn)
  userCart.total = 0
  for (const item of userCart.items) {
    const product = item.productId
    if (!product || !Array.isArray(product.variants)) continue

    for (const variant of product.variants) {
      if (variant.size === item.size && variant.salePrice !== item.price) {
        item.price = variant.salePrice
        item.totalPrice = item.quantity * variant.salePrice
      }
    }
    userCart.total += item.totalPrice || 0
  }

  await userCart.save()

  return { userCart, userData }
}

const addProduct = async (userId, productId, selectedSize) => {
  try {
    const product = await Product.findById(productId).populate('category')
    if (!product) return { status: false, statusCode: 404, message: 'Product not found' }

    if (!product.category || !product.category.isListed || product.isBlocked) {
      return { status: false, statusCode: 400, message: 'Product is currently unavailable' }
    }

    const variant = product.variants.find((v) => v.size === selectedSize)
    if (!variant) return { status: false, statusCode: 400, message: 'Invalid size' }

    if (variant.quantity < 1) {
      return { status: false, statusCode: 400, message: 'Out of stock' }
    }

    let cart = await Cart.findOne({ userId })

    const existingItem = cart?.items.find(
      (item) => item.productId.toString() === productId && item.size === selectedSize
    )

    const requestedQty = existingItem ? existingItem.quantity + 1 : 1

    if (requestedQty > 5) {
      return {
        status: false,
        statusCode: 400,
        message: 'You can only add up to 5 units of this product',
      }
    }

    if (requestedQty > variant.quantity) {
      return {
        status: false,
        statusCode: 400,
        message: `Only ${variant.quantity} unit(${variant.size}) left in stock!`,
      }
    }

    const findTotal = requestedQty * variant.salePrice

    if (!cart) {
      cart = new Cart({
        userId,
        items: [
          {
            productId,
            size: selectedSize,
            quantity: 1,
            price: variant.salePrice,
            totalPrice: variant.salePrice,
          },
        ],
        total: variant.salePrice,
      })
    } else if (existingItem) {
      existingItem.quantity += 1
      existingItem.price = variant.salePrice
      existingItem.totalPrice = existingItem.quantity * existingItem.price
    } else {
      cart.items.push({
        productId,
        size: selectedSize,
        quantity: 1,
        price: variant.salePrice,
        totalPrice: variant.salePrice,
      })
    }

    cart.total = cart.items.reduce((acc, curr) => acc + curr.totalPrice, 0)

    const exists = !!existingItem

    const removedWish = await WishList.updateOne(
      { userId: new mongoose.Types.ObjectId(userId) },
      { $pull: { products: { productId: new mongoose.Types.ObjectId(productId) } } }
    )

    await cart.save()

    return {
      status: true,
      statusCode: 200,
      message: 'Added to cart!',
      cart,
      exists,
    }
  } catch (error) {
    logger.error(`Error in addProduct service: ${error}`)
    throw error
  }
}

const removeProduct = async (userId, itemId) => {
  try {
    const cart = await Cart.findOne({ userId })
    if (!cart) {
      return { status: false, statusCode: 404, message: 'Cart not found' }
    }

    const removeItem = cart.items.find((item) => item._id.toString() === itemId)
    if (!removeItem) return { status: false, statusCode: 404, message: 'Item not found in cart' }

    cart.total -= removeItem.totalPrice
    cart.items = cart.items.filter((item) => item._id.toString() !== itemId)
    await cart.save()

    return { status: true, statusCode: 200, message: 'Item removed from cart', cart }
  } catch (error) {
    logger.error(`Error in removeProduct service: ${error}`)
    throw error
  }
}

const decreaseQuantity = async (userId, itemId) => {
  try {
    const cart = await Cart.findOne({ userId })
    if (!cart) return { status: false, statusCode: 404, message: 'Cart not available' }

    const item = cart.items.find((i) => i._id.toString() === itemId)
    if (!item) return { status: false, statusCode: 404, message: 'Item not found in cart' }

    if (item.quantity <= 1) {
      return { status: false, statusCode: 400, message: 'Minimum quantity reached. Remove item instead.' }
    }

    item.quantity -= 1
    item.totalPrice = item.quantity * item.price

    // Recalculate cart total to be safe
    cart.total = cart.items.reduce((acc, curr) => acc + curr.totalPrice, 0)

    await cart.save()

    return {
      status: true,
      statusCode: 200,
      message: 'Quantity updated',
      quantity: item.quantity,
      itemTotal: item.totalPrice,
      cartTotal: cart.total,
    }
  } catch (error) {
    logger.error(`Error in decreaseQuantity service: ${error}`)
    throw error
  }
}

const increaseQuantity = async (userId, itemId) => {
  try {
    const cart = await Cart.findOne({ userId }).populate('items.productId')
    if (!cart) return { status: false, statusCode: 404, message: 'Cart not available' }

    const item = cart.items.find((i) => i._id.toString() === itemId)
    if (!item) return { status: false, statusCode: 404, message: 'Item not found in cart' }

    const product = item.productId
    if (!product) return { status: false, statusCode: 404, message: 'Product not found' }

    const variant = product.variants.find((v) => v.size === item.size)
    if (!variant) return { status: false, statusCode: 400, message: 'Variant not found' }

    if (item.quantity >= 5) {
      return { status: false, statusCode: 400, message: 'Maximum 5 units allowed per product' }
    }

    if (item.quantity + 1 > variant.quantity) {
      return {
        status: false,
        statusCode: 400,
        message: `Only ${variant.quantity} unit(s) left in stock!`,
      }
    }

    item.quantity += 1
    item.totalPrice = item.quantity * item.price

    // Recalculate cart total
    cart.total = cart.items.reduce((acc, curr) => acc + curr.totalPrice, 0)

    await cart.save()

    return {
      status: true,
      statusCode: 200,
      message: 'Quantity updated',
      quantity: item.quantity,
      itemTotal: item.totalPrice,
      cartTotal: cart.total,
    }
  } catch (error) {
    logger.error(`Error in increaseQuantity service: ${error}`)
    throw error
  }
}

export default {
  getCart,
  addProduct,
  removeProduct,
  decreaseQuantity,
  increaseQuantity,
}
