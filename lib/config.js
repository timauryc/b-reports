'use strict';

var nconf = require('nconf');

nconf.argv()
  .env()
  .file(process.cwd() + '/conf/bonuz-reports.json');

module.exports = nconf;