import test from 'node:test';
import assert from 'node:assert/strict';
import {calendarEntries,readDays} from './shared-calendar.js';
const book=(title,start,logs=[])=>({id:title,title,start,end:start,logs});
test('reader day totals stay separate and count each date once within the month',()=>{
  const first={books:[book('A','',['2026-11-16','2026-11-17']),book('B','',['2026-11-17','2026-10-31'])]};
  const second={books:[book('C','',['2026-11-16'])]};
  assert.equal(readDays([first],'2026-11').size,2);
  assert.equal(readDays([second],'2026-11').size,1);
  assert.equal(readDays([{books:[]}],'2026-11').size,0);
});
test('shared calendar includes both owners and keeps identical titles distinct',()=>{
  const libraries=[{ownerId:'reader-1',ownerName:'민수',books:[book('원씽','2026-11-16',['2026-11-16'])]},{ownerId:'reader-2',ownerName:'지은',books:[book('원씽','2026-11-16',['2026-11-17'])]}];
  const entries=calendarEntries(libraries,'2026-11-16');assert.equal(entries.length,2);assert.deepEqual(entries.map(e=>e.ownerName),['민수','지은']);
  assert.equal(calendarEntries(libraries,'2026-11-17').length,1);assert.deepEqual([...readDays(libraries,'2026-11')].sort(),['2026-11-16','2026-11-17']);
});
