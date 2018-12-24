const assert = require('assert');
var neo4j = require('neo4j-driver');


xdescribe('Neo4jAdapter', () => {

  const DB = require("../../index.js").DB;
  const Entity = require('../../index.js').Entity;

  beforeAll((done) => {

    DB.configure({
      db : {
        type : "neo4j",
        client : neo4j.v1.driver('bolt://localhost', neo4j.v1.auth.basic('neo4j', '12345678'))
      }
    });

    done();

  });

  it('should save an instance of Entity with Neo4j as a database', async () => {

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

    assert.notEqual(braph.id, null);

  });

  it('should read an instance of the Entity inherited class with Neo4j as a database', async () => {

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

    assert.notEqual(braph.id, null);

    var braph_read = await Braph.read(braph.id);
    assert.equal(braph_read.id, braph.id);

  });

  xit('should update an instance the Entity inherited class with Neo4j as a database', async () => {

  });

  it('should delete an instance of the Entity inherited class with Neo4j as a database', async () => {

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

    assert.notEqual(braph.id, null);

    await Braph.delete(braph.id);

    var braph_read = await Braph.read(braph.id);
    assert.equal(braph_read, null);

  });

  xit('should run a raw query using the Entity inherited class', async () => {

  });

});
