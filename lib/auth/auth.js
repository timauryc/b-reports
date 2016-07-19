'use strict';

var auth = require('basic-auth');
var logger = require('../logger/logger');
var errMessage;

function checkUserPass(object) {
  var result = GLOBAL.usersCredentials.some(function(item) {
    return item.clientId === object.name && item.secret === object.pass;
  });
  return result;
}

module.exports = function(req, callback) {

  if (!req.headers.authorization) {
    errMessage = 'Authorization field does not exist on request';

    logger.writeLog('error', 'Error on authenticating' +
      '. File: api/auth/auth.js' +
      '. Function: auth' +
      '. ErrorMessage: ' + errMessage);

    
    return callback(errMessage, false);
  } else {
    var credentials = auth(req);
    if (!credentials || !checkUserPass(credentials)) {
      errMessage = 'Unauthorized';

      logger.writeLog('error', 'Error on authenticating' +
        '. File: api/auth/auth.js' +
        '. Function: auth' +
        '. ErrorMessage: ' + errMessage);

      return callback(errMessage, false);
    } else {
      return callback(null, true);
    }
  }
};