export interface VocabItem {
  id: string;
  word: string;
  article: 'der' | 'die' | 'das' | '';
  plural: string;
  ipa: string;
  meaningVi: string;
  level: 'B1' | 'B2' | 'C1';
  category: string;
  collocation: string;
  exampleDe: string;
  exampleVi: string;
  mastery: number; // 0 to 100
}

export interface LectureSegment {
  id: string;
  timestamp: string;
  de: string;
  vi: string;
  literalChunk: string;
  grammarNote: string;
  cefr: 'B1' | 'B2' | 'C1';
}

export interface LectureItem {
  id: string;
  title: string;
  speaker: string;
  institution: string;
  level: 'B1' | 'B2' | 'C1';
  duration: string;
  topic: string;
  summaryVi: string;
  segments: LectureSegment[];
  keyVocab: VocabItem[];
}

export interface PlaylistTrack {
  id: string;
  title: string;
  broadcaster: string;
  category: 'Radio Live' | 'Podcast SLA' | 'Hörbuch B2' | 'Custom';
  level: 'B1' | 'B2' | 'C1';
  durationSeconds: number;
  streamUrl?: string;
  youtubeId?: string;
  descriptionVi: string;
  transcript: {
    timeSec: number;
    timeLabel: string;
    de: string;
    vi: string;
  }[];
}

export interface ShadowingExercise {
  id: string;
  level: 'B1' | 'B2' | 'C1';
  context: string;
  de: string;
  prosodyMarkup: string;
  ipa: string;
  vi: string;
  focusPoint: string;
  tempoBpm: number;
}

export interface NewsArticle {
  id: string;
  titleDe: string;
  titleVi: string;
  source: string;
  level: 'B1' | 'B2' | 'C1';
  readTime: string;
  publishedDate: string;
  topic: string;
  leadDe: string;
  leadVi: string;
  paragraphs: {
    de: string;
    vi: string;
    grammarHighlight: string;
  }[];
}

export interface MangaEpisode {
  id: string;
  titleDe: string;
  titleVi: string;
  location: string;
  level: 'B1' | 'B2';
  culturalNote: string;
  panels: {
    panelNumber: number;
    sceneTheme: 'ubahn' | 'wg_kitchen' | 'uni_mensa' | 'spati_night';
    sceneCaptionDe: string;
    sceneCaptionVi: string;
    dialogues: {
      speaker: string;
      role: string;
      de: string;
      vi: string;
      particleNote: string;
    }[];
  }[];
}

export const INITIAL_VOCABULARY: VocabItem[] = [
  {
    id: 'v-1',
    word: 'Herausforderung',
    article: 'die',
    plural: 'die Herausforderungen',
    ipa: '/hɛˈʁaʊ̯sˌfɔʁdəʁʊŋ/',
    meaningVi: 'Thách thức, thử thách lớn',
    level: 'B2',
    category: 'Beruf & Studium',
    collocation: 'vor einer großen Herausforderung stehen (đối mặt với một thử thách lớn)',
    exampleDe: 'Der Klimawandel stellt unsere Gesellschaft vor eine enorme Herausforderung.',
    exampleVi: 'Biến đổi khí hậu đặt xã hội chúng ta trước một thách thức khổng lồ.',
    mastery: 85,
  },
  {
    id: 'v-2',
    word: 'Zusammenhang',
    article: 'der',
    plural: 'die Zusammenhänge',
    ipa: '/tsuˈzamənhaŋ/',
    meaningVi: 'Mối liên hệ, ngữ cảnh, bối cảnh',
    level: 'B2',
    category: 'Wissenschaft',
    collocation: 'in diesem Zusammenhang (trong bối cảnh/mối liên hệ này)',
    exampleDe: 'Man muss neue Vokabeln immer im natürlichen Zusammenhang lernen.',
    exampleVi: 'Người ta luôn phải học từ vựng mới trong ngữ cảnh tự nhiên.',
    mastery: 90,
  },
  {
    id: 'v-3',
    word: 'Voraussetzung',
    article: 'die',
    plural: 'die Voraussetzungen',
    ipa: '/foˈʁaʊ̯sˌzɛtsʊŋ/',
    meaningVi: 'Điều kiện tiên quyết, tiền đề',
    level: 'B2',
    category: 'Studium',
    collocation: 'die Voraussetzungen erfüllen (đáp ứng các điều kiện tiên quyết)',
    exampleDe: 'Verständlicher Input ist die wichtigste Voraussetzung für den Spracherwerb.',
    exampleVi: 'Đầu vào dễ hiểu là điều kiện tiên quyết quan trọng nhất để tiếp thu ngôn ngữ.',
    mastery: 70,
  },
  {
    id: 'v-4',
    word: 'Nachhaltigkeit',
    article: 'die',
    plural: 'kein Plural',
    ipa: '/ˈnaːxˌhaltɪçkaɪ̯t/',
    meaningVi: 'Tính bền vững (môi trường, kinh tế)',
    level: 'B2',
    category: 'Umwelt & Politik',
    collocation: 'auf Nachhaltigkeit achten (chú trọng đến tính bền vững)',
    exampleDe: 'In Deutschland spielt Nachhaltigkeit bei der Stadtplanung eine zentrale Rolle.',
    exampleVi: 'Tại Đức, tính bền vững đóng vai trò trung tâm trong quy hoạch đô thị.',
    mastery: 65,
  },
  {
    id: 'v-5',
    word: 'Gedächtnis',
    article: 'das',
    plural: 'die Gedächtnisse',
    ipa: '/ɡəˈdɛçtnɪs/',
    meaningVi: 'Trí nhớ, bộ nhớ',
    level: 'B1',
    category: 'Psychologie',
    collocation: 'im Gedächtnis behalten (lưu giữ trong trí nhớ)',
    exampleDe: 'Durch emotionale Geschichten bleiben Wörter viel länger im Gedächtnis.',
    exampleVi: 'Thông qua những câu chuyện giàu cảm xúc, từ vựng đọng lại trong trí nhớ lâu hơn nhiều.',
    mastery: 80,
  },
  {
    id: 'v-6',
    word: 'Auseinandersetzung',
    article: 'die',
    plural: 'die Auseinandersetzungen',
    ipa: '/aʊ̯sʔaɪ̯ˈnandɐˌzɛtsʊŋ/',
    meaningVi: 'Sự tìm hiểu sâu, cuộc tranh luận, đối mặt',
    level: 'C1',
    category: 'Diskurs & Kultur',
    collocation: 'sich mit einem Thema auseinandersetzen (+ Dativ)',
    exampleDe: 'Eine kritische Auseinandersetzung mit den Medien ist heute unerlässlich.',
    exampleVi: 'Việc tiếp cận và phân tích có tư duy phản biện với truyền thông ngày nay là không thể thiếu.',
    mastery: 45,
  },
  {
    id: 'v-7',
    word: 'Wahrnehmung',
    article: 'die',
    plural: 'die Wahrnehmungen',
    ipa: '/ˈvaːɐ̯ˌneːmʊŋ/',
    meaningVi: 'Sự nhận thức, cảm nhận giác quan',
    level: 'C1',
    category: 'Psychologie',
    collocation: 'die selektive Wahrnehmung (nhận thức có chọn lọc)',
    exampleDe: 'Regelmäßiges Schatten-Sprechen verändert Ihre akustische Wahrnehmung der deutschen Sprache.',
    exampleVi: 'Việc luyện nói đuổi (Shadowing) thường xuyên thay đổi nhận thức thính giác của bạn về tiếng Đức.',
    mastery: 55,
  },
  {
    id: 'v-8',
    word: 'Erkenntnis',
    article: 'die',
    plural: 'die Erkenntnisse',
    ipa: '/ɛɐ̯ˈkɛntnɪs/',
    meaningVi: 'Sự nhận ra, phát hiện khoa học, tri thức',
    level: 'B2',
    category: 'Wissenschaft',
    collocation: 'zu der Erkenntnis gelangen (đi đến nhận thức/kết luận rằng)',
    exampleDe: 'Neurowissenschaftliche Erkenntnisse bestätigen die Wirksamkeit des natürlichen Hörens.',
    exampleVi: 'Những phát hiện khoa học thần kinh xác nhận tính hiệu quả của việc nghe tự nhiên.',
    mastery: 60,
  },
  {
    id: 'v-9',
    word: 'Verfügung',
    article: 'die',
    plural: 'die Verfügungen',
    ipa: '/fɛɐ̯ˈfyːɡʊŋ/',
    meaningVi: 'Sự sẵn có để sử dụng (Funktionsverbgefüge)',
    level: 'B2',
    category: 'Beruf & Alltag',
    collocation: 'zur Verfügung stehen / stellen (sẵn có / cung cấp cho ai)',
    exampleDe: 'Alle Vorlesungsmanuskripte stehen den Studierenden online zur Verfügung.',
    exampleVi: 'Tất cả bản thảo bài giảng đều có sẵn trực tuyến cho sinh viên.',
    mastery: 95,
  },
  {
    id: 'v-10',
    word: 'Einfluss',
    article: 'der',
    plural: 'die Einflüsse',
    ipa: '/ˈaɪ̯nflʊs/',
    meaningVi: 'Sự ảnh hưởng, tác động',
    level: 'B1',
    category: 'Gesellschaft',
    collocation: 'Einfluss nehmen auf (+ Akkusativ)',
    exampleDe: 'Die tägliche Hörgewohnheit hat einen enormen Einfluss auf das Sprachgefühl.',
    exampleVi: 'Thói quen nghe hàng ngày có ảnh hưởng to lớn đến cảm thức ngôn ngữ.',
    mastery: 88,
  },
  {
    id: 'v-11',
    word: 'Gelegenheit',
    article: 'die',
    plural: 'die Gelegenheiten',
    ipa: '/ɡəˈleːɡn̩haɪ̯t/',
    meaningVi: 'Cơ hội, dịp thuận lợi',
    level: 'B1',
    category: 'Alltag',
    collocation: 'die Gelegenheit nutzen / ergreifen (nắm bắt cơ hội)',
    exampleDe: 'Nutzen Sie jede Gelegenheit, um authentisches Deutsch im Alltag zu hören.',
    exampleVi: 'Hãy tận dụng mọi cơ hội để nghe tiếng Đức thực tế trong đời sống hàng ngày.',
    mastery: 78,
  },
  {
    id: 'v-12',
    word: 'Standpunkt',
    article: 'der',
    plural: 'die Standpunkte',
    ipa: '/ˈʃtantˌpʊŋkt/',
    meaningVi: 'Quan điểm, lập trường',
    level: 'B2',
    category: 'Diskurs & Debatte',
    collocation: 'einen klaren Standpunkt vertreten (bảo vệ một quan điểm rõ ràng)',
    exampleDe: 'In der Diskussion vertrat die Professorin einen äußerst differenzierten Standpunkt.',
    exampleVi: 'Trong cuộc thảo luận, nữ giáo sư đã trình bày một quan điểm hết sức sâu sắc và đa chiều.',
    mastery: 50,
  },
  {
    id: 'v-13',
    word: 'Verständnis',
    article: 'das',
    plural: 'die Verständnisse',
    ipa: '/fɛɐ̯ˈʃtɛntnɪs/',
    meaningVi: 'Sự thấu hiểu, sự thông cảm',
    level: 'B1',
    category: 'Kommunikation',
    collocation: 'Verständnis aufbringen für (+ Akkusativ)',
    exampleDe: 'Hörverstehen entwickelt sich vor allem durch entspanntes, wiederholtes Zuhören.',
    exampleVi: 'Kỹ năng nghe hiểu phát triển trước hết nhờ việc lắng nghe lặp lại trong trạng thái thư giãn.',
    mastery: 82,
  },
  {
    id: 'v-14',
    word: 'Beitrag',
    article: 'der',
    plural: 'die Beiträge',
    ipa: '/ˈbaɪ̯tʁaːk/',
    meaningVi: 'Sự đóng góp, bài viết/phóng sự báo chí',
    level: 'B1',
    category: 'Medien & Gesellschaft',
    collocation: 'einen wichtigen Beitrag leisten zu (+ Dativ)',
    exampleDe: 'Dieser Radiobeitrag leistet einen wertvollen Beitrag zur aktuellen Energiedebatte.',
    exampleVi: 'Phóng sự phát thanh này đóng góp giá trị vào cuộc tranh luận năng lượng hiện nay.',
    mastery: 75,
  },
  {
    id: 'v-15',
    word: 'Wortschatz',
    article: 'der',
    plural: 'die Wortschätze',
    ipa: '/ˈvɔʁtˌʃats/',
    meaningVi: 'Vốn từ vựng (kho báu từ ngữ)',
    level: 'B1',
    category: 'Spracherwerb',
    collocation: 'den aktiven Wortschatz erweitern (mở rộng vốn từ vựng chủ động)',
    exampleDe: 'Wer viel liest, erweitert seinen passiven und aktiven Wortschatz ganz automatisch.',
    exampleVi: 'Ai đọc nhiều sẽ tự động mở rộng vốn từ vựng bị động lẫn chủ động của mình.',
    mastery: 92,
  },
  {
    id: 'v-16',
    word: 'Selbstverständlichkeit',
    article: 'die',
    plural: 'die Selbstverständlichkeiten',
    ipa: '/ˈzɛlpstfɛɐ̯ˌʃtɛntlɪçkaɪ̯t/',
    meaningVi: 'Điều hiển nhiên, sự tự nhiên không cần gượng ép',
    level: 'C1',
    category: 'Kultur & Alltag',
    collocation: 'etwas als Selbstverständlichkeit betrachten (coi điều gì là hiển nhiên)',
    exampleDe: 'Pünktlichkeit gilt im deutschen Berufsleben oft als absolute Selbstverständlichkeit.',
    exampleVi: 'Sự đúng giờ trong môi trường làm việc ở Đức thường được coi là điều hiển nhiên tuyệt đối.',
    mastery: 40,
  },
];

