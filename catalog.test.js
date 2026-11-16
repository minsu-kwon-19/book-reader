import test from 'node:test';
import assert from 'node:assert/strict';
import {titles,seedCatalog,availableBooks,assignBook} from './catalog.js';
import {validate} from './model.js';
test('version 1 libraries replace Carnegie titles once without duplicating money or restoring unrelated books',()=>{
  const template=seedCatalog({version:1,books:[]}).books[0];
  const money={...template,id:'money',title:'보도 섀퍼의 돈',observed:'기존 기록'};
  const old={version:1,catalogVersion:1,books:[money,...['데일 카네기 인간관계론','데일 카네기 자기관리론'].map((title,i)=>({...template,id:`old-${i}`,title}))]};
  const next=seedCatalog(old);validate(next);
  assert.deepEqual(next.books.map(b=>b.title),['보도 섀퍼의 돈','데일 카네기 인간관계론','나는 나의 스무 살을 가장 존중한다']);
  assert.deepEqual(next.books[1],old.books[1]);
  assert.deepEqual(next.books[0],money);assert.equal(old.books.length,3);
  assert.equal(seedCatalog(next),next);
  assert.equal(seedCatalog({...old,books:[]}).books.length,3);
});
test('version 2 adds only human relations and preserves existing records',()=>{
  const current=seedCatalog({version:1,books:[]});
  const old={...current,catalogVersion:2,books:current.books.filter(b=>b.title!=='데일 카네기 인간관계론')};
  const next=seedCatalog(old);validate(next);
  assert.equal(next.books.length,100);
  assert.deepEqual(next.books.slice(0,-1),old.books);
  assert.equal(next.books.at(-1).title,'데일 카네기 인간관계론');
  assert.equal(seedCatalog(next),next);
});
test('all supplied titles seed once and survive backup',()=>{assert.equal(titles.length,100);assert.equal(new Set(titles).size,100);const data=seedCatalog({version:1,books:[]});assert.equal(data.books.length,100);validate(data);assert.equal(seedCatalog(data),data);const restored=validate(JSON.parse(JSON.stringify(data)));restored.books.pop();assert.equal(seedCatalog(restored).books.length,99)});
test('existing books and notes are preserved without title duplicates',()=>{const old={...seedCatalog({version:1,books:[]}).books[0],id:'existing',title:'생각의  비밀',observed:'내 기록',status:'done'};const data=seedCatalog({version:1,books:[old]});assert.equal(data.books.length,100);assert.deepEqual(data.books[0],old)});
test('search, planning exclusion, unplanning and completed books',()=>{const data=seedCatalog({version:1,books:[]});assert.equal(availableBooks(data.books,'제로투원').length,1);const id=data.books[0].id;const planned=assignBook(data.books,id,'2026-11-20');assert.equal(availableBooks(planned).length,99);assert.equal(assignBook(planned,id,'2026-11-21')[0].start,'2026-11-20');const removed=planned.map(b=>b.id===id?{...b,start:'',end:''}:b);assert.equal(availableBooks(removed).length,100);removed[0].status='done';assert.equal(availableBooks(removed).length,99);assert.equal(assignBook(removed,id,'2026-11-20')[0].start,'')});
