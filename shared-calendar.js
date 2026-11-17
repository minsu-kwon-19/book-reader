import {scheduled,dateKey} from './model.js';
export function calendarEntries(libraries,day){
  return libraries.flatMap(({ownerId,ownerName,books})=>books.filter(book=>scheduled(book,day)||book.logs.includes(day)||(book.status==='reading'&&day===dateKey(new Date()))).map(book=>({ownerId,ownerName,book,planned:scheduled(book,day)})));
}
export function readDays(libraries,month){
  return new Set(libraries.flatMap(({books})=>books.flatMap(book=>book.logs.filter(day=>day.startsWith(month)))));
}
