const mongoose = require('mongoose')
const { search } = require('../routes/user')
const { Schema } = mongoose

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    phone: {
        type: String,
        required: false,
        unique: false,
        sparse: true,                  
        default: null
    },
    googleId: {
        type: String,
        unique: true,
      
    },
    password: {
        type: String,
        required: false
    },
    isBlock: {
        type: Boolean,
        default: false
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    cart: [{
        type: Schema.Types.ObjectId,
        ref: 'cart'
    }],
    wallet: [{
        type: Number,
        default: 0,
    }],
    wishlist: [{
        type: Schema.Types.ObjectId,
        ref: 'wishlist'
    }],
    orderHistory: [{
        type: Schema.Types.ObjectId,
        ref: 'order'
    }],
    createdOn: {
        type: Date,
        default: Date.now
    },
    referCode: {
        type: String,
    },
    redeemed: {
        type: Boolean
    },
    redeemedUser: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    searchHistory: [{
        categery: {
            type: Schema.Types.ObjectId,
            ref: 'Catagery'
        },
        brand: {
            type: String
        },
        searchOn: {
            type: Date,
            default: Date.now
        }
    }]
})
const User = mongoose.model('User', userSchema)
module.exports = User