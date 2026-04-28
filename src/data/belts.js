export const FOERDERBAENDER = [
  { id: 'keins', name: 'Kein Band',              nameEn: 'No Belt',               durchsatz: null  },
  { id: 'gelb',  name: 'Gelbes Band (15/s)',      nameEn: 'Transport Belt (15/s)',  durchsatz: 15    },
  { id: 'rot',   name: 'Rotes Band (30/s)',        nameEn: 'Fast Belt (30/s)',       durchsatz: 30    },
  { id: 'blau',  name: 'Blaues Band (45/s)',       nameEn: 'Express Belt (45/s)',    durchsatz: 45    },
  { id: 'turbo', name: 'Turbo-Band (60/s)',        nameEn: 'Turbo Belt (60/s)',      durchsatz: 60    },
];

export const FOERDERBAENDER_MAP = Object.fromEntries(FOERDERBAENDER.map(b => [b.id, b]));

export const BELT_FARBE = {
  gelb:  'text-yellow-400',
  rot:   'text-red-400',
  blau:  'text-blue-400',
  turbo: 'text-purple-400',
};
