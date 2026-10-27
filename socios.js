(() => {
  const $=id=>document.getElementById(id), match=location.hash.match(/^#access=([A-Za-z0-9_-]{43})$/), api=window.AUTOZAP_CAPTACAO_API;
  if(!api) { $('memberStatus').textContent='A área de sócios está em preparação. Os registros serão liberados após a conferência do documento, do pagamento e da formalização.';return; }
  if(!match)return;
  $('returnOrder').href='index.html#captacao/access='+match[1]; $('memberStatus').textContent='Consultando seu registro…';
  fetch(api+'/v1/membership',{headers:{Authorization:'Bearer '+match[1]},signal:AbortSignal.timeout(30000)}).then(async response=>{const result=await response.json();if(!response.ok)throw Error(result.error || 'Registro indisponível.');return result;}).then(data=>{
    $('memberName').textContent=data.name; $('memberUnits').textContent=data.units;
    $('memberPercent').textContent=data.percent.toLocaleString('pt-BR',{minimumFractionDigits:2})+'%';
    $('memberDate').textContent=new Date(data.confirmed).toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'});
    $('memberId').textContent='Registro: '+data.id; $('memberFormalization').textContent='Formalização: '+data.formalization;
    $('memberRecord').hidden=false; $('memberStatus').textContent='Participação confirmada';
  }).catch(error=>{$('memberStatus').textContent=error.message;});
})();
