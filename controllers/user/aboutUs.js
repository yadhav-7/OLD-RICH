const User = require('../../models/userSchema')
const aboutUs = async(req,res)=>{
    try {
        const userId = req.session.user
        let user = null
        if(userId)user = await User.findOne({_id:userId})

        return res.render('aboutUs',{user})
    } catch (error) {
        console.error('error in about us Page',error)
        return res.redirect('/pageNotFound')
    }
}

module.exports={
    aboutUs
}