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

    async save() {

        console.log("SAVE OBJECT");

        var self = this;
        var db = this.constructor.db;

        var q = [];
        var properties = self.getProperties();

        for(var i in properties){
            q.push(i + ":{" + i + "}")
        }

        q = q.join(", ");

        var query = `CREATE (n:${self.constructor.name} { ${q} }) RETURN n`;

        console.log("query:", query);
        console.log("parameters:", self.getProperties());

        var session = db.session();

        try{

            // It is possible to execute write transactions that will benefit from automatic retries
            // on both single instance ('bolt' URI scheme) and Causal Cluster ('bolt+routing' URI scheme)
            var result = await session.writeTransaction(function (transaction) {
                // used transaction will be committed automatically, no need for explicit commit/rollback
                
                
                var result = transaction.run(query, self.getProperties());
                
                // at this point it is possible to either return the result or process it and return the
                // result of processing it is also possible to run more statements in the same transaction
                return result;
            });

            session.close();

            var record = result.records[0].get("n");
            console.log(record);
            console.log(record.identity.toString());

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