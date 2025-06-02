
const mongoose=require('mongoose');

const datamodelSchema=mongoose.Schema({
    full_name:{
        type:String,
        required:true
    },
    state:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    address:{
        type:String,
        required:true
    },
    city:{
        type:String,
        required:true
    },
    gender:{
        type:String,
        required:true
    },
    date_of_birth:{
        type:String,
        required:true
    },
    mobile:{
        type:Number,
        required:true
    },
    addedBy: { 
        type: mongoose.Schema.Types.ObjectId, ref: 'User' }
})


const Datamodel=mongoose.model('Datamodel',datamodelSchema);


module.exports = Datamodel;
