import * as THREE from 'three';

// Smooth longitudinal bodywork; stations are [x, centreY, halfWidth, halfHeight].
// All surfaces are authored approximations, not official FW48 CAD.
export function loft(stations, segments=64, rings=28) {
 const curves=[0,1,2,3].map(k=>new THREE.SplineCurve(stations.map((s,i)=>new THREE.Vector2(i,s[k]))));
 const vertices=[], indices=[];
 for(let i=0;i<=segments;i++){
  const s=curves.map(c=>c.getPoint(i/segments).y);
  for(let j=0;j<=rings;j++){
   const a=j/rings*Math.PI*2;
   vertices.push(s[0],s[1]+Math.sin(a)*s[3],Math.cos(a)*s[2]);
  }
 }
 for(let i=0;i<segments;i++)for(let j=0;j<rings;j++){
  const a=i*(rings+1)+j,b=a+rings+1;
  indices.push(a,b,a+1,b,b+1,a+1);
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
export function rod(a,b,r=.018){
 const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b),d=q.clone().sub(p);
 const g=new THREE.CylinderGeometry(r,r,d.length(),10);
 g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize()));g.translate(...p.add(q).multiplyScalar(.5).toArray());return g;
}
export function tube(points,r=.022){return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),56,r,10,false);}
// An extruded, cambered wing profile with a swept leading edge.
export function wing(x,y,span,chord,camber=.075){
 const vertices=[],indices=[],N=36,M=18;
 for(let i=0;i<=N;i++)for(let j=0;j<=M;j++){
  const z=(i/N-.5)*span,t=j/M,sweep=Math.pow(Math.abs(z)/(span/2),1.6)*.13;
  vertices.push(x+t*chord+sweep,y+Math.sin(t*Math.PI)*camber+Math.pow(z/span,2)*.13,z);
 }
 for(let i=0;i<N;i++)for(let j=0;j<M;j++){const a=i*(M+1)+j,b=a+M+1;indices.push(a,b,a+1,b,b+1,a+1);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
export function labelTexture(text,color='#ffffff',bg=null,width=1024,height=160){
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
 const ctx=canvas.getContext('2d');if(bg){ctx.fillStyle=bg;ctx.fillRect(0,0,width,height);}
 ctx.fillStyle=color;ctx.font=`italic 700 ${height*.63}px Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,width/2,height/2,width*.96);
 const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=8;return tex;
}
