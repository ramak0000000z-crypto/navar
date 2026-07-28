  var sortState = {key:null, dir:-1};
  function bindRowActions(){
    document.querySelectorAll("#cmp-body .del[data-ix]").forEach(function(b){
      b.addEventListener("click", function(){
        var ix = parseInt(b.dataset.ix,10);
        var sure = true;
        try { if(typeof window.confirm === "function"){ var r = window.confirm("Удалить «" + items[ix].name + "»?"); if(r === false) sure = false; } } catch(e){}
        if(!sure) return;
        items.splice(ix,1); renderItems();
      });
    });
    document.querySelectorAll("#cmp-body .del[data-edit]").forEach(function(b){
      b.addEventListener("click", function(){
        var it = items[parseInt(b.dataset.edit,10)]; if(!it) return;
        Object.keys(it.inputs).forEach(function(id){ var el=document.getElementById(id); if(el) el.value = it.inputs[id]; });
        var tb = document.querySelector('#tax-seg button[data-tax="'+it.tax+'"]');
        if(tb){ document.querySelectorAll("#tax-seg button").forEach(function(x){x.classList.remove("on")}); tb.classList.add("on"); tax = it.tax; }
        document.getElementById("itemname").value = it.name;
        recompute();
        window.scrollTo(0,0);
      });
    });
  }
  document.querySelectorAll("#cmp-table th[data-key]").forEach(function(th){
    th.style.cursor = "pointer";
    th.addEventListener("click", function(){
      var k = th.dataset.key;
      if(sortState.key === k) sortState.dir *= -1; else { sortState.key = k; sortState.dir = -1; }
      renderItems();
    });
  });

  function escapeHtml(s){ var d=document.createElement("div"); d.textContent=s; return d.innerHTML; }