// Quick Word Dictionary for instant click-to-lookup across all German texts
export const QUICK_WORD_DICTIONARY: Record<
  string,
  {
    word: string;
    article: 'der' | 'die' | 'das' | '';
    plural: string;
    ipa: string;
    meaningVi: string;
    level: 'B1' | 'B2' | 'C1';
    grammarTip: string;
  }
> = {
  spracherwerb: {
    word: 'Spracherwerb',
    article: 'der',
    plural: 'kein Plural',
    ipa: '/ˈʃpʁaːxʔɛɐ̯ˌvɛʁp/',
    meaningVi: 'Sự tiếp thu ngôn ngữ tự nhiên (SLA)',
    level: 'C1',
    grammarTip: 'Danh từ ghép: die Sprache (ngôn ngữ) + der Erwerb (sự tiếp thu).',
  },
  gehirn: {
    word: 'Gehirn',
    article: 'das',
    plural: 'die Gehirne',
    ipa: '/ɡəˈhɪʁn/',
    meaningVi: 'Bộ não',
    level: 'B1',
    grammarTip: 'Danh từ trung tính bắt đầu bằng tiền tố Ge- thường mang mạo từ "das".',
  },
  voraussetzung: {
    word: 'Voraussetzung',
    article: 'die',
    plural: 'die Voraussetzungen',
    ipa: '/foˈʁaʊ̯sˌzɛtsʊŋ/',
    meaningVi: 'Điều kiện tiên quyết',
    level: 'B2',
    grammarTip: 'Mọi danh từ tận cùng bằng -ung đều mang giống cái (die).',
  },
  zusammenhang: {
    word: 'Zusammenhang',
    article: 'der',
    plural: 'die Zusammenhänge',
    ipa: '/tsuˈzamənhaŋ/',
    meaningVi: 'Ngữ cảnh, mối liên hệ',
    level: 'B2',
    grammarTip: 'Đi với giới từ: im Zusammenhang mit (+ Dativ).',
  },
  herausforderung: {
    word: 'Herausforderung',
    article: 'die',
    plural: 'die Herausforderungen',
    ipa: '/hɛˈʁaʊ̯sˌfɔʁdəʁʊŋ/',
    meaningVi: 'Thách thức, thử thách',
    level: 'B2',
    grammarTip: 'Từ động từ tách được: heraus|fordern (thách thức).',
  },
  nachhaltigkeit: {
    word: 'Nachhaltigkeit',
    article: 'die',
    plural: 'kein Plural',
    ipa: '/ˈnaːxˌhaltɪçkaɪ̯t/',
    meaningVi: 'Tính bền vững',
    level: 'B2',
    grammarTip: 'Danh từ có hậu tố -keit luôn mang giống cái (die).',
  },
  wahrnehmung: {
    word: 'Wahrnehmung',
    article: 'die',
    plural: 'die Wahrnehmungen',
    ipa: '/ˈvaːɐ̯ˌneːmʊŋ/',
    meaningVi: 'Sự nhận thức, cảm nhận',
    level: 'C1',
    grammarTip: 'Từ động từ tách được: wahr|nehmen (nhận thức, cảm nhận).',
  },
  erkenntnisse: {
    word: 'Erkenntnis',
    article: 'die',
    plural: 'die Erkenntnisse',
    ipa: '/ɛɐ̯ˈkɛntnɪs/',
    meaningVi: 'Phát hiện khoa học, tri thức',
    level: 'B2',
    grammarTip: 'Lưu ý: Erkenntnis mang giống cái (die Erkenntnis), khác với das Ergebnis.',
  },
  gesellschaft: {
    word: 'Gesellschaft',
    article: 'die',
    plural: 'die Gesellschaften',
    ipa: '/ɡəˈzɛlʃaft/',
    meaningVi: 'Xã hội, công ty',
    level: 'B1',
    grammarTip: 'Hậu tố -schaft luôn mang giống cái (die).',
  },
  künstliche: {
    word: 'künstlich',
    article: '',
    plural: 'Adjektiv',
    ipa: '/ˈkʏnstlɪç/',
    meaningVi: 'Nhân tạo (Künstliche Intelligenz = AI)',
    level: 'B2',
    grammarTip: 'Xuất phát từ die Kunst (nghệ thuật / kỹ nghệ).',
  },
  arbeitsmarkt: {
    word: 'Arbeitsmarkt',
    article: 'der',
    plural: 'die Arbeitsmärkte',
    ipa: '/ˈaʁbaɪ̯tsˌmaʁkt/',
    meaningVi: 'Thị trường lao động',
    level: 'B2',
    grammarTip: 'Đi với giới từ: auf dem Arbeitsmarkt (trên thị trường lao động).',
  },
  fachkräfte: {
    word: 'Fachkraft',
    article: 'die',
    plural: 'die Fachkräfte',
    ipa: '/ˈfaxˌkʁaft/',
    meaningVi: 'Nhân lực có chuyên môn lành nghề',
    level: 'B2',
    grammarTip: 'der Fachkräftemangel = Sự thiếu hụt lao động có tay nghề tại Đức.',
  },
};

