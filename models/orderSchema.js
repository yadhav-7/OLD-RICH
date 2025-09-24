const mongoose = require('mongoose')
const { Schema } = mongoose
const { v4: uuidv4 } = require('uuid')

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        default: () => uuidv4(),
        unique: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    orderedItems: [{
        product: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        productName: {
            type: String,
            required: true
        },
        size: {
            type: String,
            required: true
        },
        sku: {
            type: String,
            required: false
        },
        categoryId: {
            type: Schema.Types.ObjectId,
            ref: 'Category',
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        price: {
            type: Number,
            default: 0
        },
        finalPrice: {
            type: Number,
            defalut: 0,
            required: true
        },
        status: {
            type: String,
            required: true,
            enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'cancelled', 'returnRequested', 'returned', 'reutrnRejected']
        },
        returnReason: {
            type: String,
            default: null
        },
    }],
    totalPrice: {
        type: Number,
        required: true
    },
    discount: {
        type: Number,
        default: 0
    },
    finalAmount: {
        type: Number,
        required: true
    },
    address: {
        addressType: { type: String, required: true },
        name: { type: String, required: true },
        country: { type: String, required: true },
        state: { type: String, required: true },
        city: { type: String, required: true },
        street: { type: String, required: true },
        pincode: { type: Number, required: true },
        phone: { type: String, required: true },
        altPhone: { type: String, required: false },
    },
    invoiceDate: {
        type: Date,
    },
    status: {
        type: String,
        required: true,
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'cancelled', 'returnRequested', 'returned', 'reutrnRejected']
    },
    returnReason: {
        type: String,
        default: null
    },
    paymentMethod: {
        type: String,
        enum: ['COD', 'RPAY', 'Wallet'],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Completed', 'Failed']
    },
    createdOn: {
        type: Date,
        default: Date.now,
        required: true
    },
    // couponApplied: {
    //     type: Boolean,
    //     default: false
    // },
    couponApplied: {
        applied: {
            type: Boolean,
            default: false
        },
        code: {
            type: String,
            default: null
        },
        amount: {
            type: Number,
            default: null
        }
    }


})
const order = mongoose.model('Order', orderSchema)
module.exports = order