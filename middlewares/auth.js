const User = require('../models/userSchema')
const userAuth = (req, res, next) => {
    if (req.session.user) {
        User.findById(req.session.user)
            .then(data => {
                if (data && !data.isBlock) {
                    next()
                }else {
                    res.redirect('/login')
                }
            })
            .catch(error => {
                console.log('Error in user auth middleware')
                res.status(500).send('Internal Server error')
            })
    } else {
        res.redirect('/login')
    }
}


const guestAuth = async (req, res, next) => {
  try {
    console.log('guestAuth')
    if (!req.session.user) {
        console.log("no session")
      res.locals.user = null; // no login, go ahead
      return next();
    }

    const user = await User.findById(req.session.user);

    if (!user || user.isBlock) {
        console.log('no user or isBlocked')
      req.session.destroy();
      return res.redirect('/login');
    }

    res.locals.user = user;
    next();
  } catch (err) {
    console.log("guestAuth Error:", err);
    next(); // don't block page
  }
};


const adminAuth = async(req, res, next) => {
        try {
            const userId = req.session.admin
            if(!userId){
                return res.redirect('/admin/login')
            }


            const data = await User.findOne({_id:userId})

            
            if (data.isAdmin) {
                next();
            } else {
                res.redirect('/admin/login');
            }

        } catch (error) {
            console.log('error from adminAuth',error)
            res.redirect('/admin/pageError')
        }
};


module.exports = {
    userAuth,
    adminAuth,
    guestAuth
}