export const PRELOADED_LECTURES: LectureItem[] = [
  {
    id: 'lec-sla-1',
    title: 'Wie das menschliche Gehirn Sprachen natürlich erwirbt (SLA)',
    speaker: 'Prof. Dr. Claudia Weber',
    institution: 'Humboldt-Universität zu Berlin · Institut für Linguistik',
    level: 'B2',
    duration: '04:20',
    topic: 'Neurolinguistik & SLA',
    summaryVi:
      'Bài giảng giải thích cơ chế tiếp thu ngôn ngữ tự nhiên (Comprehensible Input): tại sao não bộ học ngữ pháp tiếng Đức qua ngữ cảnh và âm thanh hiệu quả hơn học thuộc lòng bảng chia từ.',
    segments: [
      {
        id: 'seg-1',
        timestamp: '00:00',
        de: 'Herzlich willkommen zu unserer heutigen Vorlesung über den natürlichen Spracherwerb im Erwachsenenalter.',
        vi: 'Nhiệt liệt chào mừng các bạn đến với bài giảng hôm nay của chúng ta về sự tiếp thu ngôn ngữ tự nhiên ở tuổi trưởng thành.',
        literalChunk: 'Nhiệt liệt chào mừng · đến với bài giảng hôm nay của chúng ta · về sự tiếp thu ngôn ngữ tự nhiên · ở tuổi trưởng thành.',
        grammarNote: 'zu + Dativ (zu unserer heutigen Vorlesung); über + Akkusativ (über den natürlichen Spracherwerb - chủ đề thảo luận).',
        cefr: 'B1',
      },
      {
        id: 'seg-2',
        timestamp: '00:18',
        de: 'Viele Lernende glauben fälschlicherweise, dass man zuerst unzählige Grammatiktabellen auswendig lernen muss, bevor man überhaupt einen Satz sprechen darf.',
        vi: 'Nhiều người học lầm tưởng rằng người ta trước tiên phải học thuộc lòng vô số bảng ngữ pháp trước khi được phép nói dù chỉ một câu.',
        literalChunk: 'Nhiều người học tin · một cách sai lầm, · rằng người ta trước hết · vô số bảng ngữ pháp · học thuộc lòng phải, · trước khi người ta nói một câu được phép.',
        grammarNote: 'Mệnh đề phụ với "dass" và "bevor" đẩy động từ chia (muss, darf) xuống cuối câu (Nebensatz-Klammer).',
        cefr: 'B2',
      },
      {
        id: 'seg-3',
        timestamp: '00:42',
        de: 'Neurowissenschaftliche Erkenntnisse zeigen jedoch deutlich: Unser Gehirn ist eine hochpräzise Mustererkennungsmaschine.',
        vi: 'Tuy nhiên, những phát hiện khoa học thần kinh chỉ ra rõ ràng: Bộ não của chúng ta là một cỗ máy nhận diện quy luật cực kỳ chính xác.',
        literalChunk: 'Những phát hiện khoa học thần kinh · chỉ ra tuy nhiên rõ ràng: · Bộ não chúng ta là · một cỗ máy nhận diện mẫu cực kỳ chính xác.',
        grammarNote: 'Kompositum (Từ ghép): Muster (mẫu/quy luật) + Erkennung (sự nhận diện) + Maschine (cỗ máy) -> die Mustererkennungsmaschine.',
        cefr: 'C1',
      },
      {
        id: 'seg-4',
        timestamp: '01:08',
        de: 'Wenn wir täglich verständlichen Input hören und lesen, der uns emotional berührt, speichert das Gedächtnis Strukturen und Kasusendungen völlig unbewusst ab.',
        vi: 'Khi chúng ta hàng ngày nghe và đọc nguồn đầu vào dễ hiểu mà chạm đến cảm xúc, trí nhớ sẽ lưu trữ các cấu trúc và đuôi chia cách hoàn toàn vô thức.',
        literalChunk: 'Khi chúng ta hàng ngày · đầu vào dễ hiểu nghe và đọc, · cái mà chạm đến cảm xúc chúng ta, · lưu trữ bộ nhớ · các cấu trúc và đuôi cách hoàn toàn vô thức.',
        grammarNote: 'Cấu trúc Wenn-Satz đứng đầu -> mệnh đề chính đảo động từ lên đầu (Verb-Zweitstellung: "speichert das Gedächtnis ... ab"). Động từ tách ab|speichern.',
        cefr: 'B2',
      },
      {
        id: 'seg-5',
        timestamp: '01:36',
        de: 'Genau deshalb kombinieren wir das entspannte Hören deutscher Radiosender mit aktivem Shadowing, um das Sprachgefühl nachhaltig zu verankern.',
        vi: 'Chính vì thế chúng ta kết hợp việc nghe thư giãn các đài phát thanh tiếng Đức với luyện nói đuổi (Shadowing) chủ động để neo giữ cảm thức ngôn ngữ một cách bền vững.',
        literalChunk: 'Chính vì vậy kết hợp chúng ta · việc nghe thư giãn các đài Đức · với Shadowing chủ động, · để cảm thức ngôn ngữ bền vững neo giữ.',
        grammarNote: 'Cấu trúc chỉ mục đích "um ... zu + Infinitiv" (um das Sprachgefühl nachhaltig zu verankern).',
        cefr: 'B2',
      },
    ],
    keyVocab: INITIAL_VOCABULARY.slice(0, 5),
  },
  {
    id: 'lec-tum-2',
    title: 'Künstliche Intelligenz & Arbeitsmarkt in Deutschland 2026',
    speaker: 'Prof. Dr.-Ing. Markus Lindner',
    institution: 'Technische Universität München (TUM) · Fakultät für Informatik',
    level: 'C1',
    duration: '05:10',
    topic: 'Technologie & Wirtschaft',
    summaryVi:
      'Phân tích tác động của Trí tuệ nhân tạo đối với nền công nghiệp Đức, sự thiếu hụt nhân lực chất lượng cao (Fachkräftemangel) và cơ hội cho sinh viên quốc tế.',
    segments: [
      {
        id: 'tum-1',
        timestamp: '00:00',
        de: 'Die deutsche Industrie befindet sich gegenwärtig in einem tiefgreifenden Transformationsprozess, der sowohl Chancen als auch erhebliche Herausforderungen birgt.',
        vi: 'Nền công nghiệp Đức hiện đang nằm trong một quá trình chuyển đổi sâu sắc, mang lại cả cơ hội lẫn những thách thức đáng kể.',
        literalChunk: 'Nền công nghiệp Đức · đang ở hiện tại · trong một quá trình chuyển đổi sâu sắc, · cái mà vừa cơ hội vừa thách thức đáng kể chứa đựng.',
        grammarNote: 'Liên từ tương quan "sowohl ... als auch" (vừa ... vừa); động từ "bergen" (birgt) = ẩn chứa, hàm chứa (C1).',
        cefr: 'C1',
      },
      {
        id: 'tum-2',
        timestamp: '00:25',
        de: 'Obwohl viele Routineaufgaben durch automatisierte Systeme übernommen werden, steigt die Nachfrage nach qualifizierten Fachkräften kontinuierlich an.',
        vi: 'Mặc dù nhiều công việc lặp lại được tiếp quản bởi các hệ thống tự động hóa, nhu cầu về nhân lực có chuyên môn vẫn tăng lên liên tục.',
        literalChunk: 'Mặc dù nhiều tác vụ thường nhật · bởi hệ thống tự động được tiếp quản, · tăng nhu cầu · về nhân lực chuyên môn liên tục lên.',
        grammarNote: 'Obwohl (Mặc dù - mệnh đề nhượng bộ) + Passiv (übernommen werden); die Nachfrage nach (+ Dativ) = nhu cầu về cái gì.',
        cefr: 'B2',
      },
      {
        id: 'tum-3',
        timestamp: '00:52',
        de: 'Entscheidend auf dem modernen Arbeitsmarkt ist nicht mehr das bloße Faktenwissen, sondern die Fähigkeit, komplexe Zusammenhänge kritisch zu hinterfragen.',
        vi: 'Yếu tố quyết định trên thị trường lao động hiện đại không còn là kiến thức dữ kiện đơn thuần, mà là khả năng đặt câu hỏi phản biện trước những mối liên hệ phức tạp.',
        literalChunk: 'Quyết định trên thị trường lao động hiện đại · không còn là kiến thức sự thật đơn thuần, · mà là khả năng, · các mối liên hệ phức tạp phản biện chất vấn.',
        grammarNote: 'Cấu trúc "nicht mehr ..., sondern ..." (không còn là ..., mà là ...); das bloße Faktenwissen = kiến thức sách vở đơn thuần.',
        cefr: 'C1',
      },
      {
        id: 'tum-4',
        timestamp: '01:18',
        de: 'Wer darüber hinaus fließend Deutsch auf B2- oder C1-Niveau beherrscht, hat in interdisziplinären Teams einen unschätzbaren kommunikativen Vorteil.',
        vi: 'Ai ngoài ra còn thông thạo tiếng Đức trôi chảy ở trình độ B2 hoặc C1 sẽ có lợi thế giao tiếp vô giá trong các nhóm làm việc liên ngành.',
        literalChunk: 'Ai ngoài ra · tiếng Đức trôi chảy ở mức B2-C1 làm chủ, · có trong các đội liên ngành · một lợi thế giao tiếp vô giá.',
        grammarNote: 'Mệnh đề quan hệ khuyết danh "Wer ..., (der) hat ..." (Ai làm gì thì người đó có...); "darüber hinaus" = hơn thế nữa.',
        cefr: 'B2',
      },
    ],
    keyVocab: INITIAL_VOCABULARY.slice(5, 10),
  },
  {
    id: 'lec-alltag-3',
    title: 'Alltagspsychologie: Warum Perfektionismus beim Sprechen blockiert',
    speaker: 'Dr. Hannah Bergmann',
    institution: 'Goethe-Forum Frankfurt · Sprachpsychologie',
    level: 'B1',
    duration: '03:45',
    topic: 'Psychologie & Kommunikation',
    summaryVi:
      'Tại sao nỗi sợ sai mạo từ (der/die/das) khiến người học bị "đơ" khi giao tiếp với người Đức và cách vượt qua rào cản tâm lý để nói tự nhiên.',
    segments: [
      {
        id: 'psy-1',
        timestamp: '00:00',
        de: 'Kennen Sie das Gefühl, dass Ihnen mitten im Gespräch plötzlich die einfachsten deutschen Wörter fehlen?',
        vi: 'Bạn có biết cái cảm giác khi đang giữa cuộc trò chuyện thì đột nhiên những từ tiếng Đức đơn giản nhất lại biến mất khỏi đầu bạn không?',
        literalChunk: 'Bạn có biết cảm giác, · rằng cho bạn giữa cuộc trò chuyện · đột nhiên những từ tiếng Đức đơn giản nhất thiếu?',
        grammarNote: 'Động từ "fehlen" đi với Dativ (Ihnen fehlen die Wörter = Bạn bị thiếu từ / không nghĩ ra từ).',
        cefr: 'B1',
      },
      {
        id: 'psy-2',
        timestamp: '00:22',
        de: 'Der Hauptgrund dafür ist selten ein zu kleiner Wortschatz, sondern ein überaktiver innerer Kontrolleur, der jeden Artikel vor dem Aussprechen prüft.',
        vi: 'Nguyên nhân chính của việc đó hiếm khi là do vốn từ quá ít, mà là do "người kiểm duyệt nội tâm" hoạt động quá mức, luôn săm soi từng mạo từ trước khi phát âm.',
        literalChunk: 'Nguyên nhân chính cho việc đó · hiếm khi là một vốn từ quá nhỏ, · mà là một người kiểm soát nội tâm quá mức, · kẻ mà kiểm tra mọi mạo từ trước khi nói ra.',
        grammarNote: 'vor + Dativ + Danh từ hoá động từ (vor dem Aussprechen = trước khi nói ra).',
        cefr: 'B2',
      },
      {
        id: 'psy-3',
        timestamp: '00:48',
        de: 'Muttersprachler achten im Alltag vor allem auf die Satzmelodie und die Schlüsselwörter, nicht auf einen falschen Akkusativ.',
        vi: 'Người bản xứ trong đời sống hàng ngày chú ý trước hết đến giai điệu câu và các từ khóa chính, chứ không phải một lỗi chia sai cách Akkusativ.',
        literalChunk: 'Người bản xứ chú ý trong đời thường · trước hết vào giai điệu câu và từ khóa, · không phải vào một Akkusativ sai.',
        grammarNote: 'achten auf (+ Akkusativ) = chú ý, để tâm đến điều gì.',
        cefr: 'B1',
      },
    ],
    keyVocab: INITIAL_VOCABULARY.slice(10, 15),
  },
];

