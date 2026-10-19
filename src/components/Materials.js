import * as THREE from 'three';
// Self-authored tiling textures: no downloaded carbon maps or proprietary paint assets.
export function carbonWeave(){
 const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');
 ctx.fillStyle='#74777b';ctx.fillRect(0,0,128,128);
 for(let y=0;y<16;y++)for(let x=0;x<16;x++){
  const horizontal=(x+y)%4<2;ctx.fillStyle=horizontal?'#9a9c9f':'#5d6268';ctx.fillRect(x*8,y*8,8,8);
  ctx.strokeStyle=horizontal?'#b0b2b4':'#777d83';ctx.lineWidth=.5;
  for(let k=1;k<7;k+=2){ctx.beginPath();if(horizontal){ctx.moveTo(x*8,y*8+k);ctx.lineTo(x*8+8,y*8+k);}else{ctx.moveTo(x*8+k,y*8);ctx.lineTo(x*8+k,y*8+8);}ctx.stroke();}
 }
 const texture=new THREE.CanvasTexture(c);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(22,22);texture.anisotropy=8;return texture;
}
export function finTexture(){
 const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#151b22';ctx.fillRect(0,0,128,128);
 for(let x=0;x<128;x+=5){ctx.fillStyle='#64727d';ctx.fillRect(x,0,1,128);}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
