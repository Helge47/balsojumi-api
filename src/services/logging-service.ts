import { Service } from "typedi";

@Service()
export class LoggingService {
    log(...args: any[]) {
        console.log(args, Date.now());
    }

    error(...args: any[]) {
        console.error(args, Date.now());
    }

    warn(...args: any[]) {
        console.warn(args, Date.now());
    }
}