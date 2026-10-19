// Serve the supplied build using Node only; npm installation is not needed for viewing.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'dist');
const port=Number(process.env.PORT||5180);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.ttf':'font/ttf','.woff2':'font/woff2','.png':'image/png','.jpg':'image/jpeg','.glb':'model/gltf-binary','.gltf':'model/gltf+json','.json':'application/json','.txt':'text/plain; charset=utf-8'};
mime['.svg']='image/svg+xml';
await fs.access(path.join(root,'index.html')).catch(()=>{throw new Error('dist/index.html missing. Run npm ci and npm run build first.');});
const server=http.createServer(async(req,res)=>{
 try{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end();}
  const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const target=path.resolve(root,'.'+(name==='/'?'/index.html':name));
  if(!target.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  const content=await fs.readFile(target);res.writeHead(200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream','Content-Length':content.length,'Cache-Control':'no-cache'});res.end(req.method==='HEAD'?undefined:content);
 }catch{res.writeHead(404,{'Content-Type':'text/plain'});res.end('File not found');}
});
server.listen(port,'127.0.0.1',()=>console.log(`FW48 Technical Studio: http://localhost:${port}/\nCtrl+C to stop.`));
server.on('error',error=>{console.error(error.message);process.exitCode=1;});
