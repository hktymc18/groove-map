#!/usr/bin/env python3
# バージョンを上げる： python3 tools/test/bump.py v613 v614 "  { v:'v614', d:'2026-10-05', items:['…'] },"
# 7か所（sw.js 2・index.html 3・app.js 2）を書き換え、RELEASE_NOTES の先頭にお知らせを足す
import sys, re, os
old, new = sys.argv[1], sys.argv[2]
note = sys.argv[3] if len(sys.argv) > 3 else ''
root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
def edit(fn, pairs, extra=None):
    p = os.path.join(root, fn); s = open(p, encoding='utf-8').read()
    for a, b in pairs:
        if s.count(a) != 1: sys.exit('NG: %s に %r が %d 個' % (fn, a, s.count(a)))
        s = s.replace(a, b)
    if extra: s = extra(s)
    open(p, 'w', encoding='utf-8').write(s)
edit('sw.js', [("var CACHE = 'groove-map-%s';" % old, "var CACHE = 'groove-map-%s';" % new), ("var APP_JS = './app.js?v=%s';" % old, "var APP_JS = './app.js?v=%s';" % new)])
def ih(s):
    s2, n = re.subn(r'(id="versionTag"[^>]*>)%s<' % old, r'\g<1>%s<' % new, s)
    if n != 1: sys.exit('NG: versionTag')
    return s2
edit('index.html', [("window.GM_EXPECT_JS='%s';" % old, "window.GM_EXPECT_JS='%s';" % new), ('<script src="app.js?v=%s"></script>' % old, '<script src="app.js?v=%s"></script>' % new)], ih)
def ap(s):
    if note:
        m = 'var RELEASE_NOTES = [\n'
        if s.count(m) != 1: sys.exit('NG: RELEASE_NOTES')
        s = s.replace(m, m + note.rstrip('\n') + '\n')
    return s
edit('app.js', [("var APP_JS_VERSION = '%s';" % old, "var APP_JS_VERSION = '%s';" % new), ("var DATA_VERSION = '%s';" % old, "var DATA_VERSION = '%s';" % new)], ap)
print('bumped %s -> %s' % (old, new))
