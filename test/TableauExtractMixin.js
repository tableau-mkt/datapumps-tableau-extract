'use strict';

var fs = require('fs'),
    assert = require('assert'),
    datapumps = require('datapumps'),
    RestMixin = datapumps.mixin.RestMixin,
    TableauExtractMixin = require('../index.js');

describe('TableauExtractMixin', function() {
  var targetDir = './test/build',
      expectedPath,
      tableDef;

  // These tests actually read/write from/to disk. Account for slowness here.
  this.timeout(10000);

  // Table definition isn't changing. Define it here.
  tableDef = {
    columns: [
      {id: 'userId', dataType: 'int'},
      {id: 'id', dataType: 'int'},
      {id: 'title', dataType: 'string'},
      {id: 'body', dataType: 'string'}
    ]
  };

  before(function() {
    // Ensure we have a place to put test extracts.
    fs.mkdirSync(targetDir);

    // Also ensure log files are written there.
    process.env['TAB_SDK_LOGDIR'] = targetDir;
  });

  it('pumps data into a TDE', function (done) {
    var pump = new datapumps.Pump(),
        apiUrl = 'https://jsonplaceholder.typicode.com/posts',
        beforeSize,
        afterSize;

    // Set the path here.
    expectedPath = targetDir + '/mocha-pumps-data-into.tde';

    // Start defining the datapump.
    pump

      // Pull data from a REST API.
      .mixin(RestMixin)
      .fromRest({
        query: function () {return pump.get(apiUrl);},
        resultMapping: function (message) {
          // Get a baseline size of the TDE here.
          beforeSize = fs.statSync(expectedPath)['size'];
          return message.result;
        }
      })

      // Write data into a Tableau Data Extract file.
      .mixin(TableauExtractMixin({path: expectedPath, definition: tableDef}))
      .process(function (post) {
        return pump.insertIntoExtract(post);
      })

      // Test Assertions here.
      .on('end', function () {
        // Close the extract (otherwise nothing is actually written to the TDE).
        pump.closeExtract();

        // Read the file size of the extract now.
        afterSize = fs.statSync(expectedPath)['size'];

        // Ensure that the file grew in size from the original measurement.
        assert(beforeSize < afterSize, 'TDE increased in size');
        done();
      })

      // Run the damn thing.
      .run()
  });

  it('can also publish to server if it wants to', function (done) {
    var pump = new datapumps.Pump(),
        apiUrl = 'https://jsonplaceholder.typicode.com/posts';

    // Set the path here.
    expectedPath = targetDir + '/mocha-can-publish-to-server.tde';

    // Start defining the datapump.
    pump

      // Pull data from a REST API.
      .mixin(RestMixin)
      .fromRest({
        query: function () {return pump.get(apiUrl);},
        resultMapping: function (message) {return message.result;}
      })

      // Write data into a Tableau Data Extract file.
      .mixin(TableauExtractMixin({path: expectedPath, definition: tableDef}))
      .process(function (post) {
        return pump.insertIntoExtract(post);
      })

      // Test Assertions here.
      .on('end', function () {
        pump.closeExtract();

        // Attempt to publish this to Server.
        pump.publishToServer('https://10ay.online.tableau.com', 'testUser', 'testPassword')
          // If we can catch the unauthorized error, then it's possible to publish.
          .catch(function (err) {
            assert(err === 'Server Response Code: 401');
            done();
          });
      })

      // Run the damn thing.
      .run()
  });

  afterEach(function () {
    // Delete any TDEs that have been generated.
    if (expectedPath) {
      try {
        fs.unlinkSync(expectedPath);
      }
      catch (e) {}
      expectedPath = null;
    }
  });

  after(function () {
    // Also clean out log files.
    fs.unlinkSync(targetDir + '/DataExtract.log');
    fs.unlinkSync(targetDir + '/TableauSDKServer.log');

    // Clean up the test extract folder.
    fs.rmdirSync(targetDir);
  });

});
