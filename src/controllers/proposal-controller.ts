/*import { RequestHandler } from "express";
import { Proposal } from "../entities";

const getProposalDataById: RequestHandler = async (req, res) => {
    if (req.params.id === undefined) {
        return res.send({ success: false, error: 'No id provided' });
    }

    const proposal = await Proposal.findOne(parseInt(req.params.id));

    return res.send({ success: true, data: proposal });
};

const getVotesByProposalId: RequestHandler = async (req, res) => {
    if (req.params.id === undefined) {
        return res.send({ success: false, error: 'No id provided' });
    }

    const proposal = await Proposal.findOne(parseInt(req.params.id), { relations: [ 'votes', 'votes.deputy' ] });
    const votes = proposal.votes;

    return res.send({ success: true, data: votes }Т
}

export { getProposalDataById, getVotesByProposalId };*/