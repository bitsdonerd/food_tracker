export class InternalServerError extends Error {
    constructor({ cause, statusCode }) {
        super("An unexpected internal error occurred.", {
            cause,
        });
        this.name = "InternalServerError";
        this.action = "Please contact technical support.";
        this.statusCode = statusCode || 500;
    }
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            action: this.action,
            status_code: this.statusCode,
        };
    }
}

export class ServiceError extends Error {
    constructor({ cause, message }) {
        super(message || "Service currently unavailable.", { cause });
        this.name = "ServiceError";
        this.action = "Check if the service is currently available.";
        this.statusCode = 503;
    }
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            action: this.action,
            status_code: this.statusCode,
        };
    }
}

export class MethodNotAllowedError extends Error {
    constructor() {
        super("Method not allowed for this endpoint.");
        this.name = "MethodNotAllowedError";
        this.action = "Verify if the HTTP method is valid for this endpoint.";
        this.statusCode = 405;
    }
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            action: this.action,
            status_code: this.statusCode,
        };
    }
}

export class ForbiddenError extends Error {
    constructor() {
        super("You do not have permission to access this action.");
        this.name = "ForbiddenError";
        this.action =
            "Provide a valid authentication token with the required permissions.";
        this.statusCode = 403;
    }
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            action: this.action,
            status_code: this.statusCode,
        };
    }
}

export class ValidationError extends Error {
    constructor({ cause, message, action }) {
        super(message || "An validation error occurred.", { cause });
        this.name = "ValidationError";
        this.action = action || "Please check the provided data and try again.";
        this.statusCode = 400;
    }
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            action: this.action,
            status_code: this.statusCode,
        };
    }
}

export class NotFoundError extends Error {
    constructor({ cause, message, action }) {
        super(message || "This feature could not be found in the system.", {
            cause,
        });
        this.name = "NotFoundError";
        this.action = action || "Please check the data and try again.";
        this.statusCode = 404;
    }
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            action: this.action,
            status_code: this.statusCode,
        };
    }
}

export class UnauthorizedError extends Error {
    constructor({ cause, message, action }) {
        super(message || "Unauthorized access.", {
            cause,
        });
        this.name = "UnauthorizedError";
        this.action = action || "Please check your input data and try again";
        this.statusCode = 401;
    }
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            action: this.action,
            status_code: this.statusCode,
        };
    }
}