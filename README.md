# 숏폼 실시간 투표 🗳️

멘티미터 스타일의 실시간 투표 앱. QR 스캔으로 접속하고, 투표하고, 하트를 날리며 응원할 수 있어요.

## 구성
- **Node.js + Express** (웹서버)
- **Socket.io** (실시간 양방향 통신)
- **Chart.js** (실시간 막대/원형 그래프)
- **canvas-confetti** (투표 시 컨페티)
- **qrcode** (QR 자동 생성)

## 🖥️ 로컬 실행

```bash
npm install
npm start
```

브라우저에서 `http://localhost:3000` 접속 → 호스트 화면에 QR이 뜹니다.

- 호스트 화면: `http://localhost:3000/`
- 투표 화면: `http://localhost:3000/vote`

### 같은 WiFi에서 학생 폰으로 접속하려면
선생님 컴퓨터의 로컬 IP를 확인(`ipconfig` on Windows / `ifconfig` on Mac) 한 뒤,
학생이 `http://192.168.x.x:3000/vote` 로 접속하면 됩니다.

## 🌐 인터넷 배포 (Render - 무료)

1. 이 폴더를 GitHub 저장소로 푸시
2. [render.com](https://render.com) 가입 → **New → Web Service**
3. GitHub 저장소 연결 → 이 저장소 선택
4. 설정:
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. **Create Web Service** 클릭
6. 2-3분 후 `https://your-app.onrender.com` 같은 URL 제공됨
7. 해당 URL을 호스트 화면으로 열면 QR이 자동으로 그 도메인을 가리킴

### 다른 무료 배포 옵션
- **Railway** (railway.app) — 비슷한 방식, 빠름
- **Fly.io** — CLI 사용, 더 많은 설정 가능
- **Glitch** (glitch.com) — 브라우저에서 바로 편집/배포, 아주 간편

## ⚙️ 커스터마이징

### 투표 항목 변경
`server.js` 상단의 `OPTIONS` 배열을 수정하세요:

```js
const OPTIONS = [
  { id: 'youtube',   label: 'YouTube Shorts',   emoji: '📺' },
  { id: 'instagram', label: 'Instagram Reels',  emoji: '📸' },
  { id: 'tiktok',    label: 'TikTok',           emoji: '🎵' }
];
```

그리고 각 옵션별 색상은 `public/host.html`과 `public/vote.html`의 `COLORS` 객체에서 지정합니다.

### 중복 투표 허용하고 싶다면
`server.js`의 아래 두 줄을 제거:
```js
if (state.votedSockets.has(socket.id)) return;
state.votedSockets.add(socket.id);
```

## 🎨 재미요소
- ✅ 투표 시 컨페티 폭발
- ✅ 호스트 화면에 하트가 아래에서 위로 떠오름 (TikTok 라이브 스타일)
- ✅ 모바일 진동 피드백
- ✅ 움직이는 그라데이션 배경
- ✅ QR 코드 주변 글로우 효과
- ✅ 막대/원형 그래프 실시간 토글
- ✅ 접속자 수 실시간 카운트 (맥박 점 애니메이션)
- ✅ 선택한 옵션에 따라 색상 테마 변화
- ✅ 다양한 하트 이모지 랜덤 생성

## 📦 폴더 구조
```
shortform-vote/
├── server.js              # Socket.io 서버
├── package.json
├── README.md
└── public/
    ├── host.html          # 선생님(호스트) 화면
    └── vote.html          # 학생(투표) 화면
```
