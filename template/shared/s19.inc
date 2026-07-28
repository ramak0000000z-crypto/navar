  document.getElementById("import-items").addEventListener("click", function(){
    document.getElementById("import-file").click();
  });
  document.getElementById("share-link").addEventListener("click", shareLink);
  document.getElementById("adv-toggle").addEventListener("click", function(){
    document.body.classList.toggle("expert");
    this.textContent = document.body.classList.contains("expert") ? "Свернуть точную настройку ▴" : "Точная настройка: комиссия, продвижение, налоги ▾";
  });