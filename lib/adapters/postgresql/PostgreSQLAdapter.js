var DB = require("./../../DB");
var InstanceUtils = require("./../../utils/InstanceUtils");

var log = require("./../../utils/Logger").child({
    tag : "InstanceTests.postgresql"
});

const Sequelize = require('sequelize');

const PRIMITIVE_TYPES = ["String", "Number", "Date"];

const TYPES = {
    "String" : Sequelize.STRING,
    "Number" : Sequelize.INTEGER,
    "Date" : Sequelize.DATE
}

class PostgreSQLAdapter {

    static create(instance_class){

        var adapter = new PostgreSQLAdapter();

        if(instance_class.db){
            if(instance_class.db.type != "postgresql")
                throw new Error("To use a PostgreSQLAdapter, a PostgreSQL db connection should be set");
        }

        adapter.instanceClass = instance_class;
        adapter.originalSchema = instance_class.schema;
        adapter.model = this.getOrCreateModel(instance_class);

        return adapter;
    }
    
    static createSchema(instance_class){

        var Instance = require("../../Entity");

        log.debug({
            instance_class
        }, "createSchema");

        var parsed_schema = {};

        // Parse schema for PostgreSQL
        for(let i in instance_class.schema){
            
            var name = i;
            var value = null;
            let inner = null;
            let isArray = null;

            if(instance_class.schema[i] instanceof Array){
                inner = instance_class.schema[i][0];
                isArray = true;
            }else{
                inner = instance_class.schema[i];
                isArray = false;
            }

            if(isArray) throw new Error("An schema for PostgreSQL can't have array properties");

            log.debug("Inner element:", inner);
            
            if(typeof inner == "object"){

                // A property value from the Schema definition 
                // could contain more details about the property.

                let v = null;
                let inner_type = (typeof inner.type == "string") ? inner.type : inner.type.name;

                log.debug("inner_type:", inner_type);

                if(PRIMITIVE_TYPES.indexOf(inner_type) != -1){
                    v = {
                        type : TYPES[inner_type],
                    };
                }else{
                    v = {
                        type : Sequelize.INTEGER,
                        ref : inner_type,
                    }
                }

                v.allowNull = true;

                if(inner.defaultValue != null) v.default = inner.default;
                if(inner.unique != null) v.unique = inner.unique;
                if(inner.index != null ) v.index = inner.index;
                if(inner.primaryKey != null) v.primaryKey = inner.primaryKey;
                if(inner.null != null) v.allowNull = inner.null;

                //value = (isArray) ? [v] : v;
                value = v;

            }else{

                let v = null;
                let inner_type = (typeof inner == "string") ? inner : inner.name;

                if(PRIMITIVE_TYPES.indexOf(inner_type) != -1){
                    v = {
                        type : TYPES[inner_type]
                    };
                }else{

                    log.debug("Inner type:", inner_type);
                    log.debug("Instance Models:", Instance.Models);

                    v = {
                        type : Sequelize.INTEGER,
                        references : {
                            model : Instance.Models[inner_type].db_adapter.model,
                            key : 'id',
                            deferrable : Sequelize.Deferrable.INITIALLY_IMMEDIATE
                        }
                    }
                }

                //value = (isArray) ? [v] : v;
                value = v;

            }

            parsed_schema[name] = value;

        }

        log.debug("Parsed schema:", parsed_schema);

        /*var schema = new Schema(parsed_schema, {
            collection : collection
        });*/
        
        var schema = parsed_schema;

        log.debug("schema:", parsed_schema);

        return schema;

    }

    static getOrCreateModel(instance_class, schema){

        if(typeof instance_class != "function")
            throw new Error("To get or create a model, a class is necessary as parameter");

        let _log = log.child({
            parameters : { instance_class },
            method : "getOrCreateModel"
        });

        var model_name = instance_class.name;

        _log.debug("model name:", model_name);

        var table_name = (process.env.POSTGRESQL_PREFIX_TABLES || "") + model_name;
        var schema = this.createSchema(instance_class);
        var model = DB.getDB().client.define(model_name, schema, {
            timestamps : false,
            tableName : table_name
        });
        
        _log.debug("model to return:", model);

        return model;
        
    }

    async syncIfNotSynched(){

        var Instance = require("../../Entity");
        var Model = this.model;

        log.debug("Instance Models:", Instance.Models);

        if(Model.__sync != true){

            if(DB.getDB().synched != true){
                await DB.getDB().client.sync();
                DB.db.synched = true;
            }

            var associatedModels = await InstanceUtils.getAssociatedModelNames(this.originalSchema);
            log.debug({associatedModels});

            for(let associatedModel of associatedModels){
                log.debug("syncing", associatedModel, "...");
                await Instance.Models[associatedModel].db_adapter.model.sync();
            }
            Model.__sync = true;
            await Model.sync();

        }
        
    }

