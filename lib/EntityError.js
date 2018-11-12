"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

class EntityError extends Error {
  constructor(...args) {
    super(...args);
    this.code = args[1];
    Error.captureStackTrace(this, EntityError);
  }

}

exports.default = EntityError;
module.exports = exports["default"];