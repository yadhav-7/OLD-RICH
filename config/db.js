const mongoose = require('mongoose')
const env = require('dotenv').config()
const connectdb = async()=>{
    try {
        await mongoose.connect(process.env.MONGODB_URI)
        console.log('Database is connected')
    } catch (error) {
        console.log('Database error//')
        console.log(error)
        process.exit(1)
    }
}
module.exports={
    connectdb
}