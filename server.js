import express from 'express'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import session from 'express-session'
import methodOverride from 'method-override'
import flash from 'connect-flash'
import logger from './utils/logger.js'

import db from './config/db.js'
import userRouter from './routes/user.js'
import adminRouter from './routes/admin.js'
import passport from './config/passport.js'
import errorHandler from './middlewares/error.js'


dotenv.config()

console.log("NODEMAILER_EMAIL:", process.env.NODEMAILER_EMAIL)
console.log("NODEMAILER_PASSWORD:", process.env.NODEMAILER_PASSWORD)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
dotenv.config()

app.use(methodOverride('_method'))

db.connectdb()

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 72 * 60 * 60 * 1000,
    },
  }),
)

app.use(flash())

app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')
  next()
})

app.use(passport.initialize())
app.use(passport.session())

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.set('view engine', 'ejs')
app.set('views', [
  path.join(__dirname, 'views/user'),
  path.join(__dirname, 'views/admin'),
])
app.use(express.static(path.join(__dirname, 'public')))

app.use('/', userRouter)
app.use('/admin', adminRouter)

const PORT = process.env.PORT || 4040


app.use(errorHandler)

app.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`)
})
