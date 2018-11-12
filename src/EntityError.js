export default class EntityError extends Error {
    constructor(...args) {
        super(...args);
        this.code = args[1];
        Error.captureStackTrace(this, EntityError);
    }
}