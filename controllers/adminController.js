const Admin = require("../models/adminModel");
const User = require("../models/userModel");
const Order = require("../models/orderModel");
const Coupon = require("../models/couponModel");

const path = require("path");
const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const adminHelper = require("../helpers/adminHelper");
const couponHelper = require("../helpers/couponHelper");
const bannerHelper = require("../helpers/bannerHelper");

const { ObjectId } = require("mongodb");
const { addCoupon } = require("./trash");
// const { response } = require("../routes/adminRoute");

const maxAge = 3 * 24 * 60 * 60;
const createToken = (id) => {
  return jwt.sign({ id }, "my-secret", {
    expiresIn: maxAge,
  });
};

/////load login page

const loadLogin = async (req, res) => {
  try {
    res.render("sign-in", { message: "" });
  } catch (error) {
    console.log(error.message);
  }
};

///verify login

const verifyLogin = async (req, res) => {
  try {
    const userName = req.body.userName;
    const password = req.body.password;
    const adminData = await Admin.findOne({ userName: userName });
    if (adminData.password === password) {
      // const passwordMatch = await bcrypt.compare(password,userData.password)
      if (adminData) {
        const token = createToken(adminData._id);
        res.cookie("jwtadmin", token, {
          httpOnly: true,
          maxAge: maxAge * 1000,
        });
        res.redirect("/admin/dashboard");
      } else {
        res.render("sign-in", { message: "Email and Password are Incorrect" });
      }
    } else {
      res.render("sign-in", { message: "Email and Password are Incorrect" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

//load dashboard

// const loadDashboard = async (req, res) => {
//   try {
//     res.render("dashboard");
//   } catch (error) {
//     console.log(error);
//   }
// };

const loadDashboard = async (req, res) => {
  try {
    const orders = await Order.aggregate([
      { $unwind: "$orders" },
      {
        $group: {
          _id: null,
          totalPriceSum: { $sum: { $toInt: "$orders.totalPrice" } },
          count: { $sum: 1 },
        },
      },
    ]);

    const salesData = await Order.aggregate([
      { $unwind: "$orders" },
      {
        $match: {
          "orders.orderStatus": "Delivered", // Consider only completed orders
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              // Group by the date part of createdAt field
              format: "%Y-%m-%d",
              date: "$orders.createdAt",
            },
          },
          dailySales: { $sum: { $toDouble: "$orders.totalPrice" } }, // Calculate the daily sales
        },
      },
      {
        $sort: {
          _id: 1, // Sort the results by date in ascending order
        },
      },
    ]);

    const salesCount = await Order.aggregate([
      { $unwind: "$orders" },
      {
        $match: {
          "orders.orderStatus": "Delivered", // Consider only completed orders
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              // Group by the date part of createdAt field
              format: "%Y-%m-%d",
              date: "$orders.createdAt",
            },
          },
          orderCount: { $sum: 1 }, // Calculate the count of orders per date
        },
      },
      {
        $sort: {
          _id: 1, // Sort the results by date in ascending order
        },
      },
    ]);

    const categoryCount = await Category.find({}).count();

    const productsCount = await Product.find({}).count();
    const onlinePay = await adminHelper.getOnlineCount();

    const latestorders = await Order.aggregate([
      { $unwind: "$orders" },
      {
        $sort: {
          "orders.createdAt": -1,
        },
      },
      { $limit: 10 },
    ]);

    res.render("dashboard", {
      orders,
      productsCount,
      categoryCount,
      onlinePay,
      salesData,
      order: latestorders,
      salesCount,
    });
  } catch (error) {
    console.log(error);
  }
};

//loadusers

const loadUsers = async (req, res) => {
  try {
    const search = "";
    if (req.query.search) {
      search = req.query.search;
    }
    const usersData = await User.find({
      $or: [
        { fname: { $regex: ".*" + search + ".*" } },
        { lname: { $regex: ".*" + search + ".*" } },
        { email: { $regex: ".*" + search + ".*" } },
        { mobile: { $regex: ".*" + search + ".*" } },
      ],
    });
    console.log(usersData);

    res.render("users1", { user: usersData });
  } catch (error) {
    console.log(error.message);
  }
};

//delete user

const deleteUser = async (req, res) => {
  try {
    const id = req.query.id;
    await User.deleteOne({ _id: id });
    res.redirect("/admin/users");
  } catch (error) {
    console.log(error.message);
  }
};

//block user

const blockUser = async (req, res) => {
  try {
    const id = req.query.id;
    await User.findByIdAndUpdate({ _id: id }, { $set: { is_blocked: true } });
    res.redirect("/admin/users");
  } catch (error) {
    console.log(error);
  }
};

///load edit user

const loadEditUser = async (req, res) => {
  try {
    const id = req.query.id;
    const userData = await User.findById({ _id: id });
    if (userData) {
      res.render("editUser", { user: userData });
    } else {
      res.redirect("/admin/users");
    }
  } catch (error) {
    console.log(error.message);
  }
};

//update user
const updateUser = async (req, res) => {
  try {
    const userData = await User.findByIdAndUpdate(
      { _id: req.body.id },
      {
        $set: {
          fname: req.body.fname,
          lname: req.body.lname,
          email: req.body.email,
          mobile: req.body.mobile,
        },
      }
    );
    res.redirect("/admin/users");
  } catch (error) {
    console.log(error.message);
  }
};

//unblockuser

const unBlockUser = async (req, res) => {
  try {
    const id = req.query.id;
    await User.findByIdAndUpdate({ _id: id }, { $set: { is_blocked: false } });
    res.redirect("/admin/users");
  } catch (error) {
    console.log(error);
  }
};

//orderlist
// const orderList = async(req,res)=>{
//   try {
//       const orders = await Order.aggregate([
//           { $unwind: "$orders" },
//           { $sort: { 'orders.createdAt' : -1 } },
//         ])
//       res.render('orderList',{orders})

//       console.log(orders);
//   } catch (error) {
//       console.log(error.message)

//   }
// }

const orderList = async (req, res) => {
  try {
   

    const totalOrders = await Order.aggregate([
      { $unwind: "$orders" },
      { $group: { _id: null, count: { $sum: 1 } } },
    ]);
    const count = totalOrders.length > 0 ? totalOrders[0].count : 0;
  


    const orders = await Order.aggregate([
      { $unwind: "$orders" },
      { $sort: { "orders.createdAt": -1 } },
    
    ]);

    res.render("orderList", { orders });
  } catch (error) {
    console.log(error.message);
  }
};

//change status

const changeStatus = async (req, res) => {
 
try {

  const orderId = req.body.orderId;
  const status = req.body.status;
  console.log(orderId);
  adminHelper.changeOrderStatus(orderId, status).then((response) => {
    console.log(response);
    res.send(response);
  });
  
} catch (error) {

  console.log(error.message, 'changeStatus');
  
}
};

const cancelOrder = (req, res) => {
  try {
    console.log("primaryy");
    const orderId = req.body.orderId;
    const status = req.body.status;
    console.log("status", status);
    return new Promise(async (resolve, reject) => {
      Order.findOne({ "orders._id": new ObjectId(orderId) }).then((orders) => {
        const order = orders.orders.find((order) => order._id == orderId);

        if (
          status == "Cancel Accepted" ||
          status == "Cancel Declined" ||
          status == "Direct Cancel"
        ) {
          Order.updateOne(
            { "orders._id": new ObjectId(orderId) },
            {
              $set: {
                "orders.$.orderStatus": status,
                "orders.$.paymentStatus": "No Refund",
              },
            }
          ).then((response) => {
            resolve(response);
          });
        }

        if (
          order.paymentMethod == "wallet" ||
          order.paymentMethod == "razorpay"
        ) {
          console.log("one");

          if (status == "Cancel Accepted" ||status == " Direct Cancel") {
            console.log("two");

            Order.updateOne(
              { "orders._id": new ObjectId(orderId) },
              {
                $set: {
                  "orders.$.orderStatus": status,
                  "orders.$.paymentStatus": "Refund Credited to Wallet",
                },
              }
            ).then(async (response) => {
              const userId = res.locals.user._id;
              console.log("three");

              console.log(response);
              const user = await User.findOne({ _id: userId });
              const currentWalletAmount = parseInt(user.wallet);
              const orderTotalPrice = parseInt(order.totalPrice);
              user.wallet = (currentWalletAmount + orderTotalPrice).toString();
              await user.save();

              const walletTransaction = {
                date: new Date(),
                type: "Credit",
                amount: order.totalPrice,
              };
              const walletupdated = await User.updateOne(
                { _id: userId },
                {
                  $push: { walletTransaction: walletTransaction },
                }
              );
              resolve(response);
            });
          }
          // if(status == ' Cancel Declined'){
          //   Order.updateOne(
          //     { "orders._id": new ObjectId(orderId) },
          //     {
          //       $set: {
          //         "orders.$.cancelStatus": status,
          //         "orders.$.orderStatus": status,
          //         "orders.$.paymentStatus": "No Refund"
          //       }
          //     }
          //   ).then((response) => {
          //     resolve(response);
          //   });
          // }
        }
      });
    });
  } catch (error) {
    console.log(error.message);
  }
};

///order details slip

const orderDetails = async (req, res) => {
  try {
    const id = req.query.id;
    console.log(id);
    adminHelper.findOrder(id).then((orders) => {
      const address = orders[0].shippingAddress;
      const products = orders[0].productDetails;
      res.render("orderSlip", { orders, address, products });
    });
    console.log(orders);
  } catch (error) {
    console.log(error.message);
  }
};

//return order

const returnOrder = async (req, res) => {
try {

  const orderId = req.body.orderId;
  const status = req.body.status;
  const user = res.locals.user;
  console.log("user", user);

  adminHelper.returnOrder(orderId, status, user).then((response) => {
    res.send(response);
  });
  
} catch (error) {

  console.log(error.message,'returnOrder');
  
}
};

////salesReport
const getSalesReport = async (req, res) => {

  try {

    const report = await adminHelper.getSalesReport();
    let details = [];
    const getDate = (date) => {
      const orderDate = new Date(date);
      const day = orderDate.getDate();
      const month = orderDate.getMonth() + 1;
      const year = orderDate.getFullYear();
      return `${isNaN(day) ? "00" : day} - ${isNaN(month) ? "00" : month} - ${
        isNaN(year) ? "0000" : year
      }`;
    };
  
    report.forEach((orders) => {
      details.push(orders.orders);
    });
  
    res.render("salesReport", { details, getDate });
    
  } catch (error) {

    console.log(error.message,'getSalesReport');
    
  }

};

const postSalesReport = (req, res) => {
  try {

    const admin = req.session.admin;
    const details = [];
    const getDate = (date) => {
      const orderDate = new Date(date);
      const day = orderDate.getDate();
      const month = orderDate.getMonth() + 1;
      const year = orderDate.getFullYear();
      return `${isNaN(day) ? "00" : day} - ${isNaN(month) ? "00" : month} - ${
        isNaN(year) ? "0000" : year
      }`;
    };
  
    adminHelper.postReport(req.body).then((orderData) => {
      console.log(orderData, "orderData");
      orderData.forEach((orders) => {
        details.push(orders.orders);
      });
      console.log(details, "details");
      res.render("salesReport", { details, getDate });
    });
    
  } catch (error) {

    console.log(error.message,'postSalesReport');

    
  }

};

// load add coupon

const loadCouponAdd = async (req, res) => {
  try {
    res.render("addCoupon");
  } catch (error) {
    console.log(error.message);
  }
};

///generateCouponCode

const generateCouponCode = async (req, res) => {
  try {
    const couponCode = await couponHelper.generateCouponCode();
    res.send(couponCode);
  } catch (error) {
    console.log(error.message);
  }
};

//addd coupon

const addCouponData = async (req, res) => {
  try {
    const data = {
      couponCode: req.body.coupon,
      validity: req.body.validity,
      minPurchase: req.body.minPurchase,
      minDiscountPercentage: req.body.minDiscountPercentage,
      maxDiscountValue: req.body.maxDiscount,
      description: req.body.description,
    };

    const response = await couponHelper.addCouponData(data);
    res.json(response);
  } catch (error) {
    console.log(error.message);
  }
};

//show coupon list

const couponList = async (req, res) => {
  try {
    const couponList = await Coupon.find();
    res.render("couponList", { couponList });
  } catch (error) {}
};

//remove coupon

const removeCoupon = async (req, res) => {
  try {
    const id = req.body.couponId;
    const result = await Coupon.deleteOne({ _id: id });

    res.json({ status: true });
  } catch (error) {
    console.log(error.message);
  }
};

// display add banner

const addBannerGet = async (req, res) => {
  try {
    res.render("addBanner");
  } catch (error) {
    console.log(error);
  }
};

//add banner

const addBannerPost = async (req, res) => {

  try {

    bannerHelper.addBannerHelper(req.body, req.file.filename).then((response) => {
      if (response) {
        // res.redirect("/admin/addBanner");
        res.render("addBanner", { message: "Banner added successfully" });
      } else {
        res.status(505);
      }
    });
    
  } catch (error) {

    console.log(error.message,'');


    
  }

};

//bannerlist
const bannerList = async (req, res) => {
  try {
    bannerHelper.bannerListHelper().then((response) => {
      res.render("bannerList", { banners: response });
    });
  } catch (error) {
    console.log(error);
  }
};

const deleteBanner = async (req, res) => {
 try {

  bannerHelper.deleteBannerHelper(req.query.id).then(() => {
    res.redirect("/admin/bannerList");
  });
  
 } catch (error) {

  console.log(error.message,'deleteBanner');
  
 }
};

//log out

const logout = (req, res) => {

  try {

    res.clearCookie("jwtadmin");
    res.redirect("/admin");
    
  } catch (error) {
    console.log(error.message,'logout');


    
  }

};

module.exports = {
  loadLogin,
  loadDashboard,
  verifyLogin,
  loadUsers,
  deleteUser,
  blockUser,
  loadEditUser,
  updateUser,
  unBlockUser,
  logout,
  orderList,
  changeStatus,
  cancelOrder,
  orderDetails,
  returnOrder,
  getSalesReport,
  postSalesReport,
  loadCouponAdd,
  generateCouponCode,
  addCouponData,
  couponList,
  removeCoupon,
  addBannerGet,
  addBannerPost,
  bannerList,
  deleteBanner,
};
