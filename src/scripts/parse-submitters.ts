import { createConnection } from "typeorm";
import { Motion } from "../entities";

const main = async () => {
    await createConnection();
    const motions = await Motion.find();
    
    for (const i in motions) {
        const m = motions[i];

        if (m.submitters === '') {
            if (m.title.includes('pilsoņu kolektīvā')) {
                console.log('DA POEPLE');
            } else {
                console.log('no submitters specified', m.number);
            }
        } else if (m.submitters.includes('komisija')) {
            console.log('commission', m.submitters);
        } else {
            console.log('deputies', m.submitters.replace('Deputāti ', '').split(', '));
        }
    }
};

main();
