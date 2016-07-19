'use strict';

var express = require('express');
var app = express();
var async = require('async');
var logger = require('./logger/logger');
var config = require('./config');
var mongoDbConnection = require('./mongodb-connection');
var connectionStringBonuz = require('../conf/bonuz-reports').MONGODB.connectionStringBonuz;
var connectionStringVoucher = require('../conf/bonuz-reports').MONGODB.connectionStringVoucher;
var connectionStringEngageRefactor = require('../conf/bonuz-reports').MONGODB.connectionStringEngageRefactor;
var connectionStringAccount = require('../conf/bonuz-reports').MONGODB.connectionStringAccount;

process.title =  require('../package.json').name;

async.waterfall([
	function(callback) {
		mongoDbConnection.connect(connectionStringBonuz, function(db) {
			GLOBAL.db = db;
			callback(null);
		});

	},
	function(callback) {
		mongoDbConnection.connect(connectionStringVoucher,function(db) {
			GLOBAL.db2 = db;
			callback(null);
		});
	},
	function(callback) {
		mongoDbConnection.connect(connectionStringEngageRefactor,function(db) {
			GLOBAL.db3 = db;
			callback(null);
		});
	},
	function(callback) {
		mongoDbConnection.connect(connectionStringAccount,function(db) {
			GLOBAL.db4 = db;
			callback(null);
		});
	},
	function(callback) {
		GLOBAL.db.collection('clients').find({}).toArray(function(err, docs) {
			if (err) {
				logger.writeLog('error', 'Error on getting user credentials.' +
					'. File: app.js' +
					'. Function: mongoDbConnection' +
					'. ErrorMessage: ' + err);
			} else {
				GLOBAL.usersCredentials = docs;

				app.listen(process.env.PORT || config.get('PORT'), function() {
					console.log('listening on port: ', process.env.PORT || config.get('PORT'));
				});
			}
		});
	}
]);


require('./routes/summary')(app);
require('./routes/payload')(app);
require('./routes/balance')(app);
require('./routes/register')(app);
require('./routes/experienceName')(app);
require('./routes/bonuz')(app);

process.on('exit', function() {
	console.log('close db');
	GLOBAL.db.close();
});

module.exports = app;
