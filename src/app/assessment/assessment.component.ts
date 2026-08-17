import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

// ── Types ──────────────────────────────────────────────────────────────────
export type RiasecKey = 'R' | 'I' | 'A' | 'S' | 'E' | 'C';
export type RiasecResult = Record<RiasecKey, number>;

export interface RatingQuestion  { id: number; type: RiasecKey; text: string; }
export interface TrueFalseQuestion { id: number; type: RiasecKey; text: string; }
export interface McOption         { label: string; type: RiasecKey; }
export interface McQuestion       { id: number; text: string; options: McOption[]; }

export interface FullAssessmentResult {
  scores: RiasecResult;
  topTypes: RiasecKey[];
  completedAt: string;
  conclusion: string;
  careerSuggestions: string[];
  strengthSummary: string;
}

// ── Rating Scale Questions (1–5) ───────────────────────────────────────────
const RATING_QUESTIONS: RatingQuestion[] = [
  { id: 1,  type: 'R', text: 'I enjoy working with tools, machines or equipment.' },
  { id: 2,  type: 'R', text: 'I like building or fixing things with my hands.' },
  { id: 3,  type: 'R', text: 'I prefer working outdoors or in a physical environment.' },
  { id: 4,  type: 'R', text: 'I enjoy activities that involve physical strength or coordination.' },
  { id: 5,  type: 'R', text: 'I like working with plants, animals or nature.' },
  { id: 6,  type: 'R', text: 'I prefer practical, hands-on tasks over theoretical ones.' },
  { id: 7,  type: 'I', text: 'I enjoy solving complex problems or puzzles.' },
  { id: 8,  type: 'I', text: 'I like reading about science, technology or research.' },
  { id: 9,  type: 'I', text: 'I enjoy analysing data or finding patterns in information.' },
  { id: 10, type: 'I', text: 'I like asking "why" and understanding how things work.' },
  { id: 11, type: 'I', text: 'I enjoy conducting experiments or testing ideas.' },
  { id: 12, type: 'I', text: 'I prefer thinking through problems carefully before acting.' },
  { id: 13, type: 'A', text: 'I enjoy expressing myself through art, music or writing.' },
  { id: 14, type: 'A', text: 'I like coming up with creative or original ideas.' },
  { id: 15, type: 'A', text: 'I enjoy designing things — visually or conceptually.' },
  { id: 16, type: 'A', text: 'I prefer work that allows me to be imaginative and expressive.' },
  { id: 17, type: 'A', text: 'I enjoy performing, storytelling or creative writing.' },
  { id: 18, type: 'A', text: 'I like environments where there are no strict rules or routines.' },
  { id: 19, type: 'S', text: 'I enjoy helping others solve their problems.' },
  { id: 20, type: 'S', text: 'I like teaching, coaching or mentoring people.' },
  { id: 21, type: 'S', text: 'I feel energised when working in a team or group.' },
  { id: 22, type: 'S', text: 'I enjoy listening to people and understanding their feelings.' },
  { id: 23, type: 'S', text: 'I like volunteering or contributing to my community.' },
  { id: 24, type: 'S', text: 'I prefer careers that make a positive difference in people\'s lives.' },
  { id: 25, type: 'E', text: 'I enjoy leading or managing a group of people.' },
  { id: 26, type: 'E', text: 'I like persuading or convincing others of my ideas.' },
  { id: 27, type: 'E', text: 'I enjoy selling, negotiating or making deals.' },
  { id: 28, type: 'E', text: 'I like taking risks and starting new projects or ventures.' },
  { id: 29, type: 'E', text: 'I enjoy public speaking or presenting to an audience.' },
  { id: 30, type: 'E', text: 'I am motivated by competition and achieving goals.' },
  { id: 31, type: 'C', text: 'I enjoy organising, filing or keeping records in order.' },
  { id: 32, type: 'C', text: 'I like following clear instructions and established procedures.' },
  { id: 33, type: 'C', text: 'I prefer structured environments with clear expectations.' },
  { id: 34, type: 'C', text: 'I enjoy working with numbers, spreadsheets or financial data.' },
  { id: 35, type: 'C', text: 'I like planning and scheduling tasks carefully.' },
  { id: 36, type: 'C', text: 'I prefer accuracy and attention to detail over creativity.' },
];

