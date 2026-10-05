# Bàn giao LifeOS — bản 2026-10-05

File đi cùng bản này là [index.html](/workspace/output/index.html). Một file HTML, khoảng 2,59 MB, 110 thẻ `<script>`. Không React, không Vite, không build. Mở bằng web server tĩnh cùng thư mục với 6 file phụ ở mục 2. `file://` lên giao diện nhưng service worker và vài đường fetch sẽ sai.

Coder mới làm được ngay nếu giữ ba luật này:

1. Chỉ sửa đúng việc được giao. Phần mục 4 đã được chủ app dùng và chốt. Không refactor, không dọn script.
2. Không gộp 6 lớp `window.fetch`. Số đo ở mục 6 đã có. Gộp vẫn cấm vì chưa đủ 7 luồng và vì cửa chặn trùng không ổn định.
3. Không thêm `<script>` bản vá mới ở cuối file. Bản này đã có một script cuối, id `lifeos-snooze-quiet-guard`. Sửa trong script đang có. Xong thì đếm lại 110 thẻ mở và 110 thẻ đóng, rồi kiểm cú pháp từng thẻ.

Chủ app xác nhận bằng mắt và bằng câu chốt. Máy viết code không khóa được màn hình điện thoại và không có Firebase thật. Chỗ nào dưới đây ghi "chủ app đã chốt" là chủ app nói chạy được. Chỗ ghi "chưa chốt" là mới có trong code.

## 1. Cách biết đang cầm đúng file

Sau khi trang tải, trong console:

```js
window.LIFEOS_FIREBASE_CONFIG.projectId
window.LIFEOS_FIREBASE_CONFIG.apiKey
```

Phải ra `tool-mimishop` và khóa bắt đầu bằng `AIzaSyB0yab1uj`. Khóa khác là cầm nhầm file. Dừng.

Trong file phải còn các chuỗi này. Mất một chuỗi là bản đã bị sửa lệch phần đã chốt:

| Chuỗi tìm trong file | Phần đã chốt |
|---|---|
| `__lifeosR76FinalGate` | Cổng fetch/XHR cuối. Không xóa. |
| `lifeos-j19x-video-overlay` | Overlay xem video lớn. |
| `data-j19g-inline-video` | Nút phát tại chỗ trên card. Không đổi tên. |
| `family-upload-error-text` | Modal lỗi upload, chỉ một chỗ. |
| `silence_30min.mp3` | Neo nghe khi tắt màn hình. |
| `vault-copy-btn is-dup` | Nút nhân bản kho. |
| `hasTvFrame` | Đường Tivi. Chủ app đã thử: có hình, nhanh hơn. Không nhận tiếng là đã có hình. |
| `lifeos-family-entry-one-paint` | Gia đình không bật lại `onSnapshot`. |
| `lifeos-snooze-quiet-guard` | Script cuối. Nhắc lại 30 giây và 1 phút. Không xóa. |
| `lifeosSnoozeAlarm` | Hàm hẹn lại. Chỉ nhận 30 giây hoặc 1 phút. |

## 2. File đặt cạnh index.html

| File | Việc |
|---|---|
| `silence_30min.mp3` | Neo MP3 và radio khi tắt màn hình. Ba thẻ audio trỏ `./silence_30min.mp3`. Thiếu file thì nghe tắt màn hình gãy. File đi cùng bản này là đoạn im khoảng 2 giây, khoảng 8 KB, thẻ audio để `loop`. Không cần file dài 30 phút. |
| `manifest.json` | PWA. |
| `sw.js` | Service worker, đăng ký bằng `./sw.js`. |
| `danhsach.js` | Danh sách YouTube. App thử file local trước, rồi GitHub. |
| `facebook_danhsach.js` | Danh sách Facebook. |
| `smartbox_channels.json` | Kênh radio và TV khi mở bằng `http` hoặc `https`. |

Không có `package.json`. Không tách `src/`.

Worker Cloudflare chỉ mở khi đụng upload, video lớn, hoặc ghi Firestore. Không deploy lại, không đổi URL trong HTML.

| File worker | Việc |
|---|---|
| `telegram-upload-relay.js` | Upload binary và lấy file về. |
| `lifeos-family-d1-api.js` | Metadata file Gia đình. |
| `lifeos-family-d1-text-api.js` | Tin chữ. |
| `lifeos-video-range-stream.js` | Video nhiều part, phát bằng Range. |
| `firestore.rules` | Đang `read, write: if true` trên project `tool-mimishop`. Không siết rules. |

URL đang chạy:

| Phần | URL |
|---|---|
| Chữ Gia đình | `https://lifeos-family-d1-text-api.tunhienhieuchuyen.workers.dev` |
| File Gia đình | `https://lifeos-family-d1-api.tunhienhieuchuyen.workers.dev` |
| Relay Telegram | `https://telegram-upload-relay.tunhienhieuchuyen.workers.dev` |
| Video nhiều part | `https://lifeos-video-range-stream.tunhienhieuchuyen.workers.dev` |
| Proxy kênh TV | `https://sua-json-proxy-kenhtivi.xiemsansang.workers.dev/proxy?url=` |

File bàn giao không chứa token bot, relay key, hay D1 token. Thiếu key mà worker đang bật thì 401. Đó không phải lỗi lớp fetch.

## 3. Dữ liệu nằm ở đâu

| Phần | Nơi ghi |
|---|---|
| Nhiệm vụ, kho | Firestore `LifeOS_Profiles/{profile}` project `tool-mimishop`, kèm localStorage. Profile là tên người đang xem, chữ thường không dấu. |
| Chữ Gia đình | D1 text. Nguồn chính `window.LifeOSR35D1TextOfficial`. |
| File Gia đình | D1 file cho metadata. Binary là XHR `POST /upload-raw` tới relay, không đi `window.fetch`. |
| Video lớn | Worker range-stream, không đi `/download` của relay. Relay chặn file trên khoảng 20 MB. |
| Nhạc, radio, YouTube, Facebook | File local ở mục 2, cộng HLS. |
| Giờ nhắc lại đang chờ | localStorage khóa `lifeos_snooze_pending`, và trên chính nhiệm vụ: `alarmTime`, `dueAt`, `snoozeUntil`, `timeStr`. |

Field được phép trên document profile: `tasks`, `vault`, `deletedTaskTombstones`, `stats`, `updatedAt`. PATCH cuối không được còn `data`, `vaultData`, `r65DeletedTasks`, `r59Meta`.

Firestore giữ một document cho cả danh sách nhiệm vụ và cả kho. Hai field đang dùng là `tasks` và `vault`. Field cũ `data` và `vaultData` vẫn được đọc để không mất dữ liệu cũ.

Lần ghi kho trước đây lấy nguyên bản trên Firebase rồi ghi lại, nên mục mới chỉ có trên máy không được đẩy lên. Máy khác vì thế không thấy. Nay đường ghi trong `compactRemote` của script `lifeos-j20r68-compact-tombstone-canonical-schema` làm đúng thứ tự: đọc Firebase trước, gộp với máy theo id, mục chỉ có trên máy được thêm, cùng id thì bản nào mới hơn được giữ. Rồi mới ghi bản đã gộp lên Firebase và vẽ lại kho. Xóa thẻ kho trước đây biến mất rồi hiện lại, vì lần gộp sau vẫn thấy thẻ đó trên Firebase và gắn vào. Nay xóa một thẻ hoặc xóa nhiều thẻ thì ghi id đã xóa vào `deletedVaultTombstones` trên máy và trên Firebase. Lần gộp bỏ đúng những id đó, không kéo lại.

Trên PC, thanh chuyển Tổng quan / Nhiệm vụ / Tập trung / Kho / Nhạc / Gia đình không còn cố định đè nội dung. Nó nằm ngay dưới header, nội dung cuộn bên dưới, chừa khoảng 16px. Máy nhỏ vẫn dùng thanh dưới. Mini PC ngang không đổi.

`ChatEngine.initFirebase` bị khóa, không gắn listener. Không bật lại `onSnapshot` cho Gia đình.

## 4. Đã làm và chủ app đã chốt

Sửa các phần này chỉ khi chủ app nêu đúng lỗi. Diff không được tràn sang phần khác.

### 4.1. Kho: copy và nhân bản

Chủ app nói phần copy kho thành công.

Bấm nút copy mở tấm chọn:

- **Copy nội dung** chép tiêu đề và nội dung ra clipboard.
- **Nhân bản ngay** thêm thẻ mới tên `tên_copy1` lên đầu danh sách và ghi Firebase liền, cùng kiểu nhân bản task.

Tìm `vault-copy-btn` và `copyEntry`. Không đổi nút này thành chỉ copy clipboard.

### 4.2. Nhiệm vụ: báo thức

Chủ app đã chốt từ trước, và ngày 2026-10-05 chốt thêm một câu: nhắc lại có kêu lại thật.

Đã chốt:

- Báo thức kêu đúng giờ. Bảng là `#lifeos-task-alarm-modal`. Một lần bấm **Dừng báo thức** tắt hết bảng và tiếng. Không phải bấm hai lần.
- Card không bị xóa trắng. Việc vừa dừng còn trong danh sách, có gạch `line-through`. Card khác còn nguyên.
- Thêm việc và hẹn giờ khi mất mạng vẫn ghi trên máy. Chuông dùng giờ điện thoại. Bản mây trống không được ghi đè danh sách đang có trên máy.
- Bảng đến giờ chỉ còn hai nút nhắc lại: **30 giây** và **1 phút**. Không còn 5 phút, 10 phút, và không còn ô nhập số. Chủ app bấm và nói có báo lại thật.

Cách nhắc lại đang chạy, tìm `lifeosSnoozeAlarm` và script `lifeos-snooze-quiet-guard`:

- Bấm 30 giây hoặc 1 phút thì tắt chuông ngay, ghi giờ mới vào nhiệm vụ đang kêu, và kêu lại đúng khoảng đó.
- Không hẹn những việc khác chỉ vì chúng từng kêu.
- Làm xong hoặc tắt chuông trong lúc đang chờ thì hết giờ không kêu lại, và không bật việc đã xong trở lại.
- Sửa giờ của việc đó trong lúc chờ thì giữ giờ mới, bỏ hẹn cũ.
- Việc khác đến giờ trong lúc đang chờ vẫn được kêu. Cửa chặn chỉ giữ đúng việc vừa hẹn, và chỉ khoảng 1,8 giây đầu để tiếng cũ tắt hết.
- Tải lại trang: giờ hẹn nằm trong `lifeos_snooze_pending`. Trang mở lại thì gắn lại vào việc. Đồng bộ mây ghi đè giờ cũ thì cũng gắn lại, trừ khi việc đã xong, đã tắt chuông, hoặc người dùng đã đặt một giờ tương lai khác.
- Máy ngủ hoặc sang tab rồi quay lại: nếu đã quá giờ hẹn thì kêu lúc trang được nhìn lại. Tab phải còn mở. Tắt hẳn trình duyệt thì không có gì để kêu.
- Mất mạng: không gọi Google để đọc. Chuông là tiếng dao động của máy. Câu nhiệm vụ do giọng máy đọc. Có mạng thì vẫn thử Google, lỗi thì về giọng máy. Phần mất mạng mới có trong code, chủ app chưa chốt lại bằng một câu riêng.

Không đưa lại nút 5 phút, 10 phút, hay ô nhập số. Chủ app đã bỏ.

Tìm thêm `__lifeosR61BeepTimer`, `__lifeosForceTaskPaint`, `saveLocalTodos`, `lifeos-task-alarm-modal`. Đường ghi vẫn đi `FirebaseSync.pushAll` khi có mạng.

### 4.3. Gia đình: ô nhắn trên điện thoại

Chủ app chốt cùng mục 4.2 cũ.

Tin dài hoặc bàn phím mở thì ô `#chat-input` vẫn nằm trong vùng nhìn thấy. Nút đính kèm và nút gửi cùng hàng, không bị che. Enter vẫn gửi. Emoji, ghi âm và khóa tạm ẩn lúc đó để chừa chỗ.

### 4.4. Nghe nhạc khi tắt màn hình

Chủ app nghe MP3 qua đêm, máy không tắt, không nóng, nhạc không đứt. Đây là phần đã đạt.

`MusicApp.keepScreenAnchor()` phát `#mstq-silence` từ `./silence_30min.mp3`, lặp, volume 1. `LifeOSAudioPipe` bám `visibilitychange`, `pagehide`, `pageshow`, `freeze`, `resume`. YouTube hoặc Facebook đang phát thì pipe không cướp. Bấm dừng thì neo dừng và không tự phát lại.

Không sửa pipe khi làm việc khác. File `silence_30min.mp3` phải đứng cạnh `index.html`.

### 4.5. MP3: mở nhanh và không tự dừng khi xoay máy

Chủ app chốt.

- Kho nhạc đã có thì mở tab không tải lại Archive.org.
- Danh sách chỉ vẽ phần đang xem.
- Bấm phát thì chạy, không tải lại cả file rồi tự dừng.
- Xoay ngang lúc đang ở tab Nhạc MP3 không bị hiểu là đã rời bài. Chỉ dừng khi sang Radio, Tivi, YouTube, Facebook hoặc tab khác.
- Radio xoay dọc kéo xuống được tới nút dừng. Ô soạn nhiệm vụ không che nút đó.
- Vuốt dọc bám tay, không biến thành trượt ngang.

### 4.6. Những chỗ giao diện đã sửa và chủ app không mở lại lỗi

Chưa có câu "chốt" riêng, nhưng sau các bản sau chủ app không báo lại. Coder không được làm hỏng lại:

- Màn ngang mini PC: tab MP3, Radio, Tivi mở được danh sách. Danh sách YouTube và Facebook trải hết cột trái, không còn bị nhét vào một phần ba cột.
- Màn ngang mini PC: tab Kho cuộn được. Chỉ thẻ Kho cuộn dọc. Vỏ danh sách bên trong không được nhận `overflow-y: auto` đè lên, nếu không kéo sẽ chết dù còn thẻ.
- Điện thoại: trang không tràn ngang. Ô thêm nhiệm vụ một hàng, không đè menu dưới. Danh sách nhạc có vùng cuộn riêng. Nút "Cài App" ẩn khi đang ở tab nhạc.
- Vuốt trang dùng cuộn của trình duyệt. Không gắn `touchmove` + `preventDefault` lên cả `document`. Vuốt trái/phải thẻ nhiệm vụ vẫn hoàn thành hoặc xóa.
- Rê chuột vào nút chỉ có icon thì tên hiện ngay cạnh.

Tìm class `lifeos-landscape-mini-pc` khi sửa mini PC. Luật cho điện thoại nằm trong các `@media (max-width: 1023px)`. Luật mini PC phải đứng sau luật chung, nếu không luật chung thắng và cuộn Kho chết lại.

## 5. Tivi: chủ app đã thử, đạt, và chạy nhanh hơn

Chủ app đã thử. Kênh ra hình, không kẹt vòng nối lại, và phát nhanh hơn trước. Coi là đã đạt. Không sửa lại đường này nếu không có lỗi mới.

Bệnh cũ nằm trong `loadMediaStream`, chỉ khi `type === 'tv'`. Radio giữ cấu hình HLS cũ (`enableWorker: true`). Không đụng Radio khi sửa Tivi.

Bệnh: nhiều kênh có tiếng không hình, hoặc kẹt câu nối lại HLS và không sang nguồn sau. Kênh chỉ thật sự xem được khi đã có hình và chữ trạng thái là một trong hai câu này:

- `Kênh đang phát bình thường qua WebView direct`
- `Kênh đang phát qua WebView + proxy`

Cách sửa, tìm `hasTvFrame`:

- Có tiếng mà `videoWidth` vẫn 0 thì không tính là đang phát, và không nối lại cùng nguồn.
- Lỗi mạng HLS khi chưa có hình thì chuyển nguồn khác ngay, thường là proxy. Không còn vòng "nối lại một lần" trên nguồn chưa ra hình.
- Manifest chỉ có tiếng, hoặc codec hình trình duyệt không phát được, thì bỏ nguồn đó. Có nhiều mức thì chọn H.264 vừa bitrate.
- Kênh đã có hình mà live hụt thì vẫn nối lại tối đa 2 lần.
- Hai câu trạng thái ở trên chỉ hiện sau khi đã có khung hình, và chỉ ghi một lần. Không vẽ lại chữ theo từng nhịp phát.
- Khóa đúng một mức hình H.264: lấy mức cao nhất trong khoảng 200 kbps đến 1000 kbps. Không có mức trong khoảng thì lấy mức gần nhất phía dưới, rồi mới tới mức thấp nhất phía trên. `currentLevel` bị khóa. Nếu trình phát vẫn nhảy lên mức trên 1000 kbps thì bị kéo về mức đã chọn. Ước lượng băng thông ban đầu là 700 kbps để không mở nhầm mức nặng.
- Tiếng tách riêng thì khóa một track AAC: ưu tiên mức cao nhất trong khoảng 64–128 kbps. Không có thì lấy mức gần nhất phía dưới, rồi mức thấp nhất phía trên. Bỏ Dolby nếu còn track AAC. Kênh gộp sẵn tiếng trong hình thì không đổi track.
- Buffer live để khoảng 12 đoạn, không bám sát mép live. Giải mã chạy ở worker. Nếu worker không ra hình thì thử lại đúng nguồn đó không dùng worker, rồi mới đổi nguồn. Segment hụt khi đã có hình thì để HLS tự tải, không dừng rồi phát lại.

Hàm nằm trong script `lifeos-mediahub-core-clean-js`. Proxy là `lifeosProxyUrl` trong script `lifeos-web-r9-media-proxy-helper-js`. Không đổi URL proxy.

## 6. Sáu lớp fetch: đã đo, chưa được gộp

Số lớp là 6. Dòng giữ `nativeFetch` của trình duyệt cho R76 không phải một lớp.

| Lớp | Cờ tìm trong file | Cờ nằm ở đâu |
|---|---|---|
| R76 | `__lifeosR76FinalGate` | Trên hàm `window.fetch`, và trên XHR cùng `play`. |
| R73 | `__lifeosR73Gate` | Trên hàm `window.fetch`. |
| R39 | `__lifeosR39FetchCorsCleanerInstalled` | Trên `window`. |
| R47 | `__lifeosR47FetchPostPromotePatched` | Trên `window`. |
| R67 | `__lifeosR67SingleSchemaPatched` | Trên hàm fetch, và cùng tên trên `Storage.prototype.setItem`. |
| R72 | `__lifeosR72WriteGate` | Trên hàm `window.fetch`. |

Thứ tự trong file: R76, R73, R39, R47, R67, R72. Không đổi chỗ các khối script.

Đã đo thật, nhiều lần, kể cả Slow 4G. Không còn là đoán từ đọc code.

| Đường | Kết quả đo |
|---|---|
| Chat và danh sách Gia đình, bằng fetch | Vài giây đầu các lớp giành `window.fetch`. Sau đó mạng nhanh thường đứng ở R76. Slow 4G có phiên đứng ở R73 gần như cả phiên. R39, R47, R67 không có trên request này. |
| Gửi file, binary | XHR `POST /upload-raw` tới relay. Chỉ R76 bọc XHR. Log là `note: "pass"`, không gỡ header, không chặn. |
| Card sau khi gửi file | J20R2 vẽ card, rồi cầu `commitUploadedMessage` của R47. Hàm fetch của R47 không chạy trên đường này. Xóa cả script R47 có thể mất card. |
| PATCH nhiệm vụ và kho | Mạng nhanh: code ghi gọi một fetch đã giữ từ trước, thường là R73 rồi R76. R76 viết lại field cũ. R73 nuốt PATCH trong 2500 ms, kể cả nội dung khác. Slow 4G: lần ghi có thể nhảy thẳng R76, cửa 2500 ms không chạy. R72 và R67 không đứng trên các lần ghi đã đo. |

Hai việc đang bảo vệ dữ liệu khi request tới được chúng:

1. R76 viết lại PATCH profile về 5 field chuẩn trước khi gửi.
2. R73 chặn PATCH profile trong 2500 ms. Việc này không chạy mọi lần. Nó phụ thuộc thứ tự tải trang. Đã thấy trên Slow 4G. Không được ghi trong tài liệu là "cửa này luôn chạy".

R39 còn việc không đi qua fetch: tắt log Firebase, `disableNetwork`, `pushAll` thành no-op, gỡ listener, `boot()` lặp. Xóa cả script là xóa những việc đó. Hàm fetch của R39 là ứng viên gỡ sau, không phải cả script.

Không gộp lớp nào cho đến khi chủ app chạy đủ 7 luồng ở mục 7 và gửi log. Một lớp chỉ được coi là thừa khi cả 7 luồng không có request nào cần việc riêng của nó, kể cả việc không đi qua fetch.

## 7. Bảy luồng còn thiếu trước khi ai đó gộp fetch

Mỗi luồng cần một câu mắt thấy và một log. Chưa đủ thì không gộp.

1. Mở trang bằng `http`, đợi 10 giây, không bấm. Nhiệm vụ không mất. Gia đình không nhảy sang Firestore.
2. Nhiệm vụ: thêm, sửa chữ, đánh dấu xong, xóa việc khác. Việc xong bị gạch và card còn. Thêm một vòng báo thức: để kêu, bấm 30 giây, đợi kêu lại, rồi bấm Dừng.
3. Kho: thêm, xóa, tải lại. Mục còn lại vẫn còn. Nhân bản vẫn ra thẻ mới.
4. Gia đình: gửi một tin chữ, tin hiện không cần tải lại.
5. Gia đình: gửi một file nhỏ, card hiện ngay. Xem video ra overlay j19x. Nút phát nhỏ trên card vẫn phát tại chỗ.
6. MP3 và một kênh radio: sang tab khác, khóa màn hình vài giây, mở lại vẫn nghe. MP3 qua đêm đã chốt. Radio khóa màn hình chưa được ghi là đã chốt riêng.
7. YouTube hết bài thì tự bài sau. Facebook phát có tiếng và hết thì tự bài sau.

Log fetch, nếu còn bộ đếm:

```js
copy(JSON.stringify(window.__lifeosFetchTrace))
```

Bản đang đưa chủ app dùng không bắt buộc còn bộ đếm. Không cài lại bộ đếm nếu không được giao đo.

## 8. Cách sửa một việc mà không làm hỏng phần đã đạt

1. Tìm đúng tên hàm, id, hoặc class trong cả file trước khi xóa. Còn chỗ gọi ở ngoài thì không xóa.
2. Với video, tìm thêm `j19g-video-`, `lifeos-j19g-thumb`, `data-j19g-inline-video` trước khi đụng chữ `j19g`.
3. Không đổi `LIFEOS_FIREBASE_CONFIG`. Không hard-code khóa thứ hai. Khóa cũ `AIzaSyBsDNZyUS` đã bỏ.
4. Không bật Firestore cho tab Gia đình.
5. Không sửa `LifeOSAudioPipe` khi việc không phải nhạc.
6. Không đổi `prev` của R67 thành `rawFetch`.
7. Không đổi nhánh không-PATCH của R72 từ `rawFetch` sang `fetchPrev`.
8. Không đưa lại nút nhắc 5 phút, 10 phút, hoặc ô nhập số trên bảng báo thức.
9. Sửa xong, kiểm cú pháp đủ mọi thẻ `<script>`. Một thẻ lỗi là chưa được đưa file. Bản này phải còn đúng 110 thẻ mở và 110 thẻ đóng.
10. Ghi một dòng: đụng chỗ nào, chủ app cần thử lại luồng nào. Không ghi "đã test ổn" cho việc máy viết code không chạy được.

## 9. Còn mở

- Gộp 6 lớp fetch. Chưa được làm. Đọc mục 6 và mục 7 trước.
- Cửa 2500 ms của R73 cần chạy trên mọi lần ghi, kể cả trang tải chậm. Chưa vá. Không vá bằng cách xóa R73.
- Radio khi khóa màn hình, YouTube tự chuyển bài, Facebook tự chuyển bài: chưa có câu chốt riêng trong đợt này.
- YouTube: player nhắm mức `medium` (360p, khoảng dưới 1000 kbps). Có `medium` thì không lên 480p/720p/1080p. Không có `medium` thì xuống `small`, rồi mới `large`. Playlist áp lại mức này cho từng video. YouTube có thể bỏ qua yêu cầu này ở một số máy. Facebook không đổi.
- Báo thức, chủ app chưa chốt lại sau bản 2026-10-05: tắt Wi-Fi rồi để kêu; bấm 30 giây rồi tải lại trang trước khi kêu lại; bấm 1 phút rồi khóa máy hoặc sang tab, mở lại sau khi quá giờ; trong lúc đang chờ, một việc khác đến giờ vẫn kêu; trong lúc đang chờ, gạch xong việc vừa hẹn thì hết giờ không kêu lại.
