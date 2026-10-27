(() => {
  'use strict';
  const $ = id => document.getElementById(id), api = window.AUTOZAP_CAPTACAO_API || '';
  const money = cents => (cents / 100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const percent = n => (n / 100).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+'%';
  let ready=false, order=null, token='', busy=false;
  const states={DRAFT:'Aguardando documento assinado',DOCUMENT_SENT:'Documento em análise',DOCUMENT_REJECTED:'Documento precisa de ajuste',PAYMENT_PENDING:'Documento aprovado · Pix disponível',PAYMENT_REPORTED:'Comprovante enviado · aguardando confirmação',CONFIRMED:'Participação confirmada',CANCELLED:'Solicitação cancelada'};
  function message(text,error=false) { $('raiseFeedback').textContent=text; $('raiseFeedback').classList.toggle('is-error',error); }
  async function request(path, options={}) {
    if(!api) throw Error('A operação ainda está em preparação. Nenhum dado foi enviado.');
    const response=await fetch(api+path,{...options,headers:{...(token?{Authorization:'Bearer '+token}:{}),...options.headers},signal:AbortSignal.timeout(30000)});
    const result=await response.json(); if(!response.ok) throw Error(result.error || 'Não foi possível concluir.'); return result;
  }
  async function act(fn) { if(busy) return; busy=true; $('raiseProcess').setAttribute('aria-busy','true'); try { await fn(); } catch(e) { message(e.message,true); } finally { busy=false; $('raiseProcess').removeAttribute('aria-busy'); } }
  function update() {
    const raw=Number($('unitQuantity').value), n=Number.isFinite(raw)?Math.min(1000,Math.max(1,Math.round(raw))):1;
    $('unitQuantity').value=n; $('selectedTotal').textContent=money(n*100000); $('selectedPercent').textContent=percent(n);
    $('paymentTotal').textContent=money(n*100000); $('paymentFraction').textContent=`${n} ${n===1?'cota':'cotas'} · ${percent(n)}`;
    $('quantityLess').disabled=!!order || n===1; $('quantityMore').disabled=!!order || n===1000;
    if(!order && $('documentText').textContent) showDraft();
  }
  function step(n) {
    if(n>0 && !order && !$('registrationForm').reportValidity()) return;
    if(n>1 && !order) { message('Primeiro conclua o cadastro e a documentação.'); return; }
    if(n>1 && !['PAYMENT_PENDING','PAYMENT_REPORTED','CONFIRMED'].includes(order.state)) { message('O Pix será disponibilizado após a conferência do documento.'); return; }
    document.querySelectorAll('[data-raise-panel]').forEach(p=>p.hidden=Number(p.dataset.raisePanel)!==n);
    document.querySelectorAll('[data-raise-step]').forEach(b=>b.setAttribute('aria-current',Number(b.dataset.raiseStep)===n?'step':'false'));
    $('raiseAnnouncement').textContent=['Cadastro','Documentação','Pagamento'][n];
  }
  function draftText() {
    const n=Number($('unitQuantity').value);
    return `EMPRESA\nNome comercial: AutoZap\nRazão social: Rafylsck industries\nCNPJ: 67.306.957/0001-31\n\nPARTICIPANTE\nNome: ${$('interestName').value.trim()}\nE-mail: ${$('interestEmail').value.trim()}\n\nCOTAS SOLICITADAS\nQuantidade: ${n}\nValor por cota: R$ 1.000,00\nValor total: ${money(n*100000)}\nParticipação proposta por cota: 0,01%\nParticipação total proposta: ${percent(n)}\n\nDOCUMENTAÇÃO E PAGAMENTO\nA aquisição fica condicionada à definição dos termos da participação, à conferência do documento assinado, à confirmação do pagamento e à conclusão da formalização. Este modelo não comprova compra concluída.\n\nCONFIRMAÇÃO DA VENDA E ACESSO À ÁREA DE SÓCIOS\nA confirmação da venda será realizada somente após a confirmação do recebimento integral do pagamento. Em até 24 horas contadas dessa confirmação, será disponibilizado ao participante um link de acesso ao site Sócios AutoZap, onde serão registrados seu nome e a quantidade de cotas adquiridas. A emissão ou assinatura deste documento, por si só, não comprova pagamento nem venda concluída.\n\nPix informado para a empresa: financeiro@autozap.log.br\nDestinatário bancário: Rafael Pacheco Balceiro\n\nASSINATURA DA EMPRESA\n[A imagem autorizada da assinatura consta na versão para impressão.]\nAutoZap\n\nASSINATURA DO PARTICIPANTE\n\n____________________________________________________________\nNome: ${$('interestName').value.trim()}\nLocal e data: _______________________________________________`;
  }
  function showDraft() {
    const text=draftText(); $('documentText').textContent=text;
    $('documentFrame').srcdoc=window.AutoZapDocument.renderDocument({text,preview:true}).replace('</style>','.toolbar{display:none}</style>');
  }
  async function assetData(path) {
    const response=await fetch(path);if(!response.ok)throw Error('Não foi possível carregar as imagens do documento.');
    const blob=await response.blob();return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('Não foi possível preparar as imagens.'));reader.readAsDataURL(blob);});
  }
  function download(content,type,name) { const url=URL.createObjectURL(new Blob([content],{type})), a=document.createElement('a'); a.href=url; a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(url),30000); }
  function render() {
    if(!order) return;
    $('interestName').value=order.name; $('interestEmail').value=order.email; $('unitQuantity').value=order.units;
    ['interestName','interestEmail','unitQuantity'].forEach(id=>$(id).disabled=true);
    document.querySelectorAll('[data-units]').forEach(b=>b.disabled=true); update();
    $('documentText').textContent=order.document; $('orderState').textContent=states[order.state] || order.state;
    $('documentText').hidden=false; $('documentFrame').hidden=true;
    $('orderReference').textContent=order.id; $('orderTracking').hidden=false;
    $('accessLink').value=location.origin+location.pathname+'#captacao/access='+token;
    $('registrationSubmit').textContent='Ver minha documentação'; $('documentUpload').disabled=!['DRAFT','DOCUMENT_REJECTED'].includes(order.state);
    $('documentSend').disabled=$('documentUpload').disabled; $('documentHelp').textContent=order.reason || 'Imprima, assine e envie uma foto legível de todas as informações em uma única imagem PNG ou JPEG, até 8 MB.';
    $('pixDetails').hidden=!order.pix; $('paymentWaiting').hidden=!!order.pix || order.state==='CONFIRMED';
    if(order.pix) { $('pixKey').value=order.pix.key; $('pixRecipient').textContent=order.pix.recipient; }
    $('receiptUpload').disabled=order.state!=='PAYMENT_PENDING'; $('receiptSend').disabled=order.state!=='PAYMENT_PENDING';
    $('paymentState').textContent=states[order.state]; $('memberAccess').hidden=order.state!=='CONFIRMED';
    $('memberLink').href='socios.html#access='+token;
    $('paymentProceed').hidden=!['PAYMENT_PENDING','PAYMENT_REPORTED','CONFIRMED'].includes(order.state);
    $('previewNote').hidden=true; $('documentTitle').textContent='Seu documento. Sua participação.';
  }
  function route() {
    const show=location.hash.startsWith('#captacao'); $('presentationView').hidden=show; $('fundraisingView').hidden=!show;
    document.querySelector('.capital-nav').setAttribute('aria-current',show?'page':'false');
    if(show) window.scrollTo({top:0,behavior:'instant'});
  }
  async function refresh() { order=await request('/v1/order'); render(); message(states[order.state]); }
  $('unitQuantity').addEventListener('change',update);
  $('unitQuantity').addEventListener('input',()=>{ if($('unitQuantity').value) update(); });
  $('quantityLess').onclick=()=>{$('unitQuantity').value--;update();}; $('quantityMore').onclick=()=>{$('unitQuantity').value++;update();};
  document.querySelectorAll('[data-units]').forEach(b=>b.onclick=()=>{$('unitQuantity').value=b.dataset.units;update();});
  document.querySelectorAll('[data-raise-step]').forEach(b=>b.onclick=()=>{const n=Number(b.dataset.raiseStep);if(n===1&&!order&&$('registrationForm').reportValidity())showDraft();step(n);});
  $('registrationForm').onsubmit=e=>{e.preventDefault();act(async()=>{
    if(order) {step(1);return;}
    if(!ready) { showDraft(); step(1); message('Documento preenchido neste navegador. Seus dados não foram enviados.'); return; }
    const result=await request('/v1/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:$('interestName').value,email:$('interestEmail').value,units:Number($('unitQuantity').value),consent:$('dataConsent').checked})});
    token=result.token; order=result.order; location.hash='captacao/access='+token; render();step(1);message('Cadastro salvo. Guarde seu link privado para acompanhar.');
  });};
  $('downloadText').onclick=()=>download(order?order.document:draftText(),'text/plain;charset=utf-8','autozap-documento.txt');
  $('printDocument').onclick=()=>act(async()=>{
    if(order) {
      const response=await fetch(api+'/v1/document',{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(30000)});
      if(!response.ok) throw Error('Não foi possível gerar a versão para impressão.');
      download(await response.text(),'text/html;charset=utf-8','autozap-documento-imprimir.html');
      message('Abra o arquivo baixado e clique em Imprimir / salvar em PDF.');
    } else {
      const [logo,signature]=await Promise.all([assetData('assets/autozap-logo-documento.png'),assetData('assets/assinatura-autozap.png')]);
      download(window.AutoZapDocument.renderDocument({text:draftText(),preview:true,logo,signature}),'text/html;charset=utf-8','autozap-documento-imprimir.html');
      message('Documento com logo e assinatura baixado. Abra o arquivo e clique em Imprimir ou salvar em PDF.');
    }
  });
  async function upload(kind) {
    const file=$(kind==='document'?'documentUpload':'receiptUpload').files[0];
    if(!file) throw Error('Selecione a foto antes de enviar.');
    if(!['image/png','image/jpeg'].includes(file.type) || file.size>8*1024*1024) throw Error('Envie uma foto PNG ou JPEG de até 8 MB.');
    order=await request('/v1/upload/'+kind,{method:'POST',headers:{'Content-Type':file.type},body:file});render();message(states[order.state]);
  }
  $('documentSend').onclick=()=>act(()=>upload('document')); $('receiptSend').onclick=()=>act(()=>upload('receipt'));
  $('refreshOrder').onclick=()=>act(refresh); $('paymentProceed').onclick=()=>step(2);
  $('copyPix').onclick=()=>act(async()=>{await navigator.clipboard.writeText($('pixKey').value);message('Chave Pix copiada. Confira o destinatário e o valor no aplicativo do banco.');});
  $('saveAccess').onclick=()=>download('AUTOZAP — LINK PRIVADO DE ACOMPANHAMENTO\nNão compartilhe este link: ele permite acessar seu cadastro e sua documentação.\n\n'+$('accessLink').value,'text/plain;charset=utf-8','autozap-meu-acesso.txt');
  window.addEventListener('hashchange',route);update();route();
  const match=location.hash.match(/^#captacao\/access=([A-Za-z0-9_-]{43})$/); if(match) token=match[1];
  act(async()=>{
    if(api) { const config=await request('/v1/config');ready=config.ready; $('dataInformation').textContent='Seus dados e documentos serão usados para analisar e acompanhar sua solicitação. Contato: '+config.privacyContact; }
    $('connectionStatus').textContent=ready?'Cadastro disponível':'Em preparação · prévia do fluxo';
    $('registrationSubmit').textContent=ready?'Criar cadastro e gerar documento':'Conferir prévia do documento';
    if(token) {await refresh();step(['PAYMENT_PENDING','PAYMENT_REPORTED','CONFIRMED'].includes(order.state)?2:1);}
  });
})();