// ── True / False Questions ─────────────────────────────────────────────────
const TF_QUESTIONS: TrueFalseQuestion[] = [
  { id: 101, type: 'R', text: 'I would rather build a bookshelf than read a book about how to build one.' },
  { id: 102, type: 'R', text: 'I feel most satisfied when I can see a physical result of my work.' },
  { id: 103, type: 'R', text: 'I prefer working with my hands over working at a desk.' },
  { id: 104, type: 'R', text: 'I enjoy activities like cooking, gardening, sport or DIY projects.' },
  { id: 105, type: 'R', text: 'I find it easier to learn by doing rather than by reading or listening.' },
  { id: 106, type: 'R', text: 'I am comfortable working with machinery or technical equipment.' },
  { id: 107, type: 'I', text: 'I often find myself wondering how or why things work the way they do.' },
  { id: 108, type: 'I', text: 'I enjoy reading or watching content about science, history or technology.' },
  { id: 109, type: 'I', text: 'I prefer to research a topic deeply before forming an opinion.' },
  { id: 110, type: 'I', text: 'I enjoy maths, logic puzzles or strategy games.' },
  { id: 111, type: 'I', text: 'I like working independently on complex problems.' },
  { id: 112, type: 'I', text: 'I find it satisfying to discover a new fact or insight.' },
  { id: 113, type: 'A', text: 'I often see the world differently from most people around me.' },
  { id: 114, type: 'A', text: 'I enjoy activities like drawing, photography, music or creative writing.' },
  { id: 115, type: 'A', text: 'I prefer to express my ideas in my own unique way rather than follow a template.' },
  { id: 116, type: 'A', text: 'I feel restricted when I have to follow very strict rules or formats.' },
  { id: 117, type: 'A', text: 'I notice beauty, design or creativity in everyday things.' },
  { id: 118, type: 'A', text: 'I enjoy imagining new possibilities or "what if" scenarios.' },
  { id: 119, type: 'S', text: 'People often come to me when they need advice or support.' },
  { id: 120, type: 'S', text: 'I feel fulfilled when I help someone overcome a challenge.' },
  { id: 121, type: 'S', text: 'I enjoy working in environments where I interact with many different people.' },
  { id: 122, type: 'S', text: 'I am a good listener and people feel comfortable talking to me.' },
  { id: 123, type: 'S', text: 'I care deeply about fairness and the wellbeing of others.' },
  { id: 124, type: 'S', text: 'I would find it rewarding to work in education, healthcare or social services.' },
  { id: 125, type: 'E', text: 'I enjoy being in charge and making decisions for a group.' },
  { id: 126, type: 'E', text: 'I am comfortable speaking in front of a crowd.' },
  { id: 127, type: 'E', text: 'I like the idea of starting my own business one day.' },
  { id: 128, type: 'E', text: 'I enjoy debating and defending my point of view.' },
  { id: 129, type: 'E', text: 'I am motivated by recognition, status or financial success.' },
  { id: 130, type: 'E', text: 'I find it easy to motivate and inspire other people.' },
  { id: 131, type: 'C', text: 'I like having a clear plan before starting any task.' },
  { id: 132, type: 'C', text: 'I keep my workspace, notes or belongings well organised.' },
  { id: 133, type: 'C', text: 'I prefer tasks that have a clear right or wrong answer.' },
  { id: 134, type: 'C', text: 'I enjoy working with budgets, schedules or data.' },
  { id: 135, type: 'C', text: 'I feel uncomfortable when things are disorganised or unclear.' },
  { id: 136, type: 'C', text: 'I take pride in being accurate and thorough in everything I do.' },
];

