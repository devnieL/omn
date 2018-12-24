var bunyan = require("bunyan");

var LOG = bunyan.createLogger({
  name: process.env.NODE_ENV || "module",
  level: "debug",
  serializers: {
    metadata: function (metadata) {
      return JSON.stringify(metadata, null, 2);
    },
    params: function (params) {
      return JSON.stringify(params, null, 2);
    },
    db_results: function (db_results) {
      return JSON.stringify(db_results, null, 2);
    },
    err: bunyan.stdSerializers.err
  }
});

module.exports = LOG;
