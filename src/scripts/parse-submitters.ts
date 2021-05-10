import { createConnection } from "typeorm";
import { Motion } from "../entities";

const main = async () => {
    await createConnection();
    const motions = await Motion.find();
    
    for (const i in motions) {
        const m = motions[i];

        if (m.submittersText === '') {
            if (m.title.includes('pilsoņu kolektīvā')) {
                console.log('the people!!!');
            } else {
                console.log('no submitters specified', m.number);
            }
        } else if (m.submittersText.includes('komisija')) {
            console.log('commission', m.submittersText);
        } else {
            console.log('deputies', m.submittersText.replace('Deputāti ', '').split(', '));
        }
    }
};

main();
