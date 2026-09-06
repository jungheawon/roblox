# 좀비 서바이벌 - 실시간 멀티플레이 (최대 40명)

원본 싱글플레이 게임(`좀비_서바이벌_로블록스_게임.html`)에 Socket.IO 기반 실시간
멀티플레이 기능을 추가하고, GitHub + Render로 바로 배포할 수 있도록 패키징했습니다.

## 추가된 기능

- **최대 40명 동시 접속** — 41번째 접속자는 "서버가 가득 찼습니다" 메시지와 함께 거절됩니다.
- **플레이어끼리 겹치지 않음** — 다른 플레이어와 가까워지면 자동으로 서로 밀어내며 통과하지 못합니다.
- **검으로 때리면 넉백** — 검 사거리 안의 다른 플레이어를 때리면 그 플레이어가 맞은 방향으로 밀려납니다.
- 닉네임 입력 후 입장, 화면 상단 "온라인 N/40" 표시, 다른 플레이어 이름표(닉네임) 및 걷기/검 스윙 애니메이션 동기화, 접속·퇴장 알림.

> 참고: 좀비, 코인, 설치한 블록 등 월드 오브젝트는 각자의 화면에서 개별적으로 동작합니다.
> 실시간으로 동기화되는 것은 "플레이어(캐릭터)"의 위치·회전·검 스윙·피격 넉백입니다.

## 폴더 구조

```
.
├── server.js         # Express + Socket.IO 서버 (게임 파일 서빙 + 멀티플레이 중계)
├── package.json
├── render.yaml        # Render 배포 설정 (선택 사항, 없어도 수동 설정 가능)
├── .gitignore
└── public/
    └── index.html     # 게임 클라이언트 (멀티플레이 코드가 포함된 버전)
```

## 로컬에서 실행해보기

Node.js 18 이상이 설치되어 있어야 합니다.

```bash
npm install
npm start
```

브라우저에서 `http://localhost:3000` 접속 → 닉네임 입력 후 "게임 입장하기".
같은 서버를 다른 탭/컴퓨터에서 열면 서로 접속해서 확인할 수 있습니다.

## 1. GitHub에 올리기

1. GitHub에서 새 저장소를 만듭니다 (예: `zombie-survival-multiplayer`), Public/Private 상관없습니다.
2. 이 폴더 전체를 그 저장소에 업로드합니다. 터미널을 쓸 수 있다면:

```bash
git init
git add .
git commit -m "좀비 서바이벌 멀티플레이 초기 버전"
git branch -M main
git remote add origin https://github.com/내계정/zombie-survival-multiplayer.git
git push -u origin main
```

   터미널이 익숙하지 않다면 GitHub 웹사이트의 "Add file → Upload files" 버튼으로
   이 폴더 안의 파일들을 그대로 드래그해서 올려도 됩니다. (`node_modules` 폴더는
   올리지 않아도 됩니다 — `.gitignore`에 이미 제외되어 있습니다.)

## 2. Render에 배포하기

1. [render.com](https://render.com) 에 가입/로그인합니다 (GitHub 계정으로 로그인 가능).
2. 대시보드에서 **New +** → **Web Service** 클릭.
3. 방금 만든 GitHub 저장소를 연결합니다 (저장소 접근 권한 승인 필요할 수 있음).
4. 아래처럼 설정합니다 (`render.yaml`이 있으면 대부분 자동으로 채워집니다):
   - **Name**: 원하는 이름 (예: `zombie-survival-multiplayer`)
   - **Environment / Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free` (테스트용으로 충분, 필요하면 유료 플랜으로 업그레이드)
5. **Create Web Service** 클릭 → 몇 분 후 빌드/배포가 끝나면 `https://내서비스이름.onrender.com` 같은 주소가 생깁니다.
6. 그 주소를 학생들에게 공유하면, 각자 접속해서 최대 40명까지 함께 플레이할 수 있습니다.

### 참고 사항 (Render 무료 플랜)

- 무료 플랜은 일정 시간 트래픽이 없으면 서버가 절전 상태가 되고, 다음 접속 시
  다시 켜지는 데 몇십 초 정도 걸릴 수 있습니다. 수업 시작 직전에 한 번 미리 접속해
  깨워두면 좋습니다.
- 동시 접속자가 많아지고 오래 켜둘 계획이라면 Render의 유료 플랜(절전 없음)을
  고려해보세요.
- 코드를 수정해서 GitHub에 다시 `push`하면 Render가 자동으로 새 버전을 다시 배포합니다.

## 문제 해결

- **입장이 안 되고 "서버가 가득 찼습니다"가 뜬다**: 이미 40명이 접속 중입니다. 잠시 후
  다시 시도하거나, 필요하면 `server.js`의 `MAX_PLAYERS` 값을 늘릴 수 있습니다(서버 성능에
  따라 너무 크게 늘리는 것은 권장하지 않습니다).
- **다른 플레이어가 안 보인다**: 브라우저 콘솔(F12)에서 오류가 있는지 확인하고, Render
  서비스가 "Live" 상태인지, 배포 로그에 오류가 없는지 확인하세요.