// ── Multiple Choice Scenario Questions ────────────────────────────────────
const MC_QUESTIONS: McQuestion[] = [
  {
    id: 201,
    text: 'Your school asks you to lead a project. Which role would you most enjoy?',
    options: [
      { label: 'Building or constructing the physical display or model', type: 'R' },
      { label: 'Researching the topic and analysing the data', type: 'I' },
      { label: 'Designing the visuals, layout and creative presentation', type: 'A' },
      { label: 'Coordinating the team and making sure everyone is supported', type: 'S' },
      { label: 'Leading the group, presenting and pitching the final result', type: 'E' },
      { label: 'Managing the schedule, budget and keeping everything organised', type: 'C' },
    ],
  },
  {
    id: 202,
    text: 'You have a free Saturday with no plans. What are you most likely to do?',
    options: [
      { label: 'Fix something around the house, go hiking or do a sport', type: 'R' },
      { label: 'Watch a documentary, read or explore a topic that interests you', type: 'I' },
      { label: 'Draw, write, make music, take photos or create something', type: 'A' },
      { label: 'Spend time with friends or family, or help someone who needs it', type: 'S' },
      { label: 'Work on a side project, plan something new or network', type: 'E' },
      { label: 'Organise your room, plan your week or sort out your finances', type: 'C' },
    ],
  },
  {
    id: 203,
    text: 'Which of these work environments sounds most appealing to you?',
    options: [
      { label: 'Outdoors, a workshop, lab or somewhere physical and active', type: 'R' },
      { label: 'A quiet research environment, library or tech lab', type: 'I' },
      { label: 'A creative studio, design agency or open, flexible space', type: 'A' },
      { label: 'A school, hospital, community centre or people-focused setting', type: 'S' },
      { label: 'A fast-paced office, boardroom or entrepreneurial environment', type: 'E' },
      { label: 'A structured office with clear processes and organised systems', type: 'C' },
    ],
  },
  {
    id: 204,
    text: 'A friend is struggling with a big decision. What do you naturally do?',
    options: [
      { label: 'Help them take practical action — do something about it', type: 'R' },
      { label: 'Research the options and present them with facts and analysis', type: 'I' },
      { label: 'Help them think creatively and explore unexpected possibilities', type: 'A' },
      { label: 'Listen carefully, offer emotional support and encouragement', type: 'S' },
      { label: 'Take charge, give clear advice and help them make a decision', type: 'E' },
      { label: 'Help them create a structured plan with steps and timelines', type: 'C' },
    ],
  },
  {
    id: 205,
    text: 'Which subject or activity do you find most engaging at school?',
    options: [
      { label: 'Technology, Engineering, Agriculture or Physical Education', type: 'R' },
      { label: 'Mathematics, Science, Geography or Computer Science', type: 'I' },
      { label: 'Art, Drama, Music, Design or Creative Writing', type: 'A' },
      { label: 'Life Orientation, History, Languages or Community Service', type: 'S' },
      { label: 'Business Studies, Economics or Debate and Leadership activities', type: 'E' },
      { label: 'Accounting, Mathematics or any subject with clear rules and structure', type: 'C' },
    ],
  },
  {
    id: 206,
    text: 'In 10 years, which of these futures excites you most?',
    options: [
      { label: 'Working as an engineer, technician, farmer or in a skilled trade', type: 'R' },
      { label: 'Working as a scientist, researcher, doctor or data analyst', type: 'I' },
      { label: 'Working as a designer, artist, writer, filmmaker or architect', type: 'A' },
      { label: 'Working as a teacher, counsellor, nurse or social worker', type: 'S' },
      { label: 'Running my own business or leading a team in a corporate environment', type: 'E' },
      { label: 'Working as an accountant, financial analyst, auditor or administrator', type: 'C' },
    ],
  },
];

