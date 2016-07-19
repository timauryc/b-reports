'use strict';

var request = require('request');
var config = require('../config');
var logger = require('../logger/logger');
var async = require('async');
var rewardsController = require('./rewards-controller');

var experience = {
	$regex: '.+'
};

//new Date('1900-01-01T00:00:00.000Z')
var d = new Date();
var referenceDate = new Date(d.getFullYear(),d.getMonth(),0,0,0,0);

function getBonuzSummary(callback) {
    async.parallel({
            triggers: function(callback) {
                rewardsController.getNumberOfTriggers(referenceDate, experience, function(err, res) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, res);
                    }
                });
            },
            deliveredAmount: function(callback) {
                rewardsController.getDeliveredAmount(referenceDate, experience, function(err, res) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, res);
                    }
                });
            },
            rewardsAmount: function(callback) {
                rewardsController.getRewardsAmount(referenceDate, experience, function(err, res) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, res);
                    }
                });
            },
            rewardsInfo: function(callback) {
                rewardsController.getTotalRewardsInfo(referenceDate, experience, function(err, res) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, res);
                    }
                });
            },
            avgTimeQualification: function(callback) {
                rewardsController.getAvgTimeQualification(referenceDate, experience, function(err, res) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, res);
                    }
                });
            },
            avgFallback: function(callback) {
                rewardsController.getAvgFallback(referenceDate, experience, function(err, res) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, res);
                    }
                });
            },
            avgChooseTime: function(callback) {
                rewardsController.getAvgChooseTime(referenceDate, experience, function(err, res) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, res);
                    }
                });
            },
            fallbackAvgConclusion: function(callback) {
                rewardsController.getFallbackAvgConclusion(referenceDate, experience, function(err, res) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, res);
                    }
                });
            },
            avgConclusion: function(callback) {
                rewardsController.getAvgConclusion(referenceDate, experience, function(err, res) {
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
    getBonuzSummary: getBonuzSummary
};