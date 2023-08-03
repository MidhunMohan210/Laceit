const returnOrder = async (orderId,userId,status) => {
  try {
    return new Promise(async (resolve, reject) => {
      Order.findOne({ "orders._id": new ObjectId(orderId) }).then((orders) => {
        const order = orders.orders.find((order) => order._id == orderId);
     
        if(order.paymentMethod == 'cod'){
        if (status == 'Return Declined') {
          Order.updateOne(
            { "orders._id": new ObjectId(orderId) },
            {
              $set: {
                "orders.$.cancelStatus": status,
                "orders.$.orderStatus": status,
                "orders.$.paymentStatus": "No Refund"
              } 
            }
          ).then((response) => {
            resolve(response);
          });
        }else if(status == 'Return Accepted'){
          Order.updateOne(
            { "orders._id": new ObjectId(orderId) },
            {
              $set: {
                "orders.$.cancelStatus": status,
                "orders.$.orderStatus": status,
                "orders.$.paymentStatus": "Refund Credited to Wallet"
              }
            }
          ).then(async (response) => {
            const user = await User.findOne({ _id: userId});
            user.wallet += parseInt(order.totalPrice);
            await user.save();
            const walletTransaction = {
              date:new Date(),
              type:"Credit",
              amount:order.totalPrice,
            }
            const walletupdated = await User.updateOne(
              { _id: userId },
              {
                $push: { walletTransaction: walletTransaction },
              }
            )
            resolve(response);
          });

        }
      }else if(order.paymentMethod=='wallet'||order.paymentMethod=='razorpay'){
        if(status == 'Return Accepted'){
          Order.updateOne(
            { "orders._id": new ObjectId(orderId) },
            {
              $set: {
                "orders.$.cancelStatus": status,
                "orders.$.orderStatus": status,
                "orders.$.paymentStatus": "Refund Credited to Wallet"
              }
            }
          ).then(async (response) => {
            const user = await User.findOne({ _id: userId});
            user.wallet += parseInt(order.totalPrice);
            await user.save();
            const walletTransaction = {
              date:new Date(),
              type:"Credit",
              amount:order.totalPrice,
            }
            const walletupdated = await User.updateOne(
              { _id: userId },
              {
                $push: { walletTransaction: walletTransaction },
              }
            )
            resolve(response);
          });

        }else if(status == 'Return Declined'){
          Order.updateOne(
            { "orders._id": new ObjectId(orderId) },
            {
              $set: {
                "orders.$.cancelStatus": status,
                "orders.$.orderStatus": status,
                "orders.$.paymentStatus": "No Refund"
              }
            }
          ).then((response) => {
            resolve(response);
          });
        }
      }
      });
    });
  } catch (error) {
    console.log(error.message);
  }
};