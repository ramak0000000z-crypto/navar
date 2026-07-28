
  function computeItem(name, taxMode, inp){
    var i = {};
    INPUT_IDS.forEach(function(id){ var v = parseFloat(inp && inp[id]); i[id] = isNaN(v) ? 0 : v; });
    var s = {
      name: String(name || "Без названия").slice(0,40),