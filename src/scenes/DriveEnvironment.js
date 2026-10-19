import * as THREE from 'three';
const mod=(n,d)=>((n%d)+d)%d;
/** Ground moves in metres with the odometer. Blur is confined to track/background
 * streaks, preserving the sharpness of car paint and sponsor graphics. */
export function createDriveEnvironment(){
 const root=new THREE.Group();root.name='Drive_Track';const fading=[],buckets=new Map();
 function mat(color,opacity=1,standard=false){const m=standard?new THREE.MeshStandardMaterial({color,roughness:.87,metalness:.04}):new THREE.MeshBasicMaterial({color});m.transparent=true;m.opacity=0;m.depthWrite=false;m.userData.peak=opacity;fading.push(m);return m;}
 function box(size,position,material){const o=new THREE.Object3D();o.scale.set(...size);o.position.set(...position);if(!buckets.has(material))buckets.set(material,[]);buckets.get(material).push(o);return o;}
 const asphalt=mat('#181e27',1,true),ground=new THREE.Mesh(new THREE.PlaneGeometry(150,12),asphalt);ground.rotation.x=-Math.PI/2;ground.position.y=-.011;ground.receiveShadow=true;root.add(ground);
 // Self-contained fine asphalt, no downloaded assets or new environment lights.
 const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');let seed=7421;
 const pixels=ctx.createImageData(256,256);for(let i=0;i<pixels.data.length;i+=4){seed=(seed*1664525+1013904223)>>>0;const v=120+(seed%42);pixels.data.set([v,v,v,255],i);}ctx.putImageData(pixels,0,0);
 const texture=new THREE.CanvasTexture(c);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(75,6);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;asphalt.map=texture;
 const white=mat('#a0b2c6',.7),blue=mat('#226ac1',.7),dark=mat('#122137',1,true),red=mat('#803a43',.7);
 for(const z of [-3.5,3.5])box([150,.008,.06],[0,-.003,z],white);
 const marks=[],barriers=[];
 for(let i=0;i<26;i++){
  for(const z of [-3.95,3.95]){const o=box([2.5,.012,.6],[0,-.001,z],i%2?blue:white);marks.push({o,start:i*2.5,period:65});}
  for(const z of [-2.4,2.4]){const o=box([2.6,.004,.045],[0,-.002,z],white);marks.push({o,start:i*6,period:156});}
  for(const z of [-5.1,5.1]){const o=box([5.6,.48,.13],[0,.23,z],dark);barriers.push({o,start:i*6,period:156});const cap=box([.13,.34,.15],[0,.24,z-.1*Math.sign(z)],i%3?blue:red);barriers.push({o:cap,start:i*6,period:156});}
 }
 const streakMaterial=mat('#7a9bbd',.11),streaks=[];
 for(let i=0;i<36;i++){const s=i%2?1:-1,o=box([1,.003,.018],[0,.018,s*(2.8+(i%7)*.27)],streakMaterial);streaks.push({o,start:i*4.63,period:100});}
 const references=[...marks,...barriers,...streaks];
 // All track props share a unit cube and only five instanced draw calls.
 const batches=[...buckets].map(([material,objects])=>{const mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),material,objects.length);mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.frustumCulled=false;root.add(mesh);return {mesh,objects};});
 function update(distance,speed,weight,{blur=true,reduced=false}={}){
  root.visible=weight>.002;if(!root.visible)return;
  for(const m of fading)m.opacity=m.userData.peak*weight;
  texture.offset.x=-mod(distance,2)/2;
  for(const item of references)item.o.position.x=mod(item.start+distance+item.period/2,item.period)-item.period/2;
  streakMaterial.opacity=weight*(blur&&!reduced?Math.min(speed/54,1)*.13:0);
  for(const {o} of streaks)o.scale.x=1+speed*.085;
  for(const {mesh,objects} of batches){objects.forEach((o,i)=>{o.updateMatrix();mesh.setMatrixAt(i,o.matrix);});mesh.instanceMatrix.needsUpdate=true;}
 }
 return {root,update};
}
