// --- SĀKOTNĒJIE MAINĪGIE ---
// Mēģinām ielādēt grozu no atmiņas, ja tur nekas nav - sākam ar tukšu
let grozs = JSON.parse(localStorage.getItem('iepirkumu_grozs')) || [];
// Uzģenerējam fiksētu pasūtījuma ID šai pirkuma sesijai (no 1000 līdz 9999)
const fiksētaisPasutījumaNumurs = Math.floor(1000 + Math.random() * 9000);

// --- 1. AUTOMĀTISKA VISU LATVIJAS OMNIVA PAKOMĀTU IELĀDE UN MEKLĒŠANA ---
document.addEventListener("DOMContentLoaded", function() {
  const pakomatuSelekts = document.getElementById('klients-pakomats');
  const mekletajs = document.getElementById('pakomatu-mekletajs');
  let visiPakomati = []; // Šeit glabāsim pilno sarakstu filtrēšanai

  if (pakomatuSelekts) {
    // Oficiālais Omniva pakomātu datu avots
    fetch('https://www.omniva.lv/locations.json')
      .then(response => response.json())
      .then(data => {
        // Atlasām tikai Latvijas pakomātus (A0_NAME: "LV") un sakārtojam alfabētā
        visiPakomati = data.filter(item => item.A0_NAME === 'LV');
        visiPakomati.sort((a, b) => a.NAME.localeCompare(b.NAME));
        
        // Sākotnēji parādām pilno sarakstu
        atjaunotPakomatuSarakstu(visiPakomati);
      })
      .catch(error => {
        console.error('Kļūda ielādējot pakomātus:', error);
        pakomatuSelekts.innerHTML = '<option value="" disabled selected>Kļūda! Ierakstiet pakomātu WhatsApp</option>';
      });
  }

  // Funkcija, kas fiziski saliek opcijas izvēlnē
  function atjaunotPakomatuSarakstu(saraksts) {
    pakomatuSelekts.innerHTML = `<option value="" disabled selected>-- Izvēlies savu pakomātu (${saraksts.length} atrasti) --</option>`;
    
    if (saraksts.length === 0) {
      pakomatuSelekts.innerHTML = '<option value="" disabled selected>Nekas netika atrasts...</option>';
      return;
    }

   saraksts.forEach(pakomats => {
      const opcija = document.createElement('option');
      opcija.value = pakomats.NAME;
      opcija.textContent = pakomats.NAME;
      pakomatuSelekts.appendChild(opcija);
    });

    // Pēc tam, kad saraksts ielādēts, mēģinām ielikt saglabāto pakomātu
    const saglabatsPakomats = localStorage.getItem('pakomats');
    if (saglabatsPakomats) {
      pakomatuSelekts.value = saglabatsPakomats;
    }
  }

  // MEKLĒŠANAS LOĢIKA: Tiklīdz lietotājs raksta laukā, saraksts uzreiz mainās
  if (mekletajs) {
    mekletajs.addEventListener('input', function() {
      const meklesanasTeksts = mekletajs.value.toLowerCase().trim();
      
      // Nofletrējam pakomātus pēc ievadītā teksta
      const filtretie = visiPakomati.filter(pakomats => 
        pakomats.NAME.toLowerCase().includes(meklesanasTeksts)
      );
      
      // Atjaunojam nolaižamo sarakstu ar nofiltrētajiem rezultātiem
      atjaunotPakomatuSarakstu(filtretie);
    });
  }

  // --- KLIENTA DATU IELĀDE (LOCAL STORAGE) ---
  if(localStorage.getItem('vards')) document.getElementById('klients-vards').value = localStorage.getItem('vards');
  if(localStorage.getItem('telefons')) document.getElementById('klients-telefons').value = localStorage.getItem('telefons');

  // IELĀDĒJOT LAPU: uzreiz uzzīmējam saglabāto grozu, ja tāds ir
  atjaunotGrozu();
});

