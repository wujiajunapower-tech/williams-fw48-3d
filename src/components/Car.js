import * as THREE from 'three';
import {loft,rod,tube,wing,labelTexture} from './geometry.js';
import {components} from '../data/components.js';
import {carbonWeave,finTexture} from './Materials.js';

/** Procedural 2026-inspired exterior. Replace individual named groups with licensed GLB meshes. */
export function createCar(){
 const root=new THREE.Group();root.name='FW48_Approximation';
 const groups={},wheels=[],activeFlaps=[];
 const weave=carbonWeave();
 const materials={
  blue:new THREE.MeshPhysicalMaterial({color:'#0733a6',metalness:.17,roughness:.29,clearcoat:1,clearcoatRoughness:.18,side:THREE.DoubleSide}),
  white:new THREE.MeshPhysicalMaterial({color:'#e5ecf4',metalness:.36,roughness:.3,clearcoat:1,side:THREE.DoubleSide}),
  carbon:new THREE.MeshPhysicalMaterial({color:'#0c1016',metalness:.08,roughness:.7,bumpMap:weave,bumpScale:.0007,roughnessMap:weave,clearcoat:.15,side:THREE.DoubleSide}),
  black:new THREE.MeshStandardMaterial({color:'#020407',metalness:.1,roughness:.6,side:THREE.DoubleSide}),
  rubber:new THREE.MeshStandardMaterial({color:'#101114',metalness:.03,roughness:.86}),
  metal:new THREE.MeshStandardMaterial({color:'#636c7b',metalness:.95,roughness:.27}),
  red:new THREE.MeshStandardMaterial({color:'#f42a43',metalness:.3,roughness:.4}),
  sky:new THREE.MeshStandardMaterial({color:'#65b7eb',metalness:.25,roughness:.32}),
  radiator:new THREE.MeshStandardMaterial({color:'#a7b4bd',map:finTexture(),metalness:.78,roughness:.5}),
  plank:new THREE.MeshStandardMaterial({color:'#6b543b',roughness:.95})
 };
 components.forEach(c=>{const g=new THREE.Group();g.name=c.id;g.userData.component=c.id;groups[c.id]=g;root.add(g);});
 function mesh(id,geometry,mat,pos=[0,0,0],rotation=[0,0,0]){
  const m=new THREE.Mesh(geometry,materials[mat].clone());m.position.set(...pos);m.rotation.set(...rotation);m.castShadow=true;m.receiveShadow=true;m.userData.component=id;
  m.userData.baseMaterial=m.material.clone();groups[id].add(m);return m;
 }
 function box(id,size,pos,mat='carbon',rot=[0,0,0]){return mesh(id,new THREE.BoxGeometry(...size),mat,pos,rot);}
 function tag(object,key){object.userData.subpart=key;return object;}
 function decal(id,text,size,pos,rot,color='#fff'){
  const m=new THREE.Mesh(new THREE.PlaneGeometry(...size),new THREE.MeshBasicMaterial({map:labelTexture(text,color),transparent:true,depthWrite:false,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-3}));
  m.position.set(...pos);m.rotation.set(...rot);m.userData.component=id;m.userData.decal=true;groups[id].add(m);return m;
 }
 // Flat(ter) 2026 floor; no older full-length Venturi tunnel reconstruction.
 tag(box('floor',[3.55,.055,1.46],[.18,.14,0]),'floor-panel');
 tag(box('floor',[2.9,.016,.21],[.16,.105,0],'plank'),'plank');
 for(const s of [-1,1]){
  tag(box('floor',[2.55,.045,.025],[.15,.18,s*.74],'carbon'),'floor-fences');
  tag(box('floor',[.85,.03,.63],[1.75,.22,s*.33],'carbon',[0,0,.22]),'diffuser');
  for(let i=0;i<4;i++)tag(box('floor',[.74,.14,.012],[1.78,.23,s*(.1+i*.15)],'carbon',[0,0,.16]),'floor-fences');
 }
 mesh('nose',loft([[-2.62,.28,.035,.035],[-2.43,.31,.11,.07],[-1.96,.42,.15,.1],[-1.3,.54,.21,.15],[-.9,.57,.25,.18]]),'blue');
 decal('nose','55',[.29,.38],[-1.63,.565,0],[-Math.PI/2,0,-Math.PI/2]);
 decal('nose','WILLIAMS',[.64,.10],[-2.05,.505,0],[-Math.PI/2,0,-Math.PI/2]);
 // Central survival-cell outer shell, open cockpit on top.
 tag(mesh('nose',loft([[-1.14,.45,.22,.13],[-.8,.47,.32,.19],[-.25,.46,.34,.20],[.28,.47,.31,.18],[.65,.42,.22,.14]]),'blue'),'chassis');
 const cockpit=tag(mesh('halo',new THREE.SphereGeometry(1,40,20),'black',[-.37,.655,0]),'cockpit');cockpit.scale.set(.55,.10,.235);
 for(const s of [-1,1]){
  tag(mesh('halo',tube([[-.95,.68,s*.14],[-.78,.75,s*.24],[-.30,.76,s*.265],[.12,.73,s*.17]],.027),'blue'),'cockpit');
  // Front and rear visible wishbones. Rod layout is schematic, not a verified push/pull-rod specification.
  for(const axle of [-1.55,1.85]){
   const id=axle<0?'front-suspension':'rear-suspension';
   for(const h of [.26,.5])for(const dx of [-.34,.31])tag(mesh(id,rod([axle+dx,h,s*.21],[axle,h-.015,s*.79],.014),'carbon'),h>.4?'upper-arms':'lower-arms');
   tag(mesh(id,rod([axle-.2,.62,s*.20],[axle+.03,.27,s*.76],.017),'carbon'),'actuation');
   tag(mesh(id,rod([axle-.3,.37,s*.22],[axle-.1,.35,s*.79],.011),'metal'),'track-rods');
  }
  // Sidepods with undercut; smooth section rings avoid primitive block silhouettes.
  const pod=mesh('sidepods',loft([[-.38,.59,.025,.06],[-.19,.58,.22,.18],[.15,.52,.245,.20],[.68,.43,.22,.16],[1.18,.33,.15,.10],[1.55,.29,.025,.035]]),'blue',[0,0,s*.42]);
  const inlet=tag(mesh('sidepods',new THREE.SphereGeometry(1,28,16),'black',[-.2,.61,s*.43]),'inlets');inlet.scale.set(.055,.105,.19);
  tag(box('sidepods',[.68,.22,.055],[.35,.46,s*.44],'radiator',[.25*s,0,-.15]),'radiators');
  tag(mesh('sidepods',tube([[-.08,.48,s*.42],[.03,.4,s*.43],[.7,.35,s*.37]],.018),'metal'),'radiators');
  tag(mesh('sidepods',tube([[-.31,.72,s*.40],[-.1,.74,s*.61],[.38,.66,s*.65],[.94,.48,s*.55],[1.4,.35,s*.42]],.018),'white'),'pod-trim');
  tag(mesh('sidepods',tube([[-.31,.697,s*.40],[-.1,.717,s*.61],[.38,.637,s*.65],[.94,.457,s*.55],[1.4,.327,s*.42]],.007),'red'),'pod-trim');
  decal('sidepods','ATLASSIAN',[.79,.13],[.37,.51,s*.665],[0,s>0?0:Math.PI,0]);
  decal('sidepods','WILLIAMS',[.64,.085],[.39,.39,s*.64],[0,s>0?0:Math.PI,0],'#8fc8ff');
  // White upper panel follows the sidepod skin.
  tag(mesh('sidepods',loft([[-.15,.665,.01,.015],[.13,.65,.185,.035],[.58,.55,.175,.035],[.98,.43,.10,.02],[1.2,.36,.01,.01]]),'white',[0,0,s*.43]),'pod-trim');
  tag(box('nose',[.16,.08,.095],[-.62,.78,s*.45],'blue'),'mirrors');tag(mesh('nose',rod([-.55,.6,s*.22],[-.62,.75,s*.43],.012),'carbon'),'mirrors');
 }
 mesh('engine-cover',loft([[.03,.66,.24,.18],[.28,.77,.23,.30],[.65,.68,.19,.30],[1.04,.55,.14,.25],[1.45,.4,.095,.13],[1.92,.33,.045,.055]]),'blue');
 // Roll hoop / airbox: dark intake surrounded by the fairing.
 mesh('airbox',loft([[.04,1.03,.12,.13],[.22,1.03,.145,.16],[.43,.94,.11,.15],[.7,.79,.05,.07]]),'blue');
 const intake=tag(mesh('airbox',new THREE.CircleGeometry(.1,32),'black',[.026,1.055,0],[0,-Math.PI/2,0]),'intake');intake.scale.set(.9,1.05,1);
 tag(box('airbox',[.21,.065,.23],[.18,1.165,0],'carbon'),'airbox-top');
 // Halo loop and central pillar, with no fictitious glass canopy.
 tag(mesh('halo',tube([[-.94,.75,0],[-.96,.96,0],[-.68,1.005,0]],.025),'carbon'),'halo-pillar');
 mesh('halo',tube([[.12,.78,-.21],[-.1,1.0,-.25],[-.7,1.015,-.20],[-.91,.99,0],[-.7,1.015,.20],[-.1,1,.25],[.12,.78,.21]],.027),'blue');
 const seat=tag(mesh('halo',new THREE.SphereGeometry(.11,28,18),'carbon',[-.2,.76,0]),'cockpit');seat.scale.set(1,1.25,1);
 tag(mesh('halo',tube([[-.66,.72,-.10],[-.69,.77,0],[-.66,.72,.1]],.016),'carbon'),'cockpit');
 for(let i=0;i<3;i++){
  const m=tag(mesh('front-wing',wing(-2.67+i*.14,.18+i*.068,1.78-i*.06,.25,.04),i===0?'carbon':'white'),i===0?'mainplane':'flaps');
  if(i>0){
   // Rotate about each element's own hinge, not the vehicle origin.
   const hx=-2.67+i*.14,hy=.18+i*.068;m.geometry.translate(-hx,-hy,0);m.position.set(hx,hy,0);
   activeFlaps.push({mesh:m,axis:'z',base:0,amount:-.12});
  }
 }
 for(const s of [-1,1]){
  tag(box('front-wing',[.45,.15,.022],[-2.35,.25,s*.89],'blue',[0,0,-.12]),'endplates');
  tag(box('front-wing',[.3,.022,.13],[-2.45,.15,s*.83],'carbon'),'endplates');
 }
 decal('front-wing','WILLIAMS',[.76,.13],[-2.36,.355,0],[-Math.PI/2,0,Math.PI/2],'#15294b');
 // Rear wing with movable flap surfaces and swan-neck-style generic supports.
 for(let i=0;i<2;i++){
  const m=tag(mesh('rear-wing',wing(1.98+i*.17,.94+i*.15,1.28,.37,.11),'white'),i===0?'rear-mainplane':'rear-flap');
  const hx=1.98+i*.17,hy=.94+i*.15;m.geometry.translate(-hx,-hy,0);m.position.set(hx,hy,0);
  activeFlaps.push({mesh:m,axis:'z',base:0,amount:-.14});
 }
 for(const s of [-1,1]){
  tag(box('rear-wing',[.58,.35,.025],[2.25,1.035,s*.65],'blue',[0,0,.08]),'rear-endplates');
  tag(mesh('rear-wing',tube([[1.7,.3,s*.14],[1.9,.65,s*.15],[2.18,.94,s*.15]],.022),'carbon'),'wing-supports');
 }
 decal('rear-wing','WILLIAMS',[1.01,.16],[2.34,1.17,0],[-Math.PI/2,0,Math.PI/2],'#142b57');
 tag(box('engine-cover',[.1,.07,.11],[2.12,.32,0],'black'),'tail-details');
 tag(box('engine-cover',[.02,.045,.065],[2.177,.32,0],'red'),'tail-details');
 tag(mesh('engine-cover',rod([1.63,.49,0],[2.03,.49,0],.043),'metal'),'tail-details');
 // Rounded shoulder slick tyres, exposed 18-inch style rims and carbon brake discs.
 for(const x of [-1.55,1.85])for(const s of [-1,1]){
  const wheel=new THREE.Group();wheel.position.set(x,.355,s*.795);wheel.userData.component='wheels';groups.wheels.add(wheel);wheels.push(wheel);
  const width=x<0?.28:.32,r=.355;
  const profile=[[-width/2,.245],[-width/2,.31],[-width*.43,.345],[-width*.28,r],[width*.28,r],[width*.43,.345],[width/2,.31],[width/2,.245]].map(([z,rad])=>new THREE.Vector2(rad,z));
  const tyre=tag(new THREE.Mesh(new THREE.LatheGeometry(profile,80),materials.rubber.clone()),'tyres');tyre.rotation.x=Math.PI/2;wheel.add(tyre);
  function disc(radius,depth,material,z){const m=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,depth,56),materials[material].clone());m.rotation.x=Math.PI/2;m.position.z=z;wheel.add(m);return m;}
  tag(disc(.232,width*.93,'metal',0),'rims');tag(disc(.208,width,'black',0),'rims');tag(disc(.174,.018,'carbon',s*(width/2+.009)),'brake-discs');tag(disc(.049,.035,'metal',s*(width/2+.026)),'rims');
  tag(box('wheels',[.13,.22,.06],[x+.1,.38,s*.82],'metal'),'calipers');
  tag(box('wheels',[.19,.1,.13],[x-.1,.35,s*.6],'carbon'),'calipers');
  for(let i=0;i<10;i++){
   const a=i/10*Math.PI*2;
   const spoke=tag(new THREE.Mesh(new THREE.BoxGeometry(.155,.018,.016),materials.metal.clone()),'rims');spoke.position.set(Math.cos(a)*.129,Math.sin(a)*.129,s*(width/2+.018));spoke.rotation.z=a;wheel.add(spoke);
  }
  // Readable sidewall lettering is a self-authored texture, not a scraped sponsor asset.
  const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d');ctx.translate(256,256);ctx.strokeStyle='#ccb848';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,207,0,Math.PI*2);ctx.stroke();
  const chars='P ZERO';ctx.font='bold italic 36px Arial';ctx.fillStyle='#e6cd4d';ctx.textAlign='center';
  for(let j=0;j<chars.length;j++){ctx.save();ctx.rotate((j-(chars.length-1)/2)*.13);ctx.fillText(chars[j],0,-174);ctx.restore();}
  ctx.rotate(Math.PI);ctx.font='bold 25px Arial';ctx.fillText('PIRELLI',0,-176);
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;
  const face=tag(new THREE.Mesh(new THREE.PlaneGeometry(.71,.71),new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:THREE.DoubleSide})),'tyres');face.position.z=s*(width/2+.004);if(s<0)face.rotation.y=Math.PI;wheel.add(face);
  wheel.traverse(o=>{if(o.isMesh){o.castShadow=true;o.userData.component='wheels';o.userData.baseMaterial=o.material.clone();}});
 }
 // Keep unique materials so focus state never mutates unrelated parts.
 const submeshes=[];
 root.traverse(o=>{if(o.isMesh){if(!o.userData.baseMaterial)o.userData.baseMaterial=o.material.clone();const c=components.find(c=>c.id===o.userData.component);if(!o.userData.subpart)o.userData.subpart=c.subparts[0].id;o.userData.restPosition=o.position.clone();submeshes.push(o);}});
 return {root,groups,wheels,activeFlaps,materials,submeshes};
}

