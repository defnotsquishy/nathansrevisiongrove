import sharp from 'sharp';

const card = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="#120f0d"/><rect x="64" y="64" width="10" height="502" fill="#f2a368"/>
<text x="110" y="106" fill="#f2a368" font-family="Arial,sans-serif" font-size="23" letter-spacing="3">NATHAN’S REVISION GROVE</text>
<text x="108" y="232" fill="#f2f4ec" font-family="Arial,sans-serif" font-weight="bold" font-size="70">Plan your revision.</text>
<text x="108" y="320" fill="#f2a368" font-family="Arial,sans-serif" font-weight="bold" font-size="70">Practise the maths.</text>
<text x="110" y="401" fill="#bfb3a7" font-family="Arial,sans-serif" font-size="30">GCSE timetable · Questions · Saved confidence ratings</text>
<path d="M110 449H1110" stroke="#735c49"/>
<text x="110" y="515" fill="#f2f4ec" font-family="Arial,sans-serif" font-size="25">Free to use. Start without an account.</text>
<rect x="858" y="485" width="72" height="36" rx="4" fill="#ff9e8e"/><rect x="948" y="485" width="72" height="36" rx="4" fill="#f1cb72"/><rect x="1038" y="485" width="72" height="36" rx="4" fill="#a8de7c"/>
</svg>`;
await sharp(Buffer.from(card)).png().toFile('public/og.png');
console.log('Prepared 1200 × 630 social share card.');
