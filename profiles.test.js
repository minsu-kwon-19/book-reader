import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultProfiles,libraryKey,validateProfiles} from './profiles.js';
import {seedCatalog} from './catalog.js';
test('profiles preserve the old library key and isolate the second reader',()=>{
  const settings=defaultProfiles();validateProfiles(settings);
  assert.equal(libraryKey(settings.activeId),'galpi-library-v1');assert.notEqual(libraryKey('reader-1'),libraryKey('reader-2'));
  const first=seedCatalog({version:1,books:[]}),second=seedCatalog({version:1,books:[]});first.books[0].observed='private note';first.books[0].start='2026-11-16';
  assert.equal(second.books[0].observed,'');assert.equal(second.books[0].start,'');assert.equal(second.books.length,100);
});
test('profile configuration rejects invalid IDs and empty names',()=>{
  for(const invalid of [{activeId:'bad',profiles:defaultProfiles().profiles},{...defaultProfiles(),profiles:[]},{...defaultProfiles(),profiles:[{id:'reader-1',name:''},{id:'reader-2',name:'second'}]}])assert.throws(()=>validateProfiles(invalid));
});
