'use strict';

var registerController = require('../controllers').registerController;
var auth = require('../auth/auth');

module.exports = function(app) {
	app.get('/reports/consumer/:consumer/:experience/register', function(req, res) {
		auth(req, function(err, isAuthorized) {
			if (err) {
				res.send(err);
			} else if (!isAuthorized) {
				res.send(err);
			} else {
				var consumer = req.params.consumer;
				var experience = req.params.experience;
				//console.log('experience: ' , experience);
				registerController.registerExperienceTag(consumer, experience, function(err, result) {
					if(err){
						res.status(500).send(err);
					}else{
						res.status(200).json(result);
					}
				});
			}
		});
	});
};