// ── Type metadata ──────────────────────────────────────────────────────────
const TYPE_META: Record<string, { label: string; emoji: string; desc: string; color: string; careers: string[] }> = {
  R: { label: 'Realistic',     emoji: '🔧', color: '#f59e0b',
       desc: 'The Doer — practical, hands-on, loves working with tools and the physical world.',
       careers: ['Civil Engineer', 'Electrician', 'Agricultural Scientist', 'Mechanical Engineer', 'Paramedic', 'Pilot', 'Veterinarian'] },
  I: { label: 'Investigative', emoji: '🔬', color: '#60a5fa',
       desc: 'The Thinker — analytical, curious, loves research, science and solving problems.',
       careers: ['Medical Doctor', 'Data Scientist', 'Pharmacist', 'Software Engineer', 'Research Scientist', 'Actuary', 'Forensic Analyst'] },
  A: { label: 'Artistic',      emoji: '🎨', color: '#f472b6',
       desc: 'The Creator — imaginative, expressive, loves art, design and original ideas.',
       careers: ['Graphic Designer', 'Architect', 'Journalist', 'Film Director', 'UX Designer', 'Fashion Designer', 'Copywriter'] },
  S: { label: 'Social',        emoji: '🤝', color: '#34d399',
       desc: 'The Helper — empathetic, caring, loves working with and supporting people.',
       careers: ['Teacher', 'Psychologist', 'Social Worker', 'Nurse', 'HR Manager', 'Counsellor', 'Community Development Worker'] },
  E: { label: 'Enterprising',  emoji: '🚀', color: '#a78bfa',
       desc: 'The Persuader — ambitious, confident, loves leading, selling and influencing.',
       careers: ['Entrepreneur', 'Marketing Manager', 'Lawyer', 'Sales Director', 'Investment Banker', 'Political Analyst', 'Business Consultant'] },
  C: { label: 'Conventional',  emoji: '📋', color: '#fb923c',
       desc: 'The Organizer — detail-oriented, structured, loves order, data and clear processes.',
       careers: ['Accountant', 'Financial Analyst', 'Auditor', 'Office Manager', 'Logistics Coordinator', 'Tax Consultant', 'Database Administrator'] },
};

// ── Conclusion generator ───────────────────────────────────────────────────
function buildConclusion(topTypes: RiasecKey[], scores: RiasecResult): string {
  const t1 = TYPE_META[topTypes[0]];
  const t2 = TYPE_META[topTypes[1]];
  const t3 = TYPE_META[topTypes[2]];
  const s1 = scores[topTypes[0]];
  const s2 = scores[topTypes[1]];

  let strength = s1 >= 80 ? 'a very strong' : s1 >= 65 ? 'a strong' : 'a clear';
  let combo = `${t1.label} (${t1.emoji}) and ${t2.label} (${t2.emoji})`;

  return `Your assessment results show ${strength} preference for ${t1.label} — ${t1.desc.split('—')[1].trim()} ` +
    `With a score of ${s1}%, this is your dominant career personality type. ` +
    `Combined with your ${t2.label} score of ${s2}%, your profile suggests you are someone who is both ${t1.label.toLowerCase()} and ${t2.label.toLowerCase()} in nature. ` +
    `${t3 ? `Your third dimension — ${t3.label} at ${scores[topTypes[2]]}% — adds further depth to your profile. ` : ''}` +
    `People with a ${combo} profile tend to thrive in environments that blend ${t1.label.toLowerCase()} work with ${t2.label.toLowerCase()} thinking. ` +
    `This combination, together with your academic results, gives Pathly a much clearer picture of the careers that may truly fit you — not just what you are academically prepared for, but what may energise and motivate you every day.`;
}

const STORAGE_KEY = 'pathly_riasec_result';

// ── Phases ─────────────────────────────────────────────────────────────────
type Phase = 'rating' | 'truefalse' | 'multichoice' | 'results';

@Component({
  selector: 'app-assessment',
  imports: [CommonModule],
  templateUrl: './assessment.component.html',
  styleUrl: './assessment.component.css'
})
export class AssessmentComponent {

  readonly ratingGroups = [
    { key: 'R' as RiasecKey, label: 'Realistic — The Doer',         emoji: '🔧', questions: RATING_QUESTIONS.filter(q => q.type === 'R') },
    { key: 'I' as RiasecKey, label: 'Investigative — The Thinker',  emoji: '🔬', questions: RATING_QUESTIONS.filter(q => q.type === 'I') },
    { key: 'A' as RiasecKey, label: 'Artistic — The Creator',        emoji: '🎨', questions: RATING_QUESTIONS.filter(q => q.type === 'A') },
    { key: 'S' as RiasecKey, label: 'Social — The Helper',           emoji: '🤝', questions: RATING_QUESTIONS.filter(q => q.type === 'S') },
    { key: 'E' as RiasecKey, label: 'Enterprising — The Persuader',  emoji: '🚀', questions: RATING_QUESTIONS.filter(q => q.type === 'E') },
    { key: 'C' as RiasecKey, label: 'Conventional — The Organizer',  emoji: '📋', questions: RATING_QUESTIONS.filter(q => q.type === 'C') },
  ];

