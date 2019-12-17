const fs = require("fs")
const path = require("path")
function abc() {
   fs.readdir(__dirname, function (err, files) 
    {
        if (err) throw console.log(err)
        module.exports.files = files
    })
    
    // return store
    
 }
 abc();

