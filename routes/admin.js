const express = require('express')
const router = express.Router()
const adminController = require('../controllers/admin/adminController')
const customerController = require('../controllers/admin/customerController')
const catagoryController = require('../controllers/admin/catagoryController')
let prodouctContoller = require('../controllers/admin/productController')
const {userAuth,adminAuth} = require('../middlewares/auth')
const upload = require('../middlewares/multer')

//login and dashboard
router.get('/login',adminController.loadlogin)
router.post('/login',adminController.login)
router.get('/dashboard',adminAuth,adminController.loadDashboard)
router.get('/logout',adminController.logout)
router.get('/pageError',adminController.pageError)

//customer management
router.get('/users',adminAuth,customerController.costomerInfo)
router.post('/blockCustomer',adminAuth,customerController.blockUser)
router.post('/unBlockCustomer',adminAuth,customerController.unBlockUser)

//Category management

router.get('/category',adminAuth,catagoryController.categoryInfo)
router.post('/addCategory',adminAuth,catagoryController.addCategory)
router.post('/addCategoryOffer',adminAuth,catagoryController.addCategoryOffer)
router.post('/removeCategoryOffer',adminAuth,catagoryController.removeCategoryOffer)
router.get('/unListCategory',adminAuth,catagoryController.getUnlistCategory)
router.get('/ListCategory',adminAuth,catagoryController.getListCategory)
router.get('/getEditCategory',adminAuth,catagoryController.getEditCategory)
router.post('/editCategory/:id',adminAuth,catagoryController.editCategory)

//product management

router.get('/getAddProduct',adminAuth,prodouctContoller.getAddProducts)
router.post('/addProducts',adminAuth,upload.array('images', 4),prodouctContoller.addProducts);
router.get('/getAllProducts',adminAuth,prodouctContoller.getAllProducts)
router.post('/addProductOffer',adminAuth,prodouctContoller.addProductOffer)
router.post('/removeProductOffer',adminAuth,prodouctContoller.removeProductOffer)
router.post('/blockProduct',adminAuth,prodouctContoller.blockProduct)
router.post('/unBlockProduct',adminAuth,prodouctContoller.unBlockProduct)
router.get('/getEditProduct',adminAuth,prodouctContoller.getEditProduct)
router.post('/editProduct/:id',adminAuth,upload.array('images', 4),prodouctContoller.editProduct)
router.post('/deleteImage',adminAuth,prodouctContoller.deleteSingleImage)

module.exports=router