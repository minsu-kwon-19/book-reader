import http from 'node:http';
import {readFile} from 'node:fs/promises';
const types={html:'text/html; charset=utf-8',css:'text/css',js:'text/javascript'};
http.createServer(async(req,res)=>{const file=req.url.split('?')[0]==='/'?'index.html':req.url.split('?')[0].slice(1);if(!['index.html','style.css','app.js','model.js','catalog.js','profiles.js','shared-calendar.js'].includes(file)){res.writeHead(404);res.end();return}try{res.setHeader('Content-Type',types[file.split('.').pop()]);res.end(await readFile(new URL(file,import.meta.url)))}catch{res.writeHead(404);res.end()}}).listen(5173,'127.0.0.1',()=>console.log('http://127.0.0.1:5173'));
