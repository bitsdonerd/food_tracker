import { createRouter } from "next-connect";
import database from "infra/database";
import controller from "infra/controller";

const router = createRouter();

router.get(getHandler);

async function getHandler(request, response) {
    const updatedAt = new Date().toISOString();

    const databaseVersionRsult = await database.query("SHOW server_version;");

    const databaseVersionValue = databaseVersionRsult.rows[0].server_version;

    const databaseMaxConnectionsResult = await database.query("SHOW max_connections;");

    const postgresConnection = databaseMaxConnectionsResult.rows[0].max_connections;

    const databaseName = process.env.POSTGRES_DB;

    const databaseOpenedConnectionsResult = await database.query({
        text: "SELECT count(*) FROM pg_stat_activity WHERE datname = $1;",
        values: [databaseName],
    });

    const databaseOpenedConnections = databaseOpenedConnectionsResult.rows[0].count;

    response.status(200).json({
        updatedAt: updatedAt,
        dependencies: {
            database: {
                version: databaseVersionValue,
                maxConnections: postgresConnection,
                openedConnections: databaseOpenedConnections,
            },
        },
    });
}