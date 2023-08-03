const Order = require("../models/orderModel");
const { ObjectId } = require("mongodb");
const User = require("../models/userModel");



//changeOrderStatus

const changeOrderStatus = (orderId, status) => {
  try {
    return new Promise((resolve, reject) => {
      Order.updateOne(
        { "orders._id": new ObjectId(orderId) },
        {
          $set: { "orders.$.orderStatus": status },
        }
      ).then((response) => {
      
        resolve(response);
      });
    });
  } catch (error) {
    console.log(error.message);
  }
};

//find order

const findOrder = (orderId) => {
  try {
    return new Promise((resolve, reject) => {
      Order.aggregate([
        {
          $match: {
            "orders._id": new ObjectId(orderId),
          },
        },
        { $unwind: "$orders" },
      ]).then((response) => {
        const orders = response
          .filter((element) => {
            if (element.orders._id == orderId) {
              return true;
            }
            return false;
          })
          .map((element) => element.orders);

        resolve(orders);
      });
    });
  } catch (error) {
    console.log(error.message);
  }
};

///return order
const returnOrder = (orderId, status,USERdata) => {
  try {
    console.log('returnOrderUSERdata',USERdata);
    const USER=USERdata
    console.log('returnOrderUSER',USER);
    return new Promise(async (resolve, reject) => {
      Order.findOne({ "orders._id": new ObjectId(orderId) })
        .then((orders) => {
          const order = orders.orders.find((order) => order._id == orderId);

          if (status == "Return Declined") {
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
            })
            .catch((error) => {
              console.log('errorryyy\ rr',error);
              reject(error);
            });
          } else if (status == "Return Accepted") {
            Order.updateOne(
              { "orders._id": new ObjectId(orderId) },
              {
                $set: {
                  "orders.$.orderStatus": status,
                  "orders.$.paymentStatus": "Refund Credited to Wallet",
                },
              }
            ).then(async (response) => {
              console.log('USER',USER);
              const user = await User.findOne({ _id: USER._id});
              
              const currentWalletAmount = parseInt(user.wallet);
              const orderTotalPrice = parseInt(order.totalPrice);
              user.wallet = (currentWalletAmount + orderTotalPrice).toString();
              await user.save();
              const walletTransaction = {
                date:new Date(),
                type:"Credit",
                amount:order.totalPrice,
              }
              const walletupdated = await User.updateOne(
                { _id: user._id },
                {
                  $push: { walletTransaction: walletTransaction },
                }
              )
              resolve(response);
            }).catch((error) => {
              console.log('errorrrr',error);
              reject(error);
            });
          }
        })
        .catch((error) => {
          reject(error);
        });
    });
  } catch (error) {
    console.log(error.message);
  }
};

const getOnlineCount = () => {

  try {
    return new Promise(async (resolve, reject) => {
      const response = await Order.aggregate([
        {
          $unwind: "$orders",
        },
        {
          $match: {
            "orders.paymentMethod": "razorpay",
          },
        },
        {
          $group: {
            _id: null,
            totalPriceSum: { $sum: { $toInt: "$orders.totalPrice" } },
            count: { $sum: 1 },
          },
        },
      ]);
      resolve(response);
    });
    
  } catch (error) {

    console.log(error.message,'getOnlineCount');


    
  }

};

///get sales report

const getSalesReport = () => {
  try {
    return new Promise((resolve, reject) => {
      Order.aggregate([
        {
          $unwind: "$orders",
        },
        // {
        //   $match: {
        //     "orders.orderStatus": "Delivered",
        //   },
        // },
      ]).then((response) => {
        resolve(response);
      });
    });
  } catch (error) {
    console.log(error.message);
  }
};

const postReport = (date) => {
 
  try {
    console.log(date, "date+++++");
    const start = new Date(date.startdate);
    const end = new Date(date.enddate);
    return new Promise((resolve, reject) => {
      Order.aggregate([
        {
          $unwind: "$orders",
        },
        {
          $match: {
            $and: [
              // { "orders.orderStatus": "Delivered" },
              {
                "orders.createdAt": {
                  $gte: start,
                  $lte: new Date(end.getTime() + 86400000),
                },
              },
            ],
          },
        },
      ])
        .exec()
        .then((response) => {
          console.log(response, "response---");
          resolve(response);
        });
    });
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  findOrder,
  changeOrderStatus,
  returnOrder,
  getOnlineCount,
  getSalesReport,
  postReport,
};