export const PLAYLIST_TRACKS: PlaylistTrack[] = [
  {
    id: 'pl-dlf-1',
    title: 'Deutschlandfunk — Forschung Aktuell: Grüne Wasserstoff-Zukunft',
    broadcaster: 'Deutschlandfunk (DLF Köln)',
    category: 'Radio Live',
    level: 'B2',
    durationSeconds: 78,
    streamUrl: 'https://st01.sslstream.dlf.de/dlf/01/128/mp3/stream.mp3',
    descriptionVi:
      'Bản tin khoa học từ đài quốc gia Deutschlandfunk về công nghệ Hydro xanh và mạng lưới năng lượng tái tạo tại miền Bắc nước Đức.',
    transcript: [
      {
        timeSec: 0,
        timeLabel: '00:00',
        de: 'Guten Tag aus Köln. In unserer Sendung „Forschung Aktuell“ blicken wir heute nach Norddeutschland.',
        vi: 'Xin chào từ Köln. Trong chương trình "Thời sự Khoa học" hôm nay, chúng ta cùng hướng về miền Bắc nước Đức.',
      },
      {
        timeSec: 14,
        timeLabel: '00:14',
        de: 'Dort entsteht an der Nordseeküste eines der größten Projekte für grünen Wasserstoff in ganz Europa.',
        vi: 'Tại đó, bên bờ Biển Bắc đang hình thành một trong những dự án Hydro xanh lớn nhất toàn châu Âu.',
      },
      {
        timeSec: 29,
        timeLabel: '00:29',
        de: 'Überschüssiger Windstrom wird direkt vor Ort genutzt, um Wasser in Wasserstoff und Sauerstoff zu spalten.',
        vi: 'Nguồn điện gió dư thừa được tận dụng ngay tại chỗ để điện phân nước thành khí hydro và oxy.',
      },
      {
        timeSec: 46,
        timeLabel: '00:46',
        de: 'Für die deutsche Stahl- und Chemieindustrie bietet diese Technologie eine realistische Chance, klimaneutral zu produzieren.',
        vi: 'Đối với ngành công nghiệp thép và hóa chất của Đức, công nghệ này mang lại cơ hội thực tế để sản xuất trung hòa khí hậu.',
      },
      {
        timeSec: 62,
        timeLabel: '01:02',
        de: 'Dennoch bleibt der zügige Ausbau der Leitungsnetze eine zentrale Voraussetzung für das Gelingen der Energiewende.',
        vi: 'Tuy vậy, việc nhanh chóng mở rộng mạng lưới đường ống vẫn là điều kiện tiên quyết cốt lõi cho sự thành công của quá trình chuyển dịch năng lượng.',
      },
    ],
  },
  {
    id: 'pl-dw-2',
    title: 'DW Langsam Gesprochen — Leben und Arbeiten in München vs. Berlin',
    broadcaster: 'Deutsche Welle (DW Bonn)',
    category: 'Podcast SLA',
    level: 'B1',
    durationSeconds: 72,
    descriptionVi:
      'Bản tin đọc chậm chuẩn SLA của Deutsche Welle so sánh văn hóa sống, chi phí thuê nhà (Warmmiete) và cơ hội nghề nghiệp giữa Berlin và München.',
    transcript: [
      {
        timeSec: 0,
        timeLabel: '00:00',
        de: 'Berlin und München gehören zu den beliebtesten Städten Deutschlands, doch kaum zwei Metropolen könnten unterschiedlicher sein.',
        vi: 'Berlin và München thuộc nhóm những thành phố được yêu thích nhất nước Đức, nhưng hiếm có hai đô thị nào lại khác biệt nhau đến vậy.',
      },
      {
        timeSec: 15,
        timeLabel: '00:15',
        de: 'Während Berlin für seine kreative Start-up-Szene und kulturelle Vielfalt bekannt ist, punktet München mit wirtschaftlicher Stabilität und der Nähe zu den Alpen.',
        vi: 'Trong khi Berlin nổi tiếng với giới khởi nghiệp sáng tạo và sự đa dạng văn hóa, thì München ghi điểm nhờ sự ổn định kinh tế và vị trí gần dãy Alps.',
      },
      {
        timeSec: 34,
        timeLabel: '00:34',
        de: 'Allerdings spiegelt sich dieser Wohlstand auch in den Lebenshaltungskosten wider: Eine Zweizimmerwohnung in München kostet oft doppelt so viel wie im Osten Deutschlands.',
        vi: 'Tuy nhiên, sự thịnh vượng này cũng phản ánh rõ qua chi phí sinh hoạt: Một căn hộ hai phòng ở München thường đắt gấp đôi so với miền Đông nước Đức.',
      },
      {
        timeSec: 54,
        timeLabel: '00:54',
        de: 'Für internationale Fachkräfte lohnt es sich daher, vor dem Umzug nicht nur das Bruttogehalt, sondern auch die regionale Warmmiete genau zu vergleichen.',
        vi: 'Vì vậy đối với nhân lực quốc tế, trước khi chuyển nhà rất đáng để so sánh kỹ không chỉ mức lương trước thuế (Bruttogehalt) mà cả tiền thuê nhà đã gồm sưởi (Warmmiete).',
      },
    ],
  },
  {
    id: 'pl-wdr-3',
    title: 'WDR 5 Zeitzeichen — Die Kunst des Feierabends und der Work-Life-Balance',
    broadcaster: 'WDR 5 (Westdeutscher Rundfunk)',
    category: 'Hörbuch B2',
    level: 'B2',
    durationSeconds: 68,
    descriptionVi:
      'Khám phá khái niệm văn hóa "Feierabend" (giờ nghỉ ngơi sau tan tầm) của người Đức và lý do tại sao sự tách biệt giữa công việc và đời tư được tôn trọng nghiêm ngặt.',
    transcript: [
      {
        timeSec: 0,
        timeLabel: '00:00',
        de: 'Das deutsche Wort „Feierabend“ lässt sich kaum in eine andere Sprache übersetzen, denn es beschreibt weit mehr als nur das Ende der Arbeitszeit.',
        vi: 'Từ tiếng Đức "Feierabend" hầu như khó có thể dịch trọn vẹn sang ngôn ngữ khác, bởi nó mô tả nhiều hơn hẳn việc kết thúc giờ làm việc đơn thuần.',
      },
      {
        timeSec: 18,
        timeLabel: '00:18',
        de: 'Es bezeichnet jenen geschützten Zeitraum am Abend, in dem berufliche E-Mails schweigen und die persönliche Erholung im Mittelpunkt steht.',
        vi: 'Nó chỉ khoảng thời gian được bảo vệ vào buổi tối, nơi những email công việc im lặng và sự nghỉ ngơi tái tạo năng lượng cá nhân nằm ở vị trí trung tâm.',
      },
      {
        timeSec: 36,
        timeLabel: '00:36',
        de: 'Arbeitspsychologen betonen immer wieder, dass genau diese klare Grenze zwischen Beruf und Privatleben die Produktivität am nächsten Tag erhöht.',
        vi: 'Các nhà tâm lý học lao động luôn nhấn mạnh rằng chính ranh giới rõ ràng giữa công việc và đời tư này làm tăng năng suất vào ngày hôm sau.',
      },
      {
        timeSec: 52,
        timeLabel: '00:52',
        de: 'Wer abends wirklich abschaltet, gibt seinem Gehirn die nötige Ruhe, um neue Eindrücke und gelernte Sprache im Schlaf zu festigen.',
        vi: 'Ai thực sự ngắt kết nối công việc vào buổi tối sẽ trao cho bộ não sự tĩnh lặng cần thiết để củng cố những ấn tượng mới và ngôn ngữ đã học trong giấc ngủ.',
      },
    ],
  },
  {
    id: 'pl-swr-4',
    title: 'SWR Wissen — Warum Bahnfahren in Deutschland Geduld und Humor erfordert',
    broadcaster: 'SWR Kultur (Stuttgart)',
    category: 'Podcast SLA',
    level: 'C1',
    durationSeconds: 64,
    descriptionVi:
      'Góc nhìn hài hước và thực tế về những chuyến tàu ICE tại Đức, các thông báo trễ tàu quen thuộc ở nhà ga (Gleiswechsel) và cách bắt chuyện tự nhiên.',
    transcript: [
      {
        timeSec: 0,
        timeLabel: '00:00',
        de: '„Information zu ICE 518 nach München Hauptbahnhof: Heute circa fünfundzwanzig Minuten später.“ — Kaum ein Satz verbindet Menschen in Deutschland schneller.',
        vi: '"Thông báo về chuyến tàu cao tốc ICE 518 đi ga trung tâm München: Hôm nay trễ khoảng 25 phút." — Hiếm có câu nói nào kết nối mọi người ở Đức nhanh hơn câu này.',
      },
      {
        timeSec: 19,
        timeLabel: '00:19',
        de: 'Hinter den häufigen Verspätungen steckt vor allem ein überlastetes Schienennetz, auf dem Güterzüge, Regionalbahnen und Hochgeschwindigkeitszüge dieselben Gleise teilen.',
        vi: 'Đằng sau sự chậm trễ thường xuyên đó trước hết là mạng lưới đường sắt quá tải, nơi tàu chở hàng, tàu vùng và tàu cao tốc dùng chung một đường ray.',
      },
      {
        timeSec: 42,
        timeLabel: '00:42',
        de: 'Nichtsdestotrotz bietet eine ungeplante Wartezeit am Bahnsteig oft die beste Gelegenheit für ein spontanes Gespräch mit anderen Reisenden.',
        vi: 'Dù vậy, khoảng thời gian chờ đợi ngoài dự kiến trên sân ga thường mang lại cơ hội tuyệt vời nhất cho một cuộc trò chuyện ngẫu hứng với những hành khách khác.',
      },
    ],
  },
];

