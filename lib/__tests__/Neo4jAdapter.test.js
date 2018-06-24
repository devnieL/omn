const assert = require('assert');
var neo4j = require('neo4j-driver');

describe('Neo4jAdapter', () => {

  it('should save an instance of Model with Neo4j as a database', async () => {

    const DB = require("../index.js").DB;

    DB.configure({
        db : {
            type : "neo4j",
            client : neo4j.v1.driver('bolt://localhost', neo4j.v1.auth.basic('neo4j', '12345678'))
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
        creation_date : (new Date()).toISOString(),
        update_date : new Date().toISOString(),
        global : true
    });

    await braph.save();

    console.log(braph);
    assert.notEqual(braph.id, null);

  });
});
