export const PROFILE_KEY='chaekteum-profiles-v1';
export const defaultProfiles=()=>({activeId:'reader-1',profiles:[{id:'reader-1',name:'독서가 1'},{id:'reader-2',name:'독서가 2'}]});
export const libraryKey=id=>id==='reader-1'?'galpi-library-v1':'chaekteum-library-reader-2-v1';
export function validateProfiles(value){
  if(!value||!Array.isArray(value.profiles)||value.profiles.length!==2||!['reader-1','reader-2'].includes(value.activeId))throw Error('프로필 설정을 읽을 수 없어요.');
  for(const [i,p]of value.profiles.entries())if(p.id!==`reader-${i+1}`||typeof p.name!=='string'||!p.name.trim()||p.name.length>24)throw Error('프로필 이름을 확인해 주세요.');
  return value;
}
