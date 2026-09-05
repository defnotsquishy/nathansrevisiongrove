'use client';
import { useState, lazy, Suspense } from 'react';
import { ArrowRight, Box, MoveUpRight, RotateCcw } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
const GroveScene = lazy(() => import('./grove-scene'));

function Range({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
}) {
  return (
    <label className="lab-range">
      <span>
        {label}
        <strong>{value}</strong>
      </span>
      <Slider
        aria-label={label}
        value={[value]}
        onValueChange={(v) => onChange(Array.isArray(v) ? v[0] : v)}
        min={min}
        max={max}
        step={step}
      />
      <small>
        <span>{min}</span>
        <span>{max}</span>
      </small>
    </label>
  );
}
export default function MathsLab({ quiet }: { quiet: boolean }) {
  const [a, setA] = useState(1),
    [b, setB] = useState(0),
    [c, setC] = useState(-3);
  const [shape, setShape] = useState<'cylinder' | 'cone' | 'sphere'>(
    'cylinder',
  );
  const [r, setR] = useState(3),
    [h, setH] = useState(5);
  const points = Array.from({ length: 401 }, (_, i) => {
    const x = -10 + i * 0.05;
    return `${300 + x * 27},${240 - (a * x * x + b * x + c) * 20}`;
  }).join(' ');
  const discriminant = b * b - 4 * a * c;
  const roots =
    a === 0
      ? b === 0
        ? c === 0
          ? 'Every x value'
          : 'No roots'
        : (-c / b).toFixed(2)
      : discriminant < 0
        ? 'No real roots'
        : discriminant === 0
          ? (-b / (2 * a)).toFixed(2)
          : `${((-b - Math.sqrt(discriminant)) / (2 * a)).toFixed(2)} and ${((-b + Math.sqrt(discriminant)) / (2 * a)).toFixed(2)}`;
  const vertex =
    a === 0
      ? 'This is a straight line'
      : `(${(-b / (2 * a)).toFixed(2)}, ${(c - (b * b) / (4 * a)).toFixed(2)})`;
  const volume =
    shape === 'sphere'
      ? (4 / 3) * Math.PI * r * r * r
      : Math.PI * r * r * h * (shape === 'cone' ? 1 / 3 : 1);
  const area =
    shape === 'sphere'
      ? 4 * Math.PI * r * r
      : shape === 'cone'
        ? Math.PI * r * (r + Math.sqrt(r * r + h * h))
        : 2 * Math.PI * r * (r + h);
  return (
    <Tabs defaultValue="graphs" className="lab-tabs">
      <TabsList>
        <TabsTrigger value="graphs">
          <MoveUpRight size={16} />
          Graph playground
        </TabsTrigger>
        <TabsTrigger value="solids">
          <Box size={16} />
          3D shape studio
        </TabsTrigger>
      </TabsList>
      <TabsContent value="graphs">
        <div className="lab-grid">
          <div className="panel graph-panel">
            <div className="section-title">
              <div>
                <span className="eyebrow">QUADRATIC MODELLING</span>
                <h2>
                  y = {a}x² {b < 0 ? '−' : '+'} {Math.abs(b)}x{' '}
                  {c < 0 ? '−' : '+'} {Math.abs(c)}
                </h2>
              </div>
              <span className="live-model">LIVE MODEL</span>
            </div>
            <svg
              className="graph"
              viewBox="0 0 600 480"
              aria-label={`Graph of y equals ${a} x squared plus ${b} x plus ${c}. X ranges from minus 10 to 10; Y ranges from minus 10 to 10.`}
            >
              <title>Interactive quadratic graph</title>
              <defs>
                <clipPath id="graph-clip">
                  <rect x="30" y="35" width="540" height="410" />
                </clipPath>
              </defs>
              {Array.from({ length: 21 }, (_, i) => (
                <g key={i}>
                  <line
                    x1={30 + i * 27}
                    x2={30 + i * 27}
                    y1="40"
                    y2="440"
                    className={i === 10 ? 'axis' : 'gridline'}
                  />
                  <line
                    x1="30"
                    x2="570"
                    y1={40 + i * 20}
                    y2={40 + i * 20}
                    className={i === 10 ? 'axis' : 'gridline'}
                  />
                  {i % 2 === 0 && (
                    <>
                      <text x={30 + i * 27} y="462" textAnchor="middle">
                        {i - 10}
                      </text>
                      <text x="17" y={44 + i * 20} textAnchor="end">
                        {10 - i}
                      </text>
                    </>
                  )}
                </g>
              ))}
              <polyline
                points={points}
                clipPath="url(#graph-clip)"
                fill="none"
                stroke="#c5b7fb"
                strokeWidth="3.5"
              />
              <text x="580" y="235">
                x
              </text>
              <text x="306" y="26">
                y
              </text>
              <circle cx="300" cy={240 - c * 20} r="5" fill="#dfed9c" />
            </svg>
            <p className="graph-caption">
              <span className="graph-key" />
              The yellow dot marks the y-intercept. The graph is clipped to this
              viewing window.
            </p>
          </div>
          <div className="panel lab-controls">
            <span className="eyebrow">PULL A FEW STRINGS</span>
            <h2>What changes?</h2>
            <p>Move one slider at a time and watch the curve.</p>
            <Range
              label="a · curve & direction"
              value={a}
              onChange={setA}
              min={-4}
              max={4}
              step={0.25}
            />
            <Range
              label="b · tilt & turning point"
              value={b}
              onChange={setB}
              min={-8}
              max={8}
              step={0.5}
            />
            <Range
              label="c · y-intercept"
              value={c}
              onChange={setC}
              min={-8}
              max={8}
              step={0.5}
            />
            <button
              className="button secondary"
              onClick={() => {
                setA(1);
                setB(0);
                setC(-3);
              }}
            >
              <RotateCcw size={15} />
              Reset graph
            </button>
            <div className="math-results">
              <div>
                <span>Roots (where y = 0)</span>
                <strong>{roots}</strong>
              </div>
              <div>
                <span>Turning point</span>
                <strong>{vertex}</strong>
              </div>
            </div>
          </div>
        </div>
        <div className="lab-challenge">
          <span className="challenge-tag">TRY THIS</span>
          <p>
            Can you make a curve with exactly one root? Try a = 1, b = −4, c =
            4. Explain what happens at the turning point.
          </p>
          <button
            className="text-button"
            onClick={() => {
              setA(1);
              setB(-4);
              setC(4);
            }}
          >
            Load challenge
            <ArrowRight size={16} />
          </button>
        </div>
      </TabsContent>
      <TabsContent value="solids">
        <div className="lab-grid">
          <div className="panel solid-panel">
            <div className="section-title">
              <div>
                <span className="eyebrow">3D MODELLING</span>
                <h2>
                  {shape.charAt(0).toUpperCase() + shape.slice(1)} explorer
                </h2>
              </div>
              <span className="live-model">DRAG TO ROTATE</span>
            </div>
            <Suspense
              fallback={<div className="model-loading">Loading the model…</div>}
            >
              <GroveScene mode={shape} radius={r} height={h} quiet={quiet} />
            </Suspense>
            <div className="solid-stats">
              <div>
                <span>Volume</span>
                <strong>
                  {volume.toFixed(2)}
                  <small> cm³</small>
                </strong>
              </div>
              <div>
                <span>Total surface area</span>
                <strong>
                  {area.toFixed(2)}
                  <small> cm²</small>
                </strong>
              </div>
            </div>
          </div>
          <div className="panel lab-controls">
            <span className="eyebrow">BUILD SOME INTUITION</span>
            <h2>Same radius. New shape.</h2>
            <p>
              Compare the dimensions and see how much space each shape takes up.
            </p>
            <Tabs
              value={shape}
              onValueChange={(v) => setShape(v as typeof shape)}
            >
              <TabsList>
                <TabsTrigger value="cylinder">Cylinder</TabsTrigger>
                <TabsTrigger value="cone">Cone</TabsTrigger>
                <TabsTrigger value="sphere">Sphere</TabsTrigger>
              </TabsList>
            </Tabs>
            <Range
              label="Radius (cm)"
              value={r}
              onChange={setR}
              min={1}
              max={6}
              step={0.5}
            />
            {shape !== 'sphere' && (
              <Range
                label="Height (cm)"
                value={h}
                onChange={setH}
                min={1}
                max={9}
                step={0.5}
              />
            )}
            <div className="formula-box">
              <span>VOLUME FORMULA</span>
              <strong>
                {shape === 'sphere'
                  ? 'V = ⁴⁄₃πr³'
                  : shape === 'cone'
                    ? 'V = ⅓πr²h'
                    : 'V = πr²h'}
              </strong>
              <p>
                {shape === 'cone'
                  ? 'A cone holds one third of a cylinder with the same radius and height.'
                  : shape === 'sphere'
                    ? 'Double the radius and the volume increases eightfold.'
                    : 'Doubling the radius multiplies the volume by four. Doubling the height doubles it.'}
              </p>
            </div>
            <button
              className="button secondary"
              onClick={() => {
                setR(3);
                setH(5);
                setShape('cylinder');
              }}
            >
              <RotateCcw size={15} />
              Reset model
            </button>
          </div>
        </div>
        <div className="lab-challenge">
          <span className="challenge-tag">TRY THIS</span>
          <p>
            A cylinder and a cone both have radius 3 cm and height 5 cm. Predict
            their volume ratio, then switch shapes to check.
          </p>
        </div>
      </TabsContent>
    </Tabs>
  );
}
