const Cart = require("../models/cartModel");
const Product = require("../models/productModel");
const Address = require("../models/userAddressModel");
const User = require("../models/userModel");
const profileHelper = require("../helpers/profileHelper");
const orderHelper = require("../helpers/orderHelper");
const Order = require("../models/orderModel");
const { ObjectId } = require("mongodb");

const bcrypt = require("bcrypt");

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

// Load profile
const profile = async (req, res) => {
  try {
    const user = res.locals.user;
   
    const orders = await profileHelper.getOrderDetails(user._id);

    const address = await Address.find();
    const ad = address.forEach((x) => {
      return (arr = x.addresses);
    });

    res.render("profileOrderList", { user, arr, orders });
  } catch (error) {
    console.log(error.message);
  }
};

///submitt address

const submitAddress = async (req, res) => {
  try {
    const userId = res.locals.user._id;
   
    const name = req.body.name;
    const mobileNumber = req.body.mno;
    const address = req.body.address;
    const locality = req.body.locality;
    const city = req.body.city;
    const pincode = req.body.pincode;
    const state = req.body.state;

    // Create a new address object
    const newAddress = {
      name: name,
      mobileNumber: mobileNumber,
      address: address,
      locality: locality,
      city: city,
      pincode: pincode,
      state: state,
    };

    const updatedUser = await profileHelper.updateAddress(userId, newAddress);
    if (!updatedUser) {
      // No matching document found, create a new one
      await profileHelper.createAddress(userId, newAddress);
    }

    res.json({ message: "Address saved successfully!" });

    res.redirect("/profile"); // Redirect to the profile page after saving the address
  } catch (error) {
    console.log(error.message);
  }
};

///edit address

const editAddress = async (req, res) => {

  try {

    const id = req.body.id;
    const name = req.body.name;
    const address = req.body.address;
    const locality = req.body.locality;
    const city = req.body.city;
    const pincode = req.body.pincode;
    const state = req.body.state;
    const mobileNumber = req.body.mobileNumber;
  
    const update = await Address.updateOne(
      { "addresses._id": id }, // Match the document with the given ID
      {
        $set: {
          "addresses.$.name": name,
          "addresses.$.address": address,
          "addresses.$.locality": locality,
          "addresses.$.city": city,
          "addresses.$.pincode": pincode,
          "addresses.$.state": state,
          "addresses.$.mobileNumber": mobileNumber,
        },
      }
    );
  
    res.redirect("/profile");
    
  } catch (error) {

    console.log(error.message,'editAddress');


    
  }


};

///delete address

const deleteAddress = async (req, res) => {
try {

  const userId = res.locals.user._id;
  const addId = req.body.addressId;


  const deleteobj = await Address.updateOne(
    { user: userId }, // Match the user based on the user ID
    { $pull: { addresses: { _id: addId } } } // Remove the object with matching _id from addresses array
  );

  res.redirect("/profile");
  
} catch (error) {

  console.log(error.message,'deleteAddress');


  
}
};

///edit info

const editInfo = async (req, res) => {
  try {
    
   const userId = res.locals.user._id;
   
    const { fname, lname, email, mobile } = req.body;
 

    const result = await User.updateOne(
      { _id: userId }, // Specify the user document to update based on the user ID
      { $set: { fname, lname, email, mobile } } // Set the new field values
    );

    res.redirect("/profile");
  } catch (error) {
    console.log(error.message);
  }
};

//editPassword
const editPassword = async (req, res) => {
  try {
    const newPass = req.body.newPassword;
    // const confPass = req.body.confPass;
    const userId = res.locals.user._id;

  

    
      const spassword = await securePassword(newPass);
      console.log(spassword);

      const result = await User.updateOne(
        { _id: userId },
        { $set: { password: spassword } }
      );
      

      res.redirect("/profile");
    
  } catch (error) {
    console.log(error.message);
  }
};

///viewOrder
const viewOrder = async (req, res) => {
  try {
    const orderId = req.query.id;

    const result = await profileHelper.getOrderDataById(orderId);
   


    let timestamp = result[0].date;
    let date = new Date(timestamp);

    const formattedDate = date.toLocaleDateString("en-US");
    const formattedTime = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });

    console.log(formattedDate);
    console.log(formattedTime);




    res.render("profileOrderSlip", { result, formattedDate, formattedTime });
  } catch (error) {
    console.log(error.message);
  }
};

const cancelOrder = async (req, res) => {
  try {
    const orderId = req.body.orderId;
    const status = req.body.status;

    const result = await Order.updateOne(
      { "orders._id": new ObjectId(orderId) },
      { $set: { "orders.$.orderStatus": status } }
    );

    res
      .status(200)
      .json({ success: true, message: "Order status updated successfully." });
  } catch (error) {
    console.log(error.message);
    res
      .status(500)
      .json({ success: false, message: "Error updating order status." });
  }
};

//profile Order List

const profileOrderList = async (req, res) => {
  try {
    const user = res.locals.user;
    const result = await profileHelper.getOrderDetails(user._id);
    const orders=result.reverse()

    if(orders){

      res.render("profileOrderList", { orders });
    }else{

      res.render("profileOrderList", { orders:[] });


    }

  } catch (error) {
    console.log(error.message);
  }
};

//profile address

const profileAddress = async (req, res) => {
  try {
    const user = res.locals.user._id;

    const result = await Address.find({ user: user });

    if(result.length>0){
    const address = result[0].addresses;


      res.render("address", { address });
    }else{
      res.render("address", { address:[] });

    }

  } catch (error) {
    console.log(error.message);
  }
};

const profileDetails = async (req, res) => {
  try {
    const id = res.locals.user._id;
    const user = await User.findOne({ _id: id });

    res.render("profileDetails", { user });
  } catch (error) {
    console.log(error.message);
  }
};

const walletTransaction = async(req,res)=>{
  try {
    const user = res.locals.user
    // const userData= await User.findOne({_id:user._id})
    const wallet = await User.aggregate([
      {$match:{_id:user._id}},
      {$unwind:"$walletTransaction"},
      {$sort:{"walletTransaction.date":-1}},
      {$project:{walletTransaction:1,wallet:1}}
    ])

    res.render('wallettransaction',{wallet})
    
  } catch (error) {
    console.log(error.message);
  }


}




module.exports = {
  profile,
  submitAddress,
  editAddress,
  deleteAddress,
  editInfo,
  editPassword,
  viewOrder,
  cancelOrder,
  profileOrderList,
  profileAddress,
  profileDetails,
  walletTransaction
};
