const mongoose = require('mongoose');
const { Schema } = mongoose;

const productSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  productOffer: {
    type: Number,
    default: 0
  },

  // For non-variant products
  quantity: {
    type: Number
  },
  color: {
        type: String,
        required: true
      },

      description:{
        type:String,
        required:true
      },
  //  Variant-wise pricing & SKU
  variants: [
    {
      sku: {
        type: String,
        required: true
      },
      size: {
        type: String,
        required: true,
        enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
      },
      regularPrice: {
        type: Number,
        required: true
      },
      salePrice: {
        type: Number,
        required: true
      },
      quantity: {
        type: Number,
        required: true
      }
    }
  ],

  productImage: {
    type: [String],
    required: true
  },

  isBlocked: {
    type: Boolean,
    default: false
  },

  createdOn: {
    type: Date,
    default: Date.now
  },

  status: {
    type: String,
    enum: ['Available', 'out of stock', 'Discountinued'],
    default: 'Available',
    required: true
  }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
