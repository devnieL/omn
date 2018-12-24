const assert = require('assert');
var neo4j = require('neo4j-driver');

describe('DB', () => {

  it('should return the configured database client', () => {

    const DB = require("../index.js").DB;

    DB.configure({
      db : neo4j.v1.driver('bolt://localhost', neo4j.v1.auth.basic('neo4j', 'neo4j'))
    });

    const db = DB.getDB();
    assert.notEqual(db, null);

  });

  it('should return the Entity class', () => {

    const Entity = require("../index.js").Entity;
    const DB = require("../index.js").DB;

    DB.configure({
      db : {
        type : "neo4j",
        client : neo4j.v1.driver('bolt://localhost', neo4j.v1.auth.basic('neo4j', 'neo4j'))
      }
    });

    const db = DB.getDB();
    assert.equal(Entity, DB.Entity);

  });

  it('should return the available models', () => {

    const DB = require("../index.js").DB;

    DB.configure({
      db : neo4j.v1.driver('bolt://localhost', neo4j.v1.auth.basic('neo4j', 'neo4j'))
    });

    class Braph extends DB.Entity {}
    class Page extends DB.Entity {}
    class User extends DB.Entity {}
    class Instance extends DB.Entity {}
    class Class extends DB.Entity {}

    DB.entities["Braph"] = Braph;
    DB.entities["Page"] = Page;
    DB.entities["User"] = User;
    DB.entities["Instance"] = Instance;
    DB.entities["Class"] = Class;

    assert.equal(Object.keys(DB.entities).length, 5);

  });

});
