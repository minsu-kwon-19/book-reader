export const titles = `생각의 비밀
사장학개론
왜 사업하는가
이나모리 가즈오의 회계 경영
실패를 통과하는 일
권도균의 스타트업 경영 수업
제로 투 원
린 스타트업
사업의 철학
하드씽
초격차
다시, 초격차
슈독
스티브 잡스
이 땅에 태어나서
장사의 신
장사는 전략이다 RED
1년에 10억 버는 방구석 비즈니스
나는 돈이 없어도 사업을 한다
스타트업 바이블
모든 것은 기본에서 시작한다
정주영처럼 생각하고 정주영처럼 행동하라
백종원의 장사이야기
왜 일하는가
파이프라인 우화
좋은 기업을 넘어 위대한 기업으로
넷플릭스 규칙 없음
비즈니스 모델의 탄생
아이디어 불패의 법칙
마케팅 설계자
브랜드 설계자
트래픽 설계자
무기가 되는 스토리
포지셔닝
마케팅 불변의 법칙
컨테이저스
그로스 해킹
스타트 위드 와이
좋은 전략 나쁜 전략
일의 격
실리콘밸리의 팀장들
고객은 검색창을 떠났다
책 읽고 매출의 신이 되다
원칙
기브앤테이크
레버리지
타이탄의 도구들
포노 사피엔스
서울의사의 부자경제학
후천적 부자
부자 아빠 가난한 아빠
돈의 속성
돈의 심리학
부자의 언어
부의 인문학
부의 추월차선
이웃집 백만장자 변하지 않는 부의 법칙
보도 섀퍼의 돈
돈, 뜨겁게 사랑하고 차갑게 다루어라
일독
투자에 대한 생각
워런 버핏 바이블
부자 아빠의 투자 가이드
투자는 심리게임이다
당신이 속고 있는 28가지 재테크의 비밀
유시민의 경제학 카페
장하준의 경제학 강의
자본주의
부자의 역사
부의 감각
부자의 그릇
백만장자 시크릿
억만장자 시크릿
도파미네이션
파이어족이 온다
아주 작은 습관의 힘
아주 작은 반복의 힘
미라클 모닝
역행자
세이노의 가르침
원씽
몰입
마지막 몰입
그릿
마인드셋
웰씽킹
생각하라 그리고 부자가 되어라
데일 카네기 인간관계론
나는 나의 스무 살을 가장 존중한다
프레임
후회의 재발견
멘탈의 연금술
백만불짜리 습관
해빗
죽음의 수용소에서
독서 천재가 된 홍대리
여덟 단어
돈의 법칙
어떻게 원하는 것을 얻을 것인가
인생에 변명하지 마라`.split('\n');
const normalize=s=>s.replace(/\s+/g,'').toLowerCase();
export function seedCatalog(data){
  if(data.catalogVersion>=3)return data;
  const removed=new Set(['데일 카네기 자기관리론'].map(normalize));
  data={...data,books:data.books.filter(b=>!removed.has(normalize(b.title)))};
  const pending=data.catalogVersion===2?['데일 카네기 인간관계론']:data.catalogVersion===1?['보도 섀퍼의 돈','나는 나의 스무 살을 가장 존중한다','데일 카네기 인간관계론']:titles;
  const existing=new Set(data.books.map(b=>normalize(b.title))),ids=new Set(data.books.map(b=>b.id));
  const additions=pending.flatMap((title,i)=>{if(existing.has(normalize(title)))return [];let id=`reading-100-${titles.indexOf(title)+1}`;while(ids.has(id))id+='-new';ids.add(id);return [{id,title,author:'',status:'want',pages:1,pagesUnknown:true,current:0,color:i%5,start:'',end:'',logs:[],observed:'',learned:'',applied:''}]});
  return {...data,catalogVersion:3,books:[...data.books,...additions]};
}
export function availableBooks(books,query=''){return books.filter(b=>!b.start&&!b.end&&b.status!=='done'&&normalize(`${b.title} ${b.author}`).includes(normalize(query)))}
export function assignBook(books,id,day){return books.map(b=>b.id===id&&!b.start&&!b.end&&b.status!=='done'?{...b,start:day,end:day}:b)}
