// Fictional leader and party names (no real persons). Culture banks are loose regional flavours.
const BANKS = {
  latin: {
    first: ['Alvaro', 'Beatriz', 'Camilo', 'Daniela', 'Esteban', 'Fabiola', 'Gael', 'Helena', 'Ignacio', 'Julia', 'Lucas', 'Marisol'],
    last: ['Montero', 'Valdez', 'Ferrer', 'Quintana', 'Carvalho', 'Ibarra', 'Salas', 'Mendoza', 'Rivas', 'Duarte'],
  },
  anglo: {
    first: ['Edward', 'Margaret', 'Oliver', 'Hannah', 'Gavin', 'Rosalind', 'Warren', 'Eleanor', 'Nathan', 'Clara', 'Silas', 'Imogen'],
    last: ['Ashcroft', 'Whitlock', 'Garrick', 'Holloway', 'Thornbury', 'Hale', 'Marlowe', 'Pemberton', 'Radley', 'Sutton'],
  },
  euro: {
    first: ['Anselm', 'Brigitte', 'Casimir', 'Dorota', 'Emil', 'Freya', 'Gustav', 'Ilse', 'Jonas', 'Katarina', 'Leopold', 'Mira'],
    last: ['Brandt', 'Novak', 'Lindqvist', 'Kovacs', 'Hartmann', 'Varga', 'Sorensen', 'Petrescu', 'Janssen', 'Moreau'],
  },
  slavic: {
    first: ['Aleksei', 'Bogdana', 'Dmitri', 'Elena', 'Fedor', 'Galina', 'Igor', 'Kira', 'Lev', 'Marta', 'Nikolai', 'Oksana'],
    last: ['Voronin', 'Kuzmin', 'Orlov', 'Belov', 'Zhdanov', 'Lazarev', 'Sokolov', 'Tarasov', 'Melnik', 'Romanov'],
  },
  arabic: {
    first: ['Amir', 'Basma', 'Faisal', 'Ghada', 'Hakim', 'Ibtisam', 'Jamal', 'Karima', 'Lutfi', 'Maysa', 'Nadir', 'Rania'],
    last: ['al-Rashid', 'Haddad', 'Mansour', 'Khalil', 'Qadir', 'Nasser', 'Farouk', 'Saleh', 'Tamimi', 'Zayed'],
  },
  turkic: {
    first: ['Arslan', 'Bahar', 'Cem', 'Dilara', 'Emre', 'Gulnara', 'Kenan', 'Leyla', 'Murat', 'Nazira', 'Oktay', 'Selin'],
    last: ['Aydin', 'Karimov', 'Demir', 'Nurlan', 'Sultanov', 'Yilmaz', 'Orazov', 'Kaya', 'Baysal', 'Temirov'],
  },
  persian: {
    first: ['Arash', 'Bahareh', 'Dariush', 'Elham', 'Farhad', 'Golnar', 'Hamid', 'Kian', 'Laleh', 'Mehran', 'Neda', 'Parviz'],
    last: ['Shirazi', 'Kazemi', 'Rostami', 'Tehrani', 'Farzan', 'Jahani', 'Mirza', 'Sadeghi', 'Amini', 'Zand'],
  },
  indic: {
    first: ['Aarav', 'Bhavna', 'Chetan', 'Deepa', 'Ishaan', 'Kavita', 'Lakshman', 'Meera', 'Nikhil', 'Pooja', 'Rohan', 'Sunita'],
    last: ['Mehra', 'Iyer', 'Banerjee', 'Chauhan', 'Desai', 'Nair', 'Rao', 'Sethi', 'Verma', 'Qureshi'],
  },
  sinic: {
    first: ['Wei', 'Lian', 'Hao', 'Mei', 'Jun', 'Xiu', 'Tao', 'Yan', 'Bo', 'Ning', 'Kai', 'Shu'],
    last: ['Zhao', 'Lin', 'Qiao', 'Xu', 'Tang', 'Fang', 'Gu', 'Shen', 'Han', 'Luo'],
  },
  nippon: {
    first: ['Haruki', 'Aiko', 'Kenji', 'Sakura', 'Daichi', 'Emi', 'Ren', 'Yuna', 'Takeshi', 'Noriko', 'Shun', 'Mio'],
    last: ['Okabe', 'Hasegawa', 'Mori', 'Kuroda', 'Fujiwara', 'Narita', 'Ishikawa', 'Sakai', 'Tachibana', 'Yamane'],
  },
  sea: {
    first: ['Arief', 'Budi', 'Citra', 'Dewi', 'Hendra', 'Intan', 'Joko', 'Kusuma', 'Lestari', 'Minh', 'Nong', 'Somchai'],
    last: ['Santoso', 'Wijaya', 'Pham', 'Nguyen', 'Chaiyo', 'Dela Cruz', 'Aquino', 'Rahman', 'Tan', 'Lim'],
  },
  african: {
    first: ['Adaeze', 'Babatunde', 'Chidi', 'Dumisani', 'Efua', 'Folasade', 'Kofi', 'Lindiwe', 'Mamadou', 'Nia', 'Obinna', 'Thandi'],
    last: ['Okafor', 'Mensah', 'Diallo', 'Nkosi', 'Abara', 'Traore', 'Kamau', 'Bello', 'Mwangi', 'Sow'],
  },
  oceanic: {
    first: ['Tane', 'Moana', 'Ruben', 'Aroha', 'Kalani', 'Mere', 'Sione', 'Leilani', 'Rawiri', 'Anika'],
    last: ['Ngata', 'Walker', 'Tuilagi', 'Kauhane', 'Reid', 'Tamihana', 'Falaniko', 'Baker'],
  },
};
const REGION_BANK = {
  north_america: 'anglo',
  caribbean: 'latin',
  south_america: 'latin',
  western_europe: 'euro',
  northern_europe: 'euro',
  southern_europe: 'euro',
  eastern_europe: 'slavic',
  russia: 'slavic',
  central_asia: 'turkic',
  middle_east: 'arabic',
  north_africa: 'arabic',
  west_africa: 'african',
  central_africa: 'african',
  east_africa: 'african',
  southern_africa: 'african',
  south_asia: 'indic',
  east_asia: 'sinic',
  southeast_asia: 'sea',
  oceania: 'oceanic',
};
const ISO_BANK = {
  JPN: 'nippon',
  IRN: 'persian',
  AFG: 'persian',
  TJK: 'persian',
  TUR: 'turkic',
  GBR: 'anglo',
  IRL: 'anglo',
  AUS: 'anglo',
  NZL: 'oceanic',
  CAN: 'anglo',
  ESP: 'latin',
  PRT: 'latin',
  KOR: 'sinic',
  PRK: 'sinic',
  TWN: 'sinic',
  MNG: 'turkic',
  ISR: 'euro',
  MEX: 'latin',
  ETH: 'african',
  SOM: 'arabic',
  SDN: 'arabic',
  MDG: 'sea',
};
export function bankFor(iso, region) {
  return BANKS[ISO_BANK[iso] || REGION_BANK[region] || 'euro'];
}
export function leaderName(rng, iso, region) {
  const b = bankFor(iso, region);
  return `${rng.pick(b.first)} ${rng.pick(b.last)}`;
}
const PARTY_STEMS = {
  left: ['Social Democratic Alliance', "Workers' Front", 'Labour Union Party', "People's Solidarity"],
  center_left: ['Progressive Coalition', 'Reform Movement', 'Civic Forward', 'Liberal Union'],
  center_right: ['Christian Civic Party', 'National Conservative Union', 'Heritage Party', 'Democratic Centre'],
  right: ['Patriotic Front', 'Free Enterprise Party', 'Order and Growth Party', 'National Rally'],
  green: ['Green Future', 'Ecological Alliance'],
  populist: ["People's Renewal", 'Sovereign Movement', 'Voice of the Nation'],
  ruling: ['National Unity Party', 'Party of Renewal', 'Revolutionary Front', 'Directorate', 'Council of Guardians'],
};
export function partyName(rng, kind) {
  return rng.pick(PARTY_STEMS[kind] || PARTY_STEMS.ruling);
}
