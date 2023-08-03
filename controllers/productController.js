const path = require("path");
const Product = require("../models/productModel");
const multer = require("multer");
const Category = require("../models/categoryModel");
const { log } = require("util");

///load product list

const loadProductList = async (req, res) => {
  try {
    const product = await Product.find({});
    res.render("productList", { product: product });
  } catch (error) {
    console.log(error.message);
  }
};

//load add product

const loadProducts = async (req, res) => {
  try {
    let categories = await Category.find({ isListed: true });
    console.log(categories);

    res.render("addProduct2", { category: categories });
  } catch (error) {
    console.log(error.message);
  }
};

///sunmit add product

const createProduct = async (req, res) => {
  const { name, description, category, price } = req.body;
  const filesArray = Object.values(req.files).flat();
  const images = filesArray.map((file) => file.filename);
  let categories = await Category.find({});

  if (name.trim().length === 0 || description.trim().length === 0) {
    return res.render("addProduct2", {
      message: "Product title and description cannot be empty",
      category: categories,
    });
  }

  // Validation for product price
  const parsedPrice = parseFloat(price);
  if (isNaN(parsedPrice) || parsedPrice < 0) {
    return res.render("addProduct2", {
      message:
        "Product price cannot be empty and should be a non-negative number",
      category: categories,
    });
  }

  const newProduct = new Product({
    name,
    description,
    images,
    category,
    price,
  });

  newProduct
    .save()
    .then(() => {
      res.render("addProduct2", {
        message: "product added succesfully",
        category: categories,
      });
    })
    .catch((err) => {
      console.error("Error adding product:", err);
      res.render("addProduct2", {
        message: "Error in adding Product",
        category: categories,
      });
    });
};

////editProductList

const editProductList = async (req, res) => {
  try {
    const id = req.query.id;
    const productData = await Product.find({ _id: id });
    const category = productData[0].category;
    const productCategory = await Category.find({ _id: category });
    const allCategory = await Category.find();

    res.render("editProductList", {
      productData,
      productCategory,
      allCategory,
    });
  } catch (error) {
    console.log(error.message);
  }
};

///update product list

const updateProductList = async (req, res) => {
  try {
    const id = req.body.id;
    const name = req.body.name;
    const description = req.body.description;
    const price = req.body.price;
    const category = req.body.category;
    const status = req.body.status === "listed";
    const filesArray = Object.values(req.files).flat();
    const images = filesArray.map((file) => file.filename);

    // Find the existing product data
    const productData = await Product.findById(id);

    // Check if new images are provided
    const updatedImages = images.length > 0 ? images : productData.images;

    const update = await Product.updateOne(
      { _id: id },
      {
        $set: {
          name: name,
          description: description,
          price: price,
          category: category,
          is_listed: status,
          images: updatedImages,
        },
      }
    );

    res.redirect("/admin/productList");
  } catch (error) {
    console.log(error.message);
  }
};

//delete product

const deleteProduct = async (req, res) => {
  try {
    const id = req.query.id;

    const product = await Product.findByIdAndDelete(id);

    res.redirect("/admin/productList");
  } catch (error) {
    console.log(error.message);
  }
};

///load product details

const productDetails = async (req, res) => {
  try {
    const id = req.query.id;
    const productData = await Product.findById(id);
    const categoryid = productData.category._id.toString();
    const categoryData = await Category.findById(categoryid);

    console.log(res.locals.user);
    res.render("productDetails", {
      product: productData,
      categoryData,
      user: res.locals.user,
    });
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  loadProducts,
  createProduct,
  loadProductList,
  editProductList,
  updateProductList,
  deleteProduct,
  productDetails,
};
