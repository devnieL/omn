var DB = require("./../../DB");
var InstanceUtils = require("../../utils/Utils");

var log = require("./../../utils/Logger").child({
  tag: "Neo4jAdapter",
  level: "debug"
});

const Neo4jSchema = require("./Neo4jSchema");
const Neo4jModel = require("./Neo4jModel");

class Neo4jAdapter {

  static create(instance_class) {

    var adapter = new Neo4jAdapter();

    if (instance_class.db) {
      if (instance_class.db.type != "neo4j")
        throw new Error("To use a Neo4jAdapter, a Neo4j db connection should be set");
    }

    adapter.instanceClass = instance_class;
    adapter.originalSchema = instance_class.schema;
    adapter.model = this.getOrCreateModel(instance_class);

    return adapter;
  }

  static createSchema(instance_class) {

    log.debug({
      instance_class
    }, "createSchema");

    var parsed_schema = {};

    // Parse schema for Neo4j
    for (let i in instance_class.schema) {

      var name = i;
      var value = null;
      let inner = null;
      let isArray = null;

      if (instance_class.schema[i] instanceof Array) {
        inner = instance_class.schema[i][0];
        isArray = true;
      } else {
        inner = instance_class.schema[i];
        isArray = false;
      }

      if (typeof inner == "object") {

        // A property value from the Schema definition
        // could contain more details about the property.

        let v = null;
        let inner_type = (typeof inner.type == "string") ? inner.type : inner.type.name;

        if (Neo4jSchema.Types[inner_type]) {
          v = {
            type: inner_type,
          };
        } else {
          v = {
            type: Neo4jSchema.Types.Id,
            ref: inner_type,
          }
        }

        if (inner.default) v.default = inner.default;
        if (inner.unique) v.unique = inner.unique;
        if (inner.index) v.index = inner.index;

        value = (isArray) ? [v] : v;

      } else {

        let v = null;
        let inner_type = (typeof inner == "string") ? inner : inner.name;

        if (Neo4jSchema.Types[inner_type]) {
          v = {
            type: inner_type
          };
        } else {
          v = {
            type: Neo4jSchema.Types.Id,
            ref: inner_type
          }
        }

        value = (isArray) ? [v] : v;

      }

      parsed_schema[name] = value;

    }

    log.debug("Parsed schema:", parsed_schema);

    var schema = new Neo4jSchema(parsed_schema);
    return schema;

  }

  static getOrCreateModel(instance_class, schema) {

    if (typeof instance_class != "function")
      throw new Error("To get or create a model, a class is necessary as parameter");

    var model_name = instance_class.name;
    var model_schema = schema || this.createSchema(instance_class);

    var model = class Model extends Neo4jModel { };
    Object.defineProperty(model, 'name', { writable: true });

    model.name = model_name;
    model.schema = model_schema;
    model.db = DB.db.client;

    return model;

  }

  /**
   * @param {Instance} entity
   */
  async save(entity) {

    log.debug("MongoDBAdapter.save()");

    var Model = this.model;

    log.debug("entity.getProperties:", entity.getProperties());

    try {
      if (entity.id) {
        log.debug("updating entity because it already has an id...");
        await Model.update({ _id: entity.id }, { $set: entity.getProperties() });
        return entity;
      } else {
        var instance = new Model(entity.getProperties());
        await instance.save();
        entity.id = instance.id;
        return entity;
      }
    } catch (e) {
      throw e;
    }

  }

  /**
   *
   *
   * @param {String|Entity} param
   * @memberof Neo4jAdapter
   */
  async delete(param) {

    var Model = this.model;

    try {
      if (typeof param == "number" || typeof param == "string")
        await Model.delete(param);
      else
        await Model.delete(param.id);
    } catch (e) {
      throw e;
    }

  }

