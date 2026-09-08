export type PracticeQuestion = {
  id: string;
  topicId: string;
  topic: string;
  prompt: string;
  answer: string;
  method: string;
};

// Original Revision Grove questions. First Class Maths materials are linked
// separately and are never copied into this project.
export const practiceQuestions: PracticeQuestion[] = [
  {
    id: 'expand-1',
    topicId: 'math-1',
    topic: 'Expand / Factorise',
    prompt: 'Expand and simplify 4(3x − 5).',
    answer: '12x − 20',
    method: 'Multiply both terms inside the bracket by 4.',
  },
  {
    id: 'factorise-1',
    topicId: 'math-1',
    topic: 'Expand / Factorise',
    prompt: 'Factorise 18x + 30 fully.',
    answer: '6(3x + 5)',
    method: 'The highest common factor of 18 and 30 is 6.',
  },
  {
    id: 'prime-1',
    topicId: 'math-2',
    topic: 'Prime Factorisation',
    prompt: 'Write 84 as a product of prime factors.',
    answer: '2² × 3 × 7',
    method: 'Divide by primes: 84 = 2 × 42 = 2 × 2 × 21 = 2² × 3 × 7.',
  },
  {
    id: 'percentage-1',
    topicId: 'math-3',
    topic: 'Percentage Change / Profit',
    prompt: 'A game costs £80 and rises to £92. Find the percentage increase.',
    answer: '15%',
    method: 'The increase is £12. Divide 12 by the original £80, then multiply by 100.',
  },
  {
    id: 'fractions-1',
    topicId: 'math-4',
    topic: 'Mixed Number Operations',
    prompt: 'Work out 2⅓ + 1¾. Give your answer as a mixed number.',
    answer: '4¹⁄₁₂',
    method: 'Use twelfths: 2⅓ = 28/12 and 1¾ = 21/12, so the total is 49/12.',
  },
  {
    id: 'subject-1',
    topicId: 'math-5',
    topic: 'Changing the Subject',
    prompt: 'Make t the subject of v = u + at.',
    answer: 't = (v − u) / a',
    method: 'Subtract u from both sides, then divide both sides by a.',
  },
  {
    id: 'inequality-1',
    topicId: 'math-6',
    topic: 'Inequalities',
    prompt: 'Solve 3x − 5 < 16.',
    answer: 'x < 7',
    method: 'Add 5 to both sides to get 3x < 21, then divide by 3.',
  },
  {
    id: 'bounds-1',
    topicId: 'math-7',
    topic: 'Error Intervals',
    prompt: 'A length is 8.4 cm correct to the nearest 0.1 cm. Write its error interval.',
    answer: '8.35 ≤ length < 8.45',
    method: 'Half of 0.1 is 0.05. Subtract and add 0.05; the upper bound is not included.',
  },
  {
    id: 'averages-1',
    topicId: 'math-8',
    topic: 'Averages from Tables',
    prompt: 'Values 2, 3 and 5 have frequencies 2, 4 and 2. Find the mean.',
    answer: '3.25',
    method: 'Calculate (2×2 + 3×4 + 5×2) ÷ (2+4+2) = 26 ÷ 8.',
  },
  {
    id: 'calculator-1',
    topicId: 'math-9',
    topic: 'Using a Calculator',
    prompt: 'Work out (3.8² + √27) ÷ 2.5. Give your answer to 3 significant figures.',
    answer: '7.85',
    method: 'Keep the full calculator value until the end, then round 7.854… to 3 significant figures.',
  },
  {
    id: 'bisector-1',
    topicId: 'math-10',
    topic: 'Angle Bisectors',
    prompt: 'An angle of 74° is bisected. What is the size of each new angle?',
    answer: '37°',
    method: 'An angle bisector divides an angle into two equal parts: 74 ÷ 2.',
  },
  {
    id: 'line-1',
    topicId: 'math-11',
    topic: 'Straight Line Graphs',
    prompt: 'For y = 3x − 5, find y when x = 4.',
    answer: '7',
    method: 'Substitute x = 4: y = 3(4) − 5 = 12 − 5.',
  },
  {
    id: 'estimate-1',
    topicId: 'math-12',
    topic: 'Estimation',
    prompt: 'Estimate (19.8 × 3.04) ÷ 0.49 by rounding each number to 1 significant figure.',
    answer: '120',
    method: 'Use 20 × 3 ÷ 0.5 = 60 ÷ 0.5.',
  },
  {
    id: 'circle-1',
    topicId: 'math-13',
    topic: 'Area / Circumference of Circles',
    prompt: 'Find the exact area of a circle with radius 7 cm.',
    answer: '49π cm²',
    method: 'Use A = πr², so A = π × 7².',
  },
  {
    id: 'sequence-1',
    topicId: 'math-14',
    topic: 'Diagram Sequences',
    prompt: 'A sequence begins 5, 9, 13, 17. Find an expression for its nth term.',
    answer: '4n + 1',
    method: 'The common difference is 4, so start with 4n. Add 1 to make the first term 5.',
  },
];
