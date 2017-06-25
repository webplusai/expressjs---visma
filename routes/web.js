var express 	= 	require('express');
var https		=	require('https');
var helper 		=	require('./../helper/router');

var router 		= 	express.Router();

router.get('/', function(req, res) {
	res.redirect('/app');
});

router.get('/app', function(req, res) {

	var request = https.request(helper.getOptions('/apps/versions?developerId=1', 'GET'), function(response) {
		response.setEncoding('utf8');
		response.on('data', function(chunk) {
			console.log('Response: ' + chunk);
			res.render('app/app-show', {data: JSON.parse(chunk)});
		});
	});

	request.end();
});

router.get('/app/create', function(req, res) {
    res.render('app/app-create');
});

router.get('/app/edit/:id', function(req, res) {
	var request = https.request(helper.getOptions('/apps/' + req.params.id + '/versions/1' + '?developerId=1', 'GET'), function(response) {
		response.setEncoding('utf8');
		response.on('data', function(chunk) {
			console.log('Response: ' + chunk);
			res.render('app/app-edit', { app: JSON.parse(chunk) });
		});
	});

	request.end();
});

module.exports = router;