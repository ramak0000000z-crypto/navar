  if(window.__navarPendingItems){
    window.__navarPendingItems.forEach(function(x){
      if(x && x.i && typeof x.i === "object") items.push(computeItem(x.n, x.t, x.i));
    });
    delete window.__navarPendingItems;
    renderItems();
  }
  document.getElementById("import-file").addEventListener("change", function(){
    var f = this.files[0]; if(!f) return;
    var r = new FileReader();
    r.onload = function(){
      try{
        var data = JSON.parse(r.result);