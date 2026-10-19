import * as THREE from 'three';
/** Follow a retargetable orbit rather than interpolating through the chassis.
 * Radius, azimuth, height and aim are damped from the current actual pose.
 * This also handles a user switching modes after orbiting to the opposite side.
 */
export function dampCameraPose(position,aim,desiredPosition,desiredAim,dt){
 const k=1-Math.exp(-dt*3),cx=position.x-aim.x,cz=position.z-aim.z,tx=desiredPosition.x-desiredAim.x,tz=desiredPosition.z-desiredAim.z;
 const a=Math.atan2(cx,cz),b=Math.atan2(tx,tz),angle=a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*k;
 const radius=THREE.MathUtils.lerp(Math.hypot(cx,cz),Math.hypot(tx,tz),k),y=THREE.MathUtils.lerp(position.y,desiredPosition.y,k);
 aim.lerp(desiredAim,k);position.set(aim.x+Math.sin(angle)*radius,y,aim.z+Math.cos(angle)*radius);
}
