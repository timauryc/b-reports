'use strict';

var summaryController = require('../controllers').summaryController;
var auth = require('../auth/auth');

module.exports = function(app) {
	app.get('/reports/experiences/:name/name', function(req, res) {
		auth(req, function(err, isAuthorized) {
			if (err) {
				res.send(err);
			} else if (!isAuthorized) {
				res.send(err);
			} else {
				var seachClue = req.params.name;
				summaryController.getExperienceName(seachClue, function(err, experience) {
					if (err) {
						res.status(500).send(err);
					} else if (experience) {
						res.status(200).json({
							experience: experience
						});
					} else {
						res.status(500).send(null);
					}
				});
			}
		});
	});
};