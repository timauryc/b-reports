'use strict';

var request = require('request');
var config = require('../config');
var logger = require('../logger/logger');
var async = require('async');
var rewardsController = require('./rewards-controller');


//Get tha name of the experience
function getExperienceName(userText, callback) {
    GLOBAL.db.collection('experiences').find({
        $text: {
            $search: userText
        }
    }, {
        _id: 0,
        'name': 1,
        score: {
            $meta: "textScore"
        }
    }).sort({
        score: {
            $meta: "textScore"
        }
    }).limit(1).toArray(function(err, docs) {
        if (err) {
            logger.writeLog('error', 'Error on getting experience data.' +
                '. File: summary-controller.js' +
                '. Function: getExperienceName' +
                '. ErrorMessage: ' + err);
            return callback(err);
        } else {
            logger.writeLog('info', 'Success on getting experience data.' +
                '. File: summary-controller.js' +
                '. Function: getExperienceName');
            if (docs[0]) {
                return callback(null, docs[0].name);
            } else {
                return callback(null, null);
            }
        }
    });
}

function getBalanceInfo(experience, callback) {
    GLOBAL.db.collection('experiences').find({
        name: experience
    }, {
        _id: 0,
        'name': 1,
        'budget.balance': 1
    }).toArray(function(err, docs) {
        if (err) {
            logger.writeLog('error', 'Error on getting experience data.' +
                '. File: summary-controller.js' +
                '. Function: getSummary' +
                '. ErrorMessage: ' + err);
            return callback(err);
        } else {
            logger.writeLog('info', 'Success on getting experience data.' +
                '. File: summary-controller.js' +
                '. Function: getSummary');
            if (docs[0]) {
                return callback(null, docs[0]);
            } else {
                return callback(null, null);
            }
        }
    });
}


function getSummary(experience, callback) {
    async.parallel({
            balance: function(callback) {
                getBalanceInfo(experience, function(err, balance) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, balance);
                    }
                });
            },
            triggers: function(callback) {
                rewardsController.getNumberOfTriggers('', experience, function(err, res) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, res);
                    }
                });
            },
            deliveredAmount: function(callback) {
                rewardsController.getDeliveredAmount('', experience, function(err, res) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, res);
                    }
                });
            },
            rewardsAmount: function(callback) {
                rewardsController.getRewardsAmount('', experience, function(err, res) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, res);
                    }
                });
            },
            rewardsInfo: function(callback) {
                rewardsController.getTotalRewardsInfo('', experience, function(err, res) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, res);
                    }
                });
            },
            avgTimeQualification: function(callback) {
                rewardsController.getAvgTimeQualification('', experience, function(err, res) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, res);
                    }
                });
            },
            avgFallback: function(callback) {
                rewardsController.getAvgFallback('', experience, function(err, res) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, res);
                    }
                });
            },
            avgChooseTime: function(callback) {
                rewardsController.getAvgChooseTime('', experience, function(err, res) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, res);
                    }
                });
            },
            fallbackAvgConclusion: function(callback) {
                rewardsController.getFallbackAvgConclusion('', experience, function(err, res) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, res);
                    }
                });
            },
            avgConclusion: function(callback) {
                rewardsController.getAvgConclusion('', experience, function(err, res) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, res);
                    }
                });
            },
            avgFallbackPerReward: function(callback) {
                rewardsController.getAvgFallbackPerReward(experience, function(err, res) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, res);
                    }
                });
            },
            fallbackEffectiveness: function(callback) {
                rewardsController.getFallbackEffectiveness(experience, function(err, res) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, res);
                    }
                });
            }
        },
        function(err, results) {
            if (err) {
                return callback(err);
            } else {
                callback(null, results);
            }
        });
}

module.exports = {
    getSummary: getSummary,
    getBalanceInfo: getBalanceInfo,
    getExperienceName: getExperienceName
};