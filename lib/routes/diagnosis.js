'use strict';

var diagnosisController = require('../controllers').diagnosisController;
var auth = require('../auth/auth');

module.exports = function(app) {
	app.get('/reports/bonuz/diagnosis', function(req, res) {
		auth(req, function(err, isAuthorized) {
			if (err) {
				res.send(err);
			} else if (!isAuthorized) {
				res.send(err);
			} else {
				diagnosisController.getDiagnosis(function(err, result) {
					if (err) {
						res.status(500).send(err);
					}
					res.status(200).json(result);
				});

			}
		});
	});
};