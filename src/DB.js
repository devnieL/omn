/**
 * A class that represents the database.
 *
 * @class DB
 */
class DB {

  static configure({ db }) {
    this.db = db;
    this.entities = {};
  }

  static getDB() {
    return this.db;
  }

  static get Entity() {
    return require("./Entity");
  }

}

module.exports = DB;
