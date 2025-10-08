const mongoose = require('mongoose');
const {Schema} = mongoose;

const walletSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    balance: {
        type: Number,
        default: 0,
        required:true
    },
    totalDebited:{
        type:Number,
        default:0,
        required:true
    },
    totalCredited:{
        type:Number,
        default:0,
        required:true
    },
    transactions: [{
            type: {
                type: String,
                enum: ['credit', 'debit'],
                required: true
            },
            amount: {
                type: Number,
                required: true,
            },
            reason: {
                type: String,
                default: "Wallet transaction"
            },
            orderId: {
                type: String,
                ref: "Order",
                default: null
            },
            productId: [{
                type: Schema.Types.ObjectId,
                ref: 'Product',
                default: null 
            }],
            productQuantity: {
                type: Number,
                default: null
            },
            createdAt: {
                type: Date,
                default: Date.now,
                required:true
            }
        }],
    createdAt: {
        type: Date,
        default: Date.now,
        required:true
    }
});


const Wallet = mongoose.model('Wallet', walletSchema)

module.exports = Wallet