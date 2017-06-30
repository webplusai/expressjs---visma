var express 	= 	require('express');
var path        =   require('path');
var fs          =   require('fs');
var https		=	require('https');
var formidable	=	require('formidable');
var request 	=	require('request');
var config 		=	require('./../config/request');
var helper 		=	require('./../helper/router');

var router 		= 	express.Router();

// File upload route
router.post('/upload', function(req, res){

	var form = new formidable.IncomingForm();

	// When the file is uploaded from frontend
	form.on('file', function(field, file) {

		var formData = {
			file: fs.createReadStream(file.path).on('data', function(chunk) {
				// Monitor progress of file upload from this endpoint to openchannel API (Reserved for later)
				console.log(chunk.length + ' bytes sent');
			}),
		};

		// Send the uploaded file to openchannel API endpoint
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

// Create app route
router.post('/app/create', function(req, res) {

	var body = {
		developerId: config.DEVELOPER_ID,
		name: req.body.name,
		customData: req.body
	}

	var post = https.request(helper.getOptions('/apps', 'POST'), function(response) {

		response.setEncoding('utf8');
		response.on('data', function (chunk) {
			var body = JSON.parse(chunk);

			// If error was retrieved, display error message and return
			if (typeof body.code != 'undefined') {
				req.session.toast_type = 'error';
				req.session.toast_message = body.errors[0].message;
				res.redirect('/app/create');
				return;
			}

			// App should be published
			if (req.body.publish == 'true') {

				var app = JSON.parse(chunk);
				var body = {
					developerId: config.DEVELOPER_ID,
					version: parseInt(app.version)
				};

				// Publish the created app
				var post = https.request(helper.getOptions('/apps/' + app.appId + '/publish', 'POST'), function(response) {
					response.setEncoding('utf8');
					response.on('data', function(chunk) {

						var body = JSON.parse(chunk);
						// If error was retrieved, display error message and return
						if (typeof body.code != 'undefined') {
							req.session.toast_type = 'error';
							req.session.toast_message = 'There was an error publishing the app. Please try again';
							res.redirect('/app');
							return;
						}

						// Display success message
						req.session.toast_type = 'publish';
						res.redirect('/app');
					});
				});

				post.write(JSON.stringify(body));
				post.end();
			} 
			// App will be published later
			else {
				// Display success message
				req.session.toast_type = 'create';
				res.redirect('/app');
			}
		});
	});

	post.write(JSON.stringify(body));
	post.end();
});

// Update app route
router.post('/app/update', function(req, res) {

	var body = {
		developerId: config.DEVELOPER_ID,
		name: req.body.name,
		customData: req.body
	}

	var post = https.request(helper.getOptions('/apps/' + req.body.appId + '/versions/' + req.body.version, 'POST'), function(response) {
		response.setEncoding('utf8');
		response.on('data', function(chunk) {
			var body = JSON.parse(chunk);

			// If error was retrieved, display error message and return
			if (typeof body.code != 'undefined') {
				req.session.toast_type = 'error';
				req.session.toast_message = body.errors[0].message;
				res.redirect('/app/edit/' + req.body.appId + '/' + req.body.version);
				return;
			}

			// App should be published
			if (req.body.publish == 'true') {

				var app = JSON.parse(chunk);
				var body = {
					developerId: config.DEVELOPER_ID,
					version: parseInt(app.version)
				};

				// Publish the app after editing
				var post = https.request(helper.getOptions('/apps/' + app.appId + '/publish', 'POST'), function(response) {
					response.setEncoding('utf8');
					response.on('data', function(chunk) {
						var body = JSON.parse(chunk);

						// If error is retrieved, display error message and return
						if (typeof body.code != 'undefined') {
							req.session.toast_type = 'error';
							req.session.toast_message = 'There was an error publishing the app. Please try again';
							res.redirect('/app');
							return;
						}

						// Display success message
						req.session.toast_type = 'publish';
						res.redirect('/app');
					});
				});

				post.write(JSON.stringify(body));
				post.end();
			}
			// App will be published later
			else {
				req.session.toast_type = 'update';
				res.redirect('/app');
			}
		});
	});

	post.write(JSON.stringify(body));
	post.end();
});

// Publish app route
router.post('/app/publish', function(req, res) {

	var body = {
		developerId: config.DEVELOPER_ID,
		version: parseInt(req.body.version)
	};

	// Publish that app
	var post = https.request(helper.getOptions('/apps/' + req.body.appId + '/publish', 'POST'), function(response) {
		response.setEncoding('utf8');
		response.on('data', function(chunk) {
			var body = JSON.parse(chunk);

			// If error is retrieved, display error message and return
			if (typeof body.code != 'undefined') {
				req.session.toast_type = 'error';
				req.session.toast_message = 'There was an error publishing the app. Please try again';
				res.send('error');
				return;
			}

			// Display success message and return
			req.session.toast_type = 'publish';
			res.send('success');
		});
	});

	post.write(JSON.stringify(body));
	post.end();
});

// Delete app route
router.post('/app/delete', function(req, res) {

	var options;

	// If version is set, delete that version
	if ( req.body.version != 'undefined' ) {
		options = helper.getOptions('/apps/' + req.body.appId + '/versions/' + req.body.version + '?developerId=' + config.DEVELOPER_ID, 'DELETE');
	} 
	// If version is not set, delete all app versions
	else {
		options = helper.getOptions('/apps/' + req.body.appId + '?developerId=' + config.DEVELOPER_ID, 'DELETE');
	}

	// Delete app
	var post = https.request(options, function(response) {
		response.setEncoding('utf8');
		response.on('data', function(chunk) {
			var body = JSON.parse(chunk);

			// If error is retreived, display error message and return
			if (typeof body.code != 'undefined') {
				req.session.toast_type = 'error';
				req.session.toast_message = body.errors[0].message;
				res.send('error');
				return;
			}

			// Display success message
			req.session.toast_type = 'delete';
			res.send('success');
		});
	});

	post.end();
});

// Suspend or unsuspend route
router.post('/app/status', function(req, res) {
	var body = {
		developerId: config.DEVELOPER_ID,
		status: req.body.status
	};
	
	var post = https.request(helper.getOptions('/apps/' + req.body.appId + '/status', 'POST'), function(response) {

		response.setEncoding('utf8');
		response.on('data', function(chunk) {
			var body = JSON.parse(chunk);
			
			// If error is retrieved, display error message and return
			if (typeof body.code != 'undefined') {
				req.session.toast_type = 'error';
				req.session.toast_message = body.errors[0].message;
				res.send('error');
				return;
			}
			
			// Display success message and return
			req.session.toast_type = 'status';
			req.session.toast_message = 'App ' + req.body.status + 'ed successfully';
			res.send('success');
		});
	});

	post.write(JSON.stringify(body));
	post.end();
});

module.exports = router;