const Banner = require('../models/bannerModel')
const mongoose = require('mongoose')


const addBannerHelper=async(texts, Image) => {
    try {

        return new Promise(async (resolve, reject) => {
            const banner = new Banner({
                title: texts.title,
                subTitle:texts.subTitle,
                price:texts.price,
                link: texts.link,
                image: Image,
            });
            await banner.save().then((response) => {
                resolve(response);
            });
        });
        
    } catch (error) {
        console.log(error.message,'addBannerHelper');
        
    }

}
const bannerListHelper = async()=>{

    try {

        return new Promise(async (resolve, reject) => {
            await Banner.find().then((response) => {
                resolve(response);
            });
        });
        
    } catch (error) {

        console.log(error.message,'bannerListHelper');


        
    }

}

const deleteBannerHelper =async(deleteId)=>{
    try {
        return new Promise(async (resolve, reject) => {
            await Banner.deleteOne({ _id: deleteId }).then(() => {
                resolve();
            });
        });
    } catch (error) {
        console.log(error.message);
    }
}

const editBannerHelper = async(bannerId) =>{
    try {
        return new Promise((resolve, reject) => {
        Banner.aggregate([
            {
                $match:{_id:new mongoose.Types.ObjectId(bannerId) }
            },{
                $project:{
                    title:1,
                    image:1,
                    description:1
                }
            }
        ])
        .then((response) => {
            resolve(response);
          });
        });
      } catch (error) {
        console.log(error.message);
      } 
}


const updateBannerHelper=async(texts, Image) => {
    try {

        return new Promise(async (resolve, reject) => {
            const bannerId = texts.id
            console.log('bannerId',bannerId);
           let response = await Banner.updateOne(
             { _id: new mongoose.Types.ObjectId(bannerId) },
             {
               $set: {
                 title: texts.title,
                 description: texts.description,
                 image: Image,
               },
             }
           );
           resolve(response);
         });
        
    } catch (error) {

        console.log(error.message,'');

        
    }
  
}



module.exports = {
    addBannerHelper,
    bannerListHelper,
    deleteBannerHelper,
    editBannerHelper,
    updateBannerHelper
}