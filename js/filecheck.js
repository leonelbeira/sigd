// Aviso quando a página é aberta directamente do disco (file://), onde a câmara e os modelos não funcionam.
if (location.protocol === 'file:') document.getElementById('fileWarn').hidden = false;
