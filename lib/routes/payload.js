'use strict';

var payloadController = require('../controllers').payloadController;
var auth = require('../auth/auth');

module.exports = function(app) {
	app.get('/reports/consumers/:mobile/profile', function(req, res) {
		auth(req, function(err, isAuthorized) {
			if (err) {
				res.send(err);
			} else if (!isAuthorized) {
				res.send(err);
			} else {
				var mobile = req.params.mobile;
				payloadController.getConsumerPayload(mobile, function(err, result) {
					if (err) {
						res.status(500).send(err);
					}
					res.status(200).json(result);
				});

			}
		});
	});
};