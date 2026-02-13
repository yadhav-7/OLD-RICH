const User = require('../models/userSchema')
const userAuth = async (req, res, next) => {
  try {
    if (req.session.user) {
      const user = await User.findById(req.session.user);

      if (user && !user.isBlock) {
        return next();
      } else {
        // If request comes via fetch, send JSON response
        if (req.xhr || req.headers.accept?.includes('json')) {
          return res.status(401).json({ redirect: '/login' });
        }
        return res.redirect('/login');
      }
    } else {
      if (req.xhr || req.headers.accept?.includes('json')) {
        return res.status(401).json({ redirect: '/login' });
      }
      return res.redirect('/login');
    }
  } catch (error) {
    console.log('Error in userAuth middleware:', error);
    res.status(500).send('Internal Server Error');
  }
};



const guestAuth = async (req, res, next) => {
  try {
   
    if (!req.session.user) {

      res.locals.user = null; 
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
            
            console.log('yes adminAuth is working',req.url)
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