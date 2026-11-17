import {mkdir,copyFile} from 'node:fs/promises';
await mkdir('dist',{recursive:true});
for(const name of ['index.html','style.css','app.js','model.js','catalog.js','profiles.js','shared-calendar.js','sync-client.js','auth-client.js']) await copyFile(name,`dist/${name}`);
console.log('Built dist/');
