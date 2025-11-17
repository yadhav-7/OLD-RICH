const express = require('express')
const app = express()
const path = require('path')
const env = require('dotenv').config()
const db = require('./config/db')
const userRouter = require('./routes/user')
const adminRouter = require('./routes/admin')
const session = require('express-session')
const passport = require('./config/passport')
const methodOverride = require('method-override')
const flash = require('connect-flash')
app.use(methodOverride('_method'))

db.connectdb()

app.use(session({
     secret:process.env.SESSION_SECRET,
     resave:false,
     saveUninitialized:true,
     cookie:{
        secure:false,
        httpOnly:true,
        maxAge:72*60*60*1000                                                                                                                                                                                       
     }
}))

app.use(flash())




app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});






app.use(passport.initialize())
app.use(passport.session())

app.use(express.json())
app.use(express.urlencoded({extended:true}))

app.set('view engine',"ejs")
app.set('views',[path.join(__dirname,'views/user'),path.join(__dirname,'views/admin')])
app.use(express.static(path.join(__dirname, 'public')))

app.use('/',userRouter)
app.use('/admin',adminRouter)

const PORT = process.env.PORT || 4040

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
})