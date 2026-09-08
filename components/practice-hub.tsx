'use client';

import { useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpenCheck,
  Check,
  Eye,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { rateTopic, topics, type AppState } from '@/lib/model';
import { practiceQuestions } from '@/lib/practice';

const ragOptions = [
  { value: 1, short: 'R', label: 'Red', detail: 'I need to relearn this' },
  { value: 2, short: 'A', label: 'Amber', detail: 'I need another go' },
  { value: 3, short: 'G', label: 'Green', detail: 'I can do this alone' },
] as const;

export default function PracticeHub({
  state,
  ready,
  today,
  board,
  onSave,
}: {
  state: AppState;
  ready: boolean;
  today: string;
  board: string;
  onSave: (state: AppState, message: string) => Promise<boolean>;
}) {
  const [questionId, setQuestionId] = useState(practiceQuestions[0].id);
  const [revealed, setRevealed] = useState(false);
  const [rated, setRated] = useState(false);
  const [saving, setSaving] = useState<number | null>(null);
  const question =
    practiceQuestions.find((item) => item.id === questionId) ??
    practiceQuestions[0];
  const topic = topics.find((item) => item.id === question.topicId);
  const currentRating = state.progress[question.topicId]?.confidence;
  const counts = useMemo(
    () =>
      topics.reduce(
        (result, item) => {
          const confidence = state.progress[item.id]?.confidence ?? 0;
          result[confidence] += 1;
          return result;
        },
        [0, 0, 0, 0],
      ),
    [state.progress],
  );
  const boardRevision = `https://www.1stclassmaths.com/${
    board === 'AQA' ? 'aqa' : 'edexcel'
  }revision`;

  const chooseQuestion = (next: string) => {
    setQuestionId(next);
    setRevealed(false);
    setRated(false);
  };
  const nextQuestion = () => {
    const index = practiceQuestions.findIndex((item) => item.id === question.id);
    chooseQuestion(practiceQuestions[(index + 1) % practiceQuestions.length].id);
  };

  return (
    <div className="practice-workspace">
      <section className="practice-route panel" aria-labelledby="practice-route-title">
        <div className="practice-route-copy">
          <span className="eyebrow">YOUR PRACTICE ROUTE</span>
          <h2 id="practice-route-title">Practice workflow</h2>
          <p>Choose a question, check the method, then record a RAG rating. Ratings set the next suggested revisit without adding a completed session.</p>
        </div>
        <ol className="practice-steps">
          {[
            ['1', 'Choose', true],
            ['2', 'Attempt', revealed],
            ['3', 'Check', revealed],
            ['4', 'Rate', rated],
          ].map(([number, label, done], index) => {
            const current = !rated && (revealed ? index === 3 : index === 1);
            return (
              <li className={done ? 'done' : current ? 'current' : ''} key={label as string}>
                <span>{done ? <Check size={14} /> : number}</span>
                <strong>{label}</strong>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="practice-layout">
        <article className="practice-question panel" aria-labelledby="quick-question-title">
          <div className="practice-question-head">
            <div>
              <span className="eyebrow">QUICK QUESTION</span>
              <h2 id="quick-question-title">{question.topic}</h2>
            </div>
            <Select value={questionId} onValueChange={(value) => value && chooseQuestion(value)}>
              <SelectTrigger className="practice-picker" aria-label="Choose a quick question">
                <SelectValue>{question.topic}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {practiceQuestions.map((item, index) => (
                  <SelectItem key={item.id} value={item.id}>
                    {index + 1}. {item.topic}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="practice-question-text">{question.prompt}</p>
          {!revealed ? (
            <div className="practice-attempt">
              <p>Work it out on paper first. Your answer stays private.</p>
              <button className="button primary" onClick={() => setRevealed(true)}>
                <Eye size={17} /> Show answer and method
              </button>
            </div>
          ) : (
            <div className="practice-answer" aria-live="polite">
              <span>ANSWER</span>
              <strong>{question.answer}</strong>
              <p>{question.method}</p>
              <button className="text-button" onClick={() => setRevealed(false)}>
                <RotateCcw size={15} /> Hide answer and try again
              </button>
            </div>
          )}
          <div className="rag-panel">
            <div>
              <span className="eyebrow">HOW DID IT GO?</span>
              <p>Choose after checking the answer.</p>
            </div>
            <fieldset className="rag-options">
              <legend className="sr-only">Rate confidence for {question.topic}</legend>
              {ragOptions.map((option) => (
                <button
                  key={option.value}
                  className={`rag-choice rag-${option.label.toLowerCase()}`}
                  aria-pressed={currentRating === option.value}
                  disabled={!revealed || !ready || saving !== null}
                  onClick={async () => {
                    setSaving(option.value);
                    const saved = await onSave(
                      rateTopic(state, question.topicId, option.value, today),
                      `${option.label} saved for ${question.topic}.`,
                    );
                    if (saved) setRated(true);
                    setSaving(null);
                  }}
                >
                  <span>{saving === option.value ? '…' : option.short}</span>
                  <strong>{option.label}</strong>
                  <small>{option.detail}</small>
                </button>
              ))}
            </fieldset>
          </div>
          <div className="practice-question-footer">
            {topic?.video ? (
              <a href={topic.video} target="_blank" rel="noopener noreferrer">
                Watch the topic video <ExternalLink size={14} />
              </a>
            ) : (
              <span />
            )}
            <button className="button secondary" onClick={nextQuestion}>
              Next question <ArrowRight size={16} />
            </button>
          </div>
        </article>

        <aside className="practice-sidebar">
          <section className="rag-summary panel" aria-labelledby="rag-summary-title">
            <span className="eyebrow">YOUR TOPIC SNAPSHOT</span>
            <h2 id="rag-summary-title">RAG overview</h2>
            <div className="rag-counts">
              {[
                ['Red', counts[1]],
                ['Amber', counts[2]],
                ['Green', counts[3]],
                ['Unrated', counts[0]],
              ].map(([label, count]) => (
                <div key={label as string}>
                  <span className={`rag-dot rag-dot-${String(label).toLowerCase()}`} />
                  <strong>{count}</strong>
                  <small>{label}</small>
                </div>
              ))}
            </div>
            <Progress
              value={(counts[3] / topics.length) * 100}
              aria-label={`${counts[3]} of ${topics.length} topics rated green`}
            />
            <p>{counts[3]} of {topics.length} topics are currently green.</p>
          </section>

          <section className="booklet-desk panel" aria-labelledby="booklet-title">
            <BookOpenCheck size={22} />
            <div>
              <span className="eyebrow">FIRST CLASS MATHS</span>
              <h2 id="booklet-title">Official question booklets</h2>
            </div>
            <a
              className="booklet-link featured"
              href="https://www.1stclassmaths.com/_files/ugd/9f3fb0_7c9b3f07eb934c26bc9fee56346be737.pdf"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span><strong>Ultimate Higher booklet</strong><small>One question on every topic</small></span>
              <ExternalLink size={16} />
            </a>
            <a className="booklet-link" href={boardRevision} target="_blank" rel="noopener noreferrer">
              <span><strong>{board === 'OCR' ? 'Edexcel' : board} topic questions</strong><small>Questions, solutions and videos</small></span>
              <ExternalLink size={16} />
            </a>
            <a
              className="booklet-link"
              href="https://www.1stclassmaths.com/exam-papers"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span><strong>Practice papers</strong><small>Timed exam practice</small></span>
              <ExternalLink size={16} />
            </a>
            <p className="booklet-note">
              These open on First Class Maths. Revision Grove links to the official copies and does not republish them.
            </p>
          </section>
        </aside>
      </section>
    </div>
  );
}