export function applyFocus(car,id,enabled,subpart=null,{cutaway=0,dt=.016}={}){
 car.root.traverse(o=>{
  if(!o.isMesh||!o.userData.component||!o.userData.baseMaterial)return;const inSystem=!id||o.userData.component===id,active=inSystem&&(!subpart||o.userData.subpart===subpart);
  const materials=Array.isArray(o.material)?o.material:[o.material],bases=Array.isArray(o.userData.baseMaterial)?o.userData.baseMaterial:[o.userData.baseMaterial];
  materials.forEach((m,i)=>{const base=bases[i],weight=1-Math.exp(-dt*12);let opacity=enabled&&!active?(inSystem?.22:.075):base.opacity;
   // Compose focus with optional teaching transparency; never overwrite base PBR values.
   opacity*=1-cutaway*(o.userData.component==='floor'?.83:.88);m.opacity=THREE.MathUtils.lerp(m.opacity,opacity,weight);if(Math.abs(m.opacity-opacity)<.0001)m.opacity=opacity;
   const transparent=base.transparent||m.opacity<base.opacity-.001;if(m.transparent!==transparent){m.transparent=transparent;m.needsUpdate=true;}m.depthWrite=m.opacity<base.opacity-.001?false:base.depthWrite;
   if(m.emissive){const highlight=enabled&&active&&id;const target=highlight?new THREE.Color('#14467d'):base.emissive;m.emissive.lerp(target,weight);m.emissiveIntensity=THREE.MathUtils.lerp(m.emissiveIntensity,highlight?.35:base.emissiveIntensity,weight);}
  });
 });
}
