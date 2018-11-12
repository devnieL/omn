"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MONGODB = void 0;

var _MongoDBAdapter = _interopRequireDefault(require("./mongodb/MongoDBAdapter"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var MONGODB = {
  MongoDBAdapter: _MongoDBAdapter.default
};
exports.MONGODB = MONGODB;