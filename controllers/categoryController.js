const path = require("path");
const multer = require("multer");
const Category = require("../models/categoryModel");

//load category

const loadCategory = async (req, res) => {
  try {
    const categories = await Category.find();

    res.render("page-categories", { categories });
  } catch (error) {
    console.log(error);
  }
};

//Create/add  category

const createCategory = async (req, res) => {
  try {
    const name = req.body.name;
    const existingCategory = await Category.findOne({ name: name });
    console.log(existingCategory);
    if (existingCategory) {
      const categories = await Category.find();
      res.render("page-categories", {
        message: "name already exist",
        categories,
      });
    } else {
      const category = new Category({
        name: req.body.name,
        description: req.body.description,
      });
      const savedCategory = await category.save();
      res.redirect("/admin/loadCategory");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const showCategory = async (req, res) => {
  try {
    res.redirect("/admin/loadCategory");
  } catch (error) {
    console.log(error.messgae);
  }
};

const loadUpdateCategory = async (req, res) => {
  try {
    const id = req.query.id;

    const Categorydata = await Category.findById({ _id: id });
    console.log(Categorydata);

    res.render("editCategories", { category: Categorydata });
  } catch (error) {
    console.log(error.message);
  }
};

// Update a category
async function updateCategory(req, res) {
  try {
    const categoryId = req.body.id;
    const updatedCategory = await Category.findByIdAndUpdate(
      { _id: categoryId },
      { $set: { name: req.body.category, description: req.body.description } }
    );
    res.redirect("/admin/loadCategory");
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Failed to update category" });
  }
}

//delete category

async function deleteCategory(req, res) {
  try {
    const categoryId = req.query.id;
    console.log(categoryId);
    const updatedCategory = await Category.findByIdAndDelete(categoryId);
    res.redirect("/admin/loadCategory");
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Failed to update category" });
  }
}

//change status

const changeStatus = async (req, res) => {
  try {
    const category_id = req.query.id;
    const category = await Category.findById(category_id);

    if (category) {
      const updatedList = !category.isListed; // Toggle the value
      const result = await Category.updateOne(
        { _id: category.id },
        { $set: { isListed: updatedList } }
      );
      await category.save();
    }

    res.redirect("/admin/loadCategory");

    res.redirect("/admin/loadCategory");
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  loadCategory,
  createCategory,
  loadUpdateCategory,
  updateCategory,
  changeStatus,
  showCategory,
  deleteCategory,
};
