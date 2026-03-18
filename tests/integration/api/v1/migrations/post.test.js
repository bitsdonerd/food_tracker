import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
    await orchestrator.waitForAllServices();
    await orchestrator.clearDatabase();
});

describe("POST /api/v1/migrations", () => {
    describe("Anonymous user", () => {
        test("Should not allow running migrations", async () => {
            const response = await fetch("http://localhost:3000/api/v1/migrations", {
                method: "POST",
                headers: {
                    "X-Test-Auth": "fail",
                },
            });

            expect(response.status).toBe(403);

            const responseBody = await response.json();

            expect(responseBody).toEqual({
                name: "ForbiddenError",
                message: "You do not have permission to access this action.",
                action:
                    "Provide a valid authentication token with the required permissions.",
                status_code: 403,
            });
        });
    });

    describe("Authorized user", () => {
        test("Retrieving pending migrations for the first time", async () => {
            const response1 = await fetch("http://localhost:3000/api/v1/migrations", {
                method: "POST",
            });
            expect(response1.status).toBe(201);
            const response1Body = await response1.json();

            expect(Array.isArray(response1Body)).toEqual(true);
            expect(response1Body.length).toBeGreaterThan(0);
        });

        test("Retrieving pending migrations for the second time", async () => {
            const response2 = await fetch("http://localhost:3000/api/v1/migrations", {
                method: "POST",
            });
            expect(response2.status).toBe(200);
            const response2Body = await response2.json();

            expect(Array.isArray(response2Body)).toEqual(true);
            expect(response2Body.length).toBe(0);
        });
    });
});