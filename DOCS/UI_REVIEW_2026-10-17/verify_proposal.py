from pathlib import Path
from html.parser import HTMLParser
import re,json,struct,hashlib,datetime

root=Path(__file__).parent
text=(root/'index.html').read_text(encoding='utf-8')
class Scan(HTMLParser):
 def __init__(self):super().__init__();self.ids=[];self.sources=[];self.tags=[]
 def handle_starttag(self,t,a):
  a=dict(a);self.tags.append(t)
  if 'id' in a:self.ids.append(a['id'])
  if 'src' in a:self.sources.append(a['src'])
s=Scan();s.feed(text)
assert len(s.ids)==len(set(s.ids)), 'Duplicate operator IDs'
assert text.count('<script>')==text.count('</script>')==1
assert '{{placeholder}}' not in text
assert all(not x.startswith(('http:','https:')) for x in s.sources)
style=re.search(r'<style>(.*?)</style>',text,re.S).group(1)
colors=set(re.findall(r'#[0-9a-fA-F]{3,8}\b',style))
assert colors<={'#ffffff','#111111','#1677ff','#f7f8fa','#6b7280','#d9dee7'}, colors
script=re.search(r'<script>(.*?)</script>',text,re.S).group(1)
(root/'verification.js').write_text(script,encoding='utf-8')
images=[]
for p in sorted((root/'media').glob('*.png')):
 b=p.read_bytes();w,h=struct.unpack('>II',b[16:24]);assert b[:8]==b'\x89PNG\r\n\x1a\n'
 images.append({'file':p.relative_to(root).as_posix(),'width':w,'height':h,'sha256':hashlib.sha256(b).hexdigest(),'modified_utc':datetime.datetime.fromtimestamp(p.stat().st_mtime,datetime.timezone.utc).isoformat()})
for state in ['setup','game']:
 for view,expected in [('desktop',(1440,900)),('portrait',(390,844)),('landscape',(844,390))]:
  for side in ['before','after']:
   f=f'media/{side}-{state}-{view}.png';im=next(i for i in images if i['file']==f);assert (im['width'],im['height'])==expected,f
for state in ['controls','rules','tuning','wonder','audio','camera']:
 for side in ['before','after']:assert any(i['file']==f'media/{side}-{state}-desktop.png' for i in images)
for side in ['before','after']:assert any(i['file']==f'media/{side}-companion-portrait.png' for i in images)
(root/'media-manifest.json').write_text(json.dumps(images,indent=2),encoding='utf-8')
source=Path('E:/devProjects/squash-arcade')
paths=['README.md','DOCS/ARCHITECTURE.md','CHECKLIST.md','index.html','styles.css','public/companion.html','src/squash/TuningPanel.js','src/game_engine.js','src/audio_engine.js']
hashes=[{'path':p,'sha256':hashlib.sha256((source/p).read_bytes()).hexdigest()} for p in paths]
(root/'source-manifest.json').write_text(json.dumps(hashes,indent=2),encoding='utf-8')
def lum(h):
 v=[int(h[i:i+2],16)/255 for i in (1,3,5)];v=[x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4 for x in v]
 return sum(a*b for a,b in zip(v,[.2126,.7152,.0722]))
def ratio(a,b):
 x,y=sorted([lum(a),lum(b)]);return round((y+.05)/(x+.05),2)
checks={'png_count':len(images),'required_pairs':'pass','palette_literals':sorted(colors),'duplicate_operator_ids':False,'external_image_sources':False,'script_tags_balanced':True,'contrast':{'fg_on_bg':ratio('#111111','#ffffff'),'fg_on_surface':ratio('#111111','#f7f8fa'),'muted_on_surface':ratio('#6b7280','#f7f8fa'),'accent_on_bg_nontext':ratio('#1677ff','#ffffff')},'scope':'Static artifact validation, not application/device acceptance'}
(root/'verification.json').write_text(json.dumps(checks,indent=2),encoding='utf-8')
print(json.dumps(checks,indent=2))
