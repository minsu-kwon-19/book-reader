import test from 'node:test';
import assert from 'node:assert/strict';
import {calendarEntries,readDays} from './shared-calendar.js';
const book=(title,start,logs=[])=>({id:title,title,start,end:start,logs});
test('shared calendar includes both owners and keeps identical titles distinct',()=>{
  const libraries=[{ownerId:'reader-1',ownerName:'민수',books:[book('원씽','2026-11-16',['2026-11-16'])]},{ownerId:'reader-2',ownerName:'지은',books:[book('원씽','2026-11-16',['2026-11-17'])]}];
  const entries=calendarEntries(libraries,'2026-11-16');assert.equal(entries.length,2);assert.deepEqual(entries.map(e=>e.ownerName),['민수','지은']);
  assert.equal(calendarEntries(libraries,'2026-11-17').length,1);assert.deepEqual([...readDays(libraries,'2026-11')].sort(),['2026-11-16','2026-11-17']);
});
