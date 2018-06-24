const RESERVED_PROPERTIES = ['_schema', '__v', '_id'];
const RESERVED_TYPES = ["String", "Number", "Date", "Object", "Boolean", String, Number, Date, Object, Boolean];

var log = require("./Logger").child({
    module : "models/utils/InstanceUtils.js",
    level: "fatal"
});

class InstanceUtils {

    static isArrayProperty(property){
        return property instanceof Array;
    }

    static getObjectProperties(schema){

        var objectProperties = {};

        for(var property in schema){

            let type = null;

            if(this.isArrayProperty(schema[property])){
                type = schema[property][0];
            }else{
                type = schema[property];
            }

            if(typeof type == "function") type = type;
            if(typeof type == "object") type = (typeof type.type == "function") ? type.type : type.type;

            log.debug("schema property type:", type);
            
            if(RESERVED_PROPERTIES.concat(RESERVED_TYPES).indexOf(type) != -1)
                continue;

            objectProperties[property] = type;
        }

        log.debug("objectProperties to return:", objectProperties);

        return objectProperties;

    }

    static getPropertiesToPopulate(schema){

        log.debug("schema:", schema);

        var properties_to_populate = [];

        for(let property in schema){

            let type = null;

            if(this.isArrayProperty(schema[property])){
                type = schema[property][0];
            }else{
                type = schema[property];
            }

            if(typeof type == "function") type = type.name;
            if(typeof type == "object") type = (typeof type.type == "function") ? type.type.name : type.type;
            
            if(RESERVED_PROPERTIES.concat(RESERVED_TYPES).indexOf(type) != -1)
                continue;

            properties_to_populate.push(property);
        }

        return properties_to_populate;
        
    }

    static getAssociatedModelNames(schema){

        log.debug({schema}, "getAssociatedModelNames()");

        var associatedModels = [];

        for(let property in schema){

            let type = null;

            if(this.isArrayProperty(schema[property])){
                type = schema[property][0];
            }else{
                type = schema[property];
            }

            if(typeof type == "function") type = type.name;
            if(typeof type == "object") type = (typeof type.type == "function") ? type.type.name : type.type;

            log.debug("getAssociatedModelNames() | type to check", type);
            
            if(RESERVED_PROPERTIES.concat(RESERVED_TYPES).indexOf(type) != -1)
                continue;
                
            associatedModels.push(type);
        }

        log.debug("getAssociatedModelNames() results:", associatedModels);

        return associatedModels;
        
    }

}

module.exports = InstanceUtils;