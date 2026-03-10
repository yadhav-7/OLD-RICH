import express from 'express'
import adminController from '../controllers/admin/adminController.js'
import customerController from '../controllers/admin/customerController.js'
import catagoryController from '../controllers/admin/catagoryController.js'
import prodouctContoller from '../controllers/admin/productController.js'
import orderController from '../controllers/admin/orderController.js'
import couponManagement from '../controllers/admin/couponController.js'
import dashboardController from '../controllers/admin/dashboardController.js'
import getSalesReport from '../controllers/admin/salesReport.js'
import { adminAuth } from '../middlewares/auth.js'
import { upload } from '../config/cloudinary.js'

const router = express.Router()

// login
router.get('/login', adminController.loadlogin)
router.post('/login', adminController.login)
router.get('/logout', adminController.logout)
router.get('/pageError', adminController.pageError)

// DASHBOARD MANAGEMENT
router.get('/dashboard', adminAuth, dashboardController.loadDashboard)

// customer management
router.get('/users', adminAuth, customerController.costomerInfo)
router.post('/blockCustomer', adminAuth, customerController.blockUser)
router.post('/unBlockCustomer', adminAuth, customerController.unBlockUser)

// Category management

router.get('/category', adminAuth, catagoryController.categoryInfo)
router.post('/addCategory', adminAuth, catagoryController.addCategory)
router.post('/addCategoryOffer', adminAuth, catagoryController.addCategoryOffer)
router.post(
  '/removeCategoryOffer',
  adminAuth,
  catagoryController.removeCategoryOffer,
)
router.post('/unListCategory', adminAuth, catagoryController.unListCategory)
router.post('/ListCategory', adminAuth, catagoryController.ListCategory)
router.get('/editCategory', adminAuth, catagoryController.getEditCategory)
router.post('/editCategory/:id', adminAuth, catagoryController.editCategory)

// product management

router.get('/addProduct', adminAuth, prodouctContoller.getAddProducts)
router.post(
  '/addProducts',
  adminAuth,
  upload.array('images', 5),
  prodouctContoller.addProducts,
)
router.get('/allProducts', adminAuth, prodouctContoller.getAllProducts)
router.post(
  '/productVarintsModal',
  adminAuth,
  prodouctContoller.productVarintsModal,
)
router.post('/addProductOffer', adminAuth, prodouctContoller.addProductOffer)
router.post(
  '/removeProductOffer',
  adminAuth,
  prodouctContoller.removeProductOffer,
)
router.post('/blockProduct', adminAuth, prodouctContoller.blockProduct)
router.post('/unBlockProduct', adminAuth, prodouctContoller.unBlockProduct)
router.get('/editProduct', adminAuth, prodouctContoller.getEditProduct)
router.post(
  '/editProduct/:id',
  adminAuth,
  upload.array('images', 5),
  prodouctContoller.editProduct,
)

// ORDER MANAGEMANT
router.get('/orderManagement', adminAuth, orderController.getOrderPage)

router.get('/searchOrders', adminAuth, orderController.searchOrders)

router.post('/changeStatus', adminAuth, orderController.changeStatus)

router.get('/orderDetails', adminAuth, orderController.ordereDetails)

router.patch('/handleReturnReq', adminAuth, orderController.handleReturnReq)

// COUPON MANAGEMENT
router.get('/couponPage', adminAuth, couponManagement.getCouponPage)
router.post('/addCoupon', adminAuth, couponManagement.addCoupons)
router.get('/listUnlistCoupon', adminAuth, couponManagement.listUnlistCoupon)
router.delete('/deleteCoupon', adminAuth, couponManagement.deleteCoupon)
router.patch('/editCoupon', adminAuth, couponManagement.editCoupon)

// SALES REPORT
router.get('/salesReport', adminAuth, getSalesReport.getSalesReport)
router.get('/generate-pdf', adminAuth, getSalesReport.salesReport)
router.get('/salesReportExcel', adminAuth, getSalesReport.salesReportExcel)
export default router