export const SHADOWING_EXERCISES: ShadowingExercise[] = [
  {
    id: 'sh-1',
    level: 'B1',
    context: 'Giao tiếp công sở & Họp nhóm (Berufsalltag)',
    de: 'Könnten Sie mir bitte kurz erklären, wie wir dieses Problem gemeinsam lösen können?',
    prosodyMarkup: 'KÖNN-ten Sie mir BIT-te kurz er-KLÄ-ren, ↗ | wie wir die-ses Pro-BLEM ge-MEIN-sam LÖ-sen kön-nen? ↘',
    ipa: '/ˈkœntən ziː miːɐ̯ ˈbɪtə kʊʁts ɛɐ̯ˈklɛːʁən | viː viːɐ̯ ˈdiːzəs pʁoˈbleːm ɡəˈmaɪ̯nzaːm ˈløːzən ˈkœnən/',
    vi: 'Anh/chị có thể giải thích ngắn gọn giúp tôi làm thế nào chúng ta có thể cùng nhau giải quyết vấn đề này được không?',
    focusPoint: 'Luyện Konjunktiv II lịch sự (Könnten Sie...) và âm tròn môi /œ/ trong "könnten", "/øː/" trong "lösen".',
    tempoBpm: 96,
  },
  {
    id: 'sh-2',
    level: 'B2',
    context: 'Thuyết trình đại học & Tranh luận (Studium & Seminar)',
    de: 'Meiner Ansicht nach sollten wir nicht nur die kurzfristigen Kosten, sondern vor allem die langfristige Nachhaltigkeit berücksichtigen.',
    prosodyMarkup: 'MEI-ner AN-sicht nach ↗ | soll-ten wir NICHT nur die KURZ-fris-ti-gen KOS-ten, ↗ | son-dern VOR al-lem die LANG-fris-ti-ge NACH-hal-tig-keit be-RÜCK-sich-ti-gen. ↘',
    ipa: '/ˈmaɪ̯nɐ ˈanzɪçt naːx ˈzɔltən viːɐ̯ nɪçt nuːɐ̯ diː ˈkʊʁtsfʁɪstɪɡən ˈkɔstən | ˈzɔndɐn foːɐ̯ ˈaləm diː ˈlaŋfʁɪstɪɡə ˈnaːxhaltɪçkaɪ̯t bəˈʁʏkzɪçtɪɡən/',
    vi: 'Theo quan điểm của tôi, chúng ta không chỉ nên tính đến chi phí ngắn hạn mà trên hết phải cân nhắc tính bền vững lâu dài.',
    focusPoint: 'Nhấn trọng âm tương phản (NICHT nur KURZfristig ... sondern LANGfristig) và phát âm mượt động từ 5 âm tiết "be-RÜCK-sich-ti-gen".',
    tempoBpm: 102,
  },
  {
    id: 'sh-3',
    level: 'B2',
    context: 'Phỏng vấn xin việc tại Đức (Vorstellungsgespräch)',
    de: 'In meiner bisherigen Tätigkeit habe ich gelernt, auch unter hohem Zeitdruck strukturiert und zuverlässig zu arbeiten.',
    prosodyMarkup: 'In mei-ner bis-HE-ri-gen TÄ-tig-keit ↗ | ha-be ich ge-LERNT, | auch un-ter HO-hem ZEIT-druck ↗ | struk-tu-RIERT und ZU-ver-läs-sig zu AR-bei-ten. ↘',
    ipa: '/ɪn ˈmaɪ̯nɐ bɪsˈheːʁɪɡən ˈtɛːtɪçkaɪ̯t ˈhaːbə ɪç ɡəˈlɛʁnt | aʊ̯x ˈʊntɐ ˈhoːəm ˈtsaɪ̯tdʁʊk ʃtʁʊktuˈʁiːɐ̯t ʊnt ˈtsuːfɛɐ̯lɛsɪç tsuː ˈaʁbaɪ̯tən/',
    vi: 'Trong công việc trước đây của mình, tôi đã học được cách làm việc có hệ thống và đáng tin cậy ngay cả dưới áp lực thời gian cao.',
    focusPoint: 'Cụm giới từ thương mại "unter hohem Zeitdruck" (Dativ) và âm /ç/ (Ich-Laut) ở cuối từ "Tätigkeit", "zuverlässig".',
    tempoBpm: 100,
  },
  {
    id: 'sh-4',
    level: 'C1',
    context: 'Phân tích học thuật & Báo chí (Wissenschaftlicher Diskurs)',
    de: 'Je intensiver man sich mit einer fremden Kultur auseinandersetzt, desto differenzierter wird die eigene Wahrnehmung der Welt.',
    prosodyMarkup: 'Je in-ten-SI-ver man sich mit ei-ner FREM-den Kul-TUR aus-ei-NAN-der-setzt, ↗ | des-to dif-fe-ren-ZIER-ter wird die EI-ge-ne WAHR-neh-mung der WELT. ↘',
    ipa: '/jeː ɪntɛnˈziːvɐ man zɪç mɪt ˈaɪ̯nɐ ˈfʁɛmdən kʊlˈtuːɐ̯ aʊ̯sʔaɪ̯ˈnandɐzɛtst | ˈdɛsto dɪfəʁɛnˈtsiːɐ̯tɐ vɪʁt diː ˈaɪ̯ɡənə ˈvaːɐ̯neːmʊŋ deːɐ̯ vɛlt/',
    vi: 'Người ta càng tìm hiểu sâu sắc một nền văn hóa mới bao nhiêu, thì nhận thức của chính họ về thế giới càng trở nên đa chiều và tinh tế bấy nhiêu.',
    focusPoint: 'Cấu trúc câu so sánh kép C1 "Je + Komparativ (+ Nebensatz), desto + Komparativ (+ Hauptsatz đảo ngữ)" với ngữ điệu nâng ở mệnh đề Je và hạ dứt khoát ở mệnh đề Desto.',
    tempoBpm: 108,
  },
  {
    id: 'sh-5',
    level: 'B1',
    context: 'Đời sống thường nhật & Trợ từ tình thái (Alltag & Modalpartikeln)',
    de: 'Sag mal, hättest du heute Abend vielleicht Lust, noch kurz auf einen Kaffee vorbeizukommen?',
    prosodyMarkup: 'SAG mal, ↗ | HÄT-test du heu-te A-bend viel-leicht LUST, ↗ | noch KURZ auf ei-nen Kaf-FEE vor-BEI-zu-kom-men? ↗',
    ipa: '/zaːk maːl | ˈhɛtəst duː ˈhɔɪ̯tə ˈaːbənt fɪˈlaɪ̯çt lʊst | nɔx kʊʁts aʊ̯f ˈaɪ̯nən ˈkafe foːɐ̯ˈbaɪ̯tsuˌkɔmən/',
    vi: 'Này, tối nay cậu có hứng ghé qua uống tách cà phê một lát không?',
    focusPoint: 'Ngữ điệu câu hỏi Yes/No tự nhiên nâng giọng ở cuối câu (vorbeizukommen ↗) và trợ từ thân mật "Sag mal".',
    tempoBpm: 105,
  },
];

