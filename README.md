Datapumps: Tableau Data Extract [![Build Status](https://travis-ci.org/tableau-mkt/datapumps-tableau-extract.svg?branch=master)](https://travis-ci.org/tableau-mkt/datapumps-tableau-extract)
==========================

[Datapumps] is a node.js ETL framework that allows you to easily import, export,
transform, or move data between systems. This package introduces a mixin that
can be used with datapumps to write data to a [Tableau Data Extract].

## Installation

In order to install and use this package, you will need to install the C/C++
Tableau SDK on your system. Instructions for doing so can be found on the
[Node.js Tableau SDK] project page.

Once the Tableau SDK is installed, you can install this package like you would
any other node package:

```sh
npm install datapumps-tde --save

# If you haven't already, be sure you've also installed datapumps itself!
npm install datapumps --save
```

## Usage

```javascript
var datapumps = require('datapumps'),
    RestMixin = datapumps.mixin.RestMixin,
    TableauExtractMixin = require('datapumps-tde'),
    pump = new datapumps.Pump();
 
pump
  // Pull data from a REST API.
  .mixin(RestMixin)
  .fromRest({
    query: function () {return pump.get('https://jsonplaceholder.typicode.com/posts');},
    resultMapping: function (message) {
      return message.result;
    }
  })

  // Write data into a TDE in the current working directory.
  .mixin(TableauExtractMixin({
    path: 'posts.tde',
    definition: {
      defaultAlias: 'JSON Placeholder Posts',
      columns: [
        {id: 'userId', dataType: 'int'},
        {id: 'id', dataType: 'int'},
        {id: 'title', dataType: 'string'},
        {id: 'body', dataType: 'string'}
      ]
    }
  }))
  .process(function (post) {
    // Optionally perform transformations here.
    return pump.insertIntoExtract(post);
  })

  .run()
    .then(function() {
      console.log('Done writing posts to the TDE.');
      pump.closeExtract();
    });
```

## Advanced Usage
You can add multiple tables to your extract and insert data into specific
tables like this.
```javascript

pump
  .mixin(TableauExtractMixin({path: extPath, definition: extDef}))
  .addTableToExtract(secondTableName, secondTableDef)
  .process(function (data) {
    if (data.hasOwnProperty('foo')) {
      return pump.insertIntoExtract(secondTableName, data);
    }
    else {
      return pump.insertIntoExtract(otherTableName, data);
    }
  });
```

You can also insert multiple rows of data at once (for example, using the
node-datapumps built-in BatchMixin) like this.

```javascript
pump
  .mixin(BatchMixin)
  .mixin(TableauExtractMixin({path: extPath, definition: extDef}))
  .process(function (rows) {
    return pump.insertMultipleIntoExtract(rows);
  });
```

For more information about how to define an extract see the Node.js
[Tableau SDK usage details].

[Datapumps]: https://www.npmjs.com/package/datapumps
[Tableau Data Extract]: https://www.tableau.com/about/blog/2014/7/understanding-tableau-data-extracts-part1
[Node.js Tableau SDK]: https://github.com/tableau-mkt/node-tableau-sdk#installation
[Tableau SDK usage details]: https://github.com/tableau-mkt/node-tableau-sdk#usage
