import { Deputy } from "../entities";
import { createConnection } from "typeorm";
import axios from "axios";
import path from 'path';
import fs from 'fs';

const main = async () => {
    await createConnection();
    const deputies = await Deputy.find({ relations: ['records'] });
    const basePath = path.resolve(__dirname, '..', '..', 'static', 'photo');

    for (const i in deputies) {
        const d = deputies[i];
        const record = d.records.find(r => r.parliamentNumber === '13');
        const url = 'https://titania.saeima.lv/personal/deputati/saeima13_depweb_public.nsf/0/' + record.uid + '/Foto/0.84?OpenElement&FieldElemFormat=jpg';
        const response = await axios.get(url, { responseType: 'stream' });
        const writeStream = fs.createWriteStream(path.resolve(basePath, d.id.toString() + '.jpg'));
        response.data.pipe(writeStream);
        writeStream.on('finish', () => console.log('downloaded', d.surname));
    }
};

main();