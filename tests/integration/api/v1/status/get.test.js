import test from "node:test";
import orchestrator from "tests/orchestrator";
import { describe } from "yargs";

beforeAll(async () => {
    await orchestrator.waitForAllServices();
})

describe("GET /api/v1/status", () => {
    describe("Annonymous user", () => {
        test("Retrieving current system status", async () => {
            const response = await fetch("http://localhost:3000/api/v1/status");
            expect(response.status).toBe(200);

            const responseBody = await response.json();

            const parsedUpdatedAt = new Date(responseBody.updatedAt).toISOString();
            expect(responseBody).toEqual(parsedUpdatedAt);

            expect(responseBody.dependencies.database.version).toEqual("16.0");
            expect(responseBody.dependencies.database.maxConnections).toEqual(100);
            expect(responseBody.dependencies.database.openedConnections).toEqual(1);
        })
    })
})