  readonly tfGroups = [
    { key: 'R' as RiasecKey, label: 'Realistic — True or False',        emoji: '🔧', questions: TF_QUESTIONS.filter(q => q.type === 'R') },
    { key: 'I' as RiasecKey, label: 'Investigative — True or False',     emoji: '🔬', questions: TF_QUESTIONS.filter(q => q.type === 'I') },
    { key: 'A' as RiasecKey, label: 'Artistic — True or False',          emoji: '🎨', questions: TF_QUESTIONS.filter(q => q.type === 'A') },
    { key: 'S' as RiasecKey, label: 'Social — True or False',            emoji: '🤝', questions: TF_QUESTIONS.filter(q => q.type === 'S') },
    { key: 'E' as RiasecKey, label: 'Enterprising — True or False',      emoji: '🚀', questions: TF_QUESTIONS.filter(q => q.type === 'E') },
    { key: 'C' as RiasecKey, label: 'Conventional — True or False',      emoji: '📋', questions: TF_QUESTIONS.filter(q => q.type === 'C') },
  ];

  readonly mcQuestions = MC_QUESTIONS;
  readonly typeMeta    = TYPE_META;
  readonly scaleLabels = ['Not at all like me', 'Slightly like me', 'Somewhat like me', 'Mostly like me', 'Very much like me'];

  // State
  phase          = signal<Phase>('rating');
  ratingGroup    = signal(0);
  tfGroup        = signal(0);
  ratingAnswers  = signal<Record<number, number>>({});   // 1–5
  tfAnswers      = signal<Record<number, boolean | null>>({});  // true/false/null
  mcAnswers      = signal<Record<number, RiasecKey>>({});

  // ── Progress ──────────────────────────────────────────────────────────────
  overallProgress = computed(() => {
    const rDone = Object.keys(this.ratingAnswers()).length;
    const tDone = Object.keys(this.tfAnswers()).length;
    const mDone = Object.keys(this.mcAnswers()).length;
    const total = RATING_QUESTIONS.length + TF_QUESTIONS.length + MC_QUESTIONS.length;
    return Math.round(((rDone + tDone + mDone) / total) * 100);
  });

  // ── Rating helpers ────────────────────────────────────────────────────────
  currentRatingGroupAnswered = computed(() =>
    this.ratingGroups[this.ratingGroup()].questions.every(q => this.ratingAnswers()[q.id] !== undefined)
  );

  setRating(id: number, score: number) { this.ratingAnswers.update(a => ({ ...a, [id]: score })); }
  getRating(id: number): number        { return this.ratingAnswers()[id] ?? 0; }

  nextRatingGroup() {
    if (this.ratingGroup() < this.ratingGroups.length - 1) {
      this.ratingGroup.update(g => g + 1);
    } else {
      this.phase.set('truefalse');
      this.tfGroup.set(0);
    }
    scrollTo(0, 0);
  }

  prevRatingGroup() {
    if (this.ratingGroup() > 0) this.ratingGroup.update(g => g - 1);
    scrollTo(0, 0);
  }

  // ── True/False helpers ────────────────────────────────────────────────────
  currentTfGroupAnswered = computed(() =>
    this.tfGroups[this.tfGroup()].questions.every(q => this.tfAnswers()[q.id] !== undefined)
  );

  setTf(id: number, val: boolean) { this.tfAnswers.update(a => ({ ...a, [id]: val })); }
  getTf(id: number): boolean | null { return this.tfAnswers()[id] ?? null; }

  nextTfGroup() {
    if (this.tfGroup() < this.tfGroups.length - 1) {
      this.tfGroup.update(g => g + 1);
    } else {
      this.phase.set('multichoice');
    }
    scrollTo(0, 0);
  }

  prevTfGroup() {
    if (this.tfGroup() > 0) {
      this.tfGroup.update(g => g - 1);
    } else {
      this.phase.set('rating');
      this.ratingGroup.set(this.ratingGroups.length - 1);
    }
    scrollTo(0, 0);
  }

  // ── Multiple choice helpers ───────────────────────────────────────────────
  allMcAnswered = computed(() => MC_QUESTIONS.every(q => this.mcAnswers()[q.id] !== undefined));

  setMc(id: number, type: RiasecKey) { this.mcAnswers.update(a => ({ ...a, [id]: type })); }
  getMc(id: number): RiasecKey | null { return this.mcAnswers()[id] ?? null; }

  prevMc() {
    this.phase.set('truefalse');
    this.tfGroup.set(this.tfGroups.length - 1);
    scrollTo(0, 0);
  }

  // ── Final scoring & result ────────────────────────────────────────────────
  result = computed<FullAssessmentResult | null>(() => {
    if (this.phase() !== 'results') return null;

    const raw: RiasecResult = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

    // Rating scale: weight 3 — max per type = 6×5×3 = 90
    for (const q of RATING_QUESTIONS) raw[q.type] += (this.ratingAnswers()[q.id] ?? 0) * 3;

    // True/False: weight 2 — max per type = 6×2 = 12
    for (const q of TF_QUESTIONS) if (this.tfAnswers()[q.id] === true) raw[q.type] += 2;

    // Multiple choice: weight 4 — max per type = 6×4 = 24 (but spread across types)
    for (const q of MC_QUESTIONS) {
      const chosen = this.mcAnswers()[q.id];
      if (chosen) raw[chosen] += 4;
    }

    // Max possible per type = 90 + 12 + 24 = 126 (MC max per type is 24 if all 6 chosen same)
    const MAX = 126;
    const pct: RiasecResult = {
      R: Math.min(100, Math.round((raw.R / MAX) * 100)),
      I: Math.min(100, Math.round((raw.I / MAX) * 100)),
      A: Math.min(100, Math.round((raw.A / MAX) * 100)),
      S: Math.min(100, Math.round((raw.S / MAX) * 100)),
      E: Math.min(100, Math.round((raw.E / MAX) * 100)),
      C: Math.min(100, Math.round((raw.C / MAX) * 100)),
    };

    const sorted = (Object.keys(pct) as RiasecKey[]).sort((a, b) => pct[b] - pct[a]);
    const topTypes = sorted.slice(0, 3);
    const top1 = topTypes[0];
    const top2 = topTypes[1];

    const careerSuggestions = [
      ...TYPE_META[top1].careers.slice(0, 4),
      ...TYPE_META[top2].careers.slice(0, 3),
    ];

    const strengthSummary =
      `You show the strongest alignment with ${TYPE_META[top1].label} (${pct[top1]}%) ` +
      `and ${TYPE_META[top2].label} (${pct[top2]}%). ` +
      `Across all three question types — your preferences, your self-beliefs and your real-world choices — ` +
      `these two dimensions came through consistently.`;

    const conclusion = buildConclusion(topTypes, pct);

    const profile: FullAssessmentResult = { scores: pct, topTypes, completedAt: new Date().toISOString(), conclusion, careerSuggestions, strengthSummary };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    return profile;
  });

  sortedTypes = computed(() => {
    const r = this.result();
    if (!r) return [] as RiasecKey[];
    return (Object.keys(r.scores) as RiasecKey[]).sort((a, b) => r.scores[b] - r.scores[a]);
  });

  submitAssessment() { this.phase.set('results'); scrollTo(0, 0); }

  retake() {
    this.ratingAnswers.set({});
    this.tfAnswers.set({});
    this.mcAnswers.set({});
    this.ratingGroup.set(0);
    this.tfGroup.set(0);
    this.phase.set('rating');
    localStorage.removeItem(STORAGE_KEY);
    scrollTo(0, 0);
  }

  goToDashboard() { window.location.href = '/analyze'; }

  getScore(scores: RiasecResult, key: string): number { return scores[key as RiasecKey] ?? 0; }
  getTypeColor(key: string): string  { return TYPE_META[key]?.color ?? '#a78bfa'; }
  getTypeLabel(key: string): string  { return TYPE_META[key]?.label ?? key; }
  getTypeEmoji(key: string): string  { return TYPE_META[key]?.emoji ?? ''; }
  getTypeDesc(key: string): string   { return TYPE_META[key]?.desc ?? ''; }
  getTypeCareers(key: string): string[] { return TYPE_META[key]?.careers ?? []; }
}
