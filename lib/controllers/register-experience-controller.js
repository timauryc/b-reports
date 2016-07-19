'use strict';

var request = require('request');
var config = require('../config');
var logger = require('../logger/logger');
var async = require('async');

function notifyUser(consumer, experience) {
	var options = {
		url: '',
		headers: {
			'Authorization': '',
			'Content-Type': 'application/json'
		},
		body: {
			"type": "call-to-action",
			"mobile": consumer,
			"icon": "",
			"template": "pesquisa-perfil-bonificada-call-to-action",
			"properties": {
				"experience": experience
			}
		},
		json: true
	};

	request.post(options, function(error, res, body) {
		if (error) {
			logger.writeLog('error', 'Error on notifying user.' +
				'. File: register-experience-controller.js' +
				'. Function: notifyUser' +
				'. ErrorMessage: ' + error);
			console.log('error: ', error);
		} else {
			logger.writeLog('info', 'Success on notifying user.' +
				'. File: register-experience-controller.js' +
				'. Function: notifyUser');
			console.log('success: ', body);
		}
	});
}

function patchExperience(consumer, experience, callback) {
	var options = {
		url: '' + consumer,
		headers: {
			''
		},
		body: [{
			"op": "add",
			"path": "/tags/0",
			"value": experience
		}],
		json: true
	};

	request.patch(options, function(error, res, body) {
		if (error) {
			logger.writeLog('error', 'Error on patching experience.' +
				'. File: register-experience-controller.js' +
				'. Function: patchExperience' +
				'. ErrorMessage: ' + error);
			return callback(error);
		} else {
			logger.writeLog('info', 'Success on getting data.' +
				'. File: register-experience-controller.js' +
				'. Function: patchExperience');
			notifyUser(consumer, experience);
			return callback(null, true);
		}
	});
}

function isEperienceExecuted(experience, executedExperiences, callback) {
	for (var i in executedExperiences) {
		if (executedExperiences[i].name === experience) {
			return callback(true);
		}
	}
	return callback(false);
}

function registerExperienceTag(consumer, experience, callback) {
	var query = {
		mobile: consumer
	};

	var projection = {
		_id: 0,
		tags: 1,
		executedExperiences: 1
	};

	GLOBAL.db.collection('consumers').find(query, projection).toArray(function(err, docs) {
		if (err) {
			logger.writeLog('error', 'Error on getting data.' +
				'. File: register-experience-controller.js' +
				'. Function: registerExperienceTag' +
				'. ErrorMessage: ' + err);
			callback(err);
		} else if (docs[0].tags.indexOf(experience) > -1) {
			logger.writeLog('info', 'No results getting data.' +
				'. File: register-experience-controller.js' +
				'. Function: registerExperienceTag');
			callback(null, false);
		} else {
			logger.writeLog('info', 'Success on getting data.' +
				'. File: register-experience-controller.js' +
				'. Function: registerExperienceTag');
			var result = docs[0];
			isEperienceExecuted(experience, result.executedExperiences, function(isExecuted) {
				if (isExecuted) {
					callback(null, false);
				} else {
					patchExperience(consumer, experience, function(err, res) {
						if (err) {
							callback(err);
						} else {
							callback(null, res);
						}
					});
				}
			})
		}
	});
}

module.exports = {
	registerExperienceTag: registerExperienceTag
};