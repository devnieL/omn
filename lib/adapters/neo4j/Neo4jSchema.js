"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

class Neo4jSchema {
  constructor(schema, options) {
    if (schema && this.setSchema) this.setSchema(schema);
  }

  setSchema(data) {
    for (var i in data) {
      this[i] = data[i];
    }
  }

  static get Types() {
    return {
      Id: "Id",
      String: "String",
      Number: "Number",
      Date: "Date",
      Object: "Object",
      Boolean: "Boolean"
    };
  }

}

exports.default = Neo4jSchema;