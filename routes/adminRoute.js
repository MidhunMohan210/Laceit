const express = require('express')
const adminRoute = express()
const adminController = require('../controllers/adminController')
const productController = require('../controllers/productController')
const categoryController = require('../controllers/categoryController')

const multer = require("multer");
const path = require('path');
const multers = require('../multer/multer')


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../public/product-images"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });
const multipleUpload = upload.fields([{ name: 'image1', maxCount: 1 }, { name:"image2" ,maxCount:1 }, { name:"image3" ,maxCount:1 }])




const validate = require('../middleware/adminAuth');
const session = require('express-session');
const cookieparser = require('cookie-parser')
const nocache = require('nocache')
adminRoute.use(nocache())
adminRoute.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
  }));

//view engine
adminRoute.set('view engine','ejs')
adminRoute.set('views','./views/admin')

//Parsing

adminRoute.use(express.json())
adminRoute.use(express.urlencoded({extended:true}))
adminRoute.use(cookieparser())
//adminRoute.get('*',validate.checkUser)



//home page
adminRoute.get('/',validate.isLogout,adminController.loadLogin)
adminRoute.post('/login',adminController.verifyLogin)
adminRoute.get('/dashboard',validate.requireAuth,validate.isLogin,adminController.loadDashboard)
adminRoute.get('/loadCategory',validate.requireAuth,validate.isLogin,categoryController.loadCategory)
adminRoute.post('/addCategory',validate.requireAuth,categoryController.createCategory)
adminRoute.get('/addCategory',validate.requireAuth,validate.isLogin,categoryController.showCategory)





adminRoute.get('/changeStatus',validate.requireAuth,validate.isLogin,categoryController.changeStatus)
adminRoute.get('/editCategory',validate.requireAuth,validate.isLogin,categoryController.loadUpdateCategory)
adminRoute.post('/editCategory',validate.requireAuth,categoryController.updateCategory)
adminRoute.get('/deleteCategory',validate.requireAuth,validate.isLogin,categoryController.deleteCategory)


adminRoute.get('/users',validate.requireAuth,validate.isLogin,adminController.loadUsers)
adminRoute.get('/deleteUser',validate.requireAuth,validate.isLogin,adminController.deleteUser)
adminRoute.get('/blockUser',validate.requireAuth,validate.isLogin,adminController.blockUser)
adminRoute.get('/unBlockUser',validate.requireAuth,validate.isLogin,adminController.unBlockUser)


adminRoute.get('/editUser',validate.requireAuth,validate.isLogin,adminController.loadEditUser)
adminRoute.post('/editUser',adminController.updateUser)

adminRoute.get('/addProduct',validate.requireAuth,validate.isLogin,productController.loadProducts)


adminRoute.post(
  "/addProduct",
  multipleUpload,
  productController.createProduct
)


///product list

adminRoute.get('/productList',validate.requireAuth,validate.isLogin,productController.loadProductList)  //loadproduct list
adminRoute.get('/editProductList',validate.requireAuth,validate.isLogin,productController.editProductList)  //editProductList
adminRoute.post('/updateProductList', multipleUpload,validate.isLogin,validate.requireAuth,productController.updateProductList)  //editProductList
adminRoute.get('/deleteProduct',validate.isLogin,productController.deleteProduct)

//order
adminRoute.get('/orderList',validate.isLogin,adminController.orderList)
adminRoute.put('/orderStatus',validate.isLogin,adminController.changeStatus)
adminRoute.put('/cancelOrder',validate.isLogin,adminController.cancelOrder)  ///cancel order
adminRoute.get('/orderDetails',validate.isLogin,adminController.orderDetails)  ///cancel order
adminRoute.put('/returnOrder',validate.isLogin,adminController.returnOrder)  ///return order
adminRoute.get('/salesReport',validate.isLogin,adminController.getSalesReport )  ///return order
adminRoute.post('/salesReport',validate.isLogin,adminController.postSalesReport )  ///return order


//coupon
adminRoute.get('/loadCouponAdd',validate.isLogin,adminController.loadCouponAdd )  ///load Coupon add
adminRoute.get('/generate-coupon-code',validate.isLogin,adminController.generateCouponCode )  ///return order
adminRoute.post('/addCoupon',validate.isLogin,adminController.addCouponData )  ///return order
adminRoute.get('/couponList',validate.isLogin,adminController.couponList )  ///return order
adminRoute.delete('/removeCoupon',validate.isLogin,adminController.removeCoupon )  ///return order



//banner
adminRoute.get('/addBannerGet',validate.isLogin,adminController.addBannerGet )  ///loa add banner
adminRoute.post('/addBanner',multers.addBannerupload,validate.isLogin,adminController.addBannerPost )  /// submit banner
adminRoute.get('/bannerList',validate.isLogin,adminController.bannerList )  /// load bannerlist
adminRoute.get('/deleteBanner',validate.isLogin,adminController.deleteBanner )  /// deleteBanner






















adminRoute.get('/logout',validate.isLogin,adminController.logout)
module.exports = adminRoute