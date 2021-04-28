import { Sitting } from '../entities';
import { createConnection } from 'typeorm';
import axios from 'axios';
import Deputy from '../entities/Deputy';
import { convertDateTime, fixLatvianString } from './util';
import AttendanceRegistration from '../entities/AttendanceRegistration';

const votingRegex = /addVotesLink\("(.*)","(.*)"(,".*"){3}\);/gm;
const attendanceRegex = /drawDKP_UT\("","","Deputātu klātbūtnes reģistrācija","","","(?<uid>.*?)"/gm;
const votesRegex = /voteFullListByNames=\["(.*)"\];/gm;
const votingDateRegex = /Datums: <\/span><b>(?<datetime>.*?)<\/b>/gm;
const separator = '�';

const processSitting = async (sitting: Sitting) => {
    const url = 'https://titania.saeima.lv/LIVS13/SaeimaLIVS2_DK.nsf/DK?ReadForm&nr=' + sitting.saeimaUid;
    const response = await axios.get(url);
    const page = fixLatvianString(response.data);

    const votingUids: { motionUid: string, uid: string }[] = [];
    let match;

    while (match = votingRegex.exec(page)) {
        const motionUid = match[1];
        const votingUid = match[2];

        if (!votingUids.some(v => v.motionUid === motionUid && v.uid === votingUid)) {
            votingUids.push({ motionUid: motionUid, uid: votingUid });
        }
    }
    votingRegex.lastIndex = 0;
    console.log('votings', votingUids);
    sitting.attendanceRegistrations = [];

    while (match = attendanceRegex.exec(page)) {
        const { uid } = match.groups;
        const votingUid = votingUids.find(v => v.motionUid === uid).uid;
        console.log({ uid, votingUid });
        const votingUrl = 'https://titania.saeima.lv/LIVS13/SaeimaLIVS2_DK.nsf/0/' + votingUid;
        const registration = await processRegistration(votingUrl);
        sitting.attendanceRegistrations.push(registration);
    }
    attendanceRegex.lastIndex = 0;

    await sitting.save();
};

const processRegistration = async (url: string) => {
    console.log(url);
    const response = await axios.get(url);
    const page: string = response.data;

    const deputies: Deputy[] = await Deputy.find();
    const match = votesRegex.exec(page);
    votesRegex.lastIndex = 0;

    if (match === null || match[1] === '') {
        throw 'no vote data';
    }

    const { datetime } = votingDateRegex.exec(page).groups;
    votingDateRegex.lastIndex = 0;

    const r = new AttendanceRegistration();
    r.date = convertDateTime(datetime);
    r.attendees = [];
    r.absentees = [];

    const voteData = match[1].split('","');
    for (const i in voteData) {
        const [ orderNumber, name, partyName, voteType ] = voteData[i].split(separator);
        const fixedName = fixLatvianString(name);
        const fixedFaction = fixLatvianString(partyName);

        const deputy = deputies.find(d => {
            return fixedName.includes(d.surname) && fixedName.includes(d.name);
        });

        if (deputy === undefined) {
            console.error('Deputy not found: ' + fixedName);
            process.exit();
        }

        if (voteType.includes('Ne')) {
            r.absentees.push(deputy);
        } else {
            r.attendees.push(deputy);
        }
    }

    console.log('registration parsed', r);
    return r.save();
};

const processAll = async () => {
    await createConnection();
    const sittings = await Sitting.find({
        order: { id: 'ASC' },
        relations: [ 'readings', 'readings.motion', 'attendanceRegistrations', 'attendanceRegistrations.absentees', 'attendanceRegistrations.attendees' ]
    });

    for (const i in sittings) {
        const sitting = sittings[i];

        if (sitting.attendanceRegistrations.length > 0) {
            console.log('sitting already has attendance registrations in it, skipping', sitting.id);
        } else {
            console.log('Processing sitting', sitting.id);
            await processSitting(sitting);
            console.log('Sitting processed');
        }
    }

    console.log('All sittings processed');
    process.exit();
};

processAll();