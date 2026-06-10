BANG NHAN - VOICEBANK KIT / KHONG PHU THUOC WINDOWS TTS
======================================================

Lý do có kit này:
- Một số máy Windows 10 cũ không có Vietnamese Text-to-Speech.
- Chrome sẽ đọc tiếng Anh nếu không có voice vi-VN.
- Cách chắc chắn hơn: tạo sẵn file MP3 tiếng Việt cho game, rồi game phát audio MP3 thay vì gọi Windows TTS.

Cách dùng:

1. Giải nén zip.
2. Chạy RUN_BUILD_VOICEBANK_EDGE_TTS.cmd trên máy có Internet và có Python.
3. Tool sẽ tạo thư mục:
   voicebank_bangnhan
4. Upload toàn bộ các file sau lên root GitHub Pages:
   hocbangnhan.html
   sw_bangnhan.js
   manifest_bangnhan.json
   icon-192.png
   icon-512.png
   voicebank_bangnhan/voice_manifest.json
   voicebank_bangnhan/*.mp3

Link vẫn là:
https://tunhienhieuchuyen.github.io/hocbangnhan.html

Cơ chế:
- Game ưu tiên phát voicebank MP3.
- Nếu voicebank có đủ file, máy Windows không có giọng Việt vẫn đọc tiếng Việt.
- Nếu thiếu voicebank, game chỉ dùng browser voice khi thật sự có vi-VN; không rơi về tiếng Anh nữa.

Đổi giọng:
- Mặc định là giọng nữ: vi-VN-HoaiMyNeural
- Muốn giọng nam, mở CMD trước khi chạy:
  set BANGNHAN_EDGE_VOICE=vi-VN-NamMinhNeural
  RUN_BUILD_VOICEBANK_EDGE_TTS.cmd

Ghi chú:
- edge-tts là thư viện Python dùng dịch vụ online Microsoft Edge TTS.
- Sau khi audio đã tạo xong và upload GitHub, người học không cần cài TTS Windows.
