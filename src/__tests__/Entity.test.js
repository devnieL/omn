const assert = require('assert');
var neo4j = require('neo4j-driver');

describe('Model', () => {
  it('should create an instance of Model', () => {

    const DB = require("../index.js").DB;

    DB.configure({
        db : {
            type : "neo4j",
            client : neo4j.v1.driver('bolt://localhost', neo4j.v1.auth.basic('neo4j', 'neo4j'))
        }
    });

    const Entity = require('../index.js').Entity;

    class Braph extends Entity {
        static get schema(){
            return {
                name : {
                    type : String,
                    null : false,
                    default : "A new Braph"
                },
                active : Boolean,
                creation_date : Date,
                update_date : Date,
                global : Boolean
            }
        }
    }

    var braph = new Braph({
        name : "An example",
        active : true,
        creation_date : new Date(),
        global : true
    });

    assert(braph instanceof Braph, true);

  });
});
