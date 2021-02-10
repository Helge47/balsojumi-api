import express from 'express';
import helmet from 'helmet';
import 'reflect-metadata';
import routes from './routes';
import bodyParser from 'body-parser';
import { createConnection } from 'typeorm';

const app = express();
const port = 3001;
const FRONTEND_URI = 'http://localhost:3000';
createConnection();

app.use(helmet());

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', FRONTEND_URI);
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

    //dev only
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
});

//TODO: separate body-parser middlewares by routes
app.use(bodyParser.json());

app.use(routes);

app.listen(port, () => {
    console.log('server started on http://localhost:' + port);
});
