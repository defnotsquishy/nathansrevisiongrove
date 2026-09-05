import { z } from 'zod';
import sourceTopics from './topics.json';

export const categories = [
  'Algebra',
  'Number',
  'Geometry',
  'Ratio & rates',
  'Statistics',
  'Probability',
  'My subjects',
] as const;
export const colours = [
  '#c4b5fd',
  '#dfed9c',
  '#86ddd2',
  '#ffbc91',
  '#96bcfb',
  '#eea4d5',
  '#d3e5a1',
];
export type Category = (typeof categories)[number];
export type Topic = {
  id: string;
  title: string;
  video?: string;
  category: Category;
};
function classify(title: string): Category {
  if (/Probability|Venn|Capture|Counting/.test(title)) return 'Probability';
  if (
    /Histogram|Frequency|Scatter|Averages|Pie Chart|Stem-and-Leaf/.test(title)
  )
    return 'Statistics';
  if (
    /Proportion|Speed|Density|Pressure|Recipes|Best Buys|Interest|Percentage/.test(
      title,
    )
  )
    return 'Ratio & rates';
  if (
    /Angle|Circle|Triangle|Trig|Pythagoras|Area|Volume|Prism|Pyramid|Cone|Sphere|Loci|Bisector|Polygon|Vector|Transformation|Enlargement|Congruent|Similar|Invariant|Geometric Proof|Bearings/.test(
      title,
    )
  )
    return 'Geometry';
  if (
    /Factorisation|Number|Reciprocal|Calculator|Estimat|Percent|Index|Standard|HCF|LCM|Surd|Decimal|Bounds|Denominator/.test(
      title,
    )
  )
    return 'Number';
  return 'Algebra';
}
export const topics: Topic[] = sourceTopics.map((t) => ({
  ...t,
  category: classify(t.title),
}));
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (v) =>
      !Number.isNaN(new Date(v + 'T12:00:00').getTime()) &&
      new Date(v + 'T12:00:00').toISOString().slice(0, 10) === v,
  );
export const sessionSchema = z.object({
  id: z.string().min(1).max(100),
  topicId: z.string().min(1).max(100),
  date,
  time: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
  minutes: z.number().int().min(5).max(90),
  done: z.boolean(),
  review: z.boolean(),
});
export type Session = z.infer<typeof sessionSchema>;
export const settingsSchema = z
  .object({
    name: z.string().trim().min(1).max(35),
    board: z.enum(['Edexcel', 'AQA', 'OCR']),
    start: date,
    finish: date,
    days: z.array(z.number().int().min(0).max(6)).min(1).max(7),
    perDay: z.number().int().min(1).max(6),
    minutes: z.number().int().min(5).max(90),
    time: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
  })
  .refine(
    (s) =>
      s.finish >= s.start &&
      +new Date(s.finish) - +new Date(s.start) <= 366 * 86400000,
    'Choose a finish date within one year of the start.',
  )
  .refine(
    (s) => toMinutes(s.time) + (s.minutes + 5) * s.perDay - 5 <= 1440,
    'Sessions must finish before midnight.',
  );
export const stateSchema = z.object({
  settings: settingsSchema,
  progress: z.record(
    z.string().max(100),
    z.object({
      confidence: z.number().int().min(1).max(3),
      last: date,
      next: date,
    }),
  ),
  sessions: z.array(sessionSchema).max(5000),
  logs: z
    .array(
      z.object({
        id: z.string().max(100),
        topicId: z.string().max(100),
        date,
        minutes: z.number().min(0).max(90),
        confidence: z.number().int().min(1).max(3),
        note: z.string().max(2000),
      }),
    )
    .max(10000),
  customTopics: z
    .array(
      z.object({
        id: z.string().min(1).max(100),
        title: z.string().trim().min(1).max(100),
        category: z.literal('My subjects'),
      }),
    )
    .max(200),
});
export type AppState = z.infer<typeof stateSchema>;
export type Settings = AppState['settings'];
export function localDate(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function addDays(day: string, n: number) {
  const d = new Date(day + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return localDate(d);
}
export function monday(day: string) {
  const d = new Date(day + 'T12:00:00');
  return addDays(day, -((d.getDay() + 6) % 7));
}
export function toMinutes(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
export function timeString(n: number) {
  return `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
}
export function topicList(s: AppState): Topic[] {
  return [...topics, ...s.customTopics];
}
export function emptyState(today = localDate()): AppState {
  return {
    settings: {
      name: 'Nathan',
      board: 'Edexcel',
      start: today,
      finish: addDays(today, 83),
      days: [1, 2, 3, 4, 5, 6],
      perDay: 2,
      minutes: 25,
      time: '16:00',
    },
    progress: {},
    sessions: [],
    logs: [],
    customTopics: [],
  };
}
export function overlaps(sessions: Session[], item: Session) {
  return sessions.some(
    (s) =>
      s.id !== item.id &&
      s.date === item.date &&
      toMinutes(s.time) < toMinutes(item.time) + item.minutes &&
      toMinutes(item.time) < toMinutes(s.time) + s.minutes,
  );
}
export function makePlan(
  state: AppState,
  settings: Settings,
  today = localDate(),
): { sessions: Session[]; unplaced: number } {
  const keep = state.sessions.filter((s) => s.done || s.date < today);
  const candidates = topicList(state)
    .filter((t) => state.progress[t.id]?.confidence !== 3)
    .sort((a, b) => {
      const score = (id: string) => {
        const p = state.progress[id];
        return p ? (p.next <= today ? -10 : 0) + p.confidence : 4;
      };
      return score(a.id) - score(b.id);
    });
  const sessions = [...keep];
  let index = 0;
  const start = settings.start < today ? today : settings.start;
  for (
    let day = start;
    day <= settings.finish && index < candidates.length;
    day = addDays(day, 1)
  ) {
    if (!settings.days.includes(new Date(day + 'T12:00:00').getDay())) continue;
    for (let n = 0; n < settings.perDay && index < candidates.length; n++) {
      const topic = candidates[index];
      const item: Session = {
        id: crypto.randomUUID(),
        topicId: topic.id,
        date: day,
        time: timeString(toMinutes(settings.time) + n * (settings.minutes + 5)),
        minutes: settings.minutes,
        done: false,
        review: !!state.progress[topic.id],
      };
      if (!overlaps(sessions, item)) {
        sessions.push(item);
        index++;
      }
    }
  }
  return { sessions, unplaced: candidates.length - index };
}
export function finishSession(
  state: AppState,
  session: Session,
  confidence: number,
  note: string,
  minutes: number,
  today = localDate(),
): AppState {
  if (state.logs.some((l) => l.id === session.id)) return state;
  const next = addDays(today, confidence === 1 ? 1 : confidence === 2 ? 3 : 7);
  return {
    ...state,
    sessions: state.sessions.map((s) =>
      s.id === session.id ? { ...s, done: true } : s,
    ),
    logs: [
      ...state.logs,
      {
        id: session.id,
        topicId: session.topicId,
        date: today,
        minutes,
        confidence,
        note,
      },
    ],
    progress: {
      ...state.progress,
      [session.topicId]: { confidence, last: today, next },
    },
  };
}
export function streak(s: AppState, today = localDate()) {
  const dates = new Set(s.logs.map((l) => l.date));
  let day = dates.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (dates.has(day)) {
    n++;
    day = addDays(day, -1);
  }
  return n;
}
export function dueTopics(s: AppState, today = localDate()) {
  return topicList(s).filter(
    (t) => s.progress[t.id] && s.progress[t.id].next <= today,
  );
}
export function sessionFor(topicId: string, minutes = 25): Session {
  return {
    id: crypto.randomUUID(),
    topicId,
    date: localDate(),
    time: timeString(new Date().getHours() * 60 + new Date().getMinutes()),
    minutes,
    done: false,
    review: false,
  };
}
