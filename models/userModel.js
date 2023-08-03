const mongoose = require("mongoose")
// const jwt = require('jsonwebtoken')
const userSchema  = mongoose.Schema({
    fname:{
        type:String,
        required:true
    },
    lname:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    mobile:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },

 

    is_blocked:{
        type:Number,
        required:true,
        default:false
    },
    coupons:[],
    wallet: {
        type: String,
        default: 0.0,
      },
      walletTransaction:{
        type:Array
    }
})

// userSchema.methods.generateJWT = function(){
//     const token = jwt.sign({
//         _id:this._id,
//         number:this.mobile
//     },process.env.JWT_SECRET_KEY,{expiresIn : '7d'})
// }

module.exports = mongoose.model('User',userSchema)