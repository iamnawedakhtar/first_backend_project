class ApiErrors extends Error {
    constructor(statuscode, message = "something went wrong", errors = [], stack = "") {
        super(message);
        
        this.statuscode = statuscode;
        this.data = null;
        this.message = message;
        this.success = false;
        this.errors = errors;

        if (stack) {
           this.stack = stack;
        } else {
           Error.stackTraceLimit = 10; // Set stackTraceLimit to desired value
           Error.captureStackTrace(this, this.constructor);
        }
    }
}
export { ApiErrors };