// --- DATU SAGLABĀŠANAS KLAUSĪTĀJI ---
document.getElementById('klients-vards')?.addEventListener('input', (e) => localStorage.setItem('vards', e.target.value));
document.getElementById('klients-telefons')?.addEventListener('input', (e) => localStorage.setItem('telefons', e.target.value));
document.getElementById('klients-pakomats')?.addEventListener('change', (e) => localStorage.setItem('pakomats', e.target.value));


// --- 2. GROZA LOĢIKA UN FUNKCIJAS ---

// Maina skaitli tieši uz preces kartītes (+ vai -)
function mainitKartesDaudzumu(nosaukums, izmaina) {
  const skaitaElements = document.getElementById(`skaits-${nosaukums}`);
  if (skaitaElements) {
    let pasreizejaisDaudzums = parseInt(skaitaElements.innerText);
    pasreizejaisDaudzums += izmaina;
    if (pasreizejaisDaudzums < 1) pasreizejaisDaudzums = 1;
    skaitaElements.innerText = pasreizejaisDaudzums;
  }
}

// Paņem uzstādīto daudzumu no kartītes, paņem bildes adresi un pievieno grozam
function pievienotNoKartes(nosaukums, cena, bilde) {
  const skaitaElements = document.getElementById(`skaits-${nosaukums}`);
  let daudzumsKoPievienot = 1;
  
  if (skaitaElements) {
    daudzumsKoPievienot = parseInt(skaitaElements.innerText);
  }

  // Nosaukumu pārtulkošana un standartizēšana starp ID un tekstiem
  if (nosaukums === 'Reeses') {
    nosaukums = "Reese's Peanut Butter Cups";
  } else if (nosaukums === 'Hersheys Cookies N Creme') {
    nosaukums = "Hershey's Cookies 'N' Creme (43g)";
  } else if (nosaukums === 'Herrs Carolina Reaper') {
    nosaukums = "Herr's Carolina Reaper Curls (113g)";
  }

  const esosaPrece = grozs.find(item => item.nosaukums === nosaukums);
  
  if (esosaPrece) {
    esosaPrece.daudzums += daudzumsKoPievienot;
    // Ja bilde vēl nav piesaistīta (piemēram, no veca localStorage), atjaunojam to
    if (bilde) esosaPrece.bilde = bilde;
  } else {
    grozs.push({ 
      nosaukums: nosaukums, 
      cena: cena, 
      daudzums: daudzumsKoPievienot,
      bilde: bilde || 'logo.png' // Ja bildes nav, izmanto rezerves logo
    });
  }
  
  if (skaitaElements) {
    skaitaElements.innerText = 1;
  }
  
  atjaunotGrozu();
}

// Rezerves funkcija gadījumam, ja kāda poga izmanto veco nosaukumu
function pievienotGrozam(nosaukums, cena) {
  pievienotNoKartes(nosaukums, cena);
}

// Daudzuma samazināšana grozā vai preces pilnīga izņemšana
function iznemtNoGroza(nosaukums) {
  if (nosaukums === 'Reeses') {
    nosaukums = "Reese's Peanut Butter Cups";
  } else if (nosaukums === 'Hersheys Cookies N Creme') {
    nosaukums = "Hershey's Cookies 'N' Creme (43g)";
  } else if (nosaukums === 'Herrs Carolina Reaper') {
    nosaukums = "Herr's Carolina Reaper Curls (113g)";
  }

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

// Groza daudzuma kontrole tieši no groza iekšienes (+ un - pogām, ja tādas tiek izmantotas)
function mainitGrozaDaudzumu(nosaukums, izmaina) {
  const esosaPrece = grozs.find(item => item.nosaukums === nosaukums);
  if (esosaPrece) {
    esosaPrece.daudzums += izmaina;
    if (esosaPrece.daudzums < 1) {
      grozs = grozs.filter(item => item.nosaukums !== nosaukums);
    }
  }
  atjaunotGrozu();
}

// Pilnīga groza iztīrīšanas funkcija
function iztiritVisuGrozu() {
  if (grozs.length === 0) {
    alert("Grozs jau ir tukšs!");
    return;
  }
  
  if (confirm("Vai tiešām vēlies pilnībā iztīrīt iepirkumu grozu?")) {
    grozs = []; // Iztīrām masīvu
    localStorage.removeItem('iepirkumu_grozs'); // Izdzēšam no pārlūka atmiņas
    atjaunotGrozu(); // Atjaunojam lapas izskatu
  }
}

// Vizuālā groza pārzīmēšana, summu rēķināšana un efektu aktivizēšana
function atjaunotGrozu() {
  const sarakstsElement = document.getElementById("groza-saraksts");
  const kopaElement = document.getElementById("groza-kopa");
  const piegadesPazinojums = document.getElementById("piegades-pazinojums");
  
  if (!sarakstsElement || !kopaElement) return;

  sarakstsElement.innerHTML = "";
  let kopa = 0;
  let kopejaisPrecuSkaits = 0;
  
  grozs.forEach((prece) => {
    const rindasCena = prece.cena * prece.daudzums;
    const li = document.createElement("li");
    li.className = "groza-prece-rindina"; // Klase smukajiem CSS stiliem
    
    const drošsNosaukums = prece.nosaukums.replace(/'/g, "\\'");
    
    // Modernizēts HTML saturs ar bildi kreisajā pusē un vadības pogām
    li.innerHTML = `
      <div class="groza-preces-info">
        <img src="${prece.bilde || 'logo.png'}" class="groza-mini-bilde" alt="${prece.nosaukums}">
        <span class="groza-preces-teksts">
          <strong>${prece.nosaukums}</strong> <br> 
          ${prece.daudzums} x ${prece.cena.toFixed(2)} €
        </span>
      </div>
      <div class="groza-kontrole" style="display: flex; gap: 5px; align-items: center;">
        <button onclick="iznemtNoGroza('${drošsNosaukums}')" style="background-color: #ffccd5; border: none; color: #ff477e; font-weight: bold; cursor: pointer; padding: 4px 8px; border-radius: 5px;">-</button>
        <button onclick="pievienotNoKartes('${drošsNosaukums}', ${prece.cena})" style="background-color: #e8f5e9; border: none; color: #2a9d8f; font-weight: bold; cursor: pointer; padding: 4px 8px; border-radius: 5px;">+</button>
      </div>
    `;
    sarakstsElement.appendChild(li);
    kopa += rindasCena;
    kopejaisPrecuSkaits += prece.daudzums;
  });
  
  if (grozs.length === 0) {
    sarakstsElement.innerHTML = '<li class="tukss" style="text-align: center; padding: 15px; color: #888;">Grozs ir tukšs</li>';
  }
  
  kopaElement.innerText = kopa.toFixed(2);

  // Saglabājam aktuālo groza saturu pārlūka atmiņā (LocalStorage)
  localStorage.setItem('iepirkumu_grozs', JSON.stringify(grozs));

  // Peldošais grozs un tā pulsācijas animācijas izsaukšana
  const peldosaisGrozs = document.getElementById("peldosais-grozs");
  const peldosaisSkaits = document.getElementById("peldosais-skaits");
  
  if (peldosaisGrozs && peldosaisSkaits) {
    peldosaisSkaits.innerText = kopejaisPrecuSkaits;
    if (kopejaisPrecuSkaits > 0) {
      peldosaisGrozs.classList.add("aktivs");
      
      // Restartējam pulsēšanas animāciju
      peldosaisGrozs.classList.remove('pulset');
      void peldosaisGrozs.offsetWidth; // Pārlūka piespiešana pārlādēt elementa stāvokli
      peldosaisGrozs.classList.add('pulset');
    } else {
      peldosaisGrozs.classList.remove("aktivs");
    }
  }

  // Bezmaksas piegādes aprēķins
  const limitsBezmaksasPiegadei = 30.00;
  if (piegadesPazinojums) {
    if (kopa === 0) {
      piegadesPazinojums.style.display = "none";
    } else if (kopa < limitsBezmaksasPiegadei) {
      let cikTruks = limitsBezmaksasPiegadei - kopa;
      piegadesPazinojums.style.display = "block";
      piegadesPazinojums.style.color = "#ff477e";
      piegadesPazinojums.style.backgroundColor = "#ffeef2";
      piegadesPazinojums.style.border = "1px solid #ffccd5";
      piegadesPazinojums.innerText = `🛒 Pērc vēl par ${cikTruks.toFixed(2)} €, lai saņemtu BEZMAKSAS piegādi!`;
    } else {
      piegadesPazinojums.style.display = "block";
      piegadesPazinojums.style.color = "#2a9d8f";
      piegadesPazinojums.style.backgroundColor = "#e8f5e9";
      piegadesPazinojums.style.border = "1px solid #c8e6c9";
      piegadesPazinojums.innerText = "🎉 Apsveicam! Tu esi ieguvis BEZMAKSAS piegādi!";
    }
  }

  // PASŪTĪJUMA NUMURA PARĀDĪŠANA MĀJASLAPĀ
  const lapasNrElements = document.getElementById("lapas-pasutijuma-nr");
  if (lapasNrElements) {
    if (grozs.length > 0) {
      lapasNrElements.style.display = "block";
      lapasNrElements.innerText = `📋 Tava pasūtījuma ID: #${fiksētaisPasutījumaNumurs}`;
    } else {
      lapasNrElements.style.display = "none";
    }
  }
}

function ritinatUzGrozu() {
  const mērķis = document.getElementById("groza-sekcija-mērķis");
  if (mērķis) {
    mērķis.scrollIntoView({ behavior: "smooth" });
  }
}

// --- 3. PASŪTĪŠANA UZ WHATSAPP ---
function sutitUzWhatsApp() {
  if (grozs.length === 0) {
    alert("Tavs grozs ir tukšs! Vispirms pievieno kādu saldumu.");
    return;
  }
  
  const vards = document.getElementById('klients-vards').value.trim();
  const telefons = document.getElementById('klients-telefons').value.trim();
  const pakomats = document.getElementById('klients-pakomats').value; 

  if (!vards || !telefons || !pakomats) {
    alert("Lūdzu, aizpildi visus piegādes datus un izvēlies Omniva pakomātu no saraksta pirms pasūtīšanas!");
    return;
  }
  
  let teksts = `*Jauns pasūtījums #${fiksētaisPasutījumaNumurs}*\n\n`;
  teksts += "*Pircēja dati:*\n";
  teksts += `- Vārds: ${vards}\n`;
  teksts += `- Telefons: ${telefons}\n`;
  teksts += `- Omniva pakomāts: ${pakomats}\n\n`;
  
  teksts += "*Pasūtītās preces:*\n";
  let kopa = 0;
  
  grozs.forEach((prece) => {
    const rindasCena = prece.cena * prece.daudzums;
    teksts += `- ${prece.nosaukums} x${prece.daudzums} (${rindasCena.toFixed(2)} €)\n`;
    kopa += rindasCena;
  });
  
  const limitsBezmaksasPiegadei = 30.00;
  if (kopa >= limitsBezmaksasPiegadei) {
    teksts += `\nPiegāde: *BEZMAKSAS (Sasniegts limits virs ${limitsBezmaksasPiegadei.toFixed(2)} €)*\n`;
  } else {
    teksts += `\nPiegāde: *Pēc Omniva cenrāža (Līdz bezmaksas piegādei trūka ${(limitsBezmaksasPiegadei - kopa).toFixed(2)} €)*\n`;
  }
  
  teksts += `*Kopā apmaksai: ${kopa.toFixed(2)} €*\n\n`;
  
  teksts += `⚠️ *SVARĪGI VEICOT MAKSĀJUMU:*\n`;
  teksts += `Revolut piezīmēs (Note) OBLIGĀTI ieraksti šo numuru: *#${fiksētaisPasutījumaNumurs}*\n\n`;
  teksts += `💳 *Saite apmaksai:* \nhttps://revolut.me/igorsyeqd`;
  
  let kodetsTeksts = encodeURIComponent(teksts);
  let mansNumurs = "37124332563"; 
  
  window.open(`https://wa.me/${mansNumurs}?text=${kodetsTeksts}`, '_blank');
}
