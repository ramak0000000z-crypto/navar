  var hashTimer = null;
  function writeHash(){
    try{
      var st = {v:1, t:tax, i:{}};
      HASH_IDS.forEach(function(id){ st.i[id] = val(id); });
      if(typeof items !== "undefined" && items.length) st.s = items.map(function(it){ return {n:it.name, t:it.tax, i:it.inputs}; });
      var h = LZString.compressToEncodedURIComponent(JSON.stringify(st));
      try { history.replaceState(null, "", "#" + h); }
      catch(e2) { location.hash = h; }  // file:// в Safari/jsdom не даёт replaceState
      if(location.hash.replace(/^#/,"") !== h) location.hash = h;
    }catch(e){}
  }
  function scheduleHash(){ clearTimeout(hashTimer); hashTimer = setTimeout(writeHash, 800); }
  function restoreHash(){
    try{
      var h = location.hash.replace(/^#/, "");
      if(!h) return;
      var st = JSON.parse(LZString.decompressFromEncodedURIComponent(h));
      if(!st || st.v !== 1 || !st.i) return;
      HASH_IDS.forEach(function(id){
        if(st.i[id] !== undefined) document.getElementById(id).value = st.i[id];
      });
      if(st.s && Array.isArray(st.s)) window.__navarPendingItems = st.s;
      if(st.t){
        var b = document.querySelector('#tax-seg button[data-tax="' + st.t + '"]');
        if(b){
          document.querySelectorAll("#tax-seg button").forEach(function(x){x.classList.remove("on")});
          b.classList.add("on"); tax = st.t;
        }
      }
    }catch(e){}
  }

  function exportCard(title, subtitle, rows){
    var cv = document.createElement("canvas"); cv.width = 1000; cv.height = 600;
    var ctx = cv.getContext && cv.getContext("2d");
    if(!ctx){ alert("Браузер не поддерживает экспорт картинки"); return; }
    function clip(t){ t = String(t); return t.length > 24 ? t.slice(0,23) + "…" : t; }
    ctx.fillStyle = "#101418"; ctx.fillRect(0,0,1000,600);
    ctx.fillStyle = "#2FD574"; ctx.font = "700 34px -apple-system,Segoe UI,Roboto,sans-serif";
    ctx.fillText(title, 48, 66);
    ctx.fillStyle = "#8D99A6"; ctx.font = "600 24px -apple-system,Segoe UI,Roboto,sans-serif";
    ctx.fillText(clip(subtitle), 48, 104);
    var p = document.getElementById("profit").textContent;
    ctx.fillStyle = (p.indexOf("−") === 0) ? "#FF5D62" : "#2FD574";
    ctx.font = "800 92px -apple-system,Segoe UI,Roboto,sans-serif";
    ctx.fillText(clip(p + " ₽"), 48, 210);
    ctx.font = "600 26px -apple-system,Segoe UI,Roboto,sans-serif";
    var y = 286;
    rows.forEach(function(r){
      var el = document.getElementById(r[1]); if(!el) return;
      ctx.fillStyle = "#8D99A6"; ctx.fillText(r[0], 48, y);
      ctx.fillStyle = "#F2F5F7"; ctx.fillText(clip(el.textContent), 520, y);
      y += 52;
    });
    ctx.fillStyle = "#5D6873"; ctx.font = "500 20px -apple-system,Segoe UI,Roboto,sans-serif";
    ctx.fillText("Посчитано в «Навар» v4.3 — честная юнит-экономика", 48, 560);
    function save(url){ var a = document.createElement("a"); a.href = url; a.download = "navar-card.png"; a.click(); }
    try {
      if(cv.toBlob) cv.toBlob(function(b){ if(b){ var u = URL.createObjectURL(b); save(u); setTimeout(function(){URL.revokeObjectURL(u);},2000); } else save(cv.toDataURL("image/png")); }, "image/png");
      else save(cv.toDataURL("image/png"));
    } catch(e){ alert("Не удалось сохранить картинку"); }
  }

  function shareLink(){
    writeHash();
    var url = location.href;
    if(url.length > 3500 && !window.__longWarned){ window.__longWarned = 1; alert("Ссылка получилась длинной — в мессенджере может обрезаться. Для большого набора надёжнее «Экспорт в файл»."); }
    var done = function(){ var b=document.getElementById("share-link"); if(b){ var t=b.textContent; b.textContent="Скопировано ✓"; setTimeout(function(){b.textContent=t;},1500);} };
    if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, function(){ prompt("Скопируй ссылку на расчёт:", url); });
    else prompt("Скопируй ссылку на расчёт:", url);
  }

  restoreHash();
  document.querySelectorAll("input.fin[data-money]").forEach(function(el){ var v = val(el.id); if(v) el.value = fmt(v); });
  recompute();
