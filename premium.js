(() => {
  const dialog=document.getElementById('deckDialog'), img=document.getElementById('deckImage'), counter=document.getElementById('deckCounter');
  const prev=document.getElementById('deckPrev'),next=document.getElementById('deckNext'),close=document.getElementById('deckClose');
  let current=0,slides=[],opener=null;
  fetch('assets/slides.json').then(r=>{if(!r.ok)throw Error('slides');return r.json()}).then(s=>{slides=s;render()}).catch(()=>{document.getElementById('deckCaption').textContent='Apresentação institucional AutoZap';});
  function render(){
    const total=slides.length||14;current=Math.min(total-1,Math.max(0,current));
    img.src=`assets/slide-${String(current+1).padStart(2,'0')}.webp`;
    img.alt=slides[current]?`${slides[current].title} ${slides[current].description}`:`Apresentação AutoZap, página ${current+1}`;
    document.getElementById('deckCaption').textContent=img.alt;
    counter.textContent=`${String(current+1).padStart(2,'0')} / ${total}`;
    prev.disabled=current===0;next.disabled=current===total-1;
    document.getElementById('deckProgress').style.width=`${(current+1)/total*100}%`;
    img.classList.remove('slide-enter');requestAnimationFrame(()=>img.classList.add('slide-enter'));
    if(current+1<total){const preload=new Image();preload.src=`assets/slide-${String(current+2).padStart(2,'0')}.webp`;}
  }
  document.querySelectorAll('[data-open-deck]').forEach(b=>b.addEventListener('click',()=>{opener=b;current=0;render();dialog.showModal();document.body.classList.add('deck-open');close.focus();}));
  prev.addEventListener('click',()=>{current--;render()});next.addEventListener('click',()=>{current++;render()});
  close.addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{document.body.classList.remove('deck-open');if(document.fullscreenElement===dialog)document.exitFullscreen().catch(()=>{});opener?.focus({preventScroll:true})});
  dialog.addEventListener('keydown',e=>{if(['ArrowRight','PageDown','ArrowLeft','PageUp','Home','End'].includes(e.key)){e.preventDefault();if(e.key==='Home')current=0;else if(e.key==='End')current=(slides.length||14)-1;else current+=['ArrowRight','PageDown'].includes(e.key)?1:-1;render()}});
  document.getElementById('deckFullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await dialog.requestFullscreen()}catch{document.getElementById('deckFullscreen').textContent='Use F11 para tela cheia'}});
  const progress=document.querySelector('.reading-progress');let queued=false;
  function updateProgress(){const max=document.documentElement.scrollHeight-innerHeight;progress.style.transform=`scaleX(${max>0?scrollY/max:0})`;queued=false}
  addEventListener('scroll',()=>{if(!queued){requestAnimationFrame(updateProgress);queued=true}},{passive:true});addEventListener('resize',updateProgress);updateProgress();
})();
