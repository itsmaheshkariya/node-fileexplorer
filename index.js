const express = require("express")
const path = require("path")
const fs = require("fs")
const bodyParser = require("body-parser")
const unzipper = require("unzipper")
var archiver = require('archiver');
const rimraf = require("rimraf");
const app = express()

const session = require('express-session');
const { exec } = require('child_process');
const multer = require("multer")
let Storage = multer.diskStorage({
    destination: function(req, file, callback) {
        callback(null, "./Images");
    },
    filename: function(req, file, callback) {
        callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
    }
});
const upload = multer({
    storage: Storage
}).array("imgUploader", 3); //Field name and max count

app.post("/api/Upload", function(req, res) {
    upload(req, res, function(err) {
        if (err) {
            return res.end("Something went wrong!");
        }
        return res.redirect('/');
    });
});
app.post('/rename/:filename',(req,res)=>{
    fs.rename(req.body.filename, req.params.filename, function (err) {
        if (err) throw err;
        res.redirect('/')
      });
})
app.use(session({secret: 'ssshhhhh',saveUninitialized: true,resave: true}));
app.use(express.json())
app.use(bodyParser.urlencoded({ extended: false }))
let sess
// sess.current = __dirname ;
app.use(express.json())
app.set('view engine','pug')

app.get("/",(req,res)=>{
    sess=req.session;    
    // sess.stdout = req.session.stdout
    // sess.stderr = ''
    
    sess.current = __dirname ;
    fs.readdir(sess.current, function (err, files) {
        res.render('index',{files:files,stdout:sess.stdout,stderr:sess.stderr,cmdinput:sess.cmdinput,alert:sess.alert})
        sess.alert = ''
    });
    
})
app.post('/postcmd',async (req,res)=>{
    sess=req.session;
    sess.cmdinput = req.body.cmdinput
    await exec(`cd ${sess.current} &&`+req.body.cmdinput, (err, stdout, stderr) => {
        if (err) {
            res.redirect('/')
        }else{
            sess.stdout = stdout;
            sess.stderr = stderr;
            console.log(sess.stdout)
            res.redirect('/')
        }

      });
      
})
app.post('/createfolder',(req,res)=>{
    sess = req.session
    var dir = req.body.foldername;
    if (!fs.existsSync(sess.current+'/'+dir)){
        fs.mkdirSync(sess.current+'/'+dir);
    }
    res.redirect('/')
})
app.post('/actions',(req,res)=>{
    sess=req.session;
    if(req.body.unzip == ''){
        fs.createReadStream(req.body.selected)
        .pipe(unzipper.Extract({ path: sess.current+'/output1' }));
    }
    if(req.body.zip == ''){
        var output = fs.createWriteStream('./example.zip');
        var archive = archiver('zip', {
            gzip: true,
            zlib: { level: 9 } // Sets the compression level.
        });
        
        archive.on('error', function(err) {
          throw err;
        });
        
        // pipe archive data to the output file
        archive.pipe(output);
        
        // append files
        for (let i=0;i<req.body.selected.length;i++){
          
            archive.file(sess.current+'/'+req.body.selected[i], {name: req.body.selected[i]});
            
           }
        
        
        //
        archive.finalize();
        
    }
    if(req.body.delete == ''){
        
       iftrue = Array.isArray(req.body.selected)
       if(iftrue == true){
            for (let i=0;i<req.body.selected.length;i++){
                tempo = sess.current+'/'+req.body.selected[i]

                if(fs.lstatSync(tempo).isFile() == true){
                    fs.unlinkSync(tempo);
                }
                else if(fs.lstatSync(tempo).isDirectory() == true){
                    rimraf(tempo, function () { console.log("done"); });
                }
            }
        }else{
            tempo = sess.current+'/'+req.body.selected

            if(fs.lstatSync(tempo).isFile() == true){
                fs.unlinkSync(tempo);
            }
            else if(fs.lstatSync(tempo).isDirectory() == true){

                rimraf(tempo, function () { console.log("done"); });
            }          
        }
    }
    sess.alert = 'delete'
    res.redirect('/')
    
})
app.post('/createnewfile',async (req,res)=>{
    sess=req.session;
    await fs.writeFile(sess.current+'/'+req.body.filename, req.body.textinput, function (err) {
        if (err) throw console.log(err)
        else res.redirect('/')
      });
      
    
})
app.get('/:name',(req,res)=>{
    sess=req.session
    console.log(sess)
    // console.log(fileType(readChunk.sync(req.params.name, 0, fileType.minimumBytes)));
    if(req.params.name == 'backwalafolder'){
        // console.log(sess.current)
        sess.current = path.dirname(sess.current)
        fs.readdir(sess.current, function (err, files) {
      
            res.render('index',{files:files})
        });
        // console.log(path.dirname(sess.current).split(path.sep))
        // console.log(__dirname - path.dirname(sess.current).split(path.sep).pop())
    }else{
    var name = req.params.name;
    // console.log(sess.current)
    var store = fs.lstatSync(sess.current+'/'+name).isFile((err)=>{
        if(err) console.log("err")
    })
    var store1 = fs.lstatSync(sess.current+'/'+name).isDirectory()
    console.log(store)
    console.log(store1)

if(store == true){
    // console.log(sess.current+'/'+name)
    fs.readFile(sess.current+'/'+name, 'utf8', function(err, data) {
        fs.readdir(sess.current, function (err, files) {
      
            res.render('index',{files:files,textarea:data,file:name})
        });

    });
}
else{
    hold = sess.current + '/' + name
    sess.current = hold;
    sess.storename =name ;
    
        fs.readdir(sess.current, function (err, files) {
      
            res.render('index',{files:files})
        });


}
    }
})
app.listen(3000)