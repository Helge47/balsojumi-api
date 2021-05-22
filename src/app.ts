import 'reflect-metadata';
import * as TypeORM from 'typeorm';
import * as TypeGraphQL from 'type-graphql';
import { Container } from 'typedi';
import { ApolloServer } from 'apollo-server';
import { DeputyResolver } from './resolvers/deputy-resolver';
import { SittingResolver } from './resolvers/sitting-resolver';
import { MotionResolver } from './resolvers/motion-resolver';
import { FactionResolver } from './resolvers/faction-resolver';
import { CronService } from './services/cron-service';
import { DeputyService } from './services/deputy-service';
import { SittingService } from './services/sitting-service';
import { MotionService } from './services/motion-service';

const port = 3001;
TypeORM.useContainer(Container);

async function bootstrap() {
    try {
        await TypeORM.createConnection();

        const schema = await TypeGraphQL.buildSchema({
            resolvers: [ DeputyResolver, FactionResolver, SittingResolver, MotionResolver ],
            container: Container,
        });

        const server = new ApolloServer({ schema });

        const { url } = await server.listen(port);
        console.log('Server started at ' + url);

        await Container.get(MotionService).parseDocs();
        await Container.get(SittingService).run();
        //cronService.setup();

    } catch (err) {
        console.error(err);
    }
}

bootstrap();
