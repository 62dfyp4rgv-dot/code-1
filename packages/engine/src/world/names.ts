/**
 * Procedural, fictional naming. Nothing here reproduces real clubs or players; coincidental overlaps with real
 * people are possible for common names and are not intentional. Real-world licensed data can replace this module.
 */
import type { Rng } from '../rng';
import type { NameCulture } from '../competition/registry';

interface CultureNames {
  first: string[];
  last: string[];
  placeA: string[];
  placeB: string[];
  suffix: string[];
}

const C: Record<NameCulture, CultureNames> = {
  english: {
    first: ['Oliver', 'Harry', 'Jack', 'Charlie', 'Thomas', 'George', 'Oscar', 'James', 'William', 'Henry', 'Leo', 'Freddie', 'Archie', 'Ethan', 'Lewis', 'Callum', 'Reece', 'Declan', 'Ryan', 'Connor', 'Mason', 'Kyle', 'Jordan', 'Marcus', 'Tyler', 'Liam', 'Noah', 'Jude', 'Ben', 'Sam'],
    last: ['Walker', 'Hughes', 'Bennett', 'Carter', 'Fletcher', 'Holmes', 'Marsh', 'Palmer', 'Reid', 'Shaw', 'Turner', 'Wells', 'Barker', 'Cole', 'Dawson', 'Ellis', 'Foster', 'Grant', 'Hayes', 'Irwin', 'Jarvis', 'Kemp', 'Lowe', 'Mills', 'Nolan', 'Osborne', 'Pearce', 'Quinn', 'Rowe', 'Sutton', 'Tucker', 'Vaughan', 'Webb', 'Yates', 'Booth', 'Chandler'],
    placeA: ['Ash', 'Brook', 'Calder', 'Dun', 'Elm', 'Fair', 'Glen', 'Har', 'Iron', 'King', 'Lang', 'Mill', 'North', 'Oak', 'Pen', 'Quarry', 'Red', 'Stone', 'Thorn', 'Upper', 'West', 'York', 'Black', 'Green', 'High', 'Low', 'Marsh', 'Rock', 'Sand', 'Wood'],
    placeB: ['ford', 'ham', 'ton', 'bury', 'field', 'mouth', 'port', 'wick', 'worth', 'ley', 'dale', 'bridge', 'castle', 'chester', 'gate', 'haven', 'stead', 'vale'],
    suffix: ['United', 'City', 'Town', 'Athletic', 'Rovers', 'Albion', 'Wanderers', 'Rangers', 'County', 'Royals'],
  },
  spanish: {
    first: ['Alejandro', 'Daniel', 'Pablo', 'Javier', 'Sergio', 'Adrián', 'Álvaro', 'Diego', 'Hugo', 'Iván', 'Rubén', 'Marcos', 'Raúl', 'Óscar', 'Gonzalo', 'Mateo', 'Joaquín', 'Nicolás', 'Santiago', 'Emilio', 'Lucas', 'Fernando', 'Cristian', 'Rodrigo', 'Andrés', 'Mauricio', 'Facundo', 'Bruno', 'Tomás', 'Ezequiel'],
    last: ['García', 'Martín', 'López', 'Sánchez', 'Romero', 'Navarro', 'Torres', 'Domínguez', 'Vega', 'Ramos', 'Castro', 'Ortega', 'Rubio', 'Molina', 'Delgado', 'Suárez', 'Herrera', 'Medina', 'Aguilar', 'Campos', 'Iglesias', 'Cabrera', 'Vargas', 'Fuentes', 'Paredes', 'Salas', 'Rojas', 'Peña', 'Montero', 'Bravo', 'Guerrero', 'Soto'],
    placeA: ['San', 'Villa', 'Real', 'Costa', 'Puente', 'Monte', 'Valle', 'Santa', 'Nueva', 'Alto', 'Río', 'Campo', 'Pueblo', 'Sierra', 'Playa', 'Torre'],
    placeB: ['marina', 'alta', 'verde', 'blanca', 'dorada', 'luna', 'sol', 'mar', 'roja', 'nova', 'bella', 'claro', 'sur', 'norte', 'oro', 'leon'],
    suffix: ['CF', 'Deportivo', 'Atlético', 'Racing', 'Unión', 'Club', 'Sporting', 'Athletic'],
  },
  italian: {
    first: ['Luca', 'Marco', 'Matteo', 'Andrea', 'Federico', 'Lorenzo', 'Alessandro', 'Davide', 'Simone', 'Riccardo', 'Gabriele', 'Francesco', 'Stefano', 'Emanuele', 'Nicolò', 'Tommaso', 'Edoardo', 'Giacomo', 'Filippo', 'Antonio', 'Paolo', 'Fabio', 'Claudio', 'Roberto', 'Giorgio', 'Michele', 'Vincenzo', 'Salvatore', 'Daniele', 'Enrico'],
    last: ['Rossi', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco', 'Bruno', 'Gallo', 'Conti', 'De Luca', 'Mancini', 'Costa', 'Giordano', 'Rizzo', 'Lombardi', 'Moretti', 'Barbieri', 'Fontana', 'Santoro', 'Mariani', 'Rinaldi', 'Caruso', 'Ferrara', 'Galli', 'Martini', 'Leone', 'Longo', 'Gentile', 'Vitale'],
    placeA: ['Monte', 'Castel', 'San', 'Porto', 'Villa', 'Torre', 'Val', 'Borgo', 'Ponte', 'Casa', 'Rocca', 'Campo', 'Santa', 'Lago', 'Pietra', 'Colle'],
    placeB: ['bello', 'novo', 'forte', 'chiaro', 'reale', 'alto', 'verde', 'mare', 'nero', 'sole', 'luce', 'grande', 'vecchio', 'sera', 'riva', 'fiore'],
    suffix: ['Calcio', 'Sportiva', 'United', 'Atletico', '1907', 'Virtus', 'Unione', 'FC'],
  },
  german: {
    first: ['Lukas', 'Jonas', 'Felix', 'Maximilian', 'Leon', 'Paul', 'Tim', 'Niklas', 'Jan', 'Florian', 'Moritz', 'Julian', 'David', 'Philipp', 'Sebastian', 'Tobias', 'Matthias', 'Kevin', 'Marvin', 'Benedikt', 'Fabian', 'Dominik', 'Lars', 'Erik', 'Johannes', 'Stefan', 'Christian', 'Daniel', 'Simon', 'Robin'],
    last: ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Hoffmann', 'Schäfer', 'Koch', 'Bauer', 'Richter', 'Klein', 'Wolf', 'Neumann', 'Schwarz', 'Zimmermann', 'Braun', 'Krüger', 'Hartmann', 'Lange', 'Werner', 'Krause', 'Lehmann', 'Köhler', 'Herrmann', 'König', 'Walter', 'Huber', 'Kaiser', 'Fuchs'],
    placeA: ['Ober', 'Nieder', 'Alt', 'Neu', 'Hohen', 'Grün', 'Bad', 'Wald', 'Stein', 'Berg', 'Eisen', 'Rhein', 'Nord', 'Süd', 'Burg', 'Linden'],
    placeB: ['berg', 'burg', 'stadt', 'dorf', 'feld', 'hausen', 'brück', 'heim', 'wald', 'tal', 'see', 'bach', 'au', 'furt'],
    suffix: ['FC', 'SV', 'Sport', 'Eintracht', 'Union', 'Borussia', 'TSV', 'Fortuna'],
  },
  french: {
    first: ['Lucas', 'Hugo', 'Louis', 'Nathan', 'Théo', 'Maxime', 'Antoine', 'Baptiste', 'Clément', 'Romain', 'Thibault', 'Quentin', 'Alexandre', 'Mathieu', 'Florian', 'Yanis', 'Rayan', 'Ousmane', 'Kylian', 'Adrien', 'Valentin', 'Corentin', 'Benjamin', 'Julien', 'Nicolas', 'Damien', 'Sofiane', 'Karim', 'Moussa', 'Ibrahima'],
    last: ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier', 'Morel', 'Girard', 'André', 'Mercier', 'Dupont', 'Lambert', 'Bonnet', 'François', 'Martinez', 'Diallo', 'Traoré', 'Camara'],
    placeA: ['Saint', 'Mont', 'Château', 'Port', 'Val', 'Bel', 'Pont', 'Clair', 'Beau', 'Fontaine', 'Roche', 'Haute', 'Neuve', 'Vieux', 'Bois', 'Lac'],
    placeB: ['mont', 'ville', 'fort', 'val', 'pierre', 'lieu', 'mer', 'rive', 'champ', 'lune', 'bourg', 'court', 'sur', 'ac'],
    suffix: ['FC', 'Olympique', 'Racing', 'Sporting', 'Athletic', 'AS', 'Stade', 'US'],
  },
  portuguese: {
    first: ['João', 'Tiago', 'Diogo', 'Rui', 'Bruno', 'Pedro', 'Rafael', 'André', 'Miguel', 'Nuno', 'Hélder', 'Gonçalo', 'Ricardo', 'Fábio', 'Sérgio', 'Vasco', 'Duarte', 'Filipe', 'Luís', 'Paulo', 'Hugo', 'Rúben', 'Ivo', 'Telmo', 'Cláudio', 'Jorge', 'Manuel', 'Carlos', 'Daniel', 'Márcio'],
    last: ['Silva', 'Santos', 'Ferreira', 'Pereira', 'Oliveira', 'Costa', 'Rodrigues', 'Martins', 'Jesus', 'Sousa', 'Fernandes', 'Gonçalves', 'Gomes', 'Lopes', 'Marques', 'Alves', 'Almeida', 'Ribeiro', 'Pinto', 'Carvalho', 'Teixeira', 'Moreira', 'Correia', 'Mendes', 'Nunes', 'Soares', 'Vieira', 'Monteiro', 'Cardoso', 'Rocha', 'Batista', 'Tavares'],
    placeA: ['Vila', 'Porto', 'Santa', 'Monte', 'Ponte', 'Campo', 'Alto', 'Serra', 'Praia', 'Casa', 'Forte', 'Rio', 'Terra', 'Mar'],
    placeB: ['nova', 'verde', 'branca', 'real', 'seca', 'velha', 'formosa', 'mar', 'sol', 'alegre', 'douro', 'minho', 'lima', 'vista'],
    suffix: ['FC', 'Sporting', 'Académica', 'União', 'Desportivo', 'Atlético', 'Clube'],
  },
  dutch: {
    first: ['Daan', 'Sem', 'Lars', 'Bram', 'Thijs', 'Jesse', 'Ruben', 'Stijn', 'Joris', 'Niels', 'Tim', 'Jelle', 'Mats', 'Teun', 'Wouter', 'Sven', 'Max', 'Koen', 'Dirk', 'Rick', 'Jan', 'Pieter', 'Joost', 'Floris', 'Gijs', 'Milan', 'Noud', 'Finn', 'Luuk', 'Cas'],
    last: ['de Vries', 'van Dijk', 'Bakker', 'Janssen', 'Visser', 'Smit', 'Meijer', 'de Boer', 'Mulder', 'de Groot', 'Bos', 'Vos', 'Peters', 'Hendriks', 'van Leeuwen', 'Dekker', 'Brouwer', 'de Wit', 'Dijkstra', 'Smits', 'de Graaf', 'van der Meer', 'Kuipers', 'Willems', 'Hoekstra', 'Maas', 'Verhoeven', 'Koster', 'Prins', 'Huisman'],
    placeA: ['Oost', 'West', 'Noord', 'Zuid', 'Hoog', 'Laag', 'Nieuw', 'Oud', 'Groen', 'Zand', 'Veen', 'Berg', 'Klein', 'Groot', 'Vlie', 'Maas'],
    placeB: ['dam', 'wijk', 'veld', 'dijk', 'burg', 'stad', 'zand', 'horst', 'water', 'bos', 'hoek', 'meer', 'kerk', 'voort'],
    suffix: ['FC', 'Vitesse', 'SC', 'Sparta', 'Victoria', 'AFC', 'Excelsior', 'DVV'],
  },
  arabic: {
    first: ['Mohammed', 'Ahmed', 'Abdullah', 'Khalid', 'Salem', 'Fahad', 'Nasser', 'Turki', 'Faisal', 'Saud', 'Omar', 'Yousef', 'Hassan', 'Ali', 'Ibrahim', 'Majed', 'Sultan', 'Bandar', 'Rayan', 'Hamad', 'Mansour', 'Waleed', 'Ziad', 'Karim', 'Tariq', 'Mahmoud', 'Mostafa', 'Amr', 'Walid', 'Hatem'],
    last: ['Al-Harbi', 'Al-Otaibi', 'Al-Qahtani', 'Al-Ghamdi', 'Al-Zahrani', 'Al-Shehri', 'Al-Dosari', 'Al-Mutairi', 'Al-Subaie', 'Al-Anazi', 'Al-Maliki', 'Al-Rashid', 'Al-Tamimi', 'Al-Saud', 'Hassan', 'Mansour', 'Khalil', 'Saleh', 'Nasr', 'Farouk', 'Haddad', 'Belhadj', 'Bensaid', 'Mekki', 'Zidane', 'Amrani', 'Idrissi', 'Benali', 'Chaabi', 'Tazi'],
    placeA: ['Al', 'Dar', 'Bahr', 'Najd', 'Hajar', 'Noor', 'Rawda', 'Wadi', 'Sahra', 'Ras', 'Tay', 'Qasr', 'Jabal', 'Nakhl', 'Dira', 'Shams'],
    placeB: ['mansur', 'salam', 'ula', 'tabuk', 'badr', 'jawf', 'khobar', 'riyada', 'amal', 'nasr', 'wahda', 'ittihad', 'taawoun', 'fateh', 'raed', 'safa'],
    suffix: ['FC', 'Club', 'SC', 'Sports Club', 'United', 'Athletic'],
  },
  japanese: {
    first: ['Haruto', 'Yuto', 'Sota', 'Riku', 'Kaito', 'Ren', 'Takumi', 'Daiki', 'Shota', 'Kenta', 'Ryota', 'Yuki', 'Hiroki', 'Naoki', 'Satoshi', 'Kosuke', 'Tomoya', 'Masato', 'Ryo', 'Shun', 'Taiga', 'Hayato', 'Koki', 'Ayumu', 'Genki', 'Keita', 'Junya', 'Tatsuya', 'Eiji', 'Minato'],
    last: ['Sato', 'Suzuki', 'Takahashi', 'Tanaka', 'Watanabe', 'Ito', 'Yamamoto', 'Nakamura', 'Kobayashi', 'Kato', 'Yoshida', 'Yamada', 'Sasaki', 'Yamaguchi', 'Matsumoto', 'Inoue', 'Kimura', 'Hayashi', 'Shimizu', 'Mori', 'Abe', 'Ikeda', 'Hashimoto', 'Ishikawa', 'Maeda', 'Fujita', 'Okada', 'Goto', 'Hasegawa', 'Murakami'],
    placeA: ['Kita', 'Minami', 'Higashi', 'Nishi', 'Shin', 'Ao', 'Taka', 'Naga', 'Fuji', 'Hoku', 'Sakura', 'Tama', 'Kawa', 'Yama', 'Hira', 'Ishi'],
    placeB: ['gawa', 'saki', 'moto', 'yama', 'shima', 'oka', 'hara', 'nari', 'kura', 'mizu', 'tani', 'bashi', 'sawa', 'ura'],
    suffix: ['FC', 'United', 'SC', 'Athletic', 'Reysol', 'Vortis', 'Albireo', 'Gamba'],
  },
  korean: {
    first: ['Min-jun', 'Seo-jun', 'Do-yun', 'Ha-jun', 'Ji-ho', 'Jun-seo', 'Hyun-woo', 'Sung-min', 'Jae-hyun', 'Tae-yang', 'Woo-jin', 'Dong-hyun', 'Ki-hoon', 'Seung-ho', 'Young-jae', 'Hee-chan', 'In-beom', 'Kang-in', 'Min-hyuk', 'Jin-su', 'Sang-woo', 'Chan-ho', 'Joon-ho', 'Hyeon-gyu', 'Bo-gyeom', 'Ui-jo', 'Sun-woo', 'Kyung-won', 'Han-bin', 'Yu-bin'],
    last: ['Kim', 'Lee', 'Park', 'Choi', 'Jung', 'Kang', 'Cho', 'Yoon', 'Jang', 'Lim', 'Han', 'Oh', 'Seo', 'Shin', 'Kwon', 'Hwang', 'Ahn', 'Song', 'Yoo', 'Hong', 'Jeon', 'Ko', 'Moon', 'Yang', 'Son', 'Bae', 'Baek', 'Heo', 'Nam', 'Sim'],
    placeA: ['Dae', 'Han', 'Sung', 'Gang', 'Bu', 'In', 'Su', 'Jeon', 'Gwang', 'Chung', 'Gyeong', 'Ul', 'Pohang', 'Jeju', 'Gim', 'Ansan'],
    placeB: ['gu', 'san', 'ju', 'won', 'cheon', 'nam', 'buk', 'jin', 'do', 'ri', 'sung', 'hae'],
    suffix: ['FC', 'United', 'Dynamos', 'Citizen', 'Athletic', 'Stars'],
  },
  chinese: {
    first: ['Wei', 'Lei', 'Jun', 'Hao', 'Yu', 'Chen', 'Ming', 'Tao', 'Peng', 'Bo', 'Kai', 'Long', 'Feng', 'Jian', 'Lin', 'Xiang', 'Yang', 'Zhi', 'Cheng', 'Rui', 'Qiang', 'Gang', 'Jie', 'Yong', 'Hui', 'Dong', 'Xin', 'Shuai', 'Bin', 'Heng'],
    last: ['Wang', 'Li', 'Zhang', 'Liu', 'Chen', 'Yang', 'Zhao', 'Huang', 'Zhou', 'Wu', 'Xu', 'Sun', 'Hu', 'Zhu', 'Gao', 'Lin', 'He', 'Guo', 'Ma', 'Luo', 'Liang', 'Song', 'Zheng', 'Xie', 'Han', 'Tang', 'Feng', 'Yu', 'Dong', 'Xiao'],
    placeA: ['Bei', 'Nan', 'Dong', 'Xi', 'Shang', 'Xia', 'Tian', 'Chang', 'Guang', 'Hai', 'Jiang', 'Long', 'Qing', 'Yun', 'Fu', 'Jin'],
    placeB: ['jing', 'hai', 'zhou', 'cheng', 'an', 'yang', 'chuan', 'shan', 'he', 'tai', 'ning', 'xing'],
    suffix: ['FC', 'City', 'United', 'Dragons', 'Athletic', 'Phoenix'],
  },
  turkish: {
    first: ['Mehmet', 'Mustafa', 'Ahmet', 'Emre', 'Burak', 'Can', 'Cem', 'Deniz', 'Efe', 'Furkan', 'Hakan', 'İsmail', 'Kerem', 'Murat', 'Onur', 'Ozan', 'Selim', 'Serkan', 'Tolga', 'Umut', 'Yusuf', 'Barış', 'Volkan', 'Arda', 'Berk', 'Kaan', 'Orkun', 'Enes', 'Hasan', 'Gökhan'],
    last: ['Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik', 'Yıldız', 'Yıldırım', 'Öztürk', 'Aydın', 'Özdemir', 'Arslan', 'Doğan', 'Kılıç', 'Aslan', 'Çetin', 'Kara', 'Koç', 'Kurt', 'Özkan', 'Şimşek', 'Polat', 'Korkmaz', 'Çakır', 'Erdoğan', 'Aksoy', 'Güneş', 'Tekin', 'Acar', 'Bulut', 'Turan'],
    placeA: ['Kara', 'Ak', 'Yeni', 'Eski', 'Sarı', 'Kızıl', 'Boz', 'Dağ', 'Göl', 'Deniz', 'Ova', 'Kale', 'Taş', 'Bağ', 'Su', 'Yıldız'],
    placeB: ['hisar', 'köy', 'şehir', 'pınar', 'tepe', 'kent', 'abad', 'dere', 'ova', 'burun', 'koy', 'yalı'],
    suffix: ['Spor', 'SK', 'FK', 'Gençlik', 'Belediye', 'İdman', 'Futbol'],
  },
  brazilian: {
    first: ['Gabriel', 'Lucas', 'Matheus', 'Pedro', 'Guilherme', 'Rafael', 'Felipe', 'Bruno', 'Thiago', 'Vinícius', 'Leandro', 'Rodrigo', 'Diego', 'Gustavo', 'Caio', 'Wesley', 'Willian', 'Everton', 'Douglas', 'Lucca', 'Murilo', 'Kauã', 'Endrick', 'Arthur', 'Danilo', 'Marlon', 'Yago', 'Igor', 'Paulinho', 'Reinier'],
    last: ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Barbosa', 'Rocha', 'Dias', 'Nascimento', 'Andrade', 'Moreira', 'Nunes', 'Marques', 'Machado', 'Mendes', 'Freitas', 'Cardoso', 'Teixeira'],
    placeA: ['Bela', 'Nova', 'Santa', 'São', 'Porto', 'Campo', 'Vila', 'Boa', 'Monte', 'Rio', 'Serra', 'Terra', 'Praia', 'Alto', 'Mata', 'Lagoa'],
    placeB: ['vista', 'verde', 'grande', 'alegre', 'branca', 'forte', 'real', 'sol', 'mar', 'luz', 'ouro', 'aurora', 'cruz', 'norte'],
    suffix: ['FC', 'Esporte Clube', 'Atlético', 'Sport', 'Associação', 'Clube', 'Atlético Clube', 'Futebol Clube'],
  },
  african: {
    first: ['Sipho', 'Thabo', 'Kwame', 'Kofi', 'Chidi', 'Emeka', 'Tendai', 'Themba', 'Bongani', 'Lungile', 'Musa', 'Sadio', 'Idrissa', 'Cheikh', 'Amadou', 'Kalidou', 'Wilfried', 'Serge', 'Yaya', 'Seydou', 'Victor', 'Obinna', 'Tariq', 'Mbwana', 'Kelechi', 'Ayo', 'Moses', 'Thulani', 'Percy', 'Lebo'],
    last: ['Nkosi', 'Dlamini', 'Mokoena', 'Khumalo', 'Zulu', 'Mthembu', 'Ndlovu', 'Mahlangu', 'Sithole', 'Mensah', 'Owusu', 'Boateng', 'Osei', 'Okafor', 'Eze', 'Adeyemi', 'Balogun', 'Diop', 'Ndiaye', 'Sow', 'Camara', 'Keita', 'Traoré', 'Koné', 'Bamba', 'Coulibaly', 'Ouattara', 'Mwale', 'Phiri', 'Banda', 'Moyo', 'Chikwanha'],
    placeA: ['Kwa', 'Mamelodi', 'Soweto', 'Cape', 'Dur', 'Jo', 'Pre', 'Bloem', 'Port', 'East', 'Free', 'Lime', 'Lion', 'Gold', 'Sun', 'Ever'],
    placeB: ['zulu', 'toria', 'ban', 'fontein', 'burg', 'ville', 'stad', 'rand', 'kop', 'vale', 'field', 'gate'],
    suffix: ['FC', 'Stars', 'United', 'Chiefs', 'Pirates', 'Celtic', 'City', 'AmaZulu'],
  },
  slavic: {
    first: ['Marko', 'Nikola', 'Stefan', 'Luka', 'Filip', 'Dusan', 'Milan', 'Aleksandar', 'Nemanja', 'Ivan', 'Petar', 'Dejan', 'Vladimir', 'Bogdan', 'Matija', 'Andrej', 'Miroslav', 'Zoran', 'Darko', 'Goran', 'Igor', 'Sasa', 'Branko', 'Mihajlo', 'Danilo', 'Strahinja', 'Uros', 'Vuk', 'Lazar', 'Jovan'],
    last: ['Jovanović', 'Petrović', 'Nikolić', 'Marković', 'Đorđević', 'Stojanović', 'Ilić', 'Stanković', 'Pavlović', 'Milošević', 'Kovačević', 'Lazić', 'Todorović', 'Simić', 'Popović', 'Vasić', 'Mitrović', 'Tadić', 'Janković', 'Radovanović', 'Savić', 'Kostić', 'Maksimović', 'Filipović', 'Živković', 'Matić', 'Kralj', 'Novak', 'Horvat', 'Babić'],
    placeA: ['Novi', 'Stari', 'Zlatni', 'Beli', 'Crni', 'Veliki', 'Mali', 'Gorni', 'Dolni', 'Sveti', 'Plavi', 'Zeleni', 'Crveni', 'Srebrni', 'Lepi', 'Brzi'],
    placeB: ['grad', 'sad', 'pazar', 'brod', 'polje', 'gora', 'most', 'selo', 'dol', 'kamen', 'potok', 'vrh'],
    suffix: ['FK', 'United', 'Partizan', 'Sloga', 'Rad', 'Sport', 'Zvezda', 'Dinamo'],
  },
  pacific: {
    first: ['Tane', 'Rangi', 'Aroha', 'Manu', 'Koa', 'Mikaele', 'Sione', 'Tevita', 'Josefa', 'Epeli', 'Ratu', 'Semi', 'Waisale', 'Ilaisa', 'Viliame', 'Nemani', 'Jone', 'Kolinio', 'Peni', 'Aisake', 'Lote', 'Maika', 'Iosefa', 'Tomasi', 'Samisoni', 'Etuate', 'Alani', 'Kalo', 'Tui', 'Hemi'],
    last: ['Tuilagi', 'Vaka', 'Naqelevuki', 'Seruvakula', 'Tamani', 'Kaufana', 'Tuivasa', 'Ratuva', 'Moala', 'Taufa', 'Fifita', 'Havili', 'Latu', 'Piutau', 'Savea', 'Fonoti', 'Salesa', 'Mataele', 'Toloa', 'Tago', 'Bola', 'Waqa', 'Lolohea', 'Cakobau', 'Nawalu', 'Ravouvou', 'Bale', 'Kuruvoli', 'Tikoisuva', 'Delai'],
    placeA: ['Mata', 'Nadi', 'Suva', 'Lau', 'Taka', 'Vava', 'Hau', 'Pele', 'Moto', 'Rata', 'Koro', 'Tavua', 'Lami', 'Sig', 'Rewa', 'Ba'],
    placeB: ['tupu', 'maru', 'viti', 'moana', 'toga', 'lani', 'nui', 'vai', 'iki', 'wai', 'kau', 'mea'],
    suffix: ['FC', 'United', 'Rangers', 'Waves', 'Navigators', 'Athletic'],
  },
};

/** Country code -> naming culture. Unknown codes default to 'english'. */
const NAT_CULTURE: Record<string, NameCulture> = {
  ENG: 'english', SCO: 'english', USA: 'english', AUS: 'english', NZL: 'english', IRL: 'english', WAL: 'english', CAN: 'english',
  ESP: 'spanish', MEX: 'spanish', ARG: 'spanish', COL: 'spanish', CHI: 'spanish', URU: 'spanish', PAR: 'spanish', CRC: 'spanish', CAM: 'spanish', PAN: 'spanish', VEN: 'spanish', ECU: 'spanish', PER: 'spanish',
  ITA: 'italian', GER: 'german', AUT: 'german', SUI: 'german', FRA: 'french', BEL: 'dutch', NED: 'dutch', POR: 'portuguese', BRA: 'brazilian',
  SAU: 'arabic', UAE: 'arabic', QAT: 'arabic', EGY: 'arabic', MAR: 'arabic', TUN: 'arabic', ALG: 'arabic', IRQ: 'arabic',
  JPN: 'japanese', KOR: 'korean', CHN: 'chinese', TUR: 'turkish',
  RSA: 'african', NGA: 'african', GHA: 'african', SEN: 'african', CIV: 'african', ZIM: 'african', ZAM: 'african', CMR: 'african', MLI: 'african',
  SRB: 'slavic', CRO: 'slavic', POL: 'slavic', CZE: 'slavic', UKR: 'slavic', FIJ: 'pacific', PNG: 'pacific',
};

export function cultureOfNation(code: string): NameCulture {
  return NAT_CULTURE[code] ?? 'english';
}

export function playerName(culture: NameCulture, rng: Rng): string {
  const c = C[culture];
  return `${rng.pick(c.first)} ${rng.pick(c.last)}`;
}

export function managerName(culture: NameCulture, rng: Rng): string {
  return playerName(culture, rng);
}

/** Generates a unique fictional club name for a culture. `used` is mutated. */
export function clubName(culture: NameCulture, rng: Rng, used: Set<string>): { name: string; short: string; city: string } {
  const c = C[culture];
  for (let attempt = 0; attempt < 200; attempt++) {
    const city = `${rng.pick(c.placeA)}${rng.pick(c.placeB)}`;
    const cityName = city.charAt(0).toUpperCase() + city.slice(1);
    const suffix = rng.pick(c.suffix);
    const prefixStyle = culture === 'german' || culture === 'turkish' || culture === 'arabic' || culture === 'brazilian' || culture === 'spanish' || culture === 'portuguese' || culture === 'french' || culture === 'italian';
    const name = prefixStyle && suffix.length <= 12 && rng.chance(0.55) ? `${suffix} ${cityName}` : `${cityName} ${suffix}`;
    if (used.has(name) || used.has(cityName)) continue;
    used.add(name);
    used.add(cityName);
    const short = cityName.slice(0, 3).toUpperCase();
    return { name, short, city: cityName };
  }
  const fallback = `Club ${used.size + 1}`;
  used.add(fallback);
  return { name: fallback, short: 'CLB', city: fallback };
}
