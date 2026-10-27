(()=>{'use strict';
const $=id=>document.getElementById(id), money=n=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0});
const quantity=$('unitQuantity');
function update(){let n=Math.min(1000,Math.max(1,Math.round(Number(quantity.value)||1)));quantity.value=String(n);const percent=(n/100).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+'%';$('selectedTotal').textContent=money(n*1000);$('selectedPercent').textContent=percent;$('paymentTotal').textContent=money(n*1000);$('paymentFraction').textContent=n+' '+(n===1?'participação':'participações')+' · '+percent+' proposto';$('quantityLess').disabled=n===1;$('quantityMore').disabled=n===1000;}
quantity.addEventListener('change',update);quantity.addEventListener('input',()=>{if(quantity.value)update()});$('quantityLess').addEventListener('click',()=>{quantity.value=Number(quantity.value)-1;update()});$('quantityMore').addEventListener('click',()=>{quantity.value=Number(quantity.value)+1;update()});document.querySelectorAll('[data-units]').forEach(b=>b.addEventListener('click',()=>{quantity.value=b.dataset.units;update()}));
function step(n){document.querySelectorAll('[data-raise-panel]').forEach(p=>p.hidden=Number(p.dataset.raisePanel)!==n);document.querySelectorAll('[data-raise-step]').forEach(b=>{if(Number(b.dataset.raiseStep)===n)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current')});$('raiseAnnouncement').textContent=['Cadastro local: dados não enviados.','Documentação pendente.','Pagamento indisponível: integração pendente.'][n];}
document.querySelectorAll('[data-raise-step]').forEach(b=>b.addEventListener('click',()=>step(Number(b.dataset.raiseStep))));document.querySelectorAll('[data-next-raise]').forEach(b=>b.addEventListener('click',()=>step(Number(b.dataset.nextRaise))));
function route(){const show=location.hash==='#captacao';$('presentationView').hidden=show;$('fundraisingView').hidden=!show;document.querySelector('.capital-nav').setAttribute('aria-current',show?'page':'false');if(show)window.scrollTo({top:0,behavior:'instant'});}
window.addEventListener('hashchange',route);update();route();
// Future provider boundary: no endpoint, credentials, payment or ownership issuance.
// Connect only after a platform and its server-side integration contract are supplied.
})();
