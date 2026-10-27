(() => {
  const match = location.hash.match(/^#access=([A-Za-z0-9_-]{43})$/);
  location.replace('https://socio.autozap.log.br/' + (match ? '#access=' + match[1] : ''));
})();
