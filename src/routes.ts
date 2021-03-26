/*
import { ErrorRequestHandler, Router } from 'express';
import { getDeputyData, getDeputyDataById } from './controllers/deputy-controller';
import { getSittingData, getSittingDataById, getProposalsBySittingId } from './controllers/sitting-controller';
import { getProposalDataById, getVotesByProposalId } from './controllers/proposal-controller';

const router = Router();
router.get('/', (req, res) => {
    res.send('Welcome!');
});

router.get('/deputies', getDeputyData);
router.get('/deputies/:id', getDeputyDataById);
router.get('/sittings', getSittingData);
router.get('/sittings/:id', getSittingDataById);
router.get('/sittings/:id/proposals', getProposalsBySittingId)
router.get('/proposals/:id', getProposalsBySittingId);
router.get('/proposals/:id/votes', getVotesByProposalId);

const catchErrors: ErrorRequestHandler = (err, req, res, next) => {
    // todo: categorize errors and think of appropriate error messages
    res.status(500).send({ success: false, error: err });
};

router.use(catchErrors);

export default router;*/