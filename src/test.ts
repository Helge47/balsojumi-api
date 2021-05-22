import 'reflect-metadata';
import * as TypeORM from 'typeorm';
import { Container } from 'typedi';
import { DeputyService } from './services/deputy-service';
import { MotionService } from './services/motion-service';
import { SittingService } from './services/sitting-service';
import { VoteService } from './services/vote-service';
import { StatisticsService } from './services/statistics-service';

TypeORM.useContainer(Container);

async function bootstrap() {
    try {
        await TypeORM.createConnection();

        const service = Container.get(StatisticsService);
        await service.run();
    } catch (err) {
        console.error(err);
    }

    process.exit();
}

bootstrap();
