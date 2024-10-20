const mongoose = require("mongoose")

const urlSchema =  mongoose.Schema({
    longUrl:String,
    uid:String
})

module.exports = mongoose.model("urls",urlSchema);