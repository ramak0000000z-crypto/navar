          data.items.forEach(function(it){
            if(it && typeof it === "object" && it.inputs && typeof it.inputs === "object"){
              items.push(computeItem(it.name, it.tax, it.inputs));
            }
          });
          renderItems();