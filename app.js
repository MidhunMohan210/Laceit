const mongoose = require('mongoose')
mongoose.connect('mongodb+srv://midhunmohan:htHsvhVBtahopBIm@cluster0.b7uevvw.mongodb.net/')

const express = require('express');
const app = express();
app.use(express.static(__dirname+'/public'));


// User Route

const userRoute = require('./routes/userRoute')
app.use('/',userRoute)

const adminRoute = require('./routes/adminRoute')

app.use('/admin',adminRoute)



//Admin Route



app.listen(7000,()=>{
    console.log("Server Started on http://localhost:7000")
})