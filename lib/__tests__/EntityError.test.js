"use strict";

var _EntityError = _interopRequireDefault(require("./../EntityError"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const assert = require('assert');

describe('EntityError', () => {
  it('should create a new EntityError including its code', () => {
    var code = "ENTITY_NOT_FOUND";
    var error = new _EntityError.default("Entity not found", code);

    try {
      throw error;
    } catch (e) {
      assert.equal(e.code, code);
    }
  });
});