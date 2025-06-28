const mongoose = require('mongoose')
const {Schema} = mongoose
const {v4:uuidv4} = require('uuid')

const orderSchema = new mongoose.Schema({
    orderId:{
        type:String,
        default:()=>uuidv4(),
        unique:true
    },
    orderedItems:[{
        product:{
            type:Schema.Types.ObjectId,
            ref:'Product',
            required:ture
        },
        quantity:{
            type:Number,
            required:true
        },
        price:{
            type:Number,
            default:0
        }
    }],
    totalPrice:{
        type:Number,
        required:true
    },
    discount:{
        type:Number,
        default:0
    },
    finalAmount:{
        type:Number,
        required:true
    },
    address:{
        type:Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    invoiceDate:{
        type:Date,
    },
    status:{
        type:Strig,
        required:true,
        enum:['Pending','Processing','Shipped','Delivered','cancelled','return Req','returned']
    },
    createdOn:{
        type:Date,
        default:Data.now,
        required:true
    },
    couponApplied:{
        type:Boolean,
        default:false
    },

})
const order = mongoose.model('Order',orderSchema)
module.exports=order