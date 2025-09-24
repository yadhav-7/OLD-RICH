const Wallet = require('../../models/walletSchema')
const User = require('../../models/userSchema')

const getWallet = async(req,res)=>{
    try {
        const userId = req.session.user
        const user = await User.findById({_id:userId})
        const wallet = await Wallet.findOne({userId:userId})
        console.log('user',user)
        res.render('wallet',{
            user:user,
            wallet
        })
    } catch (error) {
        console.error('error in getWallet',error)
        return res.render('/pageNOTfound')
    }
}


module.exports={
    getWallet
}