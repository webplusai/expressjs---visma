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
		developerId: config.DEVELOPER_ID,
		name: req.body.name,
		customData: req.body
	}

	var post = https.request(helper.getOptions('/apps', 'POST'), function(response) {
		response.setEncoding('utf8');
		response.on('data', function (chunk) {
			if (req.body.publish == 'true') {
				var app = JSON.parse(chunk);
				var body = {
					developerId: config.DEVELOPER_ID,
					version: parseInt(app.version)
				};

				var post = https.request(helper.getOptions('/apps/' + app.appId + '/publish', 'POST'), function(response) {
					response.setEncoding('utf8');
					response.on('data', function(chunk) {
						res.redirect('/app');
					});
				});

				post.write(JSON.stringify(body));
				post.end();
			} else {
				res.redirect('/app');
			}
		});
	});

	post.write(JSON.stringify(body));
	post.end();
});

router.post('/app/update', function(req, res) {
	var body = {
		developerId: config.DEVELOPER_ID,
		name: req.body.name,
		customData: req.body
	}

	var post = https.request(helper.getOptions('/apps/' + req.body.appId + '/versions/' + req.body.version, 'POST'), function(response) {
		response.setEncoding('utf8');
		response.on('data', function(chunk) {
			if (req.body.publish == 'true') {
				var app = JSON.parse(chunk);
				var body = {
					developerId: config.DEVELOPER_ID,
					version: parseInt(app.version)
				};

				var post = https.request(helper.getOptions('/apps/' + app.appId + '/publish', 'POST'), function(response) {
					response.setEncoding('utf8');
					response.on('data', function(chunk) {
						res.redirect('/app');
					});
				});

				post.write(JSON.stringify(body));
				post.end();
			} else {
				res.redirect('/app');
			}

		});
	});

	post.write(JSON.stringify(body));
	post.end();
});

router.post('/app/publish', function(req, res) {
	var body = {
		developerId: config.DEVELOPER_ID,
		version: parseInt(req.body.version)
	};

	var post = https.request(helper.getOptions('/apps/' + req.body.appId + '/publish', 'POST'), function(response) {
		response.setEncoding('utf8');
		response.on('data', function(chunk) {
			res.send('success');
		});
	});

	post.write(JSON.stringify(body));
	post.end();
});

router.post('/app/delete', function(req, res) {

	var options;
	if ( req.body.version ) {
		options = helper.getOptions('/apps/' + req.body.appId + '/versions/' + req.body.version + '?developerId=' + config.DEVELOPER_ID, 'DELETE')
	} else {
		options = helper.getOptions('/apps/' + req.body.appId + '?developerId=' + config.DEVELOPER_ID, 'DELETE')
	}
	var post = https.request(options, function(response) {
		response.setEncoding('utf8');
		response.on('data', function(chunk) {
			res.send('success');
		});
	});

	post.end();
});

module.exports = router;