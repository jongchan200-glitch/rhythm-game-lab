if(playing){
  // V32 common octagonal note faces; only drawing changes. The same time and
  // lane positions, note kinds and state drive every skin.
  const light=['#edb9c4','#f5dca0','#a9e0e5','#d4c2ee'],mid=['#936879','#8b7852','#4c8793','#756c9b'];
  function oct(x,y,w,h,c){c=Math.min(c,w*.23,h*.36);ctx.beginPath();ctx.moveTo(x+c,y);ctx.lineTo(x+w-c,y);ctx.lineTo(x+w,y+c);ctx.lineTo(x+w,y+h-c);ctx.lineTo(x+w-c,y+h);ctx.lineTo(x+c,y+h);ctx.lineTo(x,y+h-c);ctx.lineTo(x,y+c);ctx.closePath()}
  function waves(cx,cy,w,ink){ctx.save();ctx.strokeStyle=ink;ctx.globalAlpha=.43;ctx.lineWidth=.75;for(let j=0;j<3;j++){ctx.beginPath();ctx.arc(cx-w*.15,cy,Math.max(2,w*(.10+j*.07)),Math.PI,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(cx+w*.14,cy,Math.max(2,w*(.07+j*.055)),Math.PI,Math.PI*2);ctx.stroke()}ctx.restore()}
  for(const r of notes){
    if(r.kind!=='release'||r.state!=='pending'||!Number.isFinite(r.startT))continue;
    if(r.t<t-.28||r.startT>t+3.6)continue;
    const sy=hitY-(r.startT-t)*speedPx,ey=hitY-(r.t-t)*speedPx;
    const upper=Math.max(-20,ey),lower=Math.min(hitY+18,sy);if(lower<=upper)continue;
    const x=r.lane*tw+tw*.22,w=tw*.56,h=lower-upper;
    ctx.save();const beam=ctx.createLinearGradient(x,0,x+w,0);beam.addColorStop(0,mid[r.lane]+'50');beam.addColorStop(.5,light[r.lane]+'9a');beam.addColorStop(1,mid[r.lane]+'50');ctx.fillStyle=beam;ctx.fillRect(x,upper,w,h);ctx.strokeStyle=light[r.lane]+'95';ctx.lineWidth=1;ctx.strokeRect(x,upper,w,h);
    if(ey>-22&&ey<H+22){ctx.strokeStyle=light[r.lane];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-3,ey);ctx.lineTo(x+w+3,ey);ctx.stroke()}
    ctx.restore()
  }
  for(const n of notes){
    if(n.state!=='pending'||n.kind==='release')continue;if(n.t>t+3.6)break;
    const y=hitY-(n.t-t)*speedPx;if(y<-70||y>H+35)continue;
    const x=n.lane*tw+7,w=tw-14,cx=x+w*.5,k=n.lane;
    ctx.save();
    if(n.coin){
      const radius=Math.min(19,w*.35);
      const g=ctx.createLinearGradient(cx-radius,y-radius,cx+radius,y+radius);g.addColorStop(0,'#fef0bd');g.addColorStop(.45,'#d9ac5a');g.addColorStop(1,'#996226');
      ctx.fillStyle=g;ctx.shadowColor='#e5bd69';ctx.shadowBlur=8;ctx.strokeStyle='#ffedb4';ctx.lineWidth=1.8;ctx.beginPath();ctx.arc(cx,y,radius,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.shadowBlur=0;ctx.strokeStyle='#94622a';ctx.lineWidth=1;ctx.beginPath();ctx.arc(cx,y,radius*.76,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#10243b';ctx.fillRect(cx-radius*.30,y-radius*.30,radius*.6,radius*.6);ctx.strokeStyle='#ffe9a7';ctx.strokeRect(cx-radius*.30,y-radius*.30,radius*.6,radius*.6);ctx.restore();continue;
    }
    const g=ctx.createLinearGradient(0,y-13,0,y+13);g.addColorStop(0,light[k]);g.addColorStop(.22,mid[k]);g.addColorStop(1,mid[k]+'d8');ctx.fillStyle=g;ctx.strokeStyle=light[k];ctx.lineWidth=1.9;ctx.shadowColor=light[k];ctx.shadowBlur=6;oct(x,y-13,w,26,7);ctx.fill();ctx.stroke();ctx.shadowBlur=0;
    ctx.strokeStyle=light[k]+'85';ctx.lineWidth=.7;oct(x+2,y-11,w-4,22,6);ctx.stroke();waves(cx,y+8,Math.min(29,w*.48),light[k]);
    if(n.kind==='flick'){ctx.strokeStyle=light[k];ctx.lineWidth=2.1;ctx.lineJoin='round';ctx.lineCap='round';for(let i=0;i<2;i++){const yy=y-18-i*7;ctx.globalAlpha=i?.58:.93;ctx.beginPath();ctx.moveTo(cx-8,yy+4);ctx.lineTo(cx,yy-2);ctx.lineTo(cx+8,yy+4);ctx.stroke()}}
    ctx.restore();
  }
}
