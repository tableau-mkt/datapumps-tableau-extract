'use strict';

var fs = require('fs-extra'),
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
      {id: 'albumId', dataType: 'int'},
      {id: 'id', dataType: 'int'},
      {id: 'title', dataType: 'string'},
      {id: 'url', dataType: 'string'},
      {id: 'thumbnailUrl', dataType: 'string'}
    ]
  };

  before(function() {
    // Ensure we have a place to put test extracts.
    fs.ensureDirSync(targetDir);

    // Also ensure log files are written there.
    process.env['TAB_SDK_LOGDIR'] = targetDir;
    process.env['TAB_SDK_TMPDIR'] = targetDir;
  });

  it('pumps data into a TDE', function (done) {
    var pump = new datapumps.Pump(),
        apiUrl = 'https://jsonplaceholder.typicode.com/photos',
        beforeSize,
        afterSize;

    // Set the path here.
    expectedPath = targetDir + '/mocha-pumps-data-into.hyper';

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
    // Clean up the test extract folder.
    fs.removeSync(targetDir);
  });

});
