    var bar = document.getElementById("wf-bar"), legend = document.getElementById("wf-legend");
    bar.innerHTML = ""; legend.innerHTML = "";
    parts.forEach(function(p){
      if(p.v <= 0) return;
      var seg = document.createElement("div");
      seg.className = "wf-seg";
      seg.style.width = (p.v/denom*100)+"%";