import { Service } from "typedi";
import cron from 'node-cron';
import { DeputyService } from "./deputy-service";
import { MotionService } from "./motion-service";
import { SittingService } from "./sitting-service";
import { VoteService } from "./vote-service";
import { StatisticsService } from "./statistics-service";
import { LoggingService } from "./logging-service";

const EVERY_MORNING = '* * 8 * * * *';
const EVERY_NIGHT = '* * 2 * * * *';
const EVERY_HOUR  = '* 0 * * * * *';

@Service()
export class CronService {
    constructor(
        private readonly deputyService: DeputyService,
        private readonly motionService: MotionService,
        private readonly sittingService: SittingService,
        private readonly voteService: VoteService,
        private readonly statisticsService: StatisticsService,
        private readonly logger: LoggingService,
    ) {}

    setup() {
        this.logger.log('Setting up cron tasks');

        cron.schedule(EVERY_MORNING, async () => {
            this.logger.log('Running daily morning tasks');
            await this.deputyService.run();
            this.logger.log('Morning tasks done!');
        });

        cron.schedule(EVERY_NIGHT, async () => {
            this.logger.log('Running daily night tasks');
            this.logger.log('Night tasks done!');
        });

        cron.schedule(EVERY_HOUR, async () => {
            this.logger.log('Running hourly tasks');
            await this.motionService.run();
            await this.sittingService.run();
            await this.voteService.run();
            await this.statisticsService.run();
            this.logger.log('Hourly tasks done!');
        });

        this.logger.log('Finished cron task setup!');
    }
};