const wishListHelper = require('../helpers/wishListHelper')
const cartHelper = require('../helpers/cartHelper')

const getWishList = async (req, res) => {
  try {

    let user = res.locals.user;
    // let count = await cartHelper.getCartCount(user._id);
    const wishlistCount = await wishListHelper.getWishListCount(user._id);
    wishListHelper.getWishListProducts(user._id).then((wishlistProducts) => {

      res.render("wishlist", {
        user,
        // count,
        wishlistProducts,
        wishlistCount,
      });
    });
    
  } catch (error) {
    console.log(error.message,'getWishList');
    
  }
    
  }

  const addWishList = async (req, res) => {

    try {

      let proId = req.body.proId;
      let userId = res.locals.user._id;
      wishListHelper.addWishList(userId, proId).then((response) => {
      res.send(response);
      });
      
    } catch (error) {

      console.log(error.message,'addWishList');

      
    }


  
  }

  const removeProductWishlist = async (req, res) => {
    try {
      
    const userId=res.locals.user._id

    const proId = req.body.proId;

    wishListHelper
      .removeProductWishlist(proId, userId)
      .then((response) => {
        res.send(response);
      });
      
    } catch (error) {
      console.log(error.message,'removeProductWishlist');

      
    }

    

  }

  module.exports = {
    getWishList,
    addWishList,
    removeProductWishlist


  }
