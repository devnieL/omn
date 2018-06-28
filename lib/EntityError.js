export default class EntityError extends Error {
    constructor(...args) {
        console.log('args:', args);
        super(...args);
        Error.captureStackTrace(this, EntityError);
    }
}