    convertProperties(schema, properties){

        var converted_properties = {};

        for(var i in properties){
            log.debug("typeof", properties[i], " = ", typeof properties[i]);
            if(typeof properties[i] == "object")
                converted_properties[i] = properties[i].id;
            else
                converted_properties[i] = properties[i];
        }

        return converted_properties;
    }

    /**
     * @param {Instance} entity 
     */
    async save(entity){

        log.debug("PostgreSQLAdapter.save()");

        var Model = this.model;

        await this.syncIfNotSynched();

        log.debug("entity.getProperties:", entity.getProperties());

        try{
            if(entity.id){

                log.debug("updating entity because it already has an id...");

                let results = await Model.update(
                    this.convertProperties(entity.constructor.schema, entity.getProperties()),
                    {
                        where : {
                            id : entity.id
                        }
                    }
                );

                log.debug({
                    results : results
                }, "results from update process");

                if(results[0] != 1)
                    throw new Error("The instance was not updated");
                    
                return entity;

            }else{

                var converted_properties = this.convertProperties(entity.constructor.schema, entity.getProperties());
                log.debug("converted properties:", converted_properties);
                var instance = Model.build(converted_properties);
                instance = await instance.save();
                log.debug("created entity:", instance);
                entity.id = instance.dataValues.id;
                return entity;
                
            }
        }catch(e){
            throw e;
        }

    }

    /**
     * 
     * @param {String} modelname
     * @param {Instance} entity 
     */
    async delete(entity){

        var Model = this.model;

        log.debug("PostgreSQLAdapter.delete()");

        await this.syncIfNotSynched();

        try{
            await Model.destroy({
                where : {
                    id : entity.id
                }
            });
        }catch(e){
            throw e;
        }

    }

    async list(page, itemsPerPage, query){

        var self = this;

        log.debug({
            page : page,
            itemsPerPage : itemsPerPage,
            query : query
        }, "PostgreSQLAdapter.list()");
        
        var Model = this.model;

        await this.syncIfNotSynched();

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
            q : q
        }, "Query to use on finding...");
    
        try{

            // TODO: Add order option

            var results = await Model.findAll({
                where : q,
                offset : itemsPerPage * page,
                limit : parseInt(itemsPerPage)
            });

            log.debug("results from psql:", results);

            /*var entities = results.map((result) => {
                return this.toInstance(result);
            })*/

            let instances = await Promise.all(results.map(async function(result){
                return self.toInstance(result);
            }));
    
            return instances;
    
        }catch(error){
            log.error(error);
            throw error;
        }
    
    }

    async toInstance(record){
        var Model = this.instanceClass;
        log.debug("toInstance model:", Model);
        let instance = new Model(record.dataValues);
        instance = await Model.populateProperties(instance);
        return instance; 
    }   

    buildQuery(query){

        var convertedQuery = {};

        let Model = this.model;
    
        let objectPropertiesWithClassNames = InstanceUtils.getObjectProperties(this.originalSchema);
        let objectProperties = Object.keys(objectPropertiesWithClassNames);


        for(var queryProperty in query){
            if(objectProperties.includes(queryProperty)){
                convertedQuery.include = [{
                    model : this.Models[objectPropertiesWithClassNames[queryProperty]],
                    where : query[queryProperty]
                }]
            }else{
                convertedQuery["where"] = convertedQuery["where"] || {};
                convertedQuery["where"][queryProperty] = query[queryProperty];
            }
        }

        return convertedQuery;
        
    }

    async query(query){
        
        try{

            let Model = this.model;
                    
            await this.syncIfNotSynched();

            let Constructor = this.instanceClass;;

            let results = await Model.findAll(this.buildQuery(query));

            log.debug({ query, results }, "PostgreSQLAdapter.query() results");

            let instances = await Promise.all(results.map(async function(result){

                log.debug({result}, "PostgreSQLAdapter query() results map()");
                let instance = new Constructor();
                instance.id = result.id.toString();
                instance.setProperties(result);
                log.debug({instance}, "instance created from result");
                instance = await Constructor.populateProperties(instance);
                log.debug({instance}, "instance after populating properties");
                return instance; 

            }));
            
            log.debug({
                instances
            }, "PostgreSQLAdapter.query() objects to return");

            return instances;
        
        }catch(e){
            log.error(e);
            throw e;
        }

    }
    
    async drop(){

        log.debug("PostgreSQLAdapter.drop()");

        var Model = this.model;
        
        try{
            if(Model.name){
                log.debug('Table to delete:', Model.name);
                await Model.drop();
                Model.__sync = false;
                log.debug("Table dropped");
            }
        }catch(e){
            log.error(e);
            throw e;
        }        

    }

}

module.exports = PostgreSQLAdapter;