import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
export const flowRegions=[
 {id:'front',name:'前翼气流',color:'#36d9f2',note:'Cyan · 翼面导流与转向',detail:'青色来流贴近前翼主翼面和襟翼，上下分层并在翼后偏转。路径用来说明前轴负载与气流分配，不对应计算压力。'},
 {id:'wheels',name:'前轮尾流',color:'#ff9e45',note:'Orange · 轮后旋涡与扰动',detail:'橙色路径绕过前轮外缘，进入轮后逐渐扩张的螺旋尾迹。它与前翼的有序来流形成对照；旋涡尺度、频率均为教学设计。'},
 {id:'sidepods',name:'侧箱及车身绕流',color:'#68df96',note:'Green · 下切、外侧与引擎盖',detail:'绿色路径分成侧箱下切、肩部与引擎盖三层，沿外部表面向尾部收束。冷却进气与外部绕流不同，此处不模拟散热器内部。'},
 {id:'floor',name:'底板及扩散器',color:'#b58bff',note:'Purple · 车底加速与后部扩散',detail:'紫色流线在车底压紧、加密，示踪箭头更快通过低矮通路，再沿扩散器向后上方展开。打开底板透视可看清通路；速度变化为定性编码。'},
 {id:'rear',name:'后翼及车尾尾流',color:'#ff6275',note:'Red · 翼面上下流路与上洗',detail:'红色路径在后翼上下方分层通过，翼后抬升并逐渐扩张扰动。用于理解上洗与尾流组织，不可据此读取阻力或下压力。'}
];
/** Art-directed paths in car coordinates: nose -X, downstream +X, Y up.
 * Tubes are batched, pulses run on GPU. Directional arrowheads and streaks share
 * arc-length sampling; no random frame-to-frame particles or fluid-solver claims.
 */
