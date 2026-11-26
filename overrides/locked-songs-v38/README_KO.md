# V38 — 문을 열어 신규곡 및 분리된 게임곡 해금
- 원본: Google Drive https://drive.google.com/file/d/1pJGVukXr6Z5tKiheonmxym2U1DlIkNnI/view — 문을 열어.wav, 277.2초·53,236,240바이트·48kHz 스테레오.
- 실제 편집: 원본 157.64~248.04초, 90.4초 연속 편집 후 입구 120ms/출구 1.90초 페이드. _site MP3 90.432초, 128kbps 스테레오, SHA256 b5e323dd641b49c658c9eca7d4f480d288ea0dbead60a749c2b5f0ea485b1255. 원본 전체는 공개 저장소에 업로드하지 않음.
- 재생성 명령: ffmpeg -ss 157.64 -t 90.40 -i '문을 열어.wav' -af 'afade=t=in:st=0:d=0.12,afade=t=out:st=88.50:d=1.90' -ar 48000 -ac 2 -codec:a libmp3lame -b:a 128k door_open_easy_v38.mp3
- 분석: 원본 구간별 STFT onset 및 비트 추정 약 95.7BPM(0.627초/박). 36마디·246 탭 판정. 2마디 반복 A(12마디)/B(8마디)/C(16마디), 후반 C는 16분음표 간격(0.157초) 손동작을 포함하고 중간 브리지 6개 음표 줄임. chart generator: build_door_v38.py.
- 해금: 기존 무료 11곡 유지, 신규 EASY 별3 곡 ID door_open_easy_v38을 무료곡 다음 순서로 추가하고 150엽전 유료 해금. 잠긴 앨범 블러 및 잠금, 재접속 후 유지. 가격 표는 별1 50/별2 100/별3 150/별4 200/별5 300(임시).
- 기존 V33 지갑 purchase(cost,commit)를 그대로 사용, rhythm_lab_coins_v1 원장 유지. 게임곡 해금은 rhythm_lab_song_unlocks_v38, 원곡 MP3 검수용 소장은 rhythm_lab_music_preview_v36로 완전 분리. 원곡 다운로드/실제 원곡 판매는 이번 변경에 포함하지 않음.
- V35 원곡 연속재생·미세 타격음·진동 규칙과 하단 메뉴/홈/기존 점수·차트·저장값·이미지 변경하지 않음.
- QA: Chrome 모바일 390×844, 360×640; 실제 배포 12곡, 246노트/95.7BPM, MP3 1MB 초과, 처음 150엽전 차감, 중복 차감 금지, 재접속 해금 유지, 원곡 MP3 소장 원장 무변경을 검사. Android/Google Play 실기기 출시 검수는 별도.
