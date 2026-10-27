(() => {
  const $=id=>document.getElementById(id), api=window.AUTOZAP_CAPTACAO_API;let key='',busy=false;
  const el=(tag,text,parent)=>{const n=document.createElement(tag);n.textContent=text;if(parent)parent.append(n);return n;};
  async function call(path,body) {
    if(!api)throw Error('Serviço ainda não configurado.');
    const response=await fetch(api+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+key,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(30000)});
    const result=await response.json();if(!response.ok)throw Error(result.error || 'Falha na operação.');return result;
  }
  async function task(fn) {if(busy)return;busy=true;try{await fn();}catch(e){$('adminStatus').textContent=e.message;}finally{busy=false;}}
  function button(parent,label,fn) {const b=el('button',label,parent);b.type='button';b.className='raise-secondary';b.onclick=()=>task(fn);return b;}
  async function file(id,kind) {
    const response=await fetch(api+'/v1/admin/orders/'+id+'/'+kind,{headers:{Authorization:'Bearer '+key},signal:AbortSignal.timeout(30000)});
    if(!response.ok)throw Error('Arquivo indisponível.');
    const blob=await response.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=kind+(blob.type==='image/png'?'.png':'.jpg');a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
  }
  async function load() {
    const orders=await call('/v1/admin/orders');$('adminOrders').replaceChildren();$('adminStatus').textContent=orders.length+' solicitações (até 500 mais recentes).';
    for(const order of orders) {
      const card=el('article','',$('adminOrders'));el('h2',order.name,card);el('p',order.email,card);
      el('p',`${order.units} cotas · ${(order.amount/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})} · ${order.state}`,card);el('small',order.id,card);
      const review=async(action,data={})=>{await call('/v1/admin/orders/'+order.id+'/'+action,data);await load();};
      if(!['DRAFT','CANCELLED'].includes(order.state))button(card,'Baixar documento enviado',()=>file(order.id,'document'));
      if(order.state==='DOCUMENT_SENT') {
        button(card,'Aprovar documento e disponibilizar Pix',()=>review('approve-document'));
        const label=el('label','Ajustes necessários',card),reason=el('input','',label);reason.maxLength=1000;
        button(card,'Solicitar correção',()=>review('reject-document',{reason:reason.value}));
      }
      if(['PAYMENT_PENDING','PAYMENT_REPORTED'].includes(order.state)) {
        if(order.state==='PAYMENT_REPORTED')button(card,'Baixar comprovante',()=>file(order.id,'receipt'));
        const field=(text)=>{const label=el('label',text,card);return el('input','',label);};
        const tx=field('Identificador do Pix confirmado no extrato bancário'),amount=field('Valor efetivamente recebido (R$)'),formal=field('Referência da formalização societária concluída');
        amount.type='number';amount.min='0';amount.step='0.01';tx.maxLength=100;formal.maxLength=1000;
        button(card,'Confirmar recebimento e liberar registro',()=>review('confirm-payment',{transactionId:tx.value.trim(),amount:Math.round(Number(amount.value)*100),formalization:formal.value.trim()}));
      }
      if(['DRAFT','DOCUMENT_REJECTED','DOCUMENT_SENT','PAYMENT_PENDING'].includes(order.state)) {
        const label=el('label','Motivo do cancelamento (confira antes se há pagamento recebido)',card),reason=el('input','',label);
        button(card,'Cancelar solicitação',()=>review('cancel',{reason:reason.value}));
      }
    }
  }
  $('adminLogin').onsubmit=e=>{e.preventDefault();key=$('adminKey').value;$('adminKey').value='';task(load);};
  $('adminLogout').onclick=()=>{key='';$('adminKey').value='';$('adminOrders').replaceChildren();$('adminStatus').textContent='Sessão encerrada neste navegador.';};
})();
