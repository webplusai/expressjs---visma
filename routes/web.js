var express 	= 	require('express');
var https		=	require('https');
var config 		=	require('./../config/request');
var helper 		=	require('./../helper/router');

var router 		= 	express.Router();

router.get('/', function(req, res) {
	res.redirect('/app');
});

router.get('/app', function(req, res) {

	var request = https.request(helper.getOptions('/apps/versions?developerId=' + config.DEVELOPER_ID, 'GET'), function(response) {
		response.setEncoding('utf8');
		response.on('data', function(chunk) {
			var data = JSON.parse(chunk);
			var get = https.request(helper.getOptions('/stats/series/month/views?query=' + encodeURIComponent("{developerId: '" + config.DEVELOPER_ID + "'}"), 'GET'), function(response) {
				response.setEncoding('utf8');
				response.on('data', function(chunk) {
					toast_type = req.session.toast_type;
					toast_message = req.session.toast_message;
					req.session.toast_type = '';
					req.session.toast_message = '';
					res.render('app/app-show', {data: data, statistics: chunk, toast_type: toast_type, toast_message: toast_message });
				})
			});

			get.end();
		});
	});

	request.end();
});

router.get('/app/create', function(req, res) {
	var toast_type = req.session.toast_type;
	var toast_message = req.session.toast_message;
    res.render('app/app-create', { toast_type: toast_type, toast_message: toast_message });
});

router.get('/app/edit/:id/:version', function(req, res) {
	var request = https.request(helper.getOptions('/apps/' + req.params.id + '/versions/' + req.params.version + '?developerId=' + config.DEVELOPER_ID, 'GET'), function(response) {
		response.setEncoding('utf8');
		response.on('data', function(chunk) {
			var app = JSON.parse(chunk);

			if (app.customData.files)
				app.customData.fileList = app.customData.files.split(',').filter(function(el) {return el.length != 0});
			if (app.customData.images)
				app.customData.imageList = app.customData.images.split(',').filter(function(el) {return el.length != 0});

			var get = https.request(helper.getOptions("/stats/series/month/views?query=" + encodeURIComponent("{appId: '" + app.appId + "', developerId: '" + config.DEVELOPER_ID + "'}"), 'GET'), function(response) {
				response.setEncoding('utf8');
				response.on('data', function(chunk) {
					var toast_type = req.session.toast_type;
					var toast_message = req.session.toast_message;
					req.session.toast_type = '';
					req.session.toast_message = '';
					res.render('app/app-edit', {app: app, statistics: chunk, toast_type: toast_type, toast_message: toast_message});
				});
			});

			get.end();
		});
	});

	request.end();
});

module.exports = router;