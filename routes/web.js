var express 	= 	require('express');
var https		=	require('https');
var config 		=	require('./../config/request');
var helper 		=	require('./../helper/router');

var router 		= 	express.Router();

router.get('/', function(req, res) {
	res.redirect('/app');
});

// Apps page
router.get('/app', function(req, res) {

	// Get app versions
	var request = https.request(helper.getOptions('/apps/versions?developerId=' + config.DEVELOPER_ID + "&query=" + encodeURIComponent('{$or: [{"status.value":"rejected",isLatestVersion:true},{isLive:true},{"status.value":{$in:["inDevelopment","inReview","pending"]}}]}'), 'GET'), function(response) {
		response.setEncoding('utf8');
		response.on('data', function(chunk) {
			var data = JSON.parse(chunk);
			
			// for (i = 0; i < data.list.length - 1; i++) {
			// 	if (data.list[i].appId == data.list[i + 1].appId && data.list[i].status.value == 'approved' && data.list[i + 1].status.value == 'approved') {
			// 		data.list.splice(i, 1);
			// 		i --;
			// 	}
			// }
			
			// Get statistics after retreiving app versions
			var get = https.request(helper.getOptions('/stats/series/month/views?query=' + encodeURIComponent("{developerId: '" + config.DEVELOPER_ID + "'}"), 'GET'), function(response) {
				response.setEncoding('utf8');
				response.on('data', function(chunk) {

					// Set toast type and toast message.
					var toast_type = req.session.toast_type;
					var toast_message = req.session.toast_message;
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

// Create page
router.get('/app/create', function(req, res) {
	var toast_type = req.session.toast_type;
	var toast_message = req.session.toast_message;
    res.render('app/app-create', { toast_type: toast_type, toast_message: toast_message });
});

// Edit page
router.get('/app/edit/:id/:version', function(req, res) {

	// Get app version
	var request = https.request(helper.getOptions('/apps/' + req.params.id + '/versions/' + req.params.version + '?developerId=' + config.DEVELOPER_ID, 'GET'), function(response) {
		response.setEncoding('utf8');
		response.on('data', function(chunk) {
			var app = JSON.parse(chunk);

			// Set file list and image list if exists.
			if (app.customData.files)
				app.customData.fileList = app.customData.files.split(',').filter(function(el) {return el.length != 0});
			if (app.customData.images)
				app.customData.imageList = app.customData.images.split(',').filter(function(el) {return el.length != 0});

			// Get app statistics after retrieving app version
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