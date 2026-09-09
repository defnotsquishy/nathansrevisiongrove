import { Player } from '@remotion/player';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

function RevisionWalkthrough() {
  const frame = useCurrentFrame();
  const checked = frame >= 145;
  const rated = frame >= 260;
  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#231c17',
        color: '#f7f3f0',
        padding: 38,
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 16,
          color: '#c6bcb4',
          letterSpacing: 1,
        }}
      >
        EXPAND / FACTORISE <span>EXAMPLE WALKTHROUGH</span>
      </div>
      <div style={{ marginTop: 32, fontSize: 42, fontWeight: 700 }}>
        4(3x − 5)
      </div>
      <div
        style={{
          marginTop: 18,
          fontSize: 24,
          opacity: interpolate(frame, [130, 150], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        12x − 20
      </div>
      <div
        style={{
          marginTop: 10,
          fontSize: 18,
          color: '#d0c4bb',
          opacity: interpolate(frame, [145, 165], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        Multiply both terms inside the bracket by 4.
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        {['Red', 'Amber', 'Green'].map((label, index) => (
          <div
            key={label}
            style={{
              padding: '12px 22px',
              borderRadius: 4,
              border: `2px solid ${['#ff9e8e', '#f1cb72', '#a8de7c'][index]}`,
              backgroundColor: rated && index === 1 ? '#f1cb72' : 'transparent',
              color: rated && index === 1 ? '#231c17' : '#f7f3f0',
              fontSize: 19,
            }}
          >
            {label}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 20, fontSize: 18, color: '#f2a368' }}>
        {rated
          ? 'Amber: try this topic again in 3 days.'
          : checked
            ? 'Check the method, then choose your confidence.'
            : 'Try it on paper before looking at the answer.'}
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: 4,
          backgroundColor: '#f2a368',
          width: `${interpolate(frame, [0, 359], [0, 100])}%`,
        }}
      />
    </AbsoluteFill>
  );
}

export default function IntroPlayer() {
  return (
    <Player
      acknowledgeRemotionLicense
      component={RevisionWalkthrough}
      durationInFrames={360}
      compositionWidth={720}
      compositionHeight={430}
      fps={30}
      controls
      autoPlay
      loop={false}
      showVolumeControls={false}
      numberOfSharedAudioTags={0}
      moveToBeginningWhenEnded={false}
      style={{ width: '100%' }}
    />
  );
}
