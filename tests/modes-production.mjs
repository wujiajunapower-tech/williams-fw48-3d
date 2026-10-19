import './temp.mjs';import {chromium} from 'playwright';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import http from 'node:http';import path from 'node:path';
const root=path.resolve('dist'),mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.glb':'model/gltf-binary','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{try{const u=new URL(req.url,'http://localhost');if(!u.pathname.startsWith('/fw48/')){res.writeHead(404).end();return;}let p=decodeURIComponent(u.pathname.slice('/fw48/'.length))||'index.html';const absolute=path.resolve(root,p);if(!absolute.startsWith(root+path.sep)){res.writeHead(403).end();return;}const data=await fs.readFile(absolute);res.writeHead(200,{'Content-Type':mime[path.extname(absolute)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);}catch{res.writeHead(404).end();}});
await new Promise(resolve=>server.listen(5181,'127.0.0.1',resolve));
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
const checks=[],errors=[],external=[],responses=[];
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}});page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)responses.push({url:r.url(),status:r.status()});});
 await page.route('**/*',route=>{const u=new URL(route.request().url());if(!['127.0.0.1','localhost'].includes(u.hostname)){external.push(u.href);return route.abort();}return route.continue();});
 const base=process.env.PRODUCTION_URL||'http://127.0.0.1:5180/';
 await page.goto(base,{waitUntil:'networkidle'});await page.waitForFunction(()=>document.body.dataset.asset==='blender',null,{timeout:60000});
 assert.equal(await page.evaluate(()=>typeof window.__FW48),'undefined');assert.equal(await page.locator('html').getAttribute('lang'),'zh-CN');assert.equal(await page.locator('#timeline,.transport').count(),0);checks.push('real delivery server serves new production build, Chinese UI, no debug hook or transport');
 for(const id of ['drive','aero','explore','aero']){await page.locator('button[data-mode="'+id+'"]').click();await page.waitForFunction(id=>document.body.dataset.mode===id,id);}
 await page.locator('button[data-aero-view="components"]').click();await page.locator('#part-select').selectOption('rear-wing');await page.waitForFunction(()=>document.querySelector('#part-title').textContent==='后翼与支撑');await page.locator('[data-subpart="rear-flap"]').click();await page.waitForFunction(()=>document.querySelector('#sub-title').textContent==='活动翼片');checks.push('production modes and preserved component inspector work');
 await page.screenshot({path:'test-results/modes/production-components.png'});
 await page.goto('http://127.0.0.1:5181/fw48/',{waitUntil:'networkidle'});await page.waitForFunction(()=>document.body.dataset.asset==='blender',null,{timeout:60000});
 const model=await page.request.get('http://127.0.0.1:5181/fw48/models/fw48/fw48.glb');assert.equal(model.status(),200);assert.equal(model.headers()['content-type'],'model/gltf-binary');
 await page.locator('button[data-mode="aero"]').click();await page.locator('[data-flow="floor"]').click();await page.waitForFunction(()=>document.querySelector('[data-flow="floor"]').getAttribute('aria-pressed')==='false');assert.equal(await page.locator('[data-flow="floor"]').getAttribute('aria-pressed'),'false');checks.push('Pages-style /fw48/ subpath loads scripts/styles/GLB and operates flow controls');
 await page.screenshot({path:'test-results/modes/production-subpath.png'});
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);assert.deepEqual(responses,[]);checks.push('no external runtime requests, HTTP errors or shader/runtime errors');
 await fs.writeFile('test-results/modes/production-report.json',JSON.stringify({passed:true,checks,errors,external,responses,subpath:'http://127.0.0.1:5181/fw48/'},null,2));console.log('PASS '+checks.length+' production and Pages-subpath checks');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
