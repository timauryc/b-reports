'use strict';

var request = require('request');
var config = require('../config');
var logger = require('../logger/logger');
var async = require('async');


//know the data stored on the variabl
function getDiagnosis(callback) {
    async.parallel([
            function(callback) {
                var query = {
                    mobile: /^550/
                };

                GLOBAL.db.collection('consumers').count(query, function(err, result) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, result);
                    }
                });
            },
            function(callback) {
                var query = {
                    mobile: {
                        $not: /(^[0-9]{12,13}$)/
                    }
                };

                GLOBAL.db.collection('consumers').count(query, function(err, result) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, result);
                    }
                });
            },
            //total experiences
            function(callback) {
                var projection = {
                    _id: 0,
                    name: 1
                };

                GLOBAL.db.collection('experiences').find({}, projection).toArray(function(err, docs) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, docs);
                    }
                });
            },
            //experiences ok
            function(callback) {
                var query = {
                    $or: [{
                        maxRecoveryFallback: {
                            $gt: 0
                        },
                        appreciationMessageFallback: {
                            $exists: true
                        },
                        'templates.events': {
                            $elemMatch: {
                                templateName: {
                                    $regex: /^fallback-notification-/
                                }
                            }
                        }
                    }, {
                        $or: [{
                            maxRecoveryFallback: {
                                $exists: false
                            }
                        }, {
                            maxRecoveryFallback: {
                                $lt: 1
                            }
                        }],
                        appreciationMessageFallback: {
                            $exists: false
                        },
                        'templates.events': {
                            $elemMatch: {
                                templateName: {
                                    $not: /^fallback-notification-/
                                }
                            }
                        }
                    }]
                };

                var projection = {
                    _id: 0,
                    name: 1
                };

                GLOBAL.db.collection('experiences').find(query, projection).toArray(function(err, docs) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, docs);
                    }
                });
            }
        ],
        function(err, results) {
            if (err) {
                callback(err);
            } else {
                var diff = results[2].filter(function(item) {
                    return !results[3].some(function(test) {
                        return test.name === item.name;
                    });
                });
                
                callback(null, {
                    wrongDDD: results[0],
                    wrongDigitNumber: results[1],
                    experiencesWrong: diff
                });
            }
        });
}

module.exports = {
    getDiagnosis: getDiagnosis
};