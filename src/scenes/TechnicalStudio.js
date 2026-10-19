import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {RectAreaLightUniformsLib} from 'three/addons/lights/RectAreaLightUniformsLib.js';
import {createCar,applyFocus} from '../components/Car.js';
import {createAirflow} from '../components/FlowField.js';
import {components,byId} from '../data/technical.js';
import {createDriveEnvironment} from './DriveEnvironment.js';
import {dampCameraPose} from '../animations/CameraRig.js';

export class Studio{
 constructor(canvas,onSelect,onOrbit){
  this.canvas=canvas;this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#090f17');this.scene.fog=new THREE.FogExp2('#090f17',.045);
  this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.05;
  this.camera=new THREE.PerspectiveCamera(38,1,.05,180);this.camera.position.set(-5.9,2.5,5.7);
  this.controls=new OrbitControls(this.camera,canvas);this.controls.target.set(0,.47,0);this.controls.enableDamping=true;this.controls.dampingFactor=.075;this.controls.minDistance=1.15;this.controls.maxDistance=15;this.controls.maxPolarAngle=Math.PI/2-.015;this.controls.enablePan=false;this.controls.addEventListener('start',onOrbit);
  const pmrem=new THREE.PMREMGenerator(this.renderer),room=new RoomEnvironment();this.env=pmrem.fromScene(room,.04);this.scene.environment=this.env.texture;this.scene.environmentIntensity=.3;room.dispose();pmrem.dispose();
  this.scene.add(new THREE.HemisphereLight('#bfd4ee','#070a10',.45));
  const key=new THREE.DirectionalLight('#e4edff',2.1);key.position.set(-2.5,6.5,3.5);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-5,right:5,top:5,bottom:-5,near:.1,far:20});key.shadow.bias=-.0004;key.shadow.normalBias=.012;key.shadow.radius=3;this.scene.add(key);
  RectAreaLightUniformsLib.init();
  const area=(color,intensity,width,height,position,target)=>{const light=new THREE.RectAreaLight(color,intensity,width,height);light.position.set(...position);light.lookAt(...target);this.scene.add(light);return light;};
  area('#f2f6ff',9,5,2,[-.5,4.5,1],[0,.4,0]);area('#4d85d6',7,4,1.3,[1.3,2.5,-3.5],[.5,.6,0]);area('#d7e1ef',5,2,2,[-4,1.8,2],[-1,.4,0]);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(160,160),new THREE.MeshStandardMaterial({color:'#060a10',roughness:.48,metalness:.16,envMapIntensity:.15}));floor.rotation.x=-Math.PI/2;floor.position.y=-.016;floor.receiveShadow=true;this.scene.add(floor);
  this.grid=new THREE.GridHelper(100,125,'#354a64','#263448');this.grid.position.y=-.009;this.grid.material.transparent=true;this.grid.material.opacity=.12;this.scene.add(this.grid);
  this.stage=new THREE.Group();const disc=new THREE.Mesh(new THREE.CylinderGeometry(3.45,3.45,.012,112),new THREE.MeshStandardMaterial({color:'#0b121c',metalness:.2,roughness:.48,envMapIntensity:.2}));disc.position.y=-.015;disc.receiveShadow=true;this.stage.add(disc);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(3.45,.004,4,160),new THREE.MeshBasicMaterial({color:'#30465e'}));ring.rotation.x=Math.PI/2;ring.position.y=-.007;this.stage.add(ring);this.scene.add(this.stage);
  // Soft, self-authored contact pool complements the directional shadow.
  const shadow=document.createElement('canvas');shadow.width=shadow.height=128;const ctx=shadow.getContext('2d'),gradient=ctx.createRadialGradient(64,64,15,64,64,64);gradient.addColorStop(0,'rgba(0,0,0,.65)');gradient.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);
  const contact=new THREE.Mesh(new THREE.PlaneGeometry(6.2,2.7),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadow),transparent:true,depthWrite:false}));contact.rotation.x=-Math.PI/2;contact.position.y=-.005;this.scene.add(contact);
  this.drive=createDriveEnvironment();this.scene.add(this.drive.root);this.motionBlur=true;this.cutaway=false;this.cutawayWeight=0;
  this.stage.traverse(o=>{if(o.material){o.material.userData.restOpacity=o.material.opacity;o.material.transparent=true;o.material.depthWrite=false;}});
  this.car=createCar();this.scene.add(this.car.root);this.flow=createAirflow();this.car.root.add(this.flow.root);
  this.selected=null;this.subpart=null;this.focus=false;this.exploded=false;this.explodeAmount=1;this.targetPosition=new THREE.Vector3();this.targetLook=new THREE.Vector3();this.raycaster=new THREE.Raycaster();this.bounds=new THREE.Box3();
  const positions=new Float32Array(components.length*6);this.leaderGeometry=new THREE.BufferGeometry();this.leaderGeometry.setAttribute('position',new THREE.BufferAttribute(positions,3));this.leaders=new THREE.LineSegments(this.leaderGeometry,new THREE.LineDashedMaterial({color:'#7599bd',dashSize:.035,gapSize:.028,transparent:true,opacity:.4,depthWrite:false}));this.leaders.frustumCulled=false;this.scene.add(this.leaders);
  this.reindex();let down;
  canvas.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY];});canvas.addEventListener('pointerup',e=>{
   if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;
   const r=canvas.getBoundingClientRect();this.camera.updateMatrixWorld(true);this.car.root.updateMatrixWorld(true);this.raycaster.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),this.camera);
  const hit=this.raycaster.intersectObjects(Object.values(this.car.groups),true).find(h=>h.object.isMesh&&(Array.isArray(h.object.material)?h.object.material[h.face?.materialIndex??0]:h.object.material).opacity>.27);if(hit)onSelect(hit.object.userData.component,hit.object.userData.subpart);
  });new ResizeObserver(()=>this.resize()).observe(canvas.parentElement);this.resize();
 }
 reindex(){this.car.root.updateMatrixWorld(true);this.car.submeshes=[];for(const [id,group] of Object.entries(this.car.groups))group.traverse(o=>{if(o.isMesh){o.userData.component=id;o.userData.subpart??=byId[id].subparts[0].id;o.userData.restPosition??=o.position.clone();o.geometry.computeBoundingBox();const v=o.geometry.boundingBox.getCenter(new THREE.Vector3()).applyMatrix4(o.matrixWorld);o.userData.side=v.z<-.05?-1:1;this.car.submeshes.push(o);}});}
 resize(){const w=this.canvas.clientWidth,h=this.canvas.clientHeight;if(!w||!h)return;this.camera.aspect=w/h;this.camera.fov=w/h<1.35?THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(23))/(w/h))):38;this.camera.updateProjectionMatrix();this.renderer.setSize(w,h,false);}
 select(id,subpart=null){this.selected=id;this.subpart=subpart;}
 setFocus(enabled){this.focus=enabled;}
 reset(){this.resetting=true;}
 update(director,dt){
  const t=director.clock,state=director.state,damp=1-Math.exp(-dt*5);
  // Car stays near the origin. Track moves +X, exactly opposite its -X travel.
  this.car.root.position.set(0,0,0);this.grid.material.opacity=.12*(1-state.road);this.stage.visible=state.road<.998;
  this.stage.traverse(o=>{if(o.material)o.material.opacity=o.material.userData.restOpacity*(1-state.road);});
  this.drive.update(director.distance,director.velocity,state.road,{blur:this.motionBlur,reduced:director.reduced});
  // Positive Z angular velocity gives +X contact-point velocity, cancelling -X vehicle velocity.
  this.car.wheels.forEach(w=>{w.rotation.z=(director.distance/(w.userData.rollingRadius??.355))%(Math.PI*2);});this.car.activeFlaps.forEach(f=>{f.mesh.rotation[f.axis]=f.base+f.amount*state.launch;});this.flow.update(t,state.flow,dt);
  this.cutawayWeight=THREE.MathUtils.lerp(this.cutawayWeight,this.cutaway&&director.mode==='aero'&&director.aeroView==='flow'?1:0,damp);
  applyFocus(this.car,this.selected,this.focus,this.subpart,{cutaway:this.cutawayWeight,dt});
  // Sprung-body motion only: wheel pivots stay grounded; suspension follows part of heave.
  const vibration=director.reduced?0:state.road*director.velocity/54;
  const heave=vibration*(Math.sin(t*31)*.0014+Math.sin(t*17.3)*.0008),pitch=-THREE.MathUtils.clamp(director.acceleration*.00018,-.002,.002);
  for(const [id,g] of Object.entries(this.car.groups)){const v=this.exploded?byId[id].offset:[0,0,0];this.targetPosition.set(...v).multiplyScalar(this.explodeAmount);if(id!=='wheels')this.targetPosition.y+=heave*(id.includes('suspension')?.4:1);g.position.lerp(this.targetPosition,damp);if(id!=='wheels'){g.rotation.z=THREE.MathUtils.lerp(g.rotation.z,pitch*state.road,damp);g.rotation.x=vibration*Math.sin(t*8.7)*.0006;}}
  // A second hierarchy level separates real tagged meshes within the selected system.
  for(const mesh of this.car.submeshes){const data=mesh.userData,c=byId[data.component],sub=c.subparts.find(p=>p.id===data.subpart);this.targetPosition.copy(data.restPosition);if(this.exploded&&data.component===this.selected&&sub){this.targetPosition.x+=sub.offset[0]*this.explodeAmount;this.targetPosition.y+=sub.offset[1]*this.explodeAmount;this.targetPosition.z+=sub.offset[2]*data.side*this.explodeAmount;}mesh.position.lerp(this.targetPosition,damp);}
  const array=this.leaderGeometry.attributes.position.array;components.forEach((c,i)=>{const p=new THREE.Vector3(...c.position).add(this.car.root.position);p.toArray(array,i*6);p.add(this.car.groups[c.id].position).toArray(array,i*6+3);});this.leaderGeometry.attributes.position.needsUpdate=true;this.leaders.computeLineDistances();this.leaders.visible=this.exploded;
  if(this.resetting||director.cameraAuto&&director.playing){const pose=this.resetting?{position:[-5.9,2.5,5.7],target:[0,.47,0]}:director.cameraPose();this.targetPosition.set(...pose.position);this.targetLook.set(...pose.target);if(this.exploded&&this.selected&&!this.resetting){const g=this.car.groups[this.selected];this.targetPosition.add(g.position);this.targetLook.add(g.position);}dampCameraPose(this.camera.position,this.controls.target,this.targetPosition,this.targetLook,dt);if(this.resetting&&this.camera.position.distanceTo(this.targetPosition)<.004)this.resetting=false;}
  this.controls.update();this.renderer.render(this.scene,this.camera);
 }
 projectSelected(){
  if(!this.selected)return null;const c=byId[this.selected],target=new THREE.Vector3(...c.position).add(this.car.root.position).add(this.car.groups[this.selected].position);let label=c.name;
  if(this.subpart){let best=Infinity;for(const mesh of this.car.submeshes){if(mesh.userData.component!==this.selected||mesh.userData.subpart!==this.subpart||mesh.userData.decal)continue;const p=mesh.geometry.boundingBox.getCenter(new THREE.Vector3()).applyMatrix4(mesh.matrixWorld),distance=p.distanceToSquared(target);if(distance<best){best=distance;this.targetLook.copy(p);}}if(best<Infinity)target.copy(this.targetLook);label=c.subparts.find(s=>s.id===this.subpart)?.name??label;}
  target.project(this.camera);return{x:(target.x*.5+.5)*this.canvas.clientWidth,y:(-.5*target.y+.5)*this.canvas.clientHeight,visible:target.z<1&&Math.abs(target.x)<.94&&Math.abs(target.y)<.94,label};
 }
}