export const NEWS_ARTICLES: NewsArticle[] = [
  {
    id: 'news-1',
    titleDe: 'Das Deutschlandticket verändert den Pendleralltag in den Metropolen nachhaltig',
    titleVi: 'Vé giao thông toàn quốc Deutschlandticket thay đổi bền vững thói quen đi làm tại các đô thị lớn',
    source: 'Spiegel Panorama · Mobilität',
    level: 'B2',
    readTime: '4 phút đọc',
    publishedDate: '17. November 2026',
    topic: 'Gesellschaft & Verkehr',
    leadDe:
      'Millionen Menschen in Deutschland nutzen inzwischen ein einziges digitales Abonnement für Busse und Regionalbahnen im ganzen Land. Doch während Fahrgäste die tarifliche Einfachheit feiern, fordern Verkehrsverbünde dringend höhere Investitionen in die Infrastruktur.',
    leadVi:
      'Hàng triệu người dân tại Đức hiện đang sử dụng một gói thuê bao kỹ thuật số duy nhất cho xe buýt và tàu vùng trên toàn quốc. Nhưng trong khi hành khách hoan nghênh sự đơn giản về giá vé, các hiệp hội giao thông lại khẩn thiết yêu cầu đầu tư mạnh hơn vào cơ sở hạ tầng.',
    paragraphs: [
      {
        de: 'Früher glich der Kauf einer einfachen Monatskarte in vielen deutschen Regionen einer kleinen Wissenschaft: Tarifzonen, Wabenpläne und unterschiedliche Verkehrsverbünde sorgten selbst bei erfahrenen Pendlern regelmäßig für Verwirrung.',
        vi: 'Trước đây, việc mua một tấm vé tháng đơn giản ở nhiều vùng nước Đức giống như một môn khoa học phức tạp: các vùng giá vé, sơ đồ tổ ong và những hiệp hội giao thông khác nhau thường xuyên gây bối rối ngay cả với những người đi làm giàu kinh nghiệm.',
        grammarHighlight: 'gleichen + Dativ (glich einer kleinen Wissenschaft = giống như một môn khoa học nhỏ); sorgen für + Akkusativ (gây ra/mang lại điều gì).',
      },
      {
        de: 'Mit dem bundesweit gültigen Deutschlandticket ist diese bürokratische Hürde im Nahverkehr weitgehend verschwunden. Wer heute in Hamburg in die S-Bahn steigt, kann am selben Wochenende problemlos auch die Straßenbahn in Dresden oder den Regionalexpress nach Garmisch nutzen.',
        vi: 'Với tấm vé Deutschlandticket có hiệu lực trên toàn liên bang, rào cản hành chính này trong giao thông công cộng nội vùng phần lớn đã biến mất. Ai hôm nay lên tàu S-Bahn ở Hamburg thì cùng cuối tuần đó cũng có thể dễ dàng đi tàu điện ở Dresden hoặc tàu vùng đến Garmisch.',
        grammarHighlight: 'die bürokratische Hürde = rào cản hành chính; weitgehend = phần lớn, ở mức độ rộng.',
      },
      {
        de: 'Verkehrsforscher weisen jedoch darauf hin, dass ein günstiger Fahrpreis allein noch keine Verkehrswende garantiert. Entscheidend für die Zufriedenheit der Bürgerinnen und Bürger bleibt die Zuverlässigkeit der Verbindungen sowie eine dichtere Taktung im ländlichen Raum.',
        vi: 'Tuy nhiên, các nhà nghiên cứu giao thông chỉ ra rằng một mức giá vé rẻ đơn thuần vẫn chưa đảm bảo cho cuộc chuyển dịch giao thông. Yếu tố quyết định đối với sự hài lòng của người dân vẫn là độ tin cậy của các chuyến tàu cũng như tần suất chuyến dày hơn ở khu vực nông thôn.',
        grammarHighlight: 'hin|weisen auf (+ Akkusativ) -> weisen darauf hin, dass... (chỉ ra/lưu ý rằng...).',
      },
    ],
  },
  {
    id: 'news-2',
    titleDe: 'Vier-Tage-Woche im Praxistest: Warum mittelständische Betriebe umdenken',
    titleVi: 'Tuần làm việc 4 ngày trong thử nghiệm thực tế: Tại sao các doanh nghiệp vừa và nhỏ tại Đức thay đổi tư duy',
    source: 'ZEIT Arbeit · Wirtschaft',
    level: 'C1',
    readTime: '5 phút đọc',
    publishedDate: '15. November 2026',
    topic: 'Arbeitswelt & Karriere',
    leadDe:
      'Angesichts des akuten Fachkräftemangels testen immer mehr deutsche Handwerksbetriebe und IT-Unternehmen verkürzte Arbeitszeiten bei vollem Lohnausgleich. Die ersten Ergebnisse überraschen selbst skeptische Ökonomen.',
    leadVi:
      'Trước tình trạng thiếu hụt nhân lực có tay nghề gay gắt, ngày càng nhiều xưởng kỹ thuật thủ công và công ty CNTT của Đức thử nghiệm rút ngắn giờ làm nhưng vẫn giữ nguyên lương. Những kết quả đầu tiên gây bất ngờ cho cả các nhà kinh tế học hoài nghi.',
    paragraphs: [
      {
        de: 'Auf den ersten Blick klingt das Konzept widersprüchlich: Wie soll ein Unternehmen wettbewerbsfähig bleiben, wenn die Belegschaft plötzlich zwanzig Prozent weniger Zeit im Büro oder in der Werkstatt verbringt?',
        vi: 'Thoạt nhìn, khái niệm này nghe có vẻ mâu thuẫn: Làm sao một doanh nghiệp có thể duy trì sức cạnh tranh khi đội ngũ nhân sự đột nhiên dành ít hơn 20% thời gian tại văn phòng hoặc xưởng sản xuất?',
        grammarHighlight: 'Auf den ersten Blick = Thoạt nhìn; die Belegschaft = toàn bộ đội ngũ nhân viên của một công ty.',
      },
      {
        de: 'Die wissenschaftliche Begleitstudie liefert eine einleuchtende Erklärung: Durch klare Prioritäten, kürzere Besprechungen und den gezielten Einsatz digitaler Werkzeuge sinkt die Zahl unproduktiver Leerlaufzeiten drastisch.',
        vi: 'Nghiên cứu khoa học đồng hành đưa ra một lời giải thích thuyết phục: Nhờ các ưu tiên rõ ràng, những cuộc họp ngắn gọn hơn và việc ứng dụng có mục tiêu các công cụ số, số lượng khoảng thời gian chết không hiệu quả giảm mạnh.',
        grammarHighlight: 'einleuchtend (Partizip I) = hợp lý, sáng tỏ; der gezielte Einsatz = việc áp dụng có định hướng rõ ràng.',
      },
      {
        de: 'Zudem berichten die teilnehmenden Betriebe von einem spürbaren Rückgang der Krankheitstage und einer doppelt so hohen Bewerberzahl auf offene Stellen — ein entscheidender Vorteil im Wettbewerb um junge Talente.',
        vi: 'Thêm vào đó, các doanh nghiệp tham gia ghi nhận sự sụt giảm rõ rệt về số ngày nghỉ ốm và lượng hồ sơ ứng tuyển vào các vị trí trống tăng gấp đôi — một lợi thế mang tính quyết định trong cuộc đua thu hút nhân tài trẻ.',
        grammarHighlight: 'berichten von (+ Dativ) = báo cáo/kể về điều gì; der Rückgang + Genitiv = sự sụt giảm của cái gì.',
      },
    ],
  },
  {
    id: 'news-3',
    titleDe: 'Digitale Entgiftung: Wie Studierende in Heidelberg wieder zum gedruckten Buch finden',
    titleVi: 'Thanh lọc kỹ thuật số: Sinh viên tại Heidelberg tìm lại niềm vui đọc sách giấy như thế nào',
    source: 'FAZ Campus · Bildung & Kultur',
    level: 'B1',
    readTime: '3 phút đọc',
    publishedDate: '12. November 2026',
    topic: 'Studium & Psychologie',
    leadDe:
      'Zwischen Vorlesungsfolien auf dem Tablet und endlosen Nachrichten auf dem Smartphone wächst an deutschen Universitäten die Sehnsucht nach analoger Konzentration. Lesekreise ohne Bildschirme erleben derzeit einen bemerkenswerten Aufschwung.',
    leadVi:
      'Giữa những trang slide bài giảng trên máy tính bảng và tin nhắn bất tận trên điện thoại, tại các trường đại học Đức đang lớn dần niềm khao khát sự tập trung thuần túy. Các câu lạc bộ đọc sách không màn hình hiện đang trải qua một sự trỗi dậy đáng chú ý.',
    paragraphs: [
      {
        de: 'Jeden Mittwochabend treffen sich dreißig Studierende verschiedener Fakultäten im historischen Innenhof der Heidelberger Universitätsbibliothek. Die einzige Regel des Abends lautet: Alle Smartphones bleiben für zwei Stunden ausgeschaltet in der Tasche.',
        vi: 'Mỗi tối thứ Tư, ba mươi sinh viên từ các khoa khác nhau gặp nhau tại sân trong lịch sử của Thư viện Đại học Heidelberg. Quy tắc duy nhất của buổi tối là: Tất cả điện thoại thông minh đều tắt nguồn và nằm yên trong túi suốt hai giờ đồng hồ.',
        grammarHighlight: 'Die Regel lautet: ... = Quy tắc là / phát biểu rằng...; ausgeschaltet bleiben = giữ nguyên trạng thái tắt.',
      },
      {
        de: '„Wenn ich auf Papier lese, erinnere ich mich nicht nur an den Inhalt, sondern auch daran, wo genau ein Satz auf der linken oder rechten Seite stand“, erzählt Lukas, der im vierten Semester Medizin studiert.',
        vi: '"Khi tôi đọc trên giấy, tôi không chỉ nhớ nội dung mà còn nhớ chính xác một câu nằm ở vị trí nào bên trang trái hay trang phải", Lukas, sinh viên y khoa học kỳ bốn chia sẻ.',
        grammarHighlight: 'sich erinnern an (+ Akkusativ) -> daran, wo... (nhớ về điều gì).',
      },
    ],
  },
];