export function createAirflow(){
 const root=new THREE.Group();root.name='Five_Engineered_Flow_Systems';
 const paths=[],tubes=[],enabled=Object.fromEntries(flowRegions.map(r=>[r.id,true])),settings={density:1,wake:true,selected:null};
 function add(index,points,wake=false){
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),false,'centripetal'),length=curve.getLength(),seed=paths.length*.6180339%1;
  const g=new THREE.TubeGeometry(curve,wake?100:72,wake?.0037:.0046,4,false),count=g.attributes.position.count,arc=new Float32Array(count),region=new Float32Array(count),seeds=new Float32Array(count),velocity=new Float32Array(count),rank=new Float32Array(count),colors=new Float32Array(count*3),color=new THREE.Color(flowRegions[index].color);
  for(let i=0;i<count;i++){arc[i]=g.attributes.uv.getX(i)*length;region[i]=index;seeds[i]=seed;velocity[i]=index===3?2.7: index===1?1.25:1.75;rank[i]=(paths.filter(p=>p.index===index).length%10)/10;color.toArray(colors,i*3);}
  for(const [key,array,size] of [['aArc',arc,1],['aRegion',region,1],['aSeed',seeds,1],['aVelocity',velocity,1],['aRank',rank,1],['color',colors,3]])g.setAttribute(key,new THREE.BufferAttribute(array,size));
  tubes.push(g);paths.push({curve,length,seed,index,region:flowRegions[index].id,wake,samples:curve.getSpacedPoints(240),rank:rank[0],velocity:velocity[0]});
 }
 for(const side of [-1,1]){
  for(let i=0;i<10;i++){const n=i/9,z=side*(.1+n*.71);
   const exit=side*(n>.6?1.1+.06*n:.12+n*.64);
   add(0,[[-4,.2+n*.12,z],[-2.85,.21+n*.1,z],[-2.5,.25+n*.1,z],[-2.25,.29+n*.14,z*1.02],[-2.04,.39+n*.13,exit*.98],[-1.75,.44+n*.14,exit],[-1.1,.48+n*.16,exit]]);
  }
  for(let i=0;i<10;i++){
   const pts=[],a0=i/10*Math.PI*2;
   for(let j=0;j<=48;j++){const u=j/48,a=a0+u*Math.PI*7,r=.06+u*.16;pts.push([-1.08+u*4.5,.34+Math.sin(a)*r,side*(1.04+u*.26)+Math.cos(a)*r]);}add(1,pts,true);
  }
  for(let i=0;i<8;i++){const n=i/7;
   add(2,[[-1.15,.29+n*.4,side*.45],[-.55,.25+n*.46,side*(.61+n*.1)],[.05,.24+n*.44,side*(.68+n*.04)],[.7,.25+n*.39,side*(.64+n*.04)],[1.33,.28+n*.31,side*.43],[2.7,.34+n*.26,side*.52],[4.1,.43+n*.28,side*.7]]);
  }
  for(let i=0;i<4;i++){const n=i/3;
   add(2,[[-.85,1.23+n*.07,side*(.08+n*.16)],[.3,1.36+n*.06,side*(.1+n*.17)],[.85,1.05+n*.18,side*(.14+n*.2)],[1.5,.85+n*.13,side*(.1+n*.16)],[3.2,.85+n*.12,side*(.18+n*.22)]]);
  }
  for(let i=0;i<12;i++){const n=i/11,z=side*(.065+n*.58);
   add(3,[[-2.5,.065,z],[-1.5,.048,z],[0,.046,z],[1.2,.05,z*.96],[1.85,.11,z*1.02],[2.3,.25,z*1.08],[3.3,.4,z*1.25],[4.2,.48,z*1.55]]);
  }
  for(let i=0;i<10;i++){const n=i/9,layer=i%2,pts=[[.65,layer?1.35:.85,side*(.08+n*.65)],[1.72,layer?1.35:.94,side*(.08+n*.65)],[2.2,layer?1.49:1.08,side*(.08+n*.65)]];
   for(let j=1;j<=12;j++){const u=j/12;pts.push([2.2+u*2.9,(layer?1.49:1.08)+u*.47+Math.sin(u*12+n*5)*u*.055,side*(.08+n*.65+u*.25)+Math.sin(u*15+n*6)*u*.055]);}add(4,pts);
  }
 }
 const mask=new Float32Array(5).fill(1),uniforms={uTime:{value:0},uOpacity:{value:0},uMask:{value:mask},uFocus:{value:-1},uDensity:{value:1}};
 const material=new THREE.ShaderMaterial({uniforms,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
 vertexShader:`attribute float aArc,aRegion,aSeed,aVelocity,aRank;varying float vArc,vRegion,vSeed,vVelocity,vRank;varying vec3 vColor;void main(){vArc=aArc;vRegion=aRegion;vSeed=aSeed;vVelocity=aVelocity;vRank=aRank;vColor=color;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
 fragmentShader:`uniform float uTime,uOpacity,uMask[5],uFocus,uDensity;varying float vArc,vRegion,vSeed,vVelocity,vRank;varying vec3 vColor;void main(){int r=int(vRegion+.1);float focus=uFocus<0.0||abs(uFocus-vRegion)<.1?1.0:.085;float phase=fract((vArc-uTime*vVelocity)*1.7+vSeed);float pulse=pow(phase,12.0);float end=smoothstep(0.0,.16,vArc);float density=1.0-smoothstep(uDensity*.72,uDensity*.72+.06,vRank);gl_FragColor=vec4(mix(vColor,vec3(.9,.97,1.0),pulse*.25),(.17+pulse*.7)*uOpacity*uMask[r]*focus*end*density);}`});
 const merged=mergeGeometries(tubes);tubes.forEach(g=>g.dispose());const mesh=new THREE.Mesh(merged,material);mesh.frustumCulled=false;root.add(mesh);
 // Arrowheads express direction even when paused; four short streaks per path.
 const arrowGeometry=new THREE.ConeGeometry(.016,.075,5);arrowGeometry.translate(0,.025,0);
 const arrowMat=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending});
 const arrows=new THREE.InstancedMesh(arrowGeometry,arrowMat,paths.length*2);arrows.instanceMatrix.setUsage(THREE.DynamicDrawUsage);arrows.frustumCulled=false;root.add(arrows);
 const streakGeometry=new THREE.BufferGeometry(),positions=new Float32Array(paths.length*4*6),colors=new Float32Array(positions.length);
 streakGeometry.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));streakGeometry.setAttribute('color',new THREE.BufferAttribute(colors,3).setUsage(THREE.DynamicDrawUsage));
 const streakMat=new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}),streaks=new THREE.LineSegments(streakGeometry,streakMat);streaks.frustumCulled=false;root.add(streaks);
 const dummy=new THREE.Object3D(),up=new THREE.Vector3(0,1,0),a=new THREE.Vector3(),b=new THREE.Vector3(),tangent=new THREE.Vector3(),color=new THREE.Color();
 function sample(path,u,out){const q=THREE.MathUtils.clamp(u,0,1)*240,k=Math.min(239,Math.floor(q));return out.copy(path.samples[k]).lerp(path.samples[k+1],q-k);}
 function update(time,opacity,dt=.016){
  root.visible=opacity>.002;uniforms.uTime.value=time;uniforms.uOpacity.value=opacity;uniforms.uDensity.value=settings.density;uniforms.uFocus.value=flowRegions.findIndex(r=>r.id===settings.selected);
  flowRegions.forEach((r,i)=>{const target=enabled[r.id]&&(i!==1||settings.wake)?1:0;mask[i]=THREE.MathUtils.lerp(mask[i],target,1-Math.exp(-dt*14));});
  if(!root.visible)return;
  arrowMat.opacity=opacity*.9;streakMat.opacity=opacity*.8;
  paths.forEach((p,i)=>{
   const focus=settings.selected&&settings.selected!==p.region?.085:1,visible=mask[p.index]*focus*(p.rank<settings.density*.72?1:0);
   color.set(flowRegions[p.index].color).multiplyScalar(visible);
   for(let j=0;j<4;j++){
    // Floor heads cluster toward the outlet as path speeds up: qualitative acceleration.
    let u=(time*p.velocity/p.length+p.seed+j/4)%1;
    // Spend less transit time in the narrow floor and more in the broad inlet/outlet.
    // Monotone remapping accelerates centrally and decelerates into the diffuser.
    if(p.index===3)u=u-Math.sin(u*Math.PI*2)*.075;
    sample(p,u,a);sample(p,Math.max(0,u-.055/p.length),b);a.toArray(positions,(i*4+j)*6);b.toArray(positions,(i*4+j)*6+3);color.toArray(colors,(i*4+j)*6);color.toArray(colors,(i*4+j)*6+3);
    if(j<2){sample(p,Math.min(1,u+.006),b);tangent.subVectors(b,a).normalize();dummy.position.copy(a);dummy.quaternion.setFromUnitVectors(up,tangent);dummy.scale.setScalar(visible>.002?Math.sqrt(visible):0);dummy.updateMatrix();arrows.setMatrixAt(i*2+j,dummy.matrix);arrows.setColorAt(i*2+j,color);}
   }
  });
  arrows.instanceMatrix.needsUpdate=true;if(arrows.instanceColor)arrows.instanceColor.needsUpdate=true;streakGeometry.attributes.position.needsUpdate=true;streakGeometry.attributes.color.needsUpdate=true;
 }
 return {root,enabled,settings,update,pathCount:paths.length,paths,masks:mask};
}
