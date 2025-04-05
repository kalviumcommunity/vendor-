const mongoose = require('mongoose')
const blogschema = new mongoose.Schema({
    title:{type:string,required:true,unique:true,minLength:5},
    content:{type:string,required:true,minLength:50},
    author:{type:string},
    tags:{type:string,default:[]},
    category:{type:string,default:general},
    likes:{type:string,default:[]},
    Created_At:{type:Date,default:Date.now},
    Updated_At:{type:Date}

})

const commentsschema = new mongoose({
    Username:{type:string},
    message:{type:string,required:true},
    commented_at:{type:Date,default:Date.now},

})

const comment = mongoose.model('comment',mongoose.Schema)