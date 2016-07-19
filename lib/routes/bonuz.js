'use strict';

var bonuzController = require('../controllers').bonuzController;
var auth = require('../auth/auth');

module.exports = function(app) {
	app.get('/reports/bonuz/summary', function(req, res) {
		auth(req, function(err, isAuthorized) {
			if (err) {
				res.send(err);
			} else if (!isAuthorized) {
				res.send(err);
			} else {
				bonuzController.getBonuzSummary(function(err, result) {
					if (err) {
						res.status(500).send(err);
					} else {
						res.status(200).send(result);
					}
				});
			}
		});
	});
};