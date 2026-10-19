import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {components} from '../data/components.js';

/** Opt-in licensed GLB adapter: metres, Y up, front -X. Validate before mutation. */
export async function loadCarModel(car,url){
 const gltf=await new GLTFLoader().loadAsync(url);gltf.scene.updateMatrixWorld(true);
 const nodes=components.map(c=>{
  const matches=[];gltf.scene.traverse(o=>{if(o.name===c.id||o.userData.componentId===c.id)matches.push(o);});
  if(matches.length!==1)throw new Error(`GLB must contain exactly one group for ${c.id}`);
  return {id:c.id,node:matches[0]};
 });
 const componentNodes=new Set(nodes.map(c=>c.node));
 for(const {node} of nodes){let p=node.parent;while(p){if(componentNodes.has(p))throw new Error('GLB component groups must not nest');p=p.parent;}}
 const importedWheels=['wheel_FL','wheel_FR','wheel_RL','wheel_RR'].map(name=>gltf.scene.getObjectByName(name));
 if(importedWheels.some(n=>!n))throw new Error('GLB needs wheel_FL, wheel_FR, wheel_RL, wheel_RR');
 for(const wheel of importedWheels){let p=wheel.parent,inside=false;while(p){if(p===nodes.find(n=>n.id==='wheels').node)inside=true;p=p.parent;}if(!inside)throw new Error('Wheel pivots must be under wheels');}
 // Prepare every material slot and propagate semantic tags before replacing the
 // fallback. glTF primitives may be child meshes beneath a tagged Blender node.
 for(const {id,node} of nodes)node.traverse(o=>{if(o.isMesh){
  o.userData.component=id;let tagged=o;while(tagged!==node&&!tagged.userData.subpart)tagged=tagged.parent;
  o.userData.subpart??=tagged.userData.subpart??components.find(c=>c.id===id).subparts[0].id;
  o.castShadow=!o.userData.decal;o.receiveShadow=true;
  const clone=m=>m.clone();o.material=Array.isArray(o.material)?o.material.map(clone):clone(o.material);
  o.userData.baseMaterial=Array.isArray(o.material)?o.material.map(clone):clone(o.material);
 }});
 const geometry=new Set(),materials=new Set(),textures=new Set();
 for(const {id,node} of nodes){
  car.groups[id].traverse(o=>{if(o.isMesh){geometry.add(o.geometry);for(const m of [...(Array.isArray(o.material)?o.material:[o.material]),...(Array.isArray(o.userData.baseMaterial)?o.userData.baseMaterial:[o.userData.baseMaterial])]){if(!m)continue;materials.add(m);for(const value of Object.values(m))if(value?.isTexture)textures.add(value);}}});
  car.groups[id].clear();car.groups[id].attach(node);
 }
 geometry.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());
 car.root.name='FW48_PhotoReconstruction';car.root.userData.assetSource='Blender photo reconstruction';
 car.wheels.splice(0,car.wheels.length,...importedWheels);car.activeFlaps.length=0;
 car.root.traverse(o=>{if(o.userData.activeAero)car.activeFlaps.push({mesh:o,axis:'z',base:o.rotation.z,amount:-.14});});
 return gltf;
}
