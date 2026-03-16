import { ForbiddenError } from "./errors";

export default function authMiddleware(request, response, next) {
    if (request.headers["x-test-auth"] === "fail") {
        throw new ForbiddenError("Simulating a blocked anonymous user for tests.")
    }

    return next();
}