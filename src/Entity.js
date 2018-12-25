import DB from './DB';
import MongoDBAdapter from './adapters/mongodb/MongoDBAdapter';
import PostgreSQLAdapter from './adapters/postgresql/PostgreSQLAdapter';
import Neo4jAdapter from './adapters/neo4j/Neo4jAdapter';

const Utils = require("./utils/Utils");

var log = require("./utils/Logger").child({
  module: "models/Entity.js",
  level: "fatal"
});

const RESERVED_PROPERTIES = ['_schema', '__v', '_id'];

class Entity {

  constructor(props) {

    log.debug("props:", props);

    let properties = props || this.getProperties();

    this._id = null;

    // Set default values.

    for (var i in this.constructor.schema) {
      var property = i;
      var value = this.constructor.schema[i];

      if (value.default && properties[property] == null) {
        properties[property] = value.default
      }
    }

    if (properties && this.setProperties)
      this.setProperties(properties);

  }

  /** STATIC PROPERTIES */

  static set schema(value) {
    this._schema = value;
  }

  static get schema() {
    return this._schema;
  }

  static set db(value) {
    this._db = value;
    this._db_adapter = null;

    switch (value.type) {
      case "mongodb":
        this._db_adapter = MongoDBAdapter.create(this);
        break;
      case "postgresql":
        this._db_adapter = PostgreSQLAdapter.create(this);
        break;
      case "neo4j":
        this._db_adapter = Neo4jAdapter.create(this);
        break;
      default:
        break;
    }
  }

  static get db() {
    return this._db;
  }

  static get db_adapter() {
    return this._db_adapter;
  }

  /**
   * Set the default database if not configured
   * at the moment that the class is defined.
   *
   * @memberof Entity
   */
  setDBIfNotConfigured() {
    if (!this.constructor.db_adapter) {
      this.constructor.db = DB.getDB();
    }
  }

  /** Instance properties */

  // Id
  set id(value) {
    this._id = value;
  }

  get id() {
    return this._id;
  }

  // Properties
  get properties() {
    return this._properties;
  }

  set properties(value) {
    this._properties = value;
  }

  /** Instance methods */

  // Get properties
  getProperties() {
    var props = {};

    for (var i in this.constructor.schema) {
      props[i] = this[i];
    }

    return props;
  }

  // Set properties
  // TODO: Allow getter and setters.
  setProperties(data) {
    let self = this;
    let props = self.getProperties();
    for (let propertyName in props) {
      const type = Utils.getPropertyType(self.constructor.schema, propertyName);
      //console.log({propertyName, type});
      switch (type) {
        case 'Date':
          self[propertyName] = new Date(data[propertyName]);
          break;
        case 'String':
        case 'Number':
        default:
          self[propertyName] = data[propertyName];
      }
    }
  }

  toString() {
    return "An instance of " + this.constructor.name;
  }

  /**
   * Convert to a JSON representation, considering
   * only its properties.
   *
   * @param {Boolean} propertiesAsObject
   * @returns
   * @memberof Entity
   */
  toJSON(_propertiesAsObject) {

    log.debug("Entity.toJSON()");

    const self = this;
    const propertiesAsObject = (_propertiesAsObject != null) ? _propertiesAsObject : false;

    log.debug("self.constructor.schema:", self.constructor.schema);

    // Properties

    var properties = [];
    var current_properties = (self.getProperties) ? self.getProperties() : Object.getOwnPropertyNames(this);

    log.debug("current properties:", current_properties);

    for (var i in current_properties) {
      if (RESERVED_PROPERTIES.indexOf(current_properties[i]) == '-1') {

        var property = {
          name: i,
          value: current_properties[i]
        };

        property.type = Utils.getPropertyType(self.constructor.schema, i);
        properties.push(property);
      }
    }

    var instance = {
      id: self.id,
      name: self.toString(),
      properties: properties
    };

    return instance;

  }

  static fromJSON(json) {

    var Constructor = this;

    var instance = new Constructor();
    instance.id = json.id;
    instance.properties = json.properties;

    var props = {};

    for (var i in json.properties) {
      props[json.properties[i].name] = json.properties[i].value;
    }

    instance.setProperties(props);

    instance.name = json.name;
    return instance;

  }

  /**
   * Save instance
   */
  async save() {

    log.debug("Entity.save()");

    this.setDBIfNotConfigured();

    try {
      await this.constructor.db_adapter.save(this);
      return this;
    } catch (e) {
      throw e;
    }

  }

  /**
   * Delete the current entity instance.
   *
   * @memberof Entity
   */
  async delete() {

    log.debug("Entity.delete()");

    try {
      let instance = await this.constructor.db_adapter.delete(this);
      this.id = null;
    } catch (e) {
      log.error(e);
      throw e;
    }

  }

  /**
   * Delete an Entity instance by id.
   *
   * @static
   * @param {String} id
   * @memberof Entity
   */
  static async delete(id) {

    log.debug("Entity.delete()");

    if (typeof id === "object")
      throw new Error("Invalid entity id");

    try {
      await this.db_adapter.delete(id);
    } catch (e) {
      log.error(e);
      throw e;
    }

  }

