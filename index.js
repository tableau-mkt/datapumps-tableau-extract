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
       * Insert a single row into the Tableau Extract.
       * @param {String} table
       *   Defaults to "Extract" if no table name is provided.
       * @param {Object|Array} row
       * @returns Promise
       */
      target.insertIntoExtract = function insertIntoExtract(table, row) {
        return new Promise(function (resolve, reject) {
          try {
            target._tableauExtract.insert(table, row);
            resolve();
          }
          catch (err) {
            reject(err);
          }
        });
      };

      /**
       * Insert multiple rows into the Tableau Extract.
       * @param {String} table
       *   Defaults to "Extract" if no table name is provided.
       * @param {Array} rows
       * @returns Promise
       */
      target.insertMultipleIntoExtract = function insertMultipleIntoExtract(table, rows) {
        return new Promise(function (resolve, reject) {
          try {
            target._tableauExtract.insertMultiple(table, rows);
          }
          catch (err) {
            reject(err);
          }
        });
      };

      /**
       * Add an additional table to the extract.
       * @param {String} table
       * @param {Object} definition
       * @returns {target}
       */
      target.addTableToExtract = function addTableToExtract(table, definition) {
        target._tableauExtract.addTable(table, definition);
        return this;
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
