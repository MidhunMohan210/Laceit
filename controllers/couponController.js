const couponHelper = require("../helpers/couponHelper");
const Coupon = require("../models/couponModel");
const { response } = require("../routes/userRoute");
const { loginLoad } = require("./userController");

const verifyCoupon = async (req, res) => {
  try {
    const userId = res.locals.user._id;
    const couponCode = req.query.couponCode;

    const responce = await couponHelper.verifyCouponData(couponCode, userId);
    res.send(responce)
    console.log("responce",responce);
  } catch (error) {
    console.log(error.message);
  }
};




//apply coupon

const applyCoupon= async (req,res)=>{
  try {

    const userId=res.locals.user._id;
    const subTotal=req.query.subTotal
    const couponCode=req.query.couponCode
    console.log(userId);
    console.log(subTotal);
    console.log(couponCode);


    const response= await couponHelper.applyCoupon(userId,subTotal,couponCode)
    console.log( "response",  response);
    res.send(response)


    
  } catch (error) {
    console.log(error.message);
  }
}




module.exports = {
  verifyCoupon,
  applyCoupon
};