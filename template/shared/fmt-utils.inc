  function pct0(n){ return (n>=0?"":"−") + Math.abs(n).toFixed(0) + "%"; }

  document.querySelectorAll("#tax-seg button").forEach(function(b){
    b.addEventListener("click", function(){
      document.querySelectorAll("#tax-seg button").forEach(function(x){x.classList.remove("on")});
      b.classList.add("on"); tax = b.dataset.tax; recompute();
    });
  });
  document.querySelectorAll("input.fin").forEach(function(el){
    el.addEventListener("input", recompute);
    el.addEventListener("focus", function(){ var b=document.querySelector(".stickybar"); if(b) b.style.display="none"; });
    el.addEventListener("blur", function(){ var b=document.querySelector(".stickybar"); if(b) b.style.display=""; });
  });
  document.querySelectorAll("input.fin[data-money]").forEach(function(el){
    el.addEventListener("blur", function(){ var v = val(this.id); if(v) this.value = fmt(v); });
    el.addEventListener("focus", function(){ this.value = String(this.value).replace(/[\s\u00A0]/g,""); });
  });
