import { createRouter } from "next-connect";
import controller from "infra/controller";
import migrator from "models/migrator";
import AuthMiddleware from "infra/auth_middleware";

const router = createRouter();

router.use(AuthMiddleware);
router.get(getHandler);
router.post(postMigrationsHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
    const pendingMigrations = await migrator.listPendingMigrations();
    return response.status(200).json(pendingMigrations);
}

async function postMigrationsHandler(request, response) {
    const migratedMigrations = await migrator.runPendingMigrations();

    if (migratedMigrations.length > 0) {
        return response.status(200).json(migratedMigrations);
    }

    return response.status(200).json(migratedMigrations);
}