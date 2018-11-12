export default class Neo4jModel {

    constructor(properties){

        this.id = null;

        if(properties && this.setProperties)
            this.setProperties(properties);
    }

    /**
     * Get the properties according to the model schema.
     *
     * @returns {JSONObject}
     * @memberof Neo4jModel
     */
    getProperties(){
        var props = {};

        for(var i in this.constructor.schema){
            props[i] = this[i];
        }

        return props;
    }

    /**
     * Set the properties according to the model schema.
     *
     * @param {JSONObject} data
     * @memberof Neo4jModel
     */
    setProperties(data){
        var self = this;
        var props = this.getProperties();
        for(var i in props){
            self[i] = data[i];
        }
    }

    static get name(){
        return this._name;
    }

    static set name(value){
        this._name = value;
    }

    static get schema(){
        return this._schema;
    }

    static set schema(value){
        this._schema = value;
    }

    /**
     * Read a node by its id.
     *
     * @param {String} id
     * @returns Neo4jModel
     * @memberof Neo4jModel
     */
    static async read(id) {
        
        var db = this.db;

        var query = `MATCH (n) WHERE ID(n) = toInteger({id}) RETURN n`;

        var session = db.session();

        try{

            var result = await session.writeTransaction(function (transaction) {      
                var result = transaction.run(query, {id: id});
                return result;
            });

            session.close();

            if(result.records.length == 0)
                return null;
            

            var record = result.records[0].get("n");

            var node = {
                id: record.identity.toString(),
                properties: record.properties,
                labels: record.labels
            }

            var object = new Neo4jModel();
            object.hydrate(node);

            return object;

        }catch(error){
            console.log(error);
            throw error;
        }

    }

    /**
     * Fill the Neo4jModel object with data gotten
     * from DB.
     * 
     * @static
     * @param {Node} node
     * @memberof Neo4jModel
     */
    async hydrate(node){
        this.id = node.id;
        this.properties = node.properties;
        this.labels = node.labels;
    }

    async update() {

    }

    /**
     * Delete an entity instance by id.
     *
     * @static
     * @param {String} id
     * @returns
     * @memberof Neo4jModel
     */
    static async delete(id) {

        var db = this.db;

        var query = `MATCH (n) WHERE ID(n) = toInteger({id}) DELETE n`;

        var session = db.session();

        try{

            var result = await session.writeTransaction(function (transaction) {      
                var result = transaction.run(query, {id: id});
                return result;
            });

            session.close();

            console.log('result:', result);
            console.log('result.records:', result.records);

        }catch(error){
            console.log(error);
            throw error;
        }

    }

    async save() {

        var self = this;
        var db = this.constructor.db;

        var q = [];
        var properties = self.getProperties();

        for(var i in properties){
            q.push(i + ":{" + i + "}")
        }

        q = q.join(", ");

        var query = `CREATE (n:${self.constructor.name} { ${q} }) RETURN n`;

        var session = db.session();

        try{

            var result = await session.writeTransaction(function (transaction) {                
                var result = transaction.run(query, self.getProperties());
                return result;
            });

            session.close();

            if(result.records.length == 0)
                throw new Error('Object not saved');

            var record = result.records[0].get("n");

            var obj = {
                id: record.identity.toString(),
                properties: record.properties,
                labels: record.labels
            }

            self.id = obj.id;

            return obj;

        }catch(error){
            console.log(error);
            throw error;
        }

    }

}