  async list(page, itemsPerPage, query) {

    log.debug({
      page: page,
      itemsPerPage: itemsPerPage,
      query: query
    }, "BotSchema.list()");

    var Model = this.model;

    var q = {};

    /*
    if(query.start_date && !query.end_date)
        q.creation_date = {
            "$gte" : moment(query.start_date).tz(process.env.TIMEZONE || "America/Bogota").toDate()
        }

    if(query.start_date && query.end_date)
        q.start_time = {
            "$gte" : moment(query.start_date).tz(process.env.TIMEZONE || "America/Bogota").toDate(),
            "$lt": moment(query.end_date).tz(process.env.TIMEZONE || "America/Bogota").toDate()
        }

    if(!query.start_date && query.end_date)
        q.start_time = {
            "$lt": moment(query.end_date).tz(process.env.TIMEZONE || "America/Bogota").toDate()
        }

    */

    log.debug({
      q: q
    }, "Query to use on finding...");

    try {

      var results = await Model.aggregate([

        {
          $match: q
        },

        {
          $skip: itemsPerPage * page
        },

        {
          $limit: parseInt(itemsPerPage)
        },

        {
          $sort: {
            'creation_date': -1
          }
        }

      ]).exec();

      return results;

    } catch (error) {
      log.error(error);
      throw error;
    }

  }

  buildQuery(query) {

    log.debug({ query }, "query before translation...");

    var convertedQuery = {};

    let Model = this.model;

    var objectPropertiesWithClassNames = InstanceUtils.getObjectProperties(this.originalSchema);
    let objectProperties = Object.keys(objectPropertiesWithClassNames);

    var objectPropertiesInQuery = [];

    for (var queryProperty in query) {
      if (objectProperties.includes(queryProperty)) {
        objectPropertiesInQuery.push(queryProperty);
      }
    }

    log.debug("object properties in query...", objectPropertiesInQuery);
    log.debug("object properties with class names...", objectPropertiesWithClassNames);

    if (objectPropertiesInQuery.length > 0) {
      convertedQuery.type = "aggregate";
      convertedQuery.query = [];

      // Lookup

      for (var objectPropertyNameInQuery of objectPropertiesInQuery) {
        var foreignClass = objectPropertiesWithClassNames[objectPropertyNameInQuery];

        var matchQuery = {};

        if (typeof query[objectPropertyNameInQuery] == "object") {
          for (var q in query[objectPropertyNameInQuery]) {
            if (q == "_id") {
              matchQuery[objectPropertyNameInQuery + "." + q] = mongoose.Types.ObjectId(query[objectPropertyNameInQuery][q]);
            } else {
              matchQuery[objectPropertyNameInQuery + "." + q] = query[objectPropertyNameInQuery][q];
            }
          }
        } else {
          matchQuery[objectPropertyNameInQuery + "._id"] = mongoose.Types.ObjectId(query[objectPropertyNameInQuery]);
        }

        convertedQuery.query.push({
          $lookup: {
            from: foreignClass.db_adapter.model.collection.name,
            localField: objectPropertyNameInQuery,
            foreignField: "_id",
            as: objectPropertyNameInQuery
          }
        }, {
            $unwind: "$" + objectPropertyNameInQuery
          }, {
            $match: matchQuery
          });
      }

    } else {
      convertedQuery.type = "find";
      convertedQuery.query = query;
    }

    log.debug({ convertedQuery }, "query to send to mongoDB");

    return convertedQuery;

  }

  async query(query) {

    try {
      let Model = this.model;

      let q = this.buildQuery(query);

      let results = null;

      switch (q.type) {

        case "aggregate":
          results = await Model.aggregate(q.query);
          break;

        case "find":
        default:
          results = await Model.find(q.query);
          break;

      }

      let Constructor = this.instanceClass;

      log.debug({ query, results }, "Instance.find() results");

      let instances = await Promise.all(results.map(async function (result) {

        let instance = new Constructor();
        instance.id = result._id.toString();
        instance.setProperties(result);
        instance = await Constructor.populateProperties(instance);
        return instance;

      }));

      log.debug({
        instances
      }, "MongoDBAdapter.find() objects to return");

      return instances;

    } catch (e) {
      log.error(e);
      throw e;
    }

  }

  async drop() {

    log.debug("Instance.drop()");

    var Model = this.model;

    try {
      if (Model.collection.name) {
        log.debug('Collection to delete:', Model.collection.name);
        await Model.collection.drop();
      }
    } catch (e) {
      if (e.code === 26)
        log.debug("Ignored Error:", e.message);
      else
        throw e;
    }

  }

}

module.exports = Neo4jAdapter;
