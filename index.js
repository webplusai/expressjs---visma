var express = require('express');
var path = require('path');
var fs = require('fs');
var busboy = require('connect-busboy');

var app = express();

app.use(busboy());
app.get('/', function(req, res) {
	res.redirect('/my-apps');
});

app.post('/upload', function(req, res) {
    var fstream;
    req.pipe(req.busboy);
    req.busboy.on('file', function (fieldname, file, filename) {
        console.log("Uploading: " + filename); 
        fstream = fs.createWriteStream(__dirname + '/uploads/' + filename);
        file.pipe(fstream);
        fstream.on('close', function () {
            res.redirect('back');
        });
    });
});

app.get('/my-apps', function(req, res) {
	res.render('my-apps');
});

app.get('/add-app', function(req, res) {
	res.render('add-app');
});

app.set('view engine', 'pug');
app.set('views', './views');

app.use('/public', express.static('public'));
app.use('/uploads', express.static('uploads'));
app.listen(3000);