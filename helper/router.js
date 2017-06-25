var config = require('./../config/request');

var router = {
	getOptions: function(endPoint, method) {
		return {
			host: config.HOST_URL,
			port: 443,
			path: '/' + config.API_VERSION + endPoint,
			method: method,
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'Basic ' + new Buffer( config.MARKETPLACE_ID + ':' + config.SECRET ).toString('base64')
			}
		}
	}
}

module.exports = router;