import 'reflect-metadata';
import * as TypeORM from 'typeorm';
import * as TypeGraphQL from 'type-graphql';
import { Container } from 'typedi';
import { ApolloServer } from 'apollo-server';
import { DeputyResolver } from './resolvers/deputy-resolver';

const port = 3001;
TypeORM.useContainer(Container);

async function bootstrap() {
    try {
        await TypeORM.createConnection();

        const schema = await TypeGraphQL.buildSchema({
            resolvers: [ DeputyResolver ],
            container: Container,
        });

        const server = new ApolloServer({ schema });

        const { url } = await server.listen(port);
        console.log('Server started at ' + url);
    } catch (err) {
        console.error(err);
    }
}

bootstrap();
