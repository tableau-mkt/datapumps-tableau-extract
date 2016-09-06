'use strict';

(function() {
  var TDE = require('tableau-sdk'),
      Promise = require('bluebird');

  module.exports = function TableauExtractMixin(args) {

    if (!args.path || !args.definition) {
      throw new Error('path and definition properties are required for TableauExtractMixin');
    }

    return function (target) {
      target._tde = new TDE(args.path, args.definition);

      /**
       * Insert a single row into the Tableau Data Extract.
       * @param {Object|Array} row
       * @returns Promise
       */
      target.insertIntoExtract = function insertIntoExtract(row) {
        return new Promise(function (resolve, reject) {
          try {
            target._tde.insert(row);
            resolve();
          }
          catch (err) {
            reject(err);
          }
        });
      };

      /**
       * Publish the extract to an instance of Tableau Server.
       * @param {String} host
       * @param {String} user
       * @param {String} password
       * @param {String|null} site
       * @param {String|null} project
       * @param {bool|null} overwrite
       * @returns Promise
       */
      target.publishToServer = function publishToServer(host, user, password, site, project, overwrite) {
        return new Promise(function (resolve, reject) {
          try {
            target._tde.publish(host, user, password, site, project, overwrite);
            resolve();
          }
          catch (err) {
            reject(err);
          }
        });
      };

      /**
       * Close the extract.
       */
      target.closeExtract = function closeExtract() {
        target._tde.close();
      };

      return target;
    }
  };

}).call(this);
