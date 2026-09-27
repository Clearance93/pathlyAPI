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
  detailedInsights: TypeInsight[];
  workStyleSummary: string;
  developmentAreas: string[];
  careerMatches: CareerMatchInsight[];
}

export interface TypeInsight {
  key: RiasecKey;
  label: string;
  emoji: string;
  score: number;
  band: string;
  summary: string;
  workEnvironment: string;
  strengths: string[];
  watchOuts: string[];
}

export interface CareerMatchInsight {
  title: string;
  reason: string;
  alignment: number;
}

export interface TypeDetail {
  summary: string;
  workEnvironment: string;
  strengths: string[];
  watchOuts: string[];
}

/** Deeper, human-readable interpretation per RIASEC dimension (used by the report). */
export const TYPE_DETAIL: Record<RiasecKey, TypeDetail> = {
  R: {
    summary: 'You are drawn to practical, concrete work where you can see and touch the result of your effort.',
    workEnvironment: 'Workshops, sites, labs, outdoors and hands-on technical settings.',
    strengths: ['Practical problem-solving', 'Working with tools, machines or living systems', 'Learning by doing'],
    watchOuts: ['Long stretches of purely theoretical or abstract work can feel draining', 'You may under-sell your hands-on expertise in interviews'],
  },
  I: {
    summary: 'You are energised by understanding why things work and by solving complex, open problems.',
    workEnvironment: 'Research, analytics, laboratories and technology teams where depth is valued.',
    strengths: ['Analytical reasoning', 'Curiosity and independent research', 'Evidence-based decision making'],
    watchOuts: ['You can over-analyse before acting', 'Roles with constant interruption may frustrate you'],
  },
  A: {
    summary: 'You are motivated by creating original work and expressing ideas in your own way.',
    workEnvironment: 'Studios, design teams and flexible spaces with room for experimentation.',
    strengths: ['Creativity and original thinking', 'Visual and narrative communication', 'Comfort with ambiguity'],
    watchOuts: ['Highly rigid, rule-bound environments may feel restrictive', 'You may need to build structure around deadlines'],
  },
  S: {
    summary: 'You are fulfilled by helping people and by work that improves others’ lives.',
    workEnvironment: 'Schools, health and community settings where people are the focus.',
    strengths: ['Empathy and active listening', 'Teaching, coaching and supporting others', 'Teamwork and collaboration'],
    watchOuts: ['You may take on others’ stress — boundaries matter', 'You can find conflict and difficult feedback hard'],
  },
  E: {
    summary: 'You are driven by leading, persuading and turning ideas into results.',
    workEnvironment: 'Fast-moving commercial, entrepreneurial and client-facing environments.',
    strengths: ['Leadership and influence', 'Initiative and risk-taking', 'Motivating and organising people'],
    watchOuts: ['You may move faster than the team can follow', 'Detail and follow-through need deliberate attention'],
  },
  C: {
    summary: 'You are at your best when work is structured, accurate and clearly defined.',
    workEnvironment: 'Organised, process-driven settings where precision is valued.',
    strengths: ['Accuracy and attention to detail', 'Planning, systems and record-keeping', 'Reliability and consistency'],
    watchOuts: ['Fast, chaotic change can be uncomfortable', 'You may hesitate when a decision is ambiguous'],
  },
};

export function scoreBand(score: number): string {
  if (score >= 80) return 'Very strong';
  if (score >= 65) return 'Strong';
  if (score >= 50) return 'Moderate';
  if (score >= 35) return 'Developing';
  return 'Low';
}

export const RATING_QUESTIONS: RatingQuestion[] = [
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

export const TF_QUESTIONS: TrueFalseQuestion[] = [
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

export const MC_QUESTIONS: McQuestion[] = [
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

export const TYPE_META: Record<string, { label: string; emoji: string; desc: string; color: string; careers: string[] }> = {
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
