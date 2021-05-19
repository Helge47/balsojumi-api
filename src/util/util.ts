
const symbols = [
    { find: '%20', replacement: ' ' },
    { find: '&nbsp;', replacement: ' ' },
    { find: '%E2%80%9C', replacement: '«' },
    { find: '%E2%80%9D', replacement: '»' },
    { find: '&#8220;', replacement: '«' },
    { find: '&#8221;', replacement: '»' },

    { find: '&#256;', replacement: 'Ā' },
    { find: '&#257;', replacement: 'ā' },
    { find: '%C4%80', replacement: 'Ā' },
    { find: '%C4%81', replacement: 'ā' },

    { find: '&#268;', replacement: 'Č' },
    { find: '&#269;', replacement: 'č' },
    { find: '%C4%8C', replacement: 'Č' },
    { find: '%C4%8D', replacement: 'č' },

    { find: '&#274;', replacement: 'Ē' },
    { find: '&#275;', replacement: 'ē' },
    { find: '%C4%92', replacement: 'Ē' },
    { find: '%C4%93', replacement: 'ē' },

    { find: '&#290;', replacement: 'Ģ' },
    { find: '&#291;', replacement: 'ģ' },
    { find: '%C4%A2', replacement: 'Ģ' },
    { find: '%C4%A3', replacement: 'ģ' },

    { find: '&#298;', replacement: 'Ī' },
    { find: '&#299;', replacement: 'ī' },
    { find: '%C4%AA', replacement: 'Ī' },
    { find: '%C4%AB', replacement: 'ī' },

    { find: '&#310;', replacement: 'Ķ' },
    { find: '&#311;', replacement: 'ķ' },
    { find: '%C4%B6', replacement: 'Ķ' },
    { find: '%C4%B7', replacement: 'ķ' },

    { find: '&#315;', replacement: 'Ļ' },
    { find: '&#316;', replacement: 'ļ' },
    { find: '%C4%BB', replacement: 'Ļ' },
    { find: '%C4%BC', replacement: 'ļ' },

    { find: '&#325;', replacement: 'Ņ' },
    { find: '&#326;', replacement: 'ņ' },
    { find: '%C5%85', replacement: 'Ņ' },
    { find: '%C5%86', replacement: 'ņ' },
    
    { find: '&#352;', replacement: 'Š' },
    { find: '&#353;', replacement: 'š' },
    { find: '%C5%A0', replacement: 'Š' },
    { find: '%C5%A1', replacement: 'š' },

    { find: '&#362;', replacement: 'Ū' },
    { find: '&#363;', replacement: 'ū' },
    { find: '%C5%AA', replacement: 'Ū' },
    { find: '%C5%AB', replacement: 'ū' },

    { find: '&#381;', replacement: 'Ž' },
    { find: '&#382;', replacement: 'ž' },
    { find: '%C5%BD', replacement: 'Ž' },
    { find: '%C5%BE', replacement: 'ž' },
];

export const fixLatvianString = (s: string) => {
    for (const i in symbols) {
        const regex = new RegExp(symbols[i].find, 'g');
        s = s.replace(regex, symbols[i].replacement);
    }

    try {
        s = decodeURIComponent(s);
    } catch(e) {
    }

    return s;
};

export const convertDate = (date: string) => {
    const [ day, month, year ] = date.split('.');
    return year + '-' + month + '-' + day;
};

export const convertDateTime = (datetime: string) => {
    const [ date, time ] = datetime.split(' ');

    return convertDate(date) + ' ' + time;
};