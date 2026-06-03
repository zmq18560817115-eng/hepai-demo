/**
 * 生成 5×6 人格×能量 离线合成 SVG
 * 同一人格固定 seed + 肤色/服装，仅眼嘴眉随能量变化
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outDir = join(root, 'public/persona/composite');

const LETTERS = ['I', 'E', 'N', 'S', 'P'];

const HEADS = {
  I: {
    seed: 'hepai-head-i',
    backgroundColor: 'b6e3f4',
    top: 'straight01',
    hairColor: '2c1b18',
    skinColor: 'ffdbb4',
    clothing: 'shirtCrewNeck',
    clothesColor: '3c4f5c',
  },
  E: {
    seed: 'hepai-head-e',
    backgroundColor: 'ffd5dc',
    top: 'shortCurly',
    hairColor: 'e6b800',
    skinColor: 'f8d25c',
    clothing: 'shirtCrewNeck',
    clothesColor: '5199e4',
  },
  N: {
    seed: 'hepai-head-n',
    backgroundColor: 'c0aede',
    top: 'hat',
    hairColor: '4a3728',
    skinColor: 'edb98a',
    clothing: 'shirtCrewNeck',
    clothesColor: '262e33',
    accessories: 'round',
  },
  S: {
    seed: 'hepai-head-s',
    backgroundColor: 'd1f4d1',
    top: 'theCaesar',
    hairColor: '724133',
    skinColor: 'd08b5b',
    clothing: 'collarAndSweater',
    clothesColor: '25557c',
    facialHair: 'beardLight',
  },
  P: {
    seed: 'hepai-head-p',
    backgroundColor: 'ffdfbf',
    top: 'fro',
    hairColor: 'f59797',
    skinColor: 'ae5d29',
    clothing: 'hoodie',
    clothesColor: '65c9ff',
    accessories: 'sunglasses',
  },
};

const TIERS = {
  critical: { eyes: 'cry', mouth: 'sad', eyebrows: 'angry' },
  low: { eyes: 'squint', mouth: 'concerned', eyebrows: 'angry' },
  recovering: { eyes: 'side', mouth: 'serious', eyebrows: 'default' },
  steady: { eyes: 'default', mouth: 'default', eyebrows: 'default' },
  good: { eyes: 'happy', mouth: 'smile', eyebrows: 'default' },
  full: { eyes: 'hearts', mouth: 'twinkle', eyebrows: 'raisedExcited' },
};

function paramsFor(letter, face) {
  const head = HEADS[letter];
  const params = new URLSearchParams({
    seed: head.seed,
    backgroundColor: head.backgroundColor,
    top: head.top,
    hairColor: head.hairColor,
    skinColor: head.skinColor,
    clothing: head.clothing,
    clothesColor: head.clothesColor,
    eyes: face.eyes,
    mouth: face.mouth,
    eyebrows: face.eyebrows,
    facialHairProbability: head.facialHair ? '100' : '0',
    accessoriesProbability: head.accessories ? '100' : '0',
  });
  if (head.facialHair) params.set('facialHair', head.facialHair);
  if (head.accessories) params.set('accessories', head.accessories);
  return params;
}

await mkdir(outDir, { recursive: true });

let ok = 0;
let fail = 0;

for (const letter of LETTERS) {
  for (const [tierId, face] of Object.entries(TIERS)) {
    const file = join(outDir, `${letter}-${tierId}.svg`);
    const url = `https://api.dicebear.com/7.x/avataaars/svg?${paramsFor(letter, face)}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`FAIL ${letter}-${tierId}: HTTP ${res.status}`);
      fail += 1;
      continue;
    }
    await writeFile(file, await res.text(), 'utf8');
    ok += 1;
    console.log('wrote', `${letter}-${tierId}.svg`);
  }
}

console.log(`Done: ${ok} ok, ${fail} failed`);
