# 撮影用ページを作る: checkin/index.html の Firebase をメモリ上のスタブ（ダミーデータ）に差し替え、
# QRコードはローカルの qrcode.min.js を使う。出力は tools/guide-video/www/ （.gitignore 対象）
import os, shutil, subprocess
T = os.path.dirname(os.path.abspath(__file__))
W = os.path.join(T, 'www'); os.makedirs(W, exist_ok=True)
src = open(os.path.join(T, '..', '..', 'checkin', 'index.html'), encoding='utf-8').read()
fb = """<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"></script>"""
qr = '<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>'
assert fb in src and qr in src, 'checkin/index.html の script タグが想定と違います'
open(os.path.join(W, 'video.html'), 'w', encoding='utf-8').write(src.replace(fb, '<script src="stub.js"></script>').replace(qr, '<script src="qrcode.min.js"></script>'))
shutil.copy(os.path.join(T, 'stub.js'), W)
if not os.path.exists(os.path.join(W, 'qrcode.min.js')):
    subprocess.run(['npm', 'pack', 'qrcodejs@1.0.0', '--silent'], cwd=W, check=True)
    subprocess.run(['tar', 'xzf', 'qrcodejs-1.0.0.tgz'], cwd=W, check=True)
    shutil.copy(os.path.join(W, 'package', 'qrcode.min.js'), W)
print('ok:', os.path.join(W, 'video.html'))
