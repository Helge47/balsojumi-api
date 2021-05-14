import { Motion } from "../entities";
import { Service } from "typedi";
import { InjectRepository } from "typeorm-typedi-extensions";
import { Repository } from "typeorm";

@Service()
export class MotionService {
    constructor(
        @InjectRepository(Motion) private readonly motionRepository: Repository<Motion>,
    ) { }

    async updateMotions() {

    };
}