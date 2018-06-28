const assert = require('assert');
import EntityError from "./../EntityError";

describe('EntityError', () => {
  it('should create a new EntityError including its code', () => {

    var code = "ENTITY_NOT_FOUND";
    var error = new EntityError("Entity not found", code);

    try{
        throw error;
    }catch(e){
        assert.equal(e.code, code);
    }

  });
});
