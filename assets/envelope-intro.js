/* Homepage cover only. The original photographs stay unchanged on disk. */
(function () {
  'use strict';
  var cover = document.getElementById('letterEnvelope');
  var button = document.getElementById('envelopeOpen');
  var image = document.getElementById('envelopeCover');
  var extraction = document.getElementById('envelopeExtraction');
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var storageKey = 'portfolio-letter-opened';
  var opening = false, timer, movingLetter, marker, artwork;
  function remember() { try { sessionStorage.setItem(storageKey, '1'); } catch (e) {} }
  try { if (sessionStorage.getItem(storageKey) === '1') return; } catch (e) { return; }
  if (motion.matches) { remember(); return; }
  if (!cover.showModal || !window.CSS || !CSS.registerProperty) return;
  try { CSS.registerProperty({ name: '--letter-opening', syntax: '<number>', inherits: true, initialValue: '0' }); }
  catch (e) { return; }
  function finish() {
    if (!cover.open) return;
    clearTimeout(timer);
    remember();
    if (movingLetter) {
      movingLetter.classList.remove('envelope-moving-letter');
      if (marker && marker.parentNode) marker.replaceWith(movingLetter);
      movingLetter = marker = null;
    }
    cover.close();
    cover.hidden = true;
    document.documentElement.classList.remove('envelope-active', 'envelope-opening');
    var letter = document.getElementById('letter');
    if (letter) letter.focus({ preventScroll: true });
  }
  function canvas(w, h) {
    var c = document.createElement('canvas'); c.width = Math.ceil(w); c.height = Math.ceil(h); return c;
  }
  function polygon(ctx, points) {
    ctx.beginPath();
    points.forEach(function (p, i) { if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); });
    ctx.closePath();
  }
  function buildArtwork(portrait) {
    var w = image.naturalWidth, h = image.naturalHeight;
    var flap = (portrait ? [[.1324,.113],[.868,.113],[.855,.185],[.67,.48],[.5,.54],[.32,.47],[.15,.24],[.14,.18]] :
      [[.166,.071],[.894,.176],[.872,.28],[.59,.498],[.5,.535],[.398,.458],[.192,.216],[.174,.17]])
      .map(function (p) { return [p[0]*w, p[1]*h]; });
    var box = portrait ? [370,760,345,350] : [566,299,308,309];
    var original = canvas(w,h), ctx = original.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(image,0,0); var pixels = ctx.getImageData(0,0,w,h);
    // Isolate the red wax, fill the lettering holes, and retain its uneven outline.
    var mask = canvas(w,h), mc = mask.getContext('2d'), alpha = mc.createImageData(w,h);
    var left = box[0], top = box[1], right = left+box[2], bottom = top+box[3];
    for (var y=top; y<bottom; y++) {
      var first=-1, last=-1;
      for (var x=left; x<right; x++) {
        var i=(y*w+x)*4, r=pixels.data[i], g=pixels.data[i+1], b=pixels.data[i+2];
        if (r>45 && r>g*1.28 && r>b*1.3) { if (first<0) first=x; last=x; }
      }
      if (first>=0) for (x=first; x<=last; x++) {
        i=(y*w+x)*4; alpha.data[i]=alpha.data[i+1]=alpha.data[i+2]=255; alpha.data[i+3]=255;
      }
    }
    mc.putImageData(alpha,0,0);
    // Reconstruct the paper under the seal, with local colour and photographic grain.
    // Only the animated layers use this in-memory composite; both WebPs remain original.
    var replacement = canvas(w,h), rc = replacement.getContext('2d'), paper = rc.createImageData(w,h);
    function paperColour(cx,cy) {
      var colour=[0,0,0],n=0;
      for(var dy=-12;dy<=12;dy+=3) for(var dx=-12;dx<=12;dx+=3){
        var at=((cy+dy)*w+cx+dx)*4;
        for(var k=0;k<3;k++)colour[k]+=pixels.data[at+k];n++;
      }
      return colour.map(function(c){return c/n;});
    }
    var corners=[paperColour(left-65,top-65),paperColour(right+65,top-65),paperColour(left-65,bottom+65),paperColour(right+65,bottom+65)];
    for (y=top-65;y<bottom+65;y++) for(x=left-65;x<right+65;x++) {
      i=(y*w+x)*4;
      var u=(x-left+65)/(box[2]+130),v=(y-top+65)/(box[3]+130);
      var sample=((portrait?340+(y-top+65)%300:y)*w+(portrait?x:360+(x-left+65)%120))*4;
      var grain=(pixels.data[sample]+pixels.data[sample+1]+pixels.data[sample+2])/3;
      for(var k=0;k<3;k++)paper.data[i+k]=(corners[0][k]*(1-u)+corners[1][k]*u)*(1-v)+(corners[2][k]*(1-u)+corners[3][k]*u)*v+Math.max(-2,Math.min(2,(grain-205)*.1));
      // Replace the entire old wax shadow, then feather into the surrounding paper.
      var distance=Math.max(left-15-x,x-right-15,top-15-y,y-bottom-15,0)/50;
      distance=Math.max(0,Math.min(1,distance));
      paper.data[i+3]=255*(1-distance*distance*(3-2*distance));
    }
    rc.putImageData(paper,0,0);
    var clean=canvas(w,h), cc=clean.getContext('2d'); cc.drawImage(original,0,0); cc.drawImage(replacement,0,0);
    // The cavity, paper and front pocket occupy one set of source-image coordinates.
    var back=canvas(w,h), bc=back.getContext('2d'); bc.drawImage(clean,0,0);
    bc.save(); polygon(bc,flap); bc.clip(); bc.fillStyle='rgba(88,62,35,.22)'; bc.fillRect(0,0,w,h); bc.restore();
    var front=canvas(w,h), fc=front.getContext('2d'); fc.drawImage(clean,0,0);
    fc.globalCompositeOperation='destination-in';
    polygon(fc,(portrait?[[.1324,.113],[.868,.113],[.873,.89],[.125,.89]]:[[.166,.071],[.894,.176],[.85,.937],[.093,.813]]).map(function(p){return [p[0]*w,p[1]*h];}));fc.fill();
    fc.globalCompositeOperation='destination-out'; polygon(fc,flap); fc.fill();
    // A real local hinge: both top corners have y=0 in this coordinate system.
    var a=flap[0], b=flap[1], angle=Math.atan2(b[1]-a[1],b[0]-a[0]);
    var cs=Math.cos(angle), sn=Math.sin(angle), length=Math.hypot(b[0]-a[0],b[1]-a[1]);
    function local(p) { var dx=p[0]-a[0],dy=p[1]-a[1];return [dx*cs+dy*sn,-dx*sn+dy*cs]; }
    var localFlap=flap.map(local), depth=Math.ceil(Math.max.apply(null,localFlap.map(function(p){return p[1];}))+4);
    var face=canvas(length,depth), faceCtx=face.getContext('2d');
    polygon(faceCtx,localFlap); faceCtx.clip();
    faceCtx.setTransform(cs,-sn,sn,cs,-a[0]*cs-a[1]*sn,a[0]*sn-a[1]*cs); faceCtx.drawImage(clean,0,0);
    var reverseFace=canvas(length,depth), reverseCtx=reverseFace.getContext('2d');
    polygon(reverseCtx,localFlap);reverseCtx.clip();
    var sample=portrait?[220,260,620,380]:[460,190,470,100];
    reverseCtx.drawImage(original,sample[0],sample[1],sample[2],sample[3],0,0,length,depth);
    // A torn horizontal seam: the upper wax rides the flap, the lower wax slips down.
    var seam=top+box[3]*.51, upper=canvas(w,h), uc=upper.getContext('2d');
    uc.drawImage(original,0,0); uc.globalCompositeOperation='destination-in'; uc.drawImage(mask,0,0);
    uc.globalCompositeOperation='destination-in';
    polygon(uc,[[0,0],[w,0],[w,seam],[left+box[2]*.8,seam+5],[left+box[2]*.65,seam-4],[left+box[2]*.5,seam+5],[left+box[2]*.35,seam-4],[left,seam],[0,seam]]);uc.fill();
    var lower=canvas(w,h), lc=lower.getContext('2d'); lc.drawImage(original,0,0);
    lc.globalCompositeOperation='destination-in'; lc.drawImage(mask,0,0); lc.globalCompositeOperation='destination-out'; lc.drawImage(upper,0,0);
    var upperLocal=canvas(length,depth), ul=upperLocal.getContext('2d');
    ul.setTransform(cs,-sn,sn,cs,-a[0]*cs-a[1]*sn,a[0]*sn-a[1]*cs); ul.drawImage(upper,0,0);
    return { source:image.currentSrc, w:w,h:h,flap:flap,hinge:a,angle:angle,length:length,depth:depth,seal:[left+box[2]/2,seam],
      back:back,front:front,face:face,reverse:reverseFace,upper:upperLocal,lower:lower };
  }
  function syncArtwork() {
    if (!image.naturalWidth || !image.naturalHeight) return;
    try {
      var portrait=image.currentSrc.indexOf('envelope-cover-mobile.webp')!==-1;
      if (!artwork || artwork.source!==image.currentSrc) {
        artwork=buildArtwork(portrait);
        var selectors={back:'.envelope-back',front:'.envelope-front',face:'.envelope-flap-face',upper:'.envelope-wax-upper',lower:'.envelope-wax-lower'};
        Object.keys(selectors).forEach(function(key){var node=artwork[key];node.className='envelope-texture';document.querySelector(selectors[key]).replaceChildren(node);});
        var reverse=artwork.reverse;reverse.className='envelope-texture';
        document.querySelector('.envelope-flap-back > div').replaceChildren(reverse);
      }
      cover.classList.toggle('envelope-portrait',portrait);
      var r=cover.getBoundingClientRect(), scale=Math.max(r.width/artwork.w,r.height/artwork.h);
      var w=artwork.w*scale,h=artwork.h*scale,l=(r.width-w)*(portrait?.5:.48),t=(r.height-h)*(portrait?.5:.6);
      function set(name,value) { cover.style.setProperty('--'+name,value); }
      set('art-width',w+'px');set('art-height',h+'px');set('art-left',l+'px');set('art-top',t+'px');
      set('hinge-left',artwork.hinge[0]*scale+'px');set('hinge-top',artwork.hinge[1]*scale+'px');
      set('hinge-width',artwork.length*scale+'px');set('hinge-depth',artwork.depth*scale+'px');set('hinge-angle',artwork.angle+'rad');
      set('seal-x',artwork.seal[0]*scale+'px');set('seal-y',artwork.seal[1]*scale+'px');
      set('seal-clearance',(Math.max.apply(null,artwork.flap.map(function(p){return p[1];}))-artwork.seal[1]+artwork.h*.06)*scale+20+'px');
      // Straight aperture at the hinge line: the letter rises behind the front
      // pocket and appears line by line, so no diagonal edge can cut its text.
      var mouthY=(t+((artwork.flap[0][1]+artwork.flap[1][1])/2)*scale)+'px';
      set('mouth-clip','polygon(0 0, 100% 0, 100% calc('+mouthY+' + var(--envelope-drop)), 0 calc('+mouthY+' + var(--envelope-drop)))');
      set('letter-start',(t+(artwork.hinge[1]+artwork.h*.25)*scale)+'px');
    } catch (e) { finish(); }
  }
  function openLetter() {
    if (opening || !image.complete || !image.naturalWidth) return;
    syncArtwork(); if (!artwork || !cover.open) return;
    var letter=document.getElementById('letter'); if (!letter) { finish();return; }
    var rect=letter.getBoundingClientRect();
    cover.style.setProperty('--letter-width',rect.width+'px');cover.style.setProperty('--letter-top',rect.top+'px');
    cover.style.setProperty('--letter-rise',Math.min(rect.top,innerHeight*.08)+'px');
    marker=document.createComment('letter-home-position');letter.before(marker);movingLetter=letter;
    letter.classList.add('envelope-moving-letter');extraction.appendChild(letter);
    opening=true;remember();button.disabled=true;cover.classList.add('is-opening');
    document.documentElement.classList.add('envelope-opening');timer=setTimeout(finish,3650);
  }
  image.addEventListener('load',syncArtwork);image.addEventListener('error',finish);
  if (image.complete && !image.naturalWidth) return;
  button.addEventListener('click',openLetter);
  cover.addEventListener('keydown',function(){cover.classList.add('keyboard-navigation');});
  document.getElementById('envelopeSkip').addEventListener('click',function(e){e.preventDefault();finish();});
  cover.addEventListener('cancel',function(e){e.preventDefault();finish();});
  cover.addEventListener('animationend',function(e){if(opening&&e.target===cover&&e.animationName==='envelope-open-scene')finish();});
  function reduceMotion(e){if(e.matches)finish();}
  if(motion.addEventListener)motion.addEventListener('change',reduceMotion);else if(motion.addListener)motion.addListener(reduceMotion);
  window.addEventListener('beforeprint',finish);
  window.addEventListener('resize',function(){if(opening)finish();else if(cover.open)syncArtwork();});
  window.addEventListener('pagehide',function(){if(opening)finish();});
  try {cover.hidden=false;cover.showModal();document.documentElement.classList.add('envelope-active');syncArtwork();}
  catch(e){cover.hidden=true;}
})();
