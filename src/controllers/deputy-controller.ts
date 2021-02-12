import { RequestHandler } from "express";
import { Deputy } from "../entities";

const getDeputyData: RequestHandler = async (req, res) => {
    const deputies = await Deputy.find();
    
    return res.send({ success: true, data: deputies });
};

const getDeputyDataById: RequestHandler = async (req, res) => {
    if (req.params.id === undefined) {
        return res.send({ success: false, error: 'No id provided' });
    }

    const deputy = await Deputy.findOne(parseInt(req.params.id));

    return res.send({ success: true, data: deputy });
};

export { getDeputyData, getDeputyDataById };