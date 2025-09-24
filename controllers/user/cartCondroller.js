const Cart = require('../../models/cartSchema')
const User = require('../../models/userSchema')
const Product = require('../../models/productSchema')
const WishList = require('../../models/wishlistSchema')
const getCart = async (req, res) => {
  try {
    const userId = req.session.user;
    const userData = await User.findById(userId);

    const userCart = await Cart.findOne({ userId })
      .populate({
        path: 'items.productId',
        populate: {
          path: 'category',
          model: 'Category'
        }
      });

    
    if (!userCart || !Array.isArray(userCart.items) || userCart.items.length === 0) {
      return res.render('cart', {
        user: userData,
        userCart: [],
        subTotal: 0,
        length: 0
      });
    }

    
    userCart.total = 0;
    for (let item of userCart.items) {
      const product = item.productId;
      if (!product || !Array.isArray(product.variants)) continue

      for (let variant of product.variants) {
        if (variant.size === item.size && variant.salePrice !== item.price) {
          item.price = variant.salePrice;
          item.totalPrice = item.quantity * variant.salePrice;
        }
      }
      userCart.total += item.totalPrice || 0;
    }

    await userCart.save();

    res.render('cart', {
      user: userData,
      userCart: userCart.items,
      subTotal: userCart.total,
      length: userCart.items.length
    });
  } catch (error) {
    console.error('Error in getCart:', error);
    res.redirect('/pageNotFound');
  }
}

const addProductToCart = async (req, res) => {
  try {
    console.log('yes im reached hear')
    const { productId, selectedSize } = req.query;
    const userId = req.session.user;


    if (!productId || !userId || !selectedSize) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const product = await Product.findById(productId).populate('category')
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (!product.category?.isListed) {
      return res.status(400).json({ message: 'Product is temporory unavailable' })
    }

    if (product.isBlocked) {
      return res.status(400).json({ message: 'Product is temporory unavailable' })
    }

    const variant = product.variants.find(v => v.size === selectedSize);
    if (!variant) return res.status(400).json({ message: 'Invalid size' });

    // 3. Check stock availability
    if (variant.quantity < 1) {
      return res.status(400).json({ message: 'Out of stock' });
    }

    // 4. Find or create cart
    let cart = await Cart.findOne({ userId });

    // 5. Check if item already exists in cart
    const existingItem = cart?.items.find(
      (item) =>
        item.productId.toString() === productId &&
        item.size === selectedSize
    );

    const requestedQty = existingItem ? existingItem.quantity + 1 : 1;

    if (requestedQty > 5) {
      return res.status(400).json({
        message: 'You can only add up to 5 units of this product',
      });
    }

    if (requestedQty > variant.quantity) {
      return res.status(400).json({
        message: `Only ${variant.quantity} unit(s) left in stock!`,
      });
    }

    let findTotal = requestedQty * variant.salePrice


    if (!cart) {
      cart = new Cart({
        userId,
        items: [{
          productId,
          size: selectedSize,
          quantity: 1,
          price: variant.salePrice || variant.price,
          totalPrice: findTotal
        }],
        total: 1
      });
    } else {
      if (existingItem) {
        existingItem.quantity += 1;
        existingItem.totalPrice += variant.salePrice || variant.price;
      } else {
        cart.items.push({
          productId,
          size: selectedSize,
          quantity: 1,
          price: variant.salePrice || variant.price,
          totalPrice: findTotal
        });
      }
    }

    let findCartTotal = cart.items?.reduce((acc, curr) => {
      return acc += curr.totalPrice
    }, 0)

    cart.total = findCartTotal



    const removedWish = await WishList.updateOne(
      { userId },
      { $pull: { products: { productId } } },
      { new: true }
    );

    if (!removedWish) {
      return res.status(401).json({ message: 'Product not found in wishlist!' });
    }

    await cart.save();


    return res.status(200).json({ message: 'Added to cart!', cart });
  } catch (error) {
    console.error('Cart Error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};


const removeProductFromCart = async (req, res) => {
  try {
    const itemId = req.query.indexId;
    const userId = req.session.user;

    // Find the user's cart
    const cart = await Cart.findOne({ userId });


    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    // Filter out the item by its _id (you may need to check if it's item._id or item.productId)
    const removeItem = cart.items.filter(item => item._id.toString() === itemId);
    cart.total -= removeItem[0].totalPrice
    cart.items = cart.items.filter(item => item._id.toString() !== itemId);
    await cart.save();

    //  Send response
    return res.status(200).json({ success: true, message: 'Item removed from cart', cart: cart });

  } catch (error) {
    console.error('Error removing product from cart:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const decreaseCartItems = async (req, res) => {
  try {
    const userId = req.session.user;

    const productId = req.query.item;

    console.log('productId', productId)


    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not available' });
    }

    // Match by productId and size
    const item = cart.items.find(i =>
      i._id.toString() === productId
    );

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }

    item.quantity -= 1;
    item.totalPrice = item.totalPrice - item.price
    cart.total = cart.total - item.price
    if (item.quantity < 1) {
      return res.status(404).json({ message: 'You have at least one item in your cart' })
    }


    await cart.save();

    res.status(200).json({ success: true, message: 'Item quantity decreased', quantity: item.quantity, itemTotal: item.totalPrice, cartTotal: cart.total });

  } catch (error) {
    console.error('Error decreasing item:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const increaseCartItems = async (req, res) => {
  try {
    const userId = req.session.user;
    const itemId = req.query.item;


    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not available' });
    }

    const item = cart.items.find(i => i._id.toString() === itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }

    // Fetch full product with variants
    const product = await Product.findById(item.productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const variant = product.variants.find(v => v.size === item.size);
    if (!variant) {
      return res.status(400).json({ success: false, message: 'Variant not found' });
    }

    //  Enforce limits
    if (item.quantity >= 5) {
      return res.status(400).json({
        success: false,
        message: 'You can only add up to 5 units of this product'
      });
    }

    if (item.quantity + 1 > variant.quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${variant.quantity} unit(s) left in stock!`
      });
    }


    item.quantity += 1;
    item.totalPrice = item.totalPrice + item.price
    cart.total = cart.total + item.price

    await cart.save();

    res.status(200).json({ success: true, message: 'Item quantity increased', quantity: item.quantity, itemTotal: item.totalPrice, cartTotal: cart.total });

  } catch (error) {
    console.error('Error increasing item:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};



module.exports = {
  getCart,
  addProductToCart,
  removeProductFromCart,
  decreaseCartItems,
  increaseCartItems
}