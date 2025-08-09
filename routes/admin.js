const express = require('express')
const router = express.Router()
const adminController = require('../controllers/admin/adminController')
const customerController = require('../controllers/admin/customerController')
const catagoryController = require('../controllers/admin/catagoryController')
let prodouctContoller = require('../controllers/admin/productController')
const orderController = require('../controllers/admin/orderController')
const {userAuth,adminAuth} = require('../middlewares/auth')
const {upload,profileUpload} = require('../middlewares/multer')
//clear flash


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
router.post('/unListCategory',adminAuth,catagoryController.getUnlistCategory)
router.post('/ListCategory',adminAuth,catagoryController.getListCategory)
router.get('/getEditCategory',adminAuth,catagoryController.getEditCategory)
router.post('/editCategory/:id',adminAuth,catagoryController.editCategory)

//product management

router.get('/getAddProduct',adminAuth,prodouctContoller.getAddProducts)
router.post('/addProducts',adminAuth,upload.array('images', 5),prodouctContoller.addProducts);

router.get('/getAllProducts',adminAuth,prodouctContoller.getAllProducts)
router.post('/productVarintsModal',adminAuth,prodouctContoller.productVarintsModal)
router.post('/addProductOffer',adminAuth,prodouctContoller.addProductOffer)
router.post('/removeProductOffer',adminAuth,prodouctContoller.removeProductOffer)
router.post('/blockProduct',adminAuth,prodouctContoller.blockProduct)
router.post('/unBlockProduct',adminAuth,prodouctContoller.unBlockProduct)
router.get('/getEditProduct',adminAuth,prodouctContoller.getEditProduct)
router.post('/editProduct/:id',adminAuth,upload.array('images', 5),prodouctContoller.editProduct)

router.post('/deleteImage',adminAuth,prodouctContoller.deleteSingleImage)


//ORDER MANAGEMANT
router.get('/orderManagement',adminAuth,orderController.getOrderPage)

router.get('/searchOrders',adminAuth,orderController.searchOrders)

router.post('/changeStatus',adminAuth,orderController.changeStatus)

router.get('/orderDetails',adminAuth,orderController.ordereDetails)

router.patch('/handleReturnReq',adminAuth,orderController.handleReturnReq)

module.exports=router