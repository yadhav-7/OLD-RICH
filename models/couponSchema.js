const mongoose = require('mongoose')
const {Schema} = mongoose

const couponSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,          
    },
    code:{
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim:true,
    },
    createdOn:{
        type:Date,
        default:Date.now,
        required:true
    },
    expireOn:{
        type:Date,
        required:true
    },
    amount:{
        type:Number,
        required:true
    },
    minimumPrice: { // cart value
        type: Number,
        required: true
    },
    isList:{
        type:Boolean,
        default:true
    },
    usedBy:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    }],
    maxUsage:{
        type: Number,
        required: true
    },

})

const Coupon = mongoose.model('Coupon',couponSchema)
module.exports=Coupon