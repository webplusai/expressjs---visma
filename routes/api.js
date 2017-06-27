var express 	= 	require('express');
var path        =   require('path');
var fs          =   require('fs');
var https		=	require('https');
var formidable	=	require('formidable');
var request 	=	require('request');
var config 		=	require('./../config/request');
var helper 		=	require('./../helper/router');

var router 		= 	express.Router();

router.post('/upload', function(req, res){

	var form = new formidable.IncomingForm();

	form.on('file', function(field, file) {
		console.log("File Detected");
		console.log(file.path + '/' +  file.name);

		var formData = {
			file: fs.createReadStream(file.path).on('data', function(chunk) {
				console.log(chunk.length);
			}),
		};

		request.post( 
			{ 
				url:'https://sandbox-market.openchannel.io/v2/files',
				formData: formData, 
				headers: {
					'Content-Type': 'multipart/form-data',
					'Authorization': 'Basic ' + new Buffer( config.MARKETPLACE_ID + ':' + config.SECRET ).toString('base64')
				} 
			}, 
			function(err, httpResponse, body) {
				if (err) {
					return console.error('upload failed:', err);
				}
				console.log('Upload successful!  Server responded with:', body);
				res.send(JSON.parse(body).fileUrl);
			}
		);
    });

	form.on('error', function(err) {
		console.log('An error has occured: \n' + err);
	});

	form.parse(req);

});

router.post('/app/create', function(req, res) {
	var body = {
		developerId: 1,
		name: req.body.name,
		customData: req.body
	}

	var post = https.request(helper.getOptions('/apps', 'POST'), function(response) {
		response.setEncoding('utf8');
		response.on('data', function (chunk) {
			console.log(JSON.stringify(req.body));
			if (req.body.publish == 'true') {
				var app = JSON.parse(chunk);
				var body = {
					developerId: 1,
					version: parseInt(app.version)
				};

				console.log(body);
				var post = https.request(helper.getOptions('/apps/' + app.appId + '/publish', 'POST'), function(response) {
					response.setEncoding('utf8');
					response.on('data', function(chunk) {
						console.log('Response: ' + chunk);
						res.redirect('/app');
					});
				});

				post.write(JSON.stringify(body));
				post.end();
			} else {
				console.log('Response: ' + chunk);
				res.redirect('/app');
			}
		});
	});

	post.write(JSON.stringify(body));
	post.end();
});

router.post('/app/update', function(req, res) {
	var body = {
		developerId: 1,
		name: req.body.name,
		customData: req.body
	}

	console.log(body);

	var post = https.request(helper.getOptions('/apps/' + req.body.appId + '/versions/' + req.body.version, 'POST'), function(response) {
		response.setEncoding('utf8');
		response.on('data', function(chunk) {
			console.log('Response: ' + chunk);
			res.redirect('/app');
		});
	});

	post.write(JSON.stringify(body));
	post.end();
});

router.post('/app/publish', function(req, res) {
	var body = {
		developerId: 1,
		version: parseInt(req.body.version)
	};

	console.log(body);
	var post = https.request(helper.getOptions('/apps/' + req.body.appId + '/publish', 'POST'), function(response) {
		response.setEncoding('utf8');
		response.on('data', function(chunk) {
			console.log('Response: ' + chunk);
			res.send('success');
		});
	});

	post.write(JSON.stringify(body));
	post.end();
});

router.post('/app/delete', function(req, res) {

	var post = https.request(helper.getOptions('/apps/' + req.body.appId + '/versions/' + req.body.version + '?developerId=1', 'DELETE'), function(response) {
		response.setEncoding('utf8');
		response.on('data', function(chunk) {
			console.log('Response: ' + chunk);
			res.send('success');
		});
	});

	post.end();
});

router.post('/app', function(req, res) {

	var body = {
		developerId: 1,
		name: req.body.name,
		customData: req.body
	}

	if ( req.body.method == 'put') {
		console.log(req.body);
		console.log('/apps/' + req.body.appId + '/versions' + req.body.version);
		var post = https.request(helper.getOptions('/apps/' + req.body.appId + '/versions/' + req.body.version, 'POST'), function(response) {
			response.setEncoding('utf8');
			response.on('data', function(chunk) {
				console.log('Response: ' + chunk);
				res.redirect('/app');
			});
		});
	} else {
		var post = https.request(helper.getOptions('/apps', 'POST'), function(response) {
			response.setEncoding('utf8');
			response.on('data', function (chunk) {
				console.log('Response: ' + chunk);
				res.redirect('/app');
			});
		});
	}
	post.write(JSON.stringify(body));
	post.end();
});

router.put('/app', function(req, res) {

});

module.exports = router;