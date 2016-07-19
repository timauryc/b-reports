'use strict';

var request = require('request');
var config = require('../config');
var logger = require('../logger/logger');
var async = require('async');

//Número de triggers recebidas
function getNumberOfTriggers(referenceDate, experience, callback) {
	var triggersToIgnore = ['pending-reward-detected', 'qualification-screen-opened', 'consumer-notified', 'rewards-qualified'];
	var query = [{
		$match: {
			experience: experience,
			'event.name': {
				$nin: triggersToIgnore
			},
			'created': {
				$gt: referenceDate ? referenceDate : new Date('1900-01-01T00:00:00.000Z')
			}
		}
	}, {
		$group: {
			_id: '$event.name',
			count: {
				$sum: 1
			}
		}
	}, {
		$sort: {
			count: -1
		}
	}];

	GLOBAL.db3.collection('triggers').aggregate(query, function(err, result) {
		if (err) {
			logger.writeLog('error', 'Error on getting triggers data.' +
				'. File: rewards-controller.js' +
				'. Function: getNumberOfTriggers' +
				'. ErrorMessage: ' + err);
			callback(err);
		} else {
			logger.writeLog('info', 'Success on getting triggers data.' +
				'. File: rewards-controller.js' +
				'. Function: getNumberOfTriggers');
			var totalTrigger = 0;
			for (var i in result) {
				totalTrigger += result[i].count;
			}
			var response = {
				total: totalTrigger,
				detailed: result
			}
			callback(null, response);
		}
	});

}

function getDeliveredAmount(referenceDate, experience, callback) {
	var query = [{
		$match: {
			'reward.experience.name': experience,
			'deal.type': {
				$ne: 'donation'
			},
			$and: [{
				'status.name': 'done'
			}, {
				'status.detail.name': 'delivered'
			}],
			'trace.0.timestamp': {
				$gt: referenceDate ? referenceDate : new Date('1900-01-01T00:00:00.000Z')
			}
		}
	}, {
		$group: {
			_id: null,
			amount: {
				$sum: '$amount'
			}
		}
	}];

	GLOBAL.db.collection('payments').aggregate(query, function(err, result) {
		if (err) {
			logger.writeLog('error', 'Error on getting  data.' +
				'. File: rewards-controller.js' +
				'. Function: getDeliveredAmount' +
				'. ErrorMessage: ' + err);
			callback(err);
		} else {
			logger.writeLog('info', 'Success on getting  data.' +
				'. File: rewards-controller.js' +
				'. Function: getDeliveredAmount');
			if (result.length > 0) {
				callback(null, result[0].amount);
			} else {
				callback(null, null);
			}
		}
	});

}

function getRewardsAmount(referenceDate, experience, callback) {

	var query = [{
		$match: {
			'experience.name': experience,
			'status.name': 'done',
			fallback: false,
			forwardedBy: {
				$exists: false
			},
			'created': {
				$gt: referenceDate ? referenceDate : new Date('1900-01-01T00:00:00.000Z')
			}
		}
	}, {
		$group: {
			_id: null,
			amount: {
				$sum: '$amount'
			}
		}
	}];

	GLOBAL.db.collection('rewards').aggregate(query, function(err, result) {
		if (err) {
			logger.writeLog('error', 'Error on getting data.' +
				'. File: rewards-controller.js' +
				'. Function: getDeliveredAmount' +
				'. ErrorMessage: ' + err);
			callback(err);
		} else {
			logger.writeLog('info', 'Success on getting data.' +
				'. File: rewards-controller.js' +
				'. Function: getDeliveredAmount');
			if (result.length > 0) {
				callback(null, result[0].amount);
			} else {
				callback(null, null);
			}
		}
	});
}

function getTotalRewardsInfo(referenceDate, experience, callback) {
	var query = [{
		$match: {
			'experience.name': experience,
			fallback: false,
			forwardedBy: {
				$exists: false
			},
			'created': {
				$gt: referenceDate ? referenceDate : new Date('1900-01-01T00:00:00.000Z')
			}
		}
	}, {
		$group: {
			_id: {
				client: '$client.name'
			},
			sum: {
				$sum: 1
			},
			amount: {
				$sum: '$amount'
			}
		}
	}, {
		$sort: {
			sum: -1
		}
	}];
	GLOBAL.db.collection('rewards').aggregate(query, function(err, result) {
		if (err) {
			logger.writeLog('error', 'Error on getting rewards data.' +
				'. File: rewards-controller.js' +
				'. Function: getRewardsInfo' +
				'. ErrorMessage: ' + err);
			callback(err);
		} else {
			logger.writeLog('info', 'Success on getting rewards data.' +
				'. File: rewards-controller.js' +
				'. Function: getRewardsInfo');
			var jsonResponse = {
				totalTicket: 0,
				total: 0,
				unqualified: 0,
				detailed: []
			};

			async.each(result, function(element, callback) {
					jsonResponse['totalTicket'] += element['amount'];
					if (element['_id']['client']) {
						jsonResponse['total'] += element['sum'];
						jsonResponse['detailed'].push({
							_id: element['_id']['client'],
							count: element['sum']
						});
					} else {
						jsonResponse['total'] += element['sum'];
						jsonResponse['detailed'].push({
							_id: 'Não qualificadas',
							count: element['sum']
						});
						//jsonResponse['unqualified'] = element['sum'];
					}
					callback();
				},
				function(err) {
					if (err) {
						callback(err);
					} else {
						callback(null, jsonResponse);
					}
				});
		}
	});
}

//Tempo médio para qualificação das rewards
function getAvgTimeQualification(referenceDate, experience, callback) {
	var array = [];
	var totalQualification = 0;
	var createdDate = new Date('2016-04-01T10:00:00.000Z');

	GLOBAL.db.collection('rewards').aggregate([{
		$match: {
			'experience.name': experience,
			created: {
				$gt: referenceDate ? referenceDate : createdDate
			},
			fallback: false,
			forwardedBy: {
				$exists: false
			},
			'client.name': {
				$nin: ['engine-no-choice', 'engine-timeout']
			},
			$and: [{
				'trace.name': {
					$in: ['created']
				}
			}, {
				'trace.name': {
					$in: ['qualified']
				}
			}]
		}
	}, {
		$unwind: {
			path: '$trace'
		}
	}, {
		$match: {
			'trace.name': {
				$in: ['created', 'qualified']
			}
		}
	}, {
		$group: {
			_id: '$_id',
			trace: {
				$push: {
					'timestamp': '$trace.timestamp'
				}
			}
		}
	}, {
		$project: {
			createdTimestamp: {
				$arrayElemAt: ['$trace', 0],
			},
			qualifiedTimestamp: {
				$arrayElemAt: ['$trace', 1],
			}
		}
	}, {
		$group: {
			_id: {
				'id': '$_id',
				'created': '$createdTimestamp.timestamp',
				'qualified': '$qualifiedTimestamp.timestamp',
				'result': {
					$subtract: ['$createdTimestamp.timestamp', '$qualifiedTimestamp.timestamp']
				}
			}
		}
	}], function(err, res) {
		if (err) {
			logger.writeLog('error', 'Error on getting data.' +
				'. File: rewards-controller.js' +
				'. Function: getAvgTimeQualification' +
				'. ErrorMessage: ' + err);
			callback(err);
		} else {
			logger.writeLog('info', 'Success on getting data.' +
				'. File: rewards-controller.js' +
				'. Function: getAvgTimeQualification');
			for (var i in res) {
				totalQualification += (res[i]._id.result / 1000 / 60);
			}
			callback(null, totalQualification / res.length);
		}
	});
}

//function for avgFallback (getting the initial fallback array)
function getFallbackArray(callback) {
	var array = [];
	GLOBAL.db.collection('experiences').find({}).toArray(function(err, docs) {
		if (err) {
			logger.writeLog('error', 'Error on getting data.' +
				'. File: rewards-controller.js' +
				'. Function: getFallbackArray' +
				'. ErrorMessage: ' + err);
			callback(err);
		} else {
			logger.writeLog('info', 'Success on getting data.' +
				'. File: rewards-controller.js' +
				'. Function: getFallbackArray');
			docs.forEach(function(xp) {
				var maxRecoveryFallback = (xp.maxRecoveryFallback ? true : false);
				var appreciationMessageFallback = (xp.appreciationMessageFallback ? true : false);
				if (maxRecoveryFallback && appreciationMessageFallback)
					array.push(xp.name)
			});
			callback(null, array);
		}
	});
}

//Quantidade média de fallbacks por reward criada
function getAvgFallback(referenceDate, experience, callback) {

	getFallbackArray(function(err, array) {
		async.parallel([
				function(callback) {
					GLOBAL.db.collection('rewards').count({
						'experience.name': {
							$in: array,
							$eq: experience
						},
						forwardedBy: {
							$exists: false
						},
						fallback: false,
						'created': {
							$gt: referenceDate ? referenceDate : new Date('1900-01-01T00:00:00.000Z')
						}
					}, function(err, res) {
						if (err) {
							callback(err);
						} else {
							callback(null, res);
						}
					});
				},
				function(callback) {
					GLOBAL.db.collection('rewards').count({
						'experience.name': {
							$in: array,
							$eq: experience
						},
						forwardedBy: {
							$exists: false
						},
						fallback: true,
						fallbackCountdown: 9,
						'created': {
							$gt: referenceDate ? referenceDate : new Date('1900-01-01T00:00:00.000Z')
						}
					}, function(err, res) {
						if (err) {
							callback(err);
						} else {
							callback(null, res);
						}
					});
				}
			],
			// optional callback
			function(err, res) {
				if (err) {
					logger.writeLog('error', 'Error on getting data.' +
						'. File: rewards-controller.js' +
						'. Function: getAvgFallback' +
						'. ErrorMessage: ' + err);
					callback(err);
				} else {
					logger.writeLog('info', 'Success on getting data.' +
						'. File: rewards-controller.js' +
						'. Function: getAvgFallback');
					callback(null, (res[1] * 100) / res[0]);
				}
			});
	});
}

//Tempo médio para escolha do novo prêmio no processo de fallback
function getAvgChooseTime(referenceDate, experience, callback) {
	var array = [];
	var createdDate = new Date('2016-04-01T10:00:00.000Z');
	var totalQualification = 0;

	GLOBAL.db.collection('rewards').aggregate([{
		$match: {
			'experience.name': experience,
			created: {
				$gt: referenceDate ? referenceDate : createdDate
			},
			fallback: true,
			forwardedBy: {
				$exists: false
			},
			'client.name': {
				$nin: ['engine-no-choice', 'engine-timeout']
			},
			$and: [{
				'trace.name': {
					$in: ['created']
				}
			}, {
				'trace.name': {
					$in: ['qualified']
				}
			}]
		}
	}, {
		$unwind: {
			path: '$trace'
		}
	}, {
		$match: {
			'trace.name': {
				$in: ['created', 'qualified']
			}
		}
	}, {
		$group: {
			_id: '$_id',
			trace: {
				$push: {
					'timestamp': '$trace.timestamp'
				}
			}
		}
	}, {
		$project: {
			createdTimestamp: {
				$arrayElemAt: ['$trace', 0],
			},
			qualifiedTimestamp: {
				$arrayElemAt: ['$trace', 1],
			}
		}
	}, {
		$group: {
			_id: {
				'id': '$_id',
				'created': '$createdTimestamp.timestamp',
				'qualified': '$qualifiedTimestamp.timestamp',
				'result': {
					$subtract: ['$createdTimestamp.timestamp', '$qualifiedTimestamp.timestamp']
				}
			}
		}
	}], function(err, res) {
		if (err) {
			logger.writeLog('error', 'Error on getting data.' +
				'. File: rewards-controller.js' +
				'. Function: getAvgChooseTime' +
				'. ErrorMessage: ' + err);
			callback(err);
		} else {
			logger.writeLog('info', 'Success on getting data.' +
				'. File: rewards-controller.js' +
				'. Function: getAvgChooseTime');
			for (var i in res) {
				totalQualification += (res[i]._id.result / 1000 / 60);
			}
			callback(null, totalQualification / res.length);
		}
	});
}


function getFallbackAvgConclusion(referenceDate, experience, callback) {

	var createdDate = new Date('2016-04-01T10:00:00.000Z');
	var totalQualification = 0;

	getFallbackArray(function(err, xpsArray) {
		GLOBAL.db.collection('rewards').aggregate([{
			$match: {
				'experience.name': experience,
				'created': {
					$gt: referenceDate ? referenceDate : createdDate
				},
				'fallback': true,
				'client.name': {
					$nin: ['engine-no-choice']
				},
				$and: [{
					'trace.name': {
						$in: ['created']
					}
				}, {
					'trace.name': {
						$in: ['done']
					}
				}]
			}
		}, {
			$unwind: {
				path: '$trace'
			}
		}, {
			$match: {
				'trace.name': {
					$in: ['created', 'done']
				}
			}
		}, {
			$group: {
				_id: '$_id',
				trace: {
					$push: {
						'timestamp': '$trace.timestamp'
					}
				}
			}
		}, {
			$project: {
				doneTimestamp: {
					$arrayElemAt: ['$trace', 0],
				},
				createdTimestamp: {
					$arrayElemAt: ['$trace', 1],
				}
			}
		}, {
			$group: {
				_id: {
					'id': '$_id',
					'created': '$createdTimestamp.timestamp',
					'qualified': '$doneTimestamp.timestamp',
					'result': {
						$subtract: ['$doneTimestamp.timestamp', '$createdTimestamp.timestamp']
					}
				}
			}
		}], function(err, res) {
			if (err) {
				logger.writeLog('error', 'Error on getting data.' +
					'. File: rewards-controller.js' +
					'. Function: getFallbackAvgConclusion' +
					'. ErrorMessage: ' + err);
				callback(err);
			} else {
				logger.writeLog('info', 'Success on getting data.' +
					'. File: rewards-controller.js' +
					'. Function: getFallbackAvgConclusion');
				for (var i in res) {
					totalQualification += (res[i]._id.result / 1000 / 60);
				}
				callback(null, totalQualification / res.length);
			}
		});
	});
}

function getAvgConclusion(referenceDate, experience, callback) {
	var createdDate = new Date('2016-04-01T10:00:00.000Z');
	var totalQualification = 0;

	getFallbackArray(function(err, xpsArray) {
		GLOBAL.db.collection('rewards').aggregate([{
			$match: {
				'experience.name': experience,
				'created': {
					$gt: referenceDate ? referenceDate : createdDate
				},
				'fallback': false,
				'client.name': {
					$nin: ['engine-no-choice', 'engine-timeout']
				},
				$and: [{
					'trace.name': {
						$in: ['created']
					}
				}, {
					'trace.name': {
						$in: ['done']
					}
				}]
			}
		}, {
			$unwind: {
				path: '$trace'
			}
		}, {
			$match: {
				'trace.name': {
					$in: ['created', 'done']
				}
			}
		}, {
			$group: {
				_id: '$_id',
				trace: {
					$push: {
						'timestamp': '$trace.timestamp'
					}
				}
			}
		}, {
			$project: {
				doneTimestamp: {
					$arrayElemAt: ['$trace', 0],
				},
				createdTimestamp: {
					$arrayElemAt: ['$trace', 1],
				}
			}
		}, {
			$group: {
				_id: {
					'id': '$_id',
					'created': '$createdTimestamp.timestamp',
					'qualified': '$doneTimestamp.timestamp',
					'result': {
						$subtract: ['$doneTimestamp.timestamp', '$createdTimestamp.timestamp']
					}
				}
			}
		}], function(err, res) {
			if (err) {
				logger.writeLog('error', 'Error on getting data.' +
					'. File: rewards-controller.js' +
					'. Function: getAvgConclusion' +
					'. ErrorMessage: ' + err);
				callback(err);
			} else {
				logger.writeLog('info', 'Success on getting data.' +
					'. File: rewards-controller.js' +
					'. Function: getAvgConclusion');
				for (var i in res) {
					totalQualification += (res[i]._id.result / 1000 / 60);
				}
				callback(null, totalQualification / res.length);
			}
		});
	});
}

function getAvgFallbackPerReward(experience, callback) {
	var query = [{
		$match: {
			'experience.name': experience,
			fallback: true,
			'status.name': 'done',
			linkedRewards: {
				$exists: true
			}

		}
	}, {
		$project: {
			numberOfFallbacks: {
				$size: "$linkedRewards"
			}
		}
	}, {
		$group: {
			_id: null,
			fallbacksMedia: {
				$avg: '$numberOfFallbacks'
			}
		}
	}];

	GLOBAL.db.collection('rewards').aggregate(query, function(err, res) {
		if (err) {
			logger.writeLog('error', 'Error on getting data.' +
				'. File: rewards-controller.js' +
				'. Function: getAvgFallbackPerReward' +
				'. ErrorMessage: ' + err);
			callback(err);
		} else {
			logger.writeLog('info', 'Success on getting data.' +
				'. File: rewards-controller.js' +
				'. Function: getAvgFallbackPerReward');
			if (res.length > 0) {
				callback(null, res[0].fallbacksMedia);
			} else {
				callback(null, null);
			}
		}
	});

}

function getFallbackEffectiveness(experience, callback) {
	async.parallel([
			function(callback) {
				var query = [{
					$match: {
						'reward.experience.name': experience,
						'deal.type': {
							$ne: 'donation'
						},
						'reward.linkedRewards': {
							$exists: true
						},
						$and: [{
							'status.name': 'done'
						}, {
							'status.detail.name': 'delivered'
						}]
					}
				}, {
					$project: {
						amount: 1,
						linkedRewardsSize: {
							$size: "$reward.linkedRewards"
						}
					}
				}, {
					$match: {
						"linkedRewardsSize": {
							$gt: 1
						}
					}
				}, {
					$group: {
						_id: null,
						amount: {
							$sum: '$amount'
						}
					}
				}];

				GLOBAL.db.collection('payments').aggregate(query, function(err, res) {
					if (err) {
						logger.writeLog('error', 'Error on getting data.' +
							'. File: rewards-controller.js' +
							'. Function: getFallbackEffectiveness' +
							'. ErrorMessage: ' + err);
						callback(err);
					} else {
						logger.writeLog('info', 'Success on getting data.' +
							'. File: rewards-controller.js' +
							'. Function: getFallbackEffectiveness');
						if (res.length > 0) {
							callback(null, res[0].amount);
						} else {
							callback(null, null);
						}
					}
				});
			},
			function(callback) {
				var query = [{
					$match: {
						'experience.name': experience,
						fallback: true,
						linkedRewards: {
							$size: 1
						}
					}
				}, {
					$group: {
						_id: null,
						amount: {
							$sum: '$amount'
						}
					}
				}];

				GLOBAL.db.collection('rewards').aggregate(query, function(err, res) {
					if (err) {
						logger.writeLog('error', 'Error on getting data.' +
							'. File: rewards-controller.js' +
							'. Function: getFallbackEffectiveness' +
							'. ErrorMessage: ' + err);
						callback(err);
					} else {
						logger.writeLog('info', 'Success on getting data.' +
							'. File: rewards-controller.js' +
							'. Function: getFallbackEffectiveness');
						if (res.length > 0) {
							callback(null, res[0].amount);
						} else {
							callback(null, null);
						}
					}
				});
			}
		],
		// optional callback
		function(err, results) {
			if (results[0] && results[0]) {
				callback(null, results[0] * 100 / results[1]);
			} else {
				callback(null, null);
			}
		});
}


module.exports = {
	getNumberOfTriggers: getNumberOfTriggers,
	getTotalRewardsInfo: getTotalRewardsInfo,
	getAvgTimeQualification: getAvgTimeQualification,
	getAvgFallback: getAvgFallback,
	getAvgChooseTime: getAvgChooseTime,
	getFallbackAvgConclusion: getFallbackAvgConclusion,
	getAvgConclusion: getAvgConclusion,
	getDeliveredAmount: getDeliveredAmount,
	getRewardsAmount: getRewardsAmount,
	getAvgFallbackPerReward: getAvgFallbackPerReward,
	getFallbackEffectiveness: getFallbackEffectiveness
};