import './ui/technical.css';
import './ui/readability.css';
import './ui/modes.css';
import {Studio} from './scenes/TechnicalStudio.js';
import {Director,DRIVE_CYCLE} from './animations/StoryDirector.js';
import {Interface} from './ui/ChineseInterface.js';
import {modes} from './data/story.js';
import {components,byId} from './data/technical.js';
import {loadCarModel} from './assets/loadCarModel.js';
let studio,director,selected=null;const assetState={status:'procedural',url:null,error:null};
const media=matchMedia('(prefers-reduced-motion: reduce)');
const actions={
 mode(id){
  if(!modes.some(m=>m.id===id))return;
  director.setMode(id);director.cameraAuto=!director.reduced;studio.resetting=false;
  if(id!=='aero'||director.aeroView==='flow'){studio.exploded=false;studio.setFocus(false);studio.select(null);selected=null;director.selected=null;}
  else if(!selected)actions.select('front-wing');
 },
 stepMode(delta){actions.mode(modes[(modes.findIndex(m=>m.id===director.mode)+delta+3)%3].id);},
 aeroView(view){director.setAeroView(view);actions.mode('aero');},
 select(id,subpart=null){if(!byId[id])return;director.setAeroView('components');selected=id;director.selected=id;studio.select(id,subpart);studio.setFocus(true);director.cameraAuto=!director.reduced;studio.resetting=false;},
 subpart(id){if(!selected||id&&!byId[selected].subparts.some(p=>p.id===id))return;studio.select(selected,id);studio.setFocus(true);if(id)studio.exploded=true;},
 stepPart(delta){const i=Math.max(0,components.findIndex(c=>c.id===selected));actions.select(components[(i+delta+components.length)%components.length].id);},
 reset(){director.cameraAuto=false;studio.reset();},
 camera(){director.cameraAuto=!director.cameraAuto;studio.resetting=false;},
 focus(){if(!selected)actions.select('front-wing');else studio.setFocus(!studio.focus);},
 explode(){if(director.mode!=='aero'||director.aeroView!=='components')actions.aeroView('components');studio.exploded=!studio.exploded;},
 explodeAmount(value){studio.explodeAmount=value;studio.exploded=true;},
 flow(id,value){if(id in studio.flow.enabled)studio.flow.enabled[id]=value;},
 region(id,all=false){if(all)Object.keys(studio.flow.enabled).forEach(key=>studio.flow.enabled[key]=true);studio.flow.settings.selected=studio.flow.settings.selected===id?null:id;if(id)studio.flow.enabled[id]=true;},
 density(value){studio.flow.settings.density=value;},
 wake(value){studio.flow.settings.wake=value;},
 cutaway(value){studio.cutaway=value;},
 blur(value){studio.motionBlur=value;},
 shot(id){director.shot=id;director.cameraAuto=true;studio.resetting=false;},
 pause(){director.toggle();}
};
const ui=new Interface(document.querySelector('#app'),actions);
try{
 director=new Director({reduced:media.matches});
 studio=new Studio(ui.el.scene,(id,sub)=>actions.select(id,sub),()=>{director.cameraAuto=false;studio.resetting=false;});
 media.addEventListener('change',e=>{director.reduced=e.matches;if(e.matches)director.cameraAuto=false;});
 const requested=new URLSearchParams(location.search).get('model'),model=requested==='procedural'?null:(requested||new URL('models/fw48/fw48.glb',document.baseURI).href);
 if(model){assetState.status='loading';assetState.url=model;loadCarModel(studio.car,model).then(()=>{studio.reindex();studio.setFocus(studio.focus);assetState.status='loaded';document.body.dataset.asset='blender';ui.assetLoaded();}).catch(error=>{assetState.status='fallback';assetState.error=error.message;console.warn('保留程序化模型：',error);const notice=document.createElement('div');notice.className='model-notice';notice.setAttribute('role','status');notice.textContent='重建模型未能加载，当前显示备用模型。原因：'+error.message;document.querySelector('.experience').append(notice);});}
 let previous=performance.now(),lastUI=0;
 function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-previous)/1000,.08);previous=now;director.update(dt);studio.update(director,dt);if(now-lastUI>70){ui.update(director,selected,studio);lastUI=now;}}
 document.addEventListener('visibilitychange',()=>{if(document.hidden)director.playing=false;previous=performance.now();});requestAnimationFrame(frame);ui.ready();
 if(import.meta.env.DEV)window.__FW48={studio,director,actions,components,DRIVE_CYCLE,assetState};
}catch(error){console.error(error);ui.error(error.message);}
