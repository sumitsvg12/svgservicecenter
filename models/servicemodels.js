const mongoose=require('mongoose');

const datamodelSchema=mongoose.Schema({
    servicename:{
        type:String,
        required:true
    },
    newprice:{
        type:Number,
        required:true
    },
    oldprice:{
        type:Number,
        required:true
    },
  
})

const servicemodel=mongoose.model('servicemodel',datamodelSchema);

module.exports=servicemodel;