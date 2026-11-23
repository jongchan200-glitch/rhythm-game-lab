#!/usr/bin/env python3
"""Patch only album browsing/preview UX on top of the deployed V21 8-song site.
The existing V21 repeated drum chart, original V20 version, manifest and all
localStorage keys remain byte-for-byte unchanged.
"""
from pathlib import Path
import os,shutil,json
SITE=Path(os.environ.get('RHYTHM_SITE','_site'))
OV=Path(os.environ.get('RHYTHM_V22_OVERRIDE','overrides/album-preview-v22'))
HOME=SITE/'scripts/home-v14.js'
HARD=SITE/'scripts/tonight-home-v16.js'
INDEX=SITE/'index.html'

def rep(s,old,new,why):
 assert s.count(old)==1,(why,s.count(old))
 return s.replace(old,new,1)

man=json.loads((SITE/'assets/manifest.json').read_text('utf8'))
ready=[x for x in man['tracks'] if x.get('status')=='ready']
assert len(ready)==8 and 'well_lived_hard_repeat_v21'==ready[-1]['id']
assert ready[-1]['audio']=='assets/audio/well_lived_climax_v20.mp3'
assert ready[-1]['chart']=='assets/charts/well_lived_hard_repeat_v21.json'

s=HOME.read_text('utf8')
s=rep(s,'  next.click();scheduleRefresh();}',
  "  next.click();scheduleRefresh();window.RhythmAlbumPreviewV22?.playSong(next.dataset.song);}",
  'LP song swipe auto preview')
s=rep(s,
 ''' byId('rhPreview').addEventListener('click',()=>{
   if(!getSelection().selected)return;
   byId('previewPlay').click();
   const previewing=byId('previewPlay').textContent.includes('일시정지');
   controls.vinyl.classList.toggle('rh-spin',previewing);
   controls.preview.textContent=previewing?'Ⅱ 미리듣기 멈추기':'♫ 곡 미리듣기';
 });''',
 ''' byId('rhPreview').addEventListener('click',()=>{
   const sel=getSelection().selected;if(sel)window.RhythmAlbumPreviewV22?.toggle(sel.dataset.song);
 });''',
 'LP legacy preview fallback')
s=rep(s,"controls.preview.textContent='♫ 곡 미리듣기'", "controls.preview.textContent=window.RhythmAlbumPreviewV22?.activeId()===id?'♫ 자동 재생 중 · 탭하면 멈춤':'♫ 앨범을 넘기면 자동 재생'",'LP preview label on refresh')
HOME.write_text(s,'utf8')

s=HARD.read_text('utf8')
s=rep(s,
 " function changeHard(delta){stopPreview();const z=tracks();if(!z.length)return;hardIndex=(hardIndex+delta+z.length)%z.length;render();}",
 " function changeHard(delta){const z=tracks();if(!z.length)return;hardIndex=(hardIndex+delta+z.length)%z.length;render();const b=z[hardIndex];if(b){b.click();window.RhythmAlbumPreviewV22?.playSong(b.dataset.song)}}",
 'CD swipe auto preview/actual selected track')
s=rep(s,
 ''' $('rhHardPreview').addEventListener('click',()=>{
   if(!activeTrack())return;
   $('previewPlay').click();const active=$('previewPlay').textContent.includes('일시정지');
   $('rhHardPreview').textContent=active?'Ⅱ 미리듣기 멈추기':'♫ 곡 미리듣기';disc.classList.toggle('rh-hard-spin',active);
 });''',
 ''' $('rhHardPreview').addEventListener('click',()=>{
   const b=tracks()[hardIndex];if(b){b.click();window.RhythmAlbumPreviewV22?.toggle(b.dataset.song)}
 });''',
 'HARD legacy button reuses new sampler')
HARD.write_text(s,'utf8')

shutil.copy2(OV/'album-autoplay-v22.js',SITE/'scripts/album-autoplay-v22.js')
h=INDEX.read_text('utf8')
h=rep(h,'scripts/home-v14.js?v20','scripts/home-v14.js?v22','LP cache bust')
h=rep(h,'scripts/tonight-home-v16.js?v21','scripts/tonight-home-v16.js?v22','CD cache bust')
h=rep(h,'</body>','<script defer src="scripts/album-autoplay-v22.js?v22"></script></body>','preview runtime script')
INDEX.write_text(h,'utf8')
print('V22_LP_CD_AUTOPREVIEW_SWIPES_CROSSFADE_WITH_EXISTING_V21_V2_INTACT')