  static async populateProperties(instance) {

    var properties_to_populate = Utils.getPropertiesToPopulate(instance.constructor.schema);

    log.debug("properties to populate: ", properties_to_populate);

    var properties = instance.getProperties();

    for (let property of properties_to_populate) {
      log.debug("id to search:", properties[property]);

      if (Utils.isArrayProperty(properties[property])) {

        properties[property] = await Promise.all(properties[property].map(async function (id) {

          log.debug("id to search:", id);

          if (id == null) return;

          var EntityClass = instance.constructor.schema[property][0];
          log.debug("model:", Model);

          var _instance = await EntityClass.read(id);

          log.debug(`read instance with id ${id}`, _instance);
          return _instance;

        }));

      } else {

        var Model = instance.constructor.schema[property];

        if (properties[property] != null)
          properties[property] = await Model.read(properties[property]);

      }
    }

    log.debug("properties:", properties);

    instance.setProperties(properties);

    return instance;

  }

  /**
   * Get an entity instance by id.
   *
   * @static
   * @param {String} id
   * @returns Entity
   * @memberof Entity
   */
  static async read(id) {

    log.debug({
      id: id,
      db_type: this.db.type
    }, "Entity.read()");

    switch (this.db.type) {

      case "neo4j":

        try {
          let Model = this.db_adapter.model;
          let result = await Model.read(id);

          // Return null if there is no result
          if (result == null)
            return result;

          log.debug({
            id: id,
            result: result
          }, "Entity.read() result");

          let instance = new this();

          instance.id = result.id.toString();
          instance.setProperties(result);
          instance = await this.populateProperties(instance);

          log.debug({
            instance: instance
          }, "Entity.read() object to return");

          return instance;
        } catch (e) {
          log.error(e);
          throw e;
        }

      case "mongodb":

        try {
          let Model = this.db_adapter.model;
          let result = await Model.findOne({ _id: id });

          // Return null if there is no result
          if (result == null)
            return result;

          log.debug({
            id: id,
            result: result
          }, "Entity.read() result");

          let instance = new this();
          instance.id = result._id.toString();
          instance.setProperties(result);

          instance = await this.populateProperties(instance);

          log.debug({
            instance: instance
          }, "Entity.read() object to return");

          return instance;
        } catch (e) {
          log.error(e);
          throw e;
        }

      case "postgresql":

        try {
          let Model = this.db_adapter.model;
          let result = await Model.findById(id);

          log.debug({
            id: id,
            result: result
          }, "Entity.read() result");

          let instance = new this();
          instance.id = result.id.toString();
          instance.setProperties(result);

          instance = await this.populateProperties(instance);

          log.debug({
            instance: instance
          }, "Entity.read() object to return");

          return instance;
        } catch (e) {
          log.error(e);
          throw e;
        }

      default:
        break;
    }

  }

  /**
   * List all the options
   * @param {Number} page
   * @param {Number} quantity
   * @param {JSONObject} query
   */
  static async list(page, itemsPerPage, query) {

    log.debug({
      options: { page, itemsPerPage, query }
    }, "Entity.list()");

    try {
      let results = await this.db_adapter.list(page, itemsPerPage, query);
      log.debug({
        length: results.length
      }, "Entity.list() results length");
      return results;
    } catch (e) {
      log.error(e);
      throw e;
    }

  }

  /**
   * Drop database store for
   * this instance
   */
  static async drop() {

    log.debug("Entity.drop()");

    try {
      await this.db_adapter.drop();
    } catch (e) {
      throw e;
    }

  }

  static buildQuery(query) {

    var convertedQuery = {};

    let Model = this.db_adapter.model;

    let objectPropertiesWithClassNames = Utils.getObjectProperties(this.schema);
    let objectProperties = Object.keys(objectPropertiesWithClassNames);

    switch (this.db.type) {

      case "mongodb":

        for (var queryProperty in query) {
          if (objectProperties.includes(queryProperty)) {
            convertedQuery.include = [{
              model: this.Models[objectPropertiesWithClassNames[queryProperty]],
              where: query[queryProperty]
            }]
          }
        }

        return convertedQuery;

        break;

      case "postgresql":

        for (var queryProperty in query) {
          if (objectProperties.includes(queryProperty)) {
            convertedQuery.include = [{
              model: this.Models[objectPropertiesWithClassNames[queryProperty]],
              where: query[queryProperty]
            }]
          }
        }

        return convertedQuery;

        break
    }

  }

  static async find(query) {

    try {

      var instances = await this.db_adapter.query(query);

      log.debug({
        instances
      }, "Entity.find() objects to return");

      return instances;

    } catch (e) {
      log.error(e);
      throw e;
    }

  }

  static async findOne(query) {

    log.debug({ query, db_type: this.db.type }, "Entity.findOne()");

    switch (this.db.type) {

      case "mongodb":

        try {
          let Model = this.db_adapter.model;
          let result = await Model.findOne(query);

          log.debug({ query, result }, "Entity.findOne() result");

          if (result == null) return result;

          let Constructor = this;
          let instance = new Constructor();
          instance.id = result._id.toString();
          instance.setProperties(result);
          instance = await Constructor.populateProperties(instance);

          log.debug({ instance }, "Entity.findOne() object to return");

          return instance;

        } catch (e) {
          log.error(e);
          throw e;
        }

        break;

      case "postgresql":

        try {

          let Model = this.db_adapter.model;

          await this.db_adapter.syncIfNotSynched();

          let Constructor = this;

          let result = await Model.findOne({
            where: query
          });

          log.debug({ query, result }, "Entity.findOne() result");

          if (result == null) return null;

          let instance = new Constructor();
          instance.id = result.id.toString();
          instance.setProperties(result);

          log.debug({ instance }, "instance created from result");
          instance = await Constructor.populateProperties(instance);

          log.debug({ instance }, "Entity.find() object to return");

          return instance;

        } catch (e) {
          log.error(e);
          throw e;
        }

        break;
      default:
        break;
    }

  }

}

module.exports = Entity;
