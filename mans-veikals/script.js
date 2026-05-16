let grozs = [];

function pievienotGrozam(nosaukums, cena) {
  // PĀRTULKOJAM NOSAUKUMUS: Ja funkcija saņem saīsināto nosaukumu, pārvēršam to glītā versijā priekš groza un WhatsApp
  if (nosaukums === 'Reeses') {
    nosaukums = "Reese's Peanut Butter Cups";
  } else if (nosaukums === 'Hersheys Cookies N Creme') {
    nosaukums = "Hershey's Cookies 'N' Creme (43g)";
  }

  const esosaPrece = grozs.find(item => item.nosaukums === nosaukums);
  
  if (esosaPrece) {
    esosaPrece.daudzums += 1;
  } else {
    grozs.push({ nosaukums: nosaukums, cena: cena, daudzums: 1 });
  }
  
  atjaunotGrozu();
}

function iznemtNoGroza(nosaukums) {
  const esosaPrece = grozs.find(item => item.nosaukums === nosaukums);
  
  if (esosaPrece) {
    if (esosaPrece.daudzums > 1) {
      esosaPrece.daudzums -= 1;
    } else {
      grozs = grozs.filter(item => item.nosaukums !== nosaukums);
    }
  }
  atjaunotGrozu();
}

function atjaunotGrozu() {
  const sarakstsElement = document.getElementById("groza-saraksts");
  const kopaElement = document.getElementById("groza-kopa");
  
  sarakstsElement.innerHTML = "";
  let kopa = 0;
  
  grozs.forEach((prece) => {
    const rindasCena = prece.cena * prece.daudzums;
    const li = document.createElement("li");
    
    // Šeit mēs izmantojam īpašu JavaScript triku (escape), lai pogas iekšienē apostrofi atkal nesalauztu kodu
    const drošsNosaukums = prece.nosaukums.replace(/'/g, "\\'");
    
    li.innerHTML = `
      <span>${prece.nosaukums} <strong>(x${prece.daudzums})</strong> - ${rindasCena.toFixed(2)} €</span>
      <button onclick="iznemtNoGroza('${drošsNosaukums}')" style="background: none; border: none; color: red; font-weight: bold; cursor: pointer; padding: 0 5px;">❌</button>
    `;
    sarakstsElement.appendChild(li);
    kopa += rindasCena;
  });
  
  if (grozs.length === 0) {
    sarakstsElement.innerHTML = '<li class="tukss">Grozs ir tukšs</li>';
  }
  
  kopaElement.innerText = kopa.toFixed(2);
}

function sutitUzWhatsApp() {
  if (grozs.length === 0) {
    alert("Tavs grozs ir tukšs! Vispirms pievieno kādu saldumu.");
    return;
  }
  
  let teksts = "Labdien! Es vēlos veikt pasūtījumu:\n\n";
  let kopa = 0;
  
  grozs.forEach((prece) => {
    const rindasCena = prece.cena * prece.daudzums;
    teksts += `- ${prece.nosaukums} x${prece.daudzums} (${rindasCena.toFixed(2)} €)\n`;
    kopa += rindasCena;
  });
  
  teksts += `\n*Kopā apmaksai: ${kopa.toFixed(2)} €*`;
  
  let kodetsTeksts = encodeURIComponent(teksts);
  let mansNumurs = "37124332563"; 
  
  window.open(`https://wa.me/${mansNumurs}?text=${kodetsTeksts}`, '_blank');
}