'use strict';

(function() {
  var ExtractApi = require('tableau-sdk'),
      Promise = require('bluebird');

  module.exports = function TableauExtractMixin(args) {

    if (!args.path || !args.definition) {
      throw new Error('path and definition properties are required for TableauExtractMixin');
    }

    return function (target) {
      target._tableauExtract = new ExtractApi(args.path, args.definition);

      /**
       * Insert a single row into the Tableau Data Extract.
       * @param {Object|Array} row
       * @returns Promise
       */
      target.insertIntoExtract = function insertIntoExtract(row) {
        return new Promise(function (resolve, reject) {
          try {
            target._tableauExtract.insert(row);
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
        target._tableauExtract.close();
      };

      return target;
    }
  };

}).call(this);
