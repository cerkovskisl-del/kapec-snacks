// --- 1. AUTOMĀTISKA VISU LATVIJAS OMNIVA PAKOMĀTU IELĀDE ---
document.addEventListener("DOMContentLoaded", function() {
  const pakomatuSelekts = document.getElementById('klients-pakomats');
  
  if (pakomatuSelekts) {
    // Oficiālais Omniva pakomātu datu avots
    fetch('https://www.omniva.lv/locations.json')
      .then(response => response.json())
      .then(data => {
        // Atlasām tikai Latvijas pakomātus (A0_NAME: "LV")
        const lvPakomati = data.filter(item => item.A0_NAME === 'LV');
        
        // Sakārtojam pakomātus pēc nosaukuma alfabēta secībā
        lvPakomati.sort((a, b) => a.NAME.localeCompare(b.NAME));
        
        // Attīrām "Lādē pakomātus..." ziņojumu un ieliekam pirmo izvēli
        pakomatuSelekts.innerHTML = '<option value="" disabled selected>-- Izvēlies savu pakomātu --</option>';
        
        // Pa vienam pievienojam visus 360+ pakomātus sarakstā
        lvPakomati.forEach(pakomats => {
          const opcija = document.createElement('option');
          opcija.value = pakomats.NAME;
          opcija.textContent = pakomats.NAME;
          pakomatuSelekts.appendChild(opcija);
        });
      })
      .catch(error => {
        console.error('Kļūda ielādējot pakomātus:', error);
        pakomatuSelekts.innerHTML = '<option value="" disabled selected>Kļūda! Ierakstiet pakomātu WhatsApp</option>';
      });
  }
});

// --- 2. GROZA LOĢIKA UN FUNKCIJAS ---
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

// --- 3. PASŪTĪŠANA UZ WHATSAPP ---
function sutitUzWhatsApp() {
  if (grozs.length === 0) {
    alert("Tavs grozs ir tukšs! Vispirms pievieno kādu saldumu.");
    return;
  }
  
  // Nolasām pircēja datus
  const vards = document.getElementById('klients-vards').value.trim();
  const telefons = document.getElementById('klients-telefons').value.trim();
  const pakomats = document.getElementById('klients-pakomats').value; // Nolasām izvēlēto opciju

  // Pārbaudām, vai klients nav aizmirsis izvēlēties pakomātu vai ierakstīt datus
  if (!vards || !telefons || !pakomats) {
    alert("Lūdzu, aizpildi visus piegādes datus un izvēlies Omniva pakomātu no saraksta pirms pasūtīšanas!");
    return;
  }
  
  // Izveidojam ziņas tekstu
  let teksts = "Sveiki! Es vēlos veikt pasūtījumu.\n\n";
  teksts += "*👤 Pircēja dati:*\n";
  teksts += `• Vārds: ${vards}\n`;
  teksts += `• Telefons: ${telefons}\n`;
  teksts += `• Omniva pakomāts: ${pakomats}\n\n`;
  
  teksts += "*📦 Pasūtītās preces:*\n";
  let kopa = 0;
  
  grozs.forEach((prece) => {
    const rindasCena = prece.cena * prece.daudzums;
    teksts += `- ${prece.nosaukums} x${prece.daudzums} (${rindasCena.toFixed(2)} €)\n`;
    kopa += rindasCena;
  });
  
  teksts += `\n*Kopā apmaksai: ${kopa.toFixed(2)} €*`;
  
  // Nosūtām uz tavu numuru
  let kodetsTeksts = encodeURIComponent(teksts);
  let mansNumurs = "37124332563"; 
  
  window.open(`https://wa.me/${mansNumurs}?text=${kodetsTeksts}`, '_blank');
}
