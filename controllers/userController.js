const User = require("../models/userModel");
const Product = require("../models/productModel");
const jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");
const Address = require("../models/userAddressModel");
const Cart = require("../models/cartModel");
const Category = require("../models/categoryModel");
const Banner = require("../models/bannerModel");
const { ObjectId } = require("mongodb");
require('dotenv/config')
const client = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);




const maxAge = 3 * 24 * 60 * 60;
const createToken = (id) => {
  return jwt.sign({ id }, "my-secret", {
    expiresIn: maxAge,
  });
};

const bcrypt = require("bcrypt");

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};
const homeLoad = async (req, res) => {
  try {
    const banner = await Banner.find({});
    const product=await Product.find({}).skip(2).limit(5)
    const category=await Category.find({})
    console.log('product',product);
    console.log(banner);
    // const category = await Category.find({ })
    res.render("landingPage", { user: res.locals.user, banner,product,category });

    // res.render("landingPage");
  } catch (error) {
    console.log(error.message);
  }
};

///login page

const loginLoad = async (req, res) => {
  try {
    res.render("userLogin");
  } catch (error) {
    console.log(error.message);
  }
};

///register user page

const loadRegister = async (req, res) => {
  try {
    res.render("register");
  } catch (error) {
    console.log(error.message);
  }
};

//submit register  and send otp

const insertUser = async (req, res) => {
  const email = req.body.email;
  const num = req.body.mno;

  const existingUser = await User.findOne({ email: email });
  const existingNum = await User.findOne({ mobile: num });

  if (existingUser) {
    return res.render("register", { message: "Email already exists" });
  }
  if (existingNum) {
    return res.render("register", { message: "Number already exists" });
  }

  if (/\d/.test(req.body.fname) || /\d/.test(req.body.lname)) {
    return res.render("register", {
      message: "Name should not contain numbers",
    });
  }

  const mobileNumber = req.body.mno;
  const otp = otpGenerator.generate(6, {
    upperCase: false,
    specialChars: false,
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
  });
  await client.messages.create({
    body: `Your OTP for Smart Wrist Sign Up is: ${otp}`,
    from: "+18623226158",
    to: `${mobileNumber}`,
  });
  console.log(`Otp is ${otp}`);
  try {
    req.session.otp = otp;
    req.session.userData = req.body;
    req.session.mobile = mobileNumber;
    res.render("verifyOtp");
  } catch (error) {
    console.log(error.message);
  }
};

//verify login

const verifyLogin = async (req, res) => {
  try {
    const emailRegex =
      /^([a-zA-Z0-9\._]+)@([a-zA-Z0-9]+)\.([a-z]+)(\.[a-z]+)?$/;

    const email = req.body.email;
    const password = req.body.password;

    if (!email) {
      return res.render("userLogin", { message: "Email must be filled" });
    }
    if (!emailRegex.test(email)) {
      return res.render("userLogin", { message: "Invalid email format" });
    }

    if (!password) {
      return res.render("userLogin", { message: "Password must be filled" });
    }

    const userData = await User.findOne({ email: email });

    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);

      if (passwordMatch) {
        if (userData.is_blocked == true) {
          return res.render("userLogin", {
            message: "Your Account is Blocked",
          });
        } else {
          const token = createToken(userData._id);
          res.cookie("jwt", token, { httpOnly: true, maxAge: maxAge * 1000 });
          req.session.id = userData._id;
          return res.redirect("/home");
          // res.send("success")
        }
      } else {
        return res.render("userLogin", {
          message: "Email and Password are Incorrect",
        });
      }
    } else {
      return res.render("userLogin", {
        message: "Email and Password are Incorrect",
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

///resend otp

const resendOTP = async (req, res) => {
  const mobileNumber = req.session.mobile;
  try {
    // Retrieve user data from session storage
    const userData = req.session.userData;

    if (!userData) {
      res.status(400).json({ message: "Invalid or expired session" });
    }

    // Generate and send new OTP using Twilio
    const otp = otpGenerator.generate(6, {
      upperCase: false,
      specialChars: false,
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
    });

    req.session.otp = otp;

    await client.messages.create({
      body: `Your OTP for  Sign Up is: ${otp}`,
      from: "+18623226158",
      to: `+91${mobileNumber}`,
    });
    console.log(`Resend Otp is ${otp}`);

    res.render("verifyOtp", { message: "OTP resent successfully" });
  } catch (error) {
    console.error("Error: ", error);
    res.render("verifyOtp", { message: "Failed to send otp" });
  }
};

///verify otp

const verifyOtp = async (req, res) => {
  const otp = req.body.otp;
  try {
    const sessionOTP = req.session.otp;
    const userData = req.session.userData;

    if (!sessionOTP || !userData) {
      res.render("verifyOtp", { message: "Invalid Session" });
    } else if (sessionOTP !== otp) {
      res.render("verifyOtp", { message: "Invalid OTP" });
    } else {
      const spassword = await securePassword(userData.password);
      const user = new User({
        fname: userData.fname,
        lname: userData.lname,
        email: userData.email,
        mobile: userData.mno,
        password: spassword,
        is_admin: 0,
      });
      const userDataSave = await user.save();
      if (userDataSave) {
        const token = createToken(user._id);
        res.cookie("jwt", token, { httpOnly: true, maxAge: maxAge * 1000 });
        // res.redirect("/");
        res.send(
          '<script>alert("Verification success"); window.location.href = "/login";</script>'
        );
      } else {
        res.render("register", { message: "Registration Failed" });
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

///load  forgotpassword page

const loadForgotPassword = async (req, res) => {
  try {
    res.render("forgetPassword");
  } catch (error) {
    console.log(error.message);
  }
};

//// forgot password otp verofication

const forgotPasswordOtp = async (req, res) => {
  try {
    req.session.mobile = req.query.mobileNumber;
    const user = await User.findOne({ mobile: req.query.mobileNumber });

    if (!user) {
      res.render("forgetPassword", { message: "User Not Registered" });
    } else {
      const OTP = otpGenerator.generate(6, {
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
      });
      // await client.messages.create({
      //   body: `Your OTP for Smart Wrist Sign Up is: ${OTP}`,
      //   from: "+18623226158",
      //   to: `+91${user.mobile}`,
      // });
      console.log(`Forgot Password otp is --- ${OTP}`);
      req.session.otp = OTP;
      req.session.email = user.email;
      res.render("forgetPassword", { mobile: req.query.mobileNumber });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const resetPasswordOtpVerify = async (req, res) => {
  try {
    const mobile = req.session.mobile;
    const otp = req.session.otp;

    console.log("session otp", otp);

    const reqOtp = req.body.otp;

    const otpHolder = await User.find({ mobile: req.body.mobile });
    if (otp == reqOtp) {
      //sending token as a cookie
      const token = createToken(User._id);
      // res.cookie("jwt", token, { httpOnly: true, maxAge: maxAge * 1000 });
      res.render("changePassword");
    } else {
      res.render("forgetPassword", { message: "Wrong OTP" });
    }
  } catch (error) {
    console.log(error);
    return console.log("an error occured");
  }
};

const setNewPassword = async (req, res) => {


  const newpw = req.body.newPassword;
  const confpw = req.body.confirmPassword;

  const mobile = req.session.mobile;
  const email = req.session.email;

  if (newpw === confpw) {
    const spassword = await securePassword(newpw);
    const newUser = await User.updateOne(
      { email: email },
      { $set: { password: spassword } }
    );

    console.log(newUser);
    res.redirect("/login")

   

    console.log("Password updated successfully");
  } else {
    res.render("resetPassword", {
      message: "Password and Confirm Password is not matching",
    });
  }
};

const logout = (req, res) => {
  res.clearCookie("jwt");
  res.redirect("/login");
  // res.send("hai")
};
``;
const displayProduct = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const skip = (page - 1) * limit; //

    const totalProducts = await Product.countDocuments({ is_listed: true }); // Get the total number of products

    const totalPages = Math.ceil(totalProducts / limit); // Calculate the total number of pages

    // const product = await Product.find({ is_listed: true });
    const categories = await Category.find({ isListed: true });
    const catId = await Category.aggregate([
      {
        $match: {
          isListed: true,
        },
      },

      {
        $project: {
          _id: 1,
        },
      },
    ]);

    const products = await Product.find({
      category: { $in: catId },
      is_listed: true,
    })
      .skip(skip)
      .limit(limit);

    res.render("shop", {
      product: products,
      categories,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    console.log(error.message);
  }
};

//category wise

const categoryPage = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const skip = (page - 1) * limit; //

    const categoryId = req.query.id;

    const categories = await Category.find({ isListed: true });

    const product = await Product.aggregate([
      {
        $match: {
          category: new ObjectId(categoryId),
          is_listed: true,
        },
      },
    ])
      .skip(skip)
      .limit(limit);

    const pro = await Product.aggregate([
      {
        $match: {
          category: new ObjectId(categoryId),
          is_listed: true,
        },
      },
    ]);

    const totalProducts = pro.length;

    const totalPages = Math.ceil(totalProducts / limit); // Calculate the total number of pages

    res.render("shopCategory", {
      product,
      categories,
      currentPage: page,
      totalPages,
      categoryId,
    });
  } catch (err) {
    console.log("category page error", err);
  }
};

//search product

const searchProduct = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;

    const limit = 6;
    const skip = (page - 1) * limit; //
    const searchQuery = req.query.search || "";

    const categories = await Category.find({ isListed: true });
    const catId = await Category.aggregate([
      {
        $match: {
          isListed: true,
        },
      },

      {
        $project: {
          _id: 1,
        },
      },
    ]);

    // Build the search filter
    const searchFilter = {
      $and: [
        { category: { $in: catId } },
        { is_listed: true },
        {
          $or: [
            { name: { $regex: new RegExp(searchQuery, "i") } },
            // You can add more conditions to the $or array if needed
          ],
        },
      ],
    };

    const totalProducts = await Product.countDocuments(searchFilter);

    const totalPages = Math.ceil(totalProducts / limit);

    const product = await Product.find(searchFilter).skip(skip).limit(limit);

    res.render("shopSearch", {
      product,
      categories,
      currentPage: page,
      totalPages,
      searchQuery,
    });
  } catch (error) {}
};

//priceFilter
const priceFilter = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;

    const limit = 6;
    const skip = (page - 1) * limit; //

    const filter = req.query.filter;

    const categories = await Category.find({ isListed: true });
    const catId = await Category.aggregate([
      {
        $match: {
          isListed: true,
        },
      },

      {
        $project: {
          _id: 1,
        },
      },
    ]);

    const pro = await Product.find({
      category: { $in: catId },
      is_listed: true,
    });

    let products;

    if (filter === "lh") {
      products = await Product.find({
        category: { $in: catId },
        is_listed: true,
      })
        .sort({ price: 1 })
        .skip(skip)
        .limit(limit);
      // console.log(products);
    } else if (filter === "hl") {
      products = await Product.find({
        category: { $in: catId },
        is_listed: true,
      })
        .sort({ price: -1 })
        .skip(skip)
        .limit(limit);
      // console.log(products);
    }

    const totalProducts = pro.length;

    const totalPages = Math.ceil(totalProducts / limit);
    res.render("shopPriceFilter", {
      product: products,
      categories,
      currentPage: page,
      totalPages,
      filter,
    });
  } catch (error) {
    console.log(error.message);
  }
};

//pricefilter2

const priceFilter2 = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;

    const limit = 2;
    const skip = (page - 1) * limit;

    const filter = req.query.filter;


    const categories = await Category.find({ isListed: true });
    const catId = await Category.aggregate([
      {
        $match: {
          isListed: true,
        },
      },

      {
        $project: {
          _id: 1,
        },
      },
    ]);

    let products;
    let filterCondition = {};

    if (filter === "1-500") {
      filterCondition = { $gte: 1, $lte: 500 };
    } else if (filter === "500-1000") {
      filterCondition = { $gte: 500, $lte: 1000 };
    } else if (filter === "1000-2000") {
      filterCondition = { $gte: 1000, $lte: 2000 };
    } else if (filter === "above2000") {
      filterCondition = { $gte: 2000 };
    }

    products = await Product.find({
      category: { $in: catId },
      is_listed: true,
      price: filterCondition,
    });

    const totalProducts = products.length;
    const totalPages = Math.ceil(totalProducts / limit);

    products = await Product.find({
      category: { $in: catId },
      is_listed: true,
      price: filterCondition,
    })
      .skip(skip)
      .limit(limit);



    res.render("shopPriceFilter2", {
      product: products,
      categories,
      currentPage: page,
      totalPages,
      filter,
    });
  } catch (error) {
    console.log(error.message);
  }
};

//load checkout

const checkout = async (req, res) => {
  try {
    const user = res.locals.user;
    const userId = res.locals.user._id;
    const CartData = await Cart.find({ user: userId });

    if (CartData.length === 0) {
      res.redirect("/viewCart");
    } else if (CartData[0].cartItems.length === 0) {
      res.redirect("/viewCart");
    } else {
      const result = await Address.find({ user: userId }, { addresses: 1 });

      let primary = null;
      let addArray = [];

      if (result.length > 0) {
        primary =result[0].addresses[0]
        addArray = result[0].addresses;
      }

      console.log("primary",primary);
      console.log("addArray",addArray);

      const cart = CartData[0];

      res.render("checkout", { addArray, cart, user });
    }
  } catch (error) {
    console.log(error.message);
    res.redirect("/viewCart");
  }
};

///changePrimary

const changePrimary = async (req, res) => {
  try {
    const userId = res.locals.user._id.toString();
    const result = req.body.addressRadio;

    const user = await Address.find({ user: userId });

    const addressIndex = user[0].addresses.findIndex((address) =>
      address._id.equals(result)
    );
    if (addressIndex === -1) {
      throw new Error("Address not found");
    }

    const removedAddress = user[0].addresses.splice(addressIndex, 1)[0];
    user[0].addresses.unshift(removedAddress);

    const final = await Address.updateOne(
      { user: userId },
      { $set: { addresses: user[0].addresses } }
    );

    res.redirect("/checkout");
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  homeLoad,
  loadRegister,
  insertUser,
  verifyOtp,
  loginLoad,
  verifyLogin,
  resendOTP,
  forgotPasswordOtp,
  loadForgotPassword,
  resetPasswordOtpVerify,
  setNewPassword,

  logout,
  displayProduct,
  checkout,
  changePrimary,
  categoryPage,
  searchProduct,
  priceFilter,
  priceFilter2,
};
