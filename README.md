# ForLeader — 회의 시간 조율 웹 서비스

## 1. 개요

팀 PM으로서 여러 팀원들과 회의 일정을 매번 개별적으로 조율하는 과정이 번거로워 직접 만든
미니 프로젝트입니다. 단순히 "언제 되세요?"를 수집하는 데서 끝나지 않고, **가장 많은 인원이
겹치는 시간대를 자동으로 계산해 랭킹으로 정리**해주는 것이 핵심입니다.

when2meet처럼 그리드를 클릭/드래그해서 가능 시간을 입력받지만, 결과는 히트맵이 아니라
"가능 인원 수 기준 랭킹 리스트"로 보여주는 방식을 택했습니다.

## 2. 주요 기능

| 기능 | 설명 |
|---|---|
| 회의 관리 | 관리자가 회의를 생성하고 참가자 명단을 등록 (비밀번호로 보호) |
| 시간 입력 | when2meet 스타일 그리드, 클릭/드래그로 선택 (PC 마우스 + 모바일 터치 지원) |
| 응답 수정 | 본인 이름 재선택 시 기존 응답을 불러와 수정 가능 |
| 랭킹 결과 | 가능 인원 수 내림차순 정렬, 연속된 동일 인원 구간은 하나로 병합 |
| 특이사항 | 자유 텍스트로 온라인 참석, 부분 참여 등 메모 가능 |
| 다중 회의 | 드롭다운으로 여러 회의를 동시에 운영 |

## 3. 기술 스택

| 구분 | 사용 기술 |
|---|---|
| Framework | Next.js 15 (App Router) |
| Database | Supabase (PostgreSQL + REST API) |
| Styling | Tailwind CSS v3 |
| Auth | JWT (httpOnly cookie) + SHA-256 해시 비교 |
| Icons | lucide-react |
| Deploy | Vercel |

## 4. 프로젝트 구조

```
forLeader/
├── app/
│   ├── admin/
│   │   └── page.tsx              # 관리자 페이지 (서버 컴포넌트 — 쿠키 검증)
│   ├── api/
│   │   └── auth/
│   │       ├── route.ts          # POST /api/auth — 로그인, JWT 발급
│   │       └── logout/
│   │           └── route.ts      # POST /api/auth/logout — 쿠키 삭제
│   ├── globals.css               # 전역 스타일 (.btn-primary, .btn-glass)
│   ├── layout.tsx
│   └── page.tsx                  # 메인 응답 페이지
├── components/
│   ├── AdminDashboard.tsx        # 관리자 대시보드 (회의 목록 + 삭제)
│   ├── AdminLogin.tsx            # 관리자 로그인 폼
│   ├── MeetingForm.tsx           # 회의 생성 폼
│   ├── RankingList.tsx           # 가능 시간 랭킹 리스트
│   ├── RespondClient.tsx         # 응답 페이지 클라이언트 컴포넌트
│   └── TimeGrid.tsx              # 드래그 가능 시간 선택 그리드
├── lib/
│   ├── ranking.ts                # 랭킹 계산 로직 (슬롯 병합 + 정렬)
│   └── supabase.ts               # Supabase 클라이언트 & 타입 정의
├── supabase_schema.sql           # DB 스키마 생성 SQL
├── supabase_grant.sql            # anon 역할 권한 부여 SQL
├── .env.example                  # 환경변수 템플릿
└── README.md
```

## 5. 시작하기

### 5-1. 패키지 설치

```bash
npm install
```

### 5-2. Supabase 설정

[Supabase](https://supabase.com)에서 새 프로젝트를 만든 후, SQL Editor에서 아래 파일을
순서대로 실행합니다.

1. `supabase_schema.sql` — 테이블 및 RLS 정책 생성
2. `supabase_grant.sql` — anon 역할 권한 부여

### 5-3. 환경변수 설정

`.env.example`을 복사해 `.env.local`을 만들고 값을 채웁니다.

```bash
cp .env.example .env.local
```

| 변수 | 설명 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon 공개 키 |
| `ADMIN_PASSWORD_HASH` | 관리자 비밀번호의 SHA-256 해시값 |
| `ADMIN_JWT_SECRET` | JWT 서명용 시크릿 (32자 이상 랜덤 문자열) |

**해시값 생성 방법**

```bash
# ADMIN_PASSWORD_HASH
python3 -c "import hashlib; print(hashlib.sha256('원하는비밀번호'.encode()).hexdigest())"

# ADMIN_JWT_SECRET
openssl rand -base64 32
```

### 5-4. 개발 서버 실행

```bash
npm run dev
```

`http://localhost:3000`에서 확인하며, 관리자 페이지는 `http://localhost:3000/admin`.

## 6. 페이지 구성

### `/` — 응답 페이지

1. 드롭다운에서 회의 선택
2. 드롭다운에서 본인 이름 선택
3. 그리드에서 가능한 시간대 클릭/드래그 선택
4. 특이사항 입력 후 제출
5. 현재까지의 응답 랭킹 확인

### `/admin` — 관리자 페이지

비밀번호 입력 후 진입 (세션은 7일간 유지).

- 새 회의 생성 (제목, 후보 날짜, 시간대, 참가자 명단)
- 회의별 응답 현황 및 미응답자 확인
- 회의 삭제

## 7. 랭킹 계산 방식

1. 모든 30분 슬롯에 대해 해당 슬롯을 선택한 사람들의 집합을 계산
2. 연속된 슬롯 중 **가능 인원 집합이 동일한** 구간을 하나로 병합
3. 가능 인원이 0명인 구간 제외
4. 정렬 기준: 가능 인원 수 ↓ → 구간 길이 ↓ → 날짜/시간 ↑

> 전원 참석 가능한 시간대는 이름 목록 대신 **"전체"**로 표시됩니다.

## 8. 만들면서 고민했던 부분

- **히트맵 대신 랭킹**: 색의 농도로 보여주는 히트맵보다, "몇 명이 언제 가능한지"를 줄글처럼
  바로 읽을 수 있는 랭킹 리스트가 실제 회의를 잡을 때 더 빠르게 의사결정에 도움이 됐습니다.
- **이름은 자유 입력이 아닌 선택**: 오타나 중복 이름으로 인한 데이터 정합성 문제를 막기 위해,
  관리자가 미리 등록한 명단에서만 고를 수 있게 제한했습니다.
- **보안 비밀번호 + JWT**: 별도 로그인 시스템 없이도 관리자 페이지만 가볍게 보호할 수 있도록
  SHA-256 해시 비교 + httpOnly 쿠키 기반 JWT를 사용했습니다.