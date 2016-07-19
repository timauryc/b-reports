'use strict';

var request = require('request');
var config = require('../config');
var logger = require('../logger/logger');
var async = require('async');

//know the data stored on the variabl
function getConsumerPayload(consumerId, callback) {
    //verificar si es un numero o un telefono
    var consumerPayload = {};
    var query;
    if (consumerId.indexOf("@") >= 0) {
        query = {
            email: consumerId
        };
    } else {
        query = {
            mobile: consumerId
        };
    }
    GLOBAL.db.collection('consumers').find(query).toArray(function(err, docs) {
        if (err) {
            logger.writeLog('error', 'Error on getting consumers data.' +
                '. File: payload-controller.js' +
                '. Function: getConsumerPayload' +
                '. ErrorMessage: ' + err);
            return callback(err);
        } else if (docs.length < 1) {
            logger.writeLog('warn', 'No result retrieved' +
                '. File: payload-controller.js' +
                '. Function: getConsumerPayload');
            return callback(null, null);
        } else {
            logger.writeLog('info', 'Success on getting consumers data.' +
                '. File: payload-controller.js' +
                '. Function: getConsumerPayload');

            var consumer = docs[0];

            consumerPayload.mobile = consumer.mobile;
            consumer.name ? (consumerPayload.name = consumer.name) : '';
            consumer.email ? (consumerPayload.email = consumer.email) : '';
            consumer.birthday ? (consumerPayload.birthday = consumer.birthday) : '';
            consumer.facebook ? (consumerPayload.facebook = consumer.facebook) : '';
            (consumer.operator && consumer.operator.title) ? (consumerPayload.operator = consumer.operator.title) : '';
            consumerPayload.client = ((consumer.notificationChannels.indexOf('push-notifications') >= 0) ? 'App' : 'SMS');
            (consumerPayload.client === 'App' && consumer.device && consumer.device.app) ? (consumerPayload.clientVersion = consumer.device.app.version) : '';
            consumer.tags ? (consumerPayload.tags = consumer.tags) : '';

                getUserRank(consumer, function(err, res) {
                    if (err) {
                        return callback(err);
                    } else {
                        consumerPayload.rank = res;
                        return callback(null, consumerPayload);
                    }
                });
        }
    });
}

function getUserRank(consumer, callback) {

    async.waterfall([
        function(callback) {
            var userPoints = 0;
            userPoints += (consumer.notificationChannels.indexOf('push-notifications') >= 0) ? 10 : 0;
            userPoints += consumer.name ? 2 : 0;
            userPoints += consumer.email ? 2 : 0;
            userPoints += consumer.birthday ? 2 : 0;
            userPoints += consumer.facebook ? 5 : 0;

            callback(null, userPoints);
        },
        function(userPoints, callback) {
            async.parallel([
                    function(callback) {
                        GLOBAL.db.collection('rewards').find({
                            'consumer.mobile': consumer.mobile,
                            forwardedBy: {
                                $exists: true
                            }
                        }).toArray(function(err, docs) {
                            if (err) {
                                logger.writeLog('error', 'Error on getting rewards data.' +
                                    '. File: payload-controller.js' +
                                    '. Function: getUserRank' +
                                    '. ErrorMessage: ' + err);
                                callback(err);
                            } else {
                                logger.writeLog('info', 'Success on getting rewards data.' +
                                    '. File: payload-controller.js' +
                                    '. Function: getUserRank');
                                callback(null, docs.length);
                            }
                        });
                    },
                    function(callback) {
                        GLOBAL.db3.collection('triggers').find({
                            'consumer': consumer.mobile
                        }).toArray(function(err, docs) {
                            if (err) {
                                logger.writeLog('error', 'Error on getting triggers data.' +
                                    '. File: payload-controller.js' +
                                    '. Function: getUserRank' +
                                    '. ErrorMessage: ' + err);
                                callback(err);
                            } else {
                                logger.writeLog('info', 'Success on getting triggerss data.' +
                                    '. File: payload-controller.js' +
                                    '. Function: getUserRank');
                                callback(null, docs.length);
                            }
                        });
                    }
                ],
                // optional callback
                function(err, results) {
                    if (err) {
                        callback(err);
                    } else {
                        var total = results[0] + results[1] + userPoints;
                        callback(null, total);
                    }
                });
        }
    ], function(err, result) {
        if (err) {
            callback(err);
        } else {
            callback(null, result);
        }
    });
}

module.exports = {
    getConsumerPayload: getConsumerPayload
};