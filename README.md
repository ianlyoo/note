# Note

> 메모 앱으로 위장한 로컬 파일 잠금 도구

[English](README.en.md) · [MIT License](LICENSE) · Node.js 24+ · Electron · ![Release](https://github.com/ianlyoo/note/actions/workflows/windows-build.yml/badge.svg)

겉보기엔 평범한 메모 앱이다. 하지만 주인만 아는 트리거 노트 하나로, 선택한 파일과
폴더를 잠그고 복원하는 보호 도구를 연다. 도구는 평범해 보이는 노트 뒤에 숨어 있어
앱을 열어봐도 눈에 띄지 않는다.

**캐주얼한 로컬 접근을 막기 위한 도구다 — 고급 공격자·멀웨어·포렌식 분석 대상이 아니다.**

## 아키텍처

```mermaid
flowchart LR
    A[노트 워크스페이스] --> B[트리거 노트]
    B -- "본문 == 비밀번호" --> C[보호 도구]
    C --> D[lockService]
    D -- "잠금 / 복원" --> E[파일 · 폴더]
```

## 빠른 시작

```bash
node -v      # Node 24+
npm install
npm run dev
```

## 기능 (현재 MVP)

| 기능 | 설명 |
|------|------|
| 노트 워크스페이스 | 평범한 노트 화면을 보여줌 |
| 최초 비밀번호 | 첫 실행 시 비밀번호를 1회 설정 |
| 은닉 | 평범해 보이는 노트 1개 뒤에 보호 도구를 숨김 |
| 잠금 | 보호 노트 영역에서 파일·폴더를 잠금 |
| 복원 | 해제 시 잠긴 항목을 원래 경로로 복원 |
| 패키징 | 실행 가능한 앱이 든 Windows zip 번들 생성 |

## 보안 경계

이 MVP는 캐주얼한 로컬 접근을 막기 위한 것이지, 고급 공격자·멀웨어·포렌식 분석을
막기 위한 것이 아니다.

- **비밀번호는 이 버전의 단순화를 위해 로컬 앱 상태에 평문으로 저장된다.**
- 트리거 노트의 저장된 본문이 비밀번호와 일치하면 보호 도구가 열린다.
- 잠긴 항목은 해제 시 원래 경로로 복원된다.
- 패키징된 빌드는 `userdata` 폴더를 추출된 실행 파일 옆에 둔다.

## 빌드

Windows zip 번들 생성:

```bash
npm run dist:win
```

생성 결과: `release/Note-Windows-0.1.0.zip` (artifactName `${productName}-Windows-${version}.${ext}`)

GitHub Actions 워크플로 `.github/workflows/windows-build.yml`는 `windows-latest`에서
의존성 설치 → lint → test 후 zip 번들을 빌드해 `Note-Windows-Zip` 아티팩트로 업로드한다.

## 개발

```bash
npm run lint
npm run build
npm run test    # vitest
```

워크플로와 로컬 기준선은 Node 24를 대상으로 한다. appId는 `com.secretfolder.note`, 현재 버전 `0.1.0`.

## License

[MIT](LICENSE) © 2026 AhnRyu
