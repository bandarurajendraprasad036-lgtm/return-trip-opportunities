"""Rebuild public/places shards: one row per place name + state, small 3-letter shards for fast village search.
Usage: python3 scripts/build-place-shards.py <source_dir> <out_dir>"""
import json, glob, os, sys, unicodedata, collections
src, out = sys.argv[1], sys.argv[2]
def norm(v):
    v = unicodedata.normalize('NFD', v.strip().lower())
    return ''.join(c for c in v if not ('\u0300' <= c <= '\u036f'))
def key(q, n): return '-'.join(format(ord(c), 'x') for c in list(norm(q))[:n])
rows = {}
for f in glob.glob(os.path.join(src, '*.json')):
    for r in json.load(open(f)):
        k = norm(r[1]) + '|' + norm(r[3])
        if k not in rows or r[7] > rows[k][7]: rows[k] = r
top = json.load(open(os.path.join(src, 'top.json')))
shards = collections.defaultdict(list)
for r in sorted(rows.values(), key=lambda r: -r[7]):
    names = []
    for n in [r[1], r[2], *r[6]]:
        if n and norm(n) not in [norm(x) for x in names]: names.append(n)
    names = names[:4]
    row = [r[0], r[1], r[2], r[3], round(r[4], 4), round(r[5], 4), names, r[7]]
    for k in {key(n, d) for n in names for d in (2, 3, 4) if len(norm(n)) >= d}:
        shards[k].append(row)
os.makedirs(out, exist_ok=True)
# 2 letters: most-populated only; 3 letters: up to 400; 4-letter shard only when the 3-letter one overflowed (complete).
written = 0
for k, v in shards.items():
    depth = k.count('-') + 1
    if depth == 4 and len(shards[k.rsplit('-', 1)[0]]) <= 400: continue
    limit = {2: 120, 3: 400, 4: 100000}[depth]
    json.dump(v[:limit], open(os.path.join(out, k + '.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
    written += 1
print('written', written)
json.dump(top, open(os.path.join(out, 'top.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
print(len(rows), 'places', len(shards), 'shards')
