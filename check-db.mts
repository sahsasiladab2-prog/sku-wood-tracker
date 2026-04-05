import { getAllWoodMaterials } from './server/db';
const materials = await getAllWoodMaterials();
console.log('Wood materials count:', materials.length);
if (materials.length > 0) {
  console.log('First:', JSON.stringify(materials[0]));
}
