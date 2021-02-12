import { ErrorRequestHandler, Router } from 'express';
import { getDeputyData, getDeputyDataById } from './controllers/deputy-controller';

const router = Router();
router.get('/', (req, res) => {
    res.send('Welcome!');
});
router.get('/deputies', getDeputyData);
router.get('/deputies/:id', getDeputyDataById);

const catchErrors: ErrorRequestHandler = (err, req, res, next) => {
    // todo: categorize errors and think of with appropraite error messages
    res.status(500).send({ success: false, error: err });
};

router.use(catchErrors);

export default router;