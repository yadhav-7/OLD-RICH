const User = require('../../models/userSchema')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')


const loadlogin = (req, res) => {
    try {
        if (req.session.admin) {
            console.log(req.session.admin)
            return res.redirect('/admin/dashboard')
        }
        
        res.render('admin-login', { message: null })
    } catch (error) {

    }
}

const login = async (req, res) => {

    try {

        const { email, password } = req.body
        const admin = await User.findOne({ email, isAdmin: true })
        if (admin) {
            const passwordMatch = await bcrypt.compare(password, admin.password)
            console.log('password',passwordMatch)
            if (passwordMatch) {
                req.session.admin = admin._id
                return res.redirect('/admin/dashboard')
            } else {
                return res.render('admin-login', { message: 'Invalid credentials' })
            }
        } else {
            return res.render('admin-login', { message: 'User does not exists' })
        }
    } catch (error) {
        console.log('login error', error)
        return res.redirect('/admin/pageError')
    }
}



const pageError = (req, res) => {
    res.render('pageError')
}

const logout = (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.log('Error destroying session:', err);
        return res.redirect('/admin/pageError');
      }
      res.redirect('/admin/login');
    });
  } catch (error) {
    console.log('Unexpected error during logout:', error);
    res.redirect('/admin/pageError');
  }
};
module.exports = {
    loadlogin,
    login,
    pageError,
    logout,
    
}