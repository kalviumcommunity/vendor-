const mongoose=require("mongoose");
const bcrypt=require("bcrypt");
const userSchema=new mongoose.schema({
    username:{
        type:String,
        require:true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    }
})

userSchema.pre('save',async function(next){
    if(!this.isModified(this.password))
        return next()
    try{
        const salt = bcrypt.genSalt(10)
        return await bcrypt.hash(this.password,salt)
        next()
    }
     catch(e){
        next()
     }
})

module.exports = mongoose.model("User", userSchema);