import test from 'node:test';
import assert from 'node:assert/strict';
import {monthDays,scheduled,validate} from './model.js';
const book={id:'a',title:'책',author:'',pages:100,current:0,status:'reading',color:0,start:'2026-11-16',end:'2026-11-20',logs:[]};
test('calendar spans year and leap month correctly',()=>{const days=monthDays(2024,1);assert.equal(days.length,42);assert.ok(days.includes('2024-02-29'));assert.equal(new Date(days[0]+'T12:00:00').getDay(),0);assert.ok(monthDays(2026,11).includes('2027-01-01'))});
test('plans include boundaries, exclude unscheduled dates',()=>{assert.ok(scheduled(book,book.start));assert.ok(scheduled(book,book.end));assert.equal(scheduled(book,'2026-11-21'),false);assert.equal(scheduled({...book,start:'',end:''},'2026-11-16'),false)});
test('backup validation rejects corrupt data and duplicate IDs',()=>{assert.doesNotThrow(()=>validate({version:1,books:[book]}));for(const b of [{...book,current:101},{...book,logs:['2026-02-30']},{...book,end:'2026-11-01'},{...book,title:' '},{...book,start:''}])assert.throws(()=>validate({version:1,books:[b]}));assert.throws(()=>validate({version:1,books:[book,book]}))});
