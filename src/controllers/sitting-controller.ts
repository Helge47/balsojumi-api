/*import { RequestHandler } from "express";
import { Sitting } from "../entities";

const getSittingData: RequestHandler = async (req, res) => {
    const sittings = await Sitting.find({ relations: [ 'proposals' ]});

    console.log(sittings);
    
    return res.send({ success: true, data: sittings });
};

const getSittingDataById: RequestHandler = async (req, res) => {
    if (req.params.id === undefined) {
        return res.send({ success: false, error: 'No id provided' });
    }

    const sitting = await Sitting.findOne(parseInt(req.params.id), { relations: [ 'proposals' ] });

    return res.send({ success: true, data: sitting });
};

const getProposalsBySittingId: RequestHandler = async (req, res) => {
    if (req.params.id === undefined) {
        return res.send({ success: false, error: 'No id provided' });
    }

    const sitting = await Sitting.findOne(
        parseInt(req.params.id),
        { relations: [ 'proposals' ] }
    );
    const proposals = sitting.proposals;

    return res.send({ success: true, data: proposals || 'no' });
};

export { getSittingData, getSittingDataById, getProposalsBySittingId };*/