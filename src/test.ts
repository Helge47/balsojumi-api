import 'reflect-metadata';
import * as TypeORM from 'typeorm';
import { Container } from 'typedi';
import { DeputyService } from './services/deputy-service';
import { MotionService } from './services/motion-service';
import { SittingService } from './services/sitting-service';

TypeORM.useContainer(Container);

async function bootstrap() {
    try {
        await TypeORM.createConnection();

        const service = Container.get(SittingService);
        await service.updateSittings();
    } catch (err) {
        console.error(err);
    }

    process.exit();
}

bootstrap();