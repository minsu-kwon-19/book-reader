# 책틈 · Book Reader

독서 계획을 달력에 펼쳐 놓고 읽은 날을 체크하는 개인 독서 서비스입니다.

## 기능
- 월별 달력, 날짜별 독서 계획 및 읽기 체크
- 읽는 중 / 읽을 책 / 다 읽은 책 분류와 제목·저자 검색
- 책 등록·수정·삭제, 독서 기간, 페이지 진행률
- 브라우저 자동 저장, JSON 백업·복원, 반응형 화면

책 제목이나 표지를 누르면 진행률과 상태를 수정할 수 있습니다. 읽기 체크는 날짜만 기록하며 페이지를 자동으로 늘리지 않습니다.

## 실행과 검증
Node.js 22 이상. 외부 npm 의존성이 없습니다.

```sh
npm run dev
npm test
npm run build
```

미리보기: http://127.0.0.1:5173
PowerShell 실행 정책으로 차단되면 npm.cmd를 사용합니다.

## Vercel 배포
```sh
vercel login
vercel --prod
```

vercel.json에 빌드와 출력 경로가 설정되어 있습니다. Git 저장소를 가져올 때는 Framework Preset: Other, Build Command: npm run build, Output Directory: dist를 사용합니다. 환경 변수는 필요하지 않습니다.

## 데이터
서버 DB와 로그인 없이 브라우저 localStorage에 저장합니다. 기기 간 동기화는 지원하지 않습니다. 로컬과 배포 사이트는 저장 공간이 다르므로 JSON 백업·복원으로 옮겨주세요. 브라우저 데이터 삭제 전 백업하세요. 복원은 확인 후 현재 책장 전체를 교체합니다. 방문자끼리 독서 기록을 공유하지 않습니다.

Google Fonts가 연결되지 않으면 시스템 글꼴을 사용합니다.

## 테스트 범위
윤년과 연도 경계, 독서 계획 기간 경계, 손상된 백업과 중복 ID 거부를 검증합니다.

## 자동 배포
GitHub의 `minsu-kwon-19/book-reader` 저장소가 Vercel 프로젝트에 연결되어 있습니다.
`main` 브랜치에 push하면 운영 사이트 https://book-reader-cyan.vercel.app 에 자동 배포됩니다.
배포 상태는 Vercel 프로젝트의 Deployments에서 확인할 수 있습니다.

## 본깨적
책장의 본깨적 버튼이나 책 제목을 눌러 본 것·깨달은 것·적용할 것을 적고 저장할 수 있습니다. 각 항목은 선택 사항이며 5,000자까지 지원합니다. JSON 백업·복원에도 포함되며, 이전 백업도 호환됩니다.