export const MANGA_EPISODES: MangaEpisode[] = [
  {
    id: 'manga-1',
    titleDe: 'Kapitel 1: Das große WG-Casting in Berlin-Kreuzberg',
    titleVi: 'Chương 1: Buổi phỏng vấn tìm bạn cùng phòng (WG-Casting) ở Berlin-Kreuzberg',
    location: 'Berlin-Kreuzberg · Altbauwohnung im 4. Stock',
    level: 'B1',
    culturalNote:
      'Ở Đức, khi một phòng trong căn hộ ghép (Wohngemeinschaft - WG) trống, các thành viên hiện tại thường tổ chức "WG-Casting" — một buổi trò chuyện uống trà/bia để xem tính cách và thói quen dọn dẹp (Putzplan) có hợp nhau không.',
    panels: [
      {
        panelNumber: 1,
        sceneTheme: 'ubahn',
        sceneCaptionDe: '18:45 Uhr — Minh steigt an der U-Bahn-Station Kottbusser Tor aus und prüft noch einmal die Hausnummer.',
        sceneCaptionVi: '18:45 — Minh bước ra khỏi ga tàu điện ngầm Kottbusser Tor và kiểm tra lại số nhà một lần nữa.',
        dialogues: [
          {
            speaker: 'Minh (22, Informatikstudent)',
            role: 'Người đi tìm phòng WG',
            de: 'Hoffentlich bin ich pünktlich! Auf WG-Gesucht hatten sie über hundert Nachrichten in nur zwei Stunden...',
            vi: 'Hy vọng là mình đến đúng giờ! Trên trang WG-Gesucht họ nhận được hơn một trăm tin nhắn chỉ trong vòng hai tiếng...',
            particleNote: 'Hoffentlich đứng đầu câu giúp bày tỏ hy vọng tự nhiên mà không cần mệnh đề phụ.',
          },
          {
            speaker: 'Lukas (Mitbewohner)',
            role: 'Chủ phòng mở cửa',
            de: 'Hey, du musst Minh sein! Komm doch rein, zieh dir einfach die Schuhe im Flur aus.',
            vi: 'Chào cậu, hẳn cậu là Minh rồi! Cứ vào nhà đi, cậu cởi giày ngay ngoài hành lang nhé.',
            particleNote: 'Trợ từ "doch" và "einfach" trong câu mệnh lệnh (Komm doch rein!) làm lời mời trở nên ấm áp, thân thiện.',
          },
        ],
      },
      {
        panelNumber: 2,
        sceneTheme: 'wg_kitchen',
        sceneCaptionDe: 'In der gemütlichen Altbauküche sitzen schon Hannah und Lukas bei Kräutertee am Holztisch.',
        sceneCaptionVi: 'Trong căn bếp cổ điển ấm cúng, Hannah và Lukas đã ngồi sẵn bên bàn gỗ cùng trà thảo mộc.',
        dialogues: [
          {
            speaker: 'Hannah (Architekturstudentin)',
            role: 'Bạn cùng phòng',
            de: 'Erzähl mal ganz entspannt: Wie stellst du dir denn das Zusammenleben in einer WG vor?',
            vi: 'Kể tụi mình nghe thoải mái nhé: Cậu hình dung cuộc sống chung trong một nhà WG sẽ như thế nào?',
            particleNote: 'sich (Dativ) etwas (Akkusativ) vorstellen = hình dung, tưởng tượng điều gì; trợ từ "mal" & "denn" giảm áp lực câu hỏi.',
          },
          {
            speaker: 'Minh',
            role: 'Người đi tìm phòng WG',
            de: 'Mir ist es total wichtig, dass man abends mal zusammen in der Küche kocht, aber auch respektiert, wenn jemand vor den Prüfungen seine Ruhe braucht.',
            vi: 'Với mình điều cực kỳ quan trọng là buổi tối thỉnh thoảng anh em nấu ăn chung trong bếp, nhưng cũng tôn trọng khi ai đó cần không gian yên tĩnh trước kỳ thi.',
            particleNote: 'seine Ruhe brauchen / haben wollen = cần sự yên tĩnh riêng tư (cụm từ cửa miệng cực kỳ phổ biến ở Đức).',
          },
        ],
      },
      {
        panelNumber: 3,
        sceneTheme: 'spati_night',
        sceneCaptionDe: 'Die Stimmung ist sofort herzlich — selbst beim gefürchteten Thema „Putzplan & Mülltrennung“.',
        sceneCaptionVi: 'Bầu không khí lập tức trở nên ăn ý — ngay cả khi bàn đến chủ đề đáng sợ "Lịch trực nhật & Phân loại rác".',
        dialogues: [
          {
            speaker: 'Lukas',
            role: 'Bạn cùng phòng',
            de: 'Klingt super sympathisch! Und solange der Biomüll nicht im Gelben Sack landet, kommen wir bestimmt bestens miteinander klar.',
            vi: 'Nghe hợp cạ quá đi chứ! Và chừng nào rác hữu cơ không bị bỏ nhầm vào túi rác nhựa màu vàng (Gelber Sack) thì chắc chắn tụi mình sẽ sống chung cực kỳ hòa thuận.',
            particleNote: 'miteinander klarkommen = hòa hợp, sống/làm việc ăn ý với nhau; der Gelbe Sack = túi đựng rác bao bì/nhựa tái chế tại Đức.',
          },
          {
            speaker: 'Hannah',
            role: 'Bạn cùng phòng',
            de: 'Weißt du was? Wir sagen die anderen Termine für morgen einfach ab. Das Zimmer gehört ab dem ersten Oktober dir!',
            vi: 'Cậu biết gì không? Tụi mình hủy luôn mấy lịch hẹn ngày mai đây. Căn phòng này từ mùng 1 tháng 10 chính thức là của cậu!',
            particleNote: 'jdm. gehören (Das Zimmer gehört dir = Căn phòng thuộc về cậu - luôn đi với Dativ).',
          },
        ],
      },
    ],
  },
  {
    id: 'manga-2',
    titleDe: 'Kapitel 2: Die erste Nachtschicht im Klinikum München',
    titleVi: 'Chương 2: Ca trực đêm đầu tiên tại Bệnh viện Đại học München',
    location: 'Klinikum Großhadern München · Station 4B',
    level: 'B2',
    culturalNote:
      'Trong môi trường y tế và kỹ thuật tại Đức, việc chuyển đổi linh hoạt giữa thuật ngữ chuyên môn (Fachsprache) với đồng nghiệp và ngôn ngữ đời thường ấm áp (Umgangssprache) với bệnh nhân là kỹ năng B2-C1 thiết yếu.',
    panels: [
      {
        panelNumber: 1,
        sceneTheme: 'uni_mensa',
        sceneCaptionDe: '21:30 Uhr — Übergabe im Stationszimmer vor Beginn der Nachtschicht.',
        sceneCaptionVi: '21:30 — Bàn giao ca trực tại phòng điều dưỡng/bác sĩ trước khi bắt đầu ca đêm.',
        dialogues: [
          {
            speaker: 'Oberärztin Dr. Kramer',
            role: 'Bác sĩ trưởng khoa',
            de: 'Behalten Sie bitte heute Nacht vor allem den Patienten in Zimmer 412 im Auge; sein Blutdruck schwankt seit dem Nachmittag.',
            vi: 'Đêm nay anh/chị làm ơn đặc biệt để mắt tới bệnh nhân ở phòng 412 nhé; huyết áp của ông ấy dao động từ chiều tới giờ.',
            particleNote: 'jemanden/etwas im Auge behalten = theo dõi sát, để mắt tới ai/cái gì.',
          },
          {
            speaker: 'Lan (Assistenzärztin)',
            role: 'Bác sĩ nội trú',
            de: 'Alles klar, Frau Doktor Kramer. Ich kontrolliere die Werte gleich um zweiundzwanzig Uhr noch einmal persönlich.',
            vi: 'Rõ rồi ạ, thưa bác sĩ Kramer. Tôi sẽ đích thân kiểm tra lại các chỉ số một lần nữa ngay lúc 22 giờ.',
            particleNote: 'die Werte = các chỉ số xét nghiệm/sinh hiệu (Blutwerte, Vitalwerte).',
          },
        ],
      },
      {
        panelNumber: 2,
        sceneTheme: 'wg_kitchen',
        sceneCaptionDe: '22:10 Uhr — Herr Huber (74) kann wegen der ungewohnten Umgebung nicht einschlafen.',
        sceneCaptionVi: '22:10 — Ông Huber (74 tuổi) không thể chợp mắt vì môi trường bệnh viện lạ lẫm.',
        dialogues: [
          {
            speaker: 'Herr Huber (Patient)',
            role: 'Bệnh nhân',
            de: 'Ach Schwester... äh, Frau Doktor, machen Sie sich bloß keine Umstände wegen mir. Ich mache mir nur ein bisschen Sorgen wegen der Untersuchung morgen.',
            vi: 'Ôi cô y tá... à bác sĩ ơi, cô đừng bận tâm phiền phức vì tôi làm gì. Tôi chỉ hơi lo lắng một chút về buổi kiểm tra ngày mai thôi.',
            particleNote: 'sich (Dativ) keine Umstände machen = đừng khách sáo/bày vẽ phiền phức; sich Sorgen machen um/wegen = lo lắng về.',
          },
          {
            speaker: 'Lan',
            role: 'Bác sĩ nội trú',
            de: 'Das ist doch völlig verständlich, Herr Huber. Der Eingriff morgen ist reine Routine, und Ihre Werte sehen heute Abend schon viel stabiler aus!',
            vi: 'Điều đó hoàn toàn dễ hiểu mà ông Huber. Thủ thuật ngày mai chỉ là quy trình thường quy thôi, và các chỉ số của ông tối nay trông đã ổn định hơn nhiều rồi!',
            particleNote: 'Trợ từ "doch" trong câu khẳng định (Das ist doch völlig verständlich) tạo sự đồng cảm, trấn an người nghe.',
          },
        ],
      },
    ],
  },
];
