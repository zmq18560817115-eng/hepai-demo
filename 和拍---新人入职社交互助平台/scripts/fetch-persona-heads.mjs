/**
 * 拉取 5 种人格头型（steady 表情）到 public/persona/heads/
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outDir = join(root, 'public/persona/heads');

const STEADY = { eyes: 'default', mouth: 'default', eyebrows: 'default' };

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

function urlFor(letter) {
  const head = HEADS[letter];
  const params = new URLSearchParams({
    seed: head.seed,
    backgroundColor: head.backgroundColor,
    top: head.top,
    hairColor: head.hairColor,
    skinColor: head.skinColor,
    clothing: head.clothing,
    clothesColor: head.clothesColor,
    eyes: STEADY.eyes,
    mouth: STEADY.mouth,
    eyebrows: STEADY.eyebrows,
    facialHairProbability: head.facialHair ? '100' : '0',
    accessoriesProbability: head.accessories ? '100' : '0',
  });
  if (head.facialHair) params.set('facialHair', head.facialHair);
  if (head.accessories) params.set('accessories', head.accessories);
  return `https://api.dicebear.com/7.x/avataaars/svg?${params}`;
}

await mkdir(outDir, { recursive: true });

for (const letter of Object.keys(HEADS)) {
  const res = await fetch(urlFor(letter));
  if (!res.ok) {
    console.error(`Failed ${letter}: ${res.status}`);
    process.exitCode = 1;
    continue;
  }
  await writeFile(join(outDir, `${letter}.svg`), await res.text(), 'utf8');
  console.log('wrote', letter);
}
