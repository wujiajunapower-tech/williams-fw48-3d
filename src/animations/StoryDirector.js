import * as THREE from 'three';
import {byId} from '../data/technical.js';
import {modes,componentView} from '../data/story.js';
export const DRIVE_CYCLE=28;
const damp=(v,t,k,dt)=>THREE.MathUtils.lerp(v,t,1-Math.exp(-k*dt));
const positions=[[-4.8,.94,4.2],[-2.7,.72,4.7],[.2,1.06,5.25],[4.3,.96,4.05],[4.05,.46,3.1],[.15,.42,4.35],[-4.5,2.15,5.65]];
const targets=[[-.7,.4,0],[-.65,.4,0],[0,.48,0],[.85,.5,0],[1.15,.36,0],[.1,.36,0],[-.15,.5,0]];
const names=['低位前方追踪 · 前翼与轮端','前侧推进 · 连续加速','侧向跟拍 · 车身与涂装','低位后方追踪 · 尾翼与后轮','尾部贴地 · 扩散器出口','地面掠行 · 速度参照','远景回收 · 全车轮廓'];
const curve=pts=>new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p)),true,'catmullrom',.35);
/** Interruptible modes, a continuous odometer and periodic camera splines.
 * No linear film, chapter scheduling, seek, or automatic component changes remain. */
export class Director{
 constructor({reduced=false}={}){this.mode='explore';this.aeroView='flow';this.playing=true;this.cameraAuto=!reduced;this.reduced=reduced;this.clock=0;this.driveTime=0;this.distance=0;this.velocity=0;this.acceleration=0;this.selected=null;this.shot='sequence';this.state={flow:0,road:0,launch:0};this.positionCurve=curve(positions);this.targetCurve=curve(targets);}
 setMode(mode){if(!modes.some(m=>m.id===mode))return;this.mode=mode;this.playing=true;}
 setAeroView(view){if(!['flow','components'].includes(view))return;this.aeroView=view;this.setMode('aero');}
 toggle(){this.playing=!this.playing;}
 update(dt){
  // Transition weights settle even while scene motion is paused.
  this.state.road=damp(this.state.road,this.mode==='drive'?1:0,4,dt);
  this.state.flow=damp(this.state.flow,this.mode==='aero'&&this.aeroView==='flow'?1:0,4.5,dt);
  if(!this.playing){this.acceleration=0;return;}
  this.clock+=dt;
  if(this.mode==='drive')this.driveTime=(this.driveTime+dt)%DRIVE_CYCLE;
  // Periodic target speed and a smooth launch. All distances are metres.
  const phase=this.driveTime/DRIVE_CYCLE*Math.PI*2,target=this.mode==='drive'?43+8*Math.sin(phase-.8)+3*Math.sin(phase*2):0;
  const old=this.velocity;this.velocity=damp(old,target,this.mode==='drive'?.48:5,dt);
  if(this.velocity<.001&&this.mode!=='drive')this.velocity=0;
  this.acceleration=(this.velocity-old)/Math.max(dt,1e-5);this.distance+=(old+this.velocity)*.5*dt;
  this.state.launch=this.velocity/54;
 }
 get speed(){return this.velocity*3.6;}
 get chapter(){return this.mode==='aero'&&this.aeroView==='components'?componentView:modes.find(m=>m.id===this.mode);}
 cameraPose(){
  if(this.mode==='drive'){
   let u=this.driveTime/DRIVE_CYCLE;
   if(this.shot!=='sequence')u={front:0,side:2/7,rear:3.6/7,ground:5/7}[this.shot]??u;
   return {position:this.positionCurve.getPoint(u).toArray(),target:this.targetCurve.getPoint(u).toArray(),name:this.shot==='sequence'?names[Math.floor(u*7)%7]:({front:names[0],side:names[2],rear:names[3],ground:names[5]}[this.shot])};
  }
  if(this.mode==='aero'&&this.aeroView==='components'&&this.selected){const c=byId[this.selected];return {position:c.camera,target:c.position,name:c.name+' · 稳定聚焦'};}
  if(this.mode==='aero')return {position:[-6,2.85,7.8],target:[.4,.5,0],name:'五系统流场 · 鼻锥至车尾'};
  const a=this.clock*.035;return {position:[-5.9*Math.cos(a)-5.7*Math.sin(a),2.5,-5.9*Math.sin(a)+5.7*Math.cos(a)],target:[0,.47,0],name:'缓慢环绕 · 自由探索'};
 }
}
