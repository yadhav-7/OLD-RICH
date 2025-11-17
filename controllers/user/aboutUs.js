const aboutUs = async(req,res)=>{
    try {
        return res.render('aboutUs')
    } catch (error) {
        console.error('error in about us Page',error)
        return res.redirect('/pageNotFound')
    }
}

module.exports={
    aboutUs
}