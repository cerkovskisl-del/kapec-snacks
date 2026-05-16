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
});

// --- 2. GROZA LOĢIKA UN FUNKCIJAS ---
let grozs = [];

// Jaunā funkcija: Maina skaitli tieši uz preces kartītes (+ vai -)
function mainitKartesDaudzumu(nosaukums, izmaina) {
  const skaitaElements = document.getElementById(`skaits-${nosaukums}`);
  if (skaitaElements) {
    let pasreizejaisDaudzums = parseInt(skaitaElements.innerText);
    pasreizejaisDaudzums += izmaina;
    if (pasreizejaisDaudzums < 1) pasreizejaisDaudzums = 1; // Neļaujam nokrist zem 1
    skaitaElements.innerText = pasreizejaisDaudzums;
  }
}

// Jaunā funkcija: Paņem uzstādīto daudzumu no kartītes un pievieno grozam
function pievienotNoKartes(nosaukums, cena) {
  const skaitaElements = document.getElementById(`skaits-${nosaukums}`);
  let daudzumsKoPievienot = 1;
  
  if (skaitaElements) {
    daudzumsKoPievienot = parseInt(skaitaElements.innerText);
  }

  // Nosaukumu pārtulkošana (lai sakristu ar HTML un skaistajām versijām)
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
  } else {
    grozs.push({ nosaukums: nosaukums, cena: cena, daudzums: daudzumsKoPievienot });
  }
  
  // Atiestatām kartītes skaitītāju atpakaļ uz 1 pēc pievienošanas
  if (skaitaElements) {
    skaitaElements.innerText = 1;
  }
  
  atjaunotGrozu();
}

// Saglabājam oriģinālo funkciju gadījumam, ja kāda cita koda daļa to izsauc
function pievienotGrozam(nosaukums, cena) {
  pievienotNoKartes(nosaukums, cena);
}

function iznemtNoGroza(nosaukums) {
  // Pārtulkojam nosaukumus arī dzēšanas brīdī, ja nepieciešams
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

function atjaunotGrozu() {
  const sarakstsElement = document.getElementById("groza-saraksts");
  const kopaElement = document.getElementById("groza-kopa");
  const piegadesPazinojums = document.getElementById("piegades-pazinojums");
  
  sarakstsElement.innerHTML = "";
  let kopa = 0;
  let kopejaisPrecuSkaits = 0; // Priekš peldošā groza riņķīša
  
  grozs.forEach((prece) => {
    const rindasCena = prece.cena * prece.daudzums;
    const li = document.createElement("li");
    
    // Lai pogas iekšienē apostrofi nesalauztu kodu, izmantojam drošo aizvietošanu
    const drošsNosaukums = prece.nosaukums.replace(/'/g, "\\'");
    
    li.innerHTML = `
      <span>${prece.nosaukums} <strong>(x${prece.daudzums})</strong> - ${rindasCena.toFixed(2)} €</span>
      <button onclick="iznemtNoGroza('${drošsNosaukums}')" style="background: none; border: none; color: red; font-weight: bold; cursor: pointer; padding: 0 5px;">❌</button>
    `;
    sarakstsElement.appendChild(li);
    kopa += rindasCena;
    kopejaisPrecuSkaits += prece.daudzums;
  });
  
  if (grozs.length === 0) {
    sarakstsElement.innerHTML = '<li class="tukss">Grozs ir tukšs</li>';
  }
  
  kopaElement.innerText = kopa.toFixed(2);

  // --- PELDOŠĀ GROZA ATJAUNOŠANA ---
  const peldosaisGrozs = document.getElementById("peldosais-grozs");
  const peldosaisSkaits = document.getElementById("peldosais-skaits");
  
  if (peldosaisGrozs && peldosaisSkaits) {
    peldosaisSkaits.innerText = kopejaisPrecuSkaits;
    if (kopejaisPrecuSkaits > 0) {
      peldosaisGrozs.classList.add("aktivs"); // Parāda peldošo pogu ar CSS animāciju
    } else {
      peldosaisGrozs.classList.remove("aktivs"); // Paslēpj, ja tukšs
    }
  }

  // --- 1.1. BEZMAKSAS PIEGĀDES LOĢIKA ---
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
}

// Jaunā funkcija: nospiežot uz peldošā groza, gludi aizriplina lapu līdz pasūtījuma formai
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
  
  let teksts = "Sveiki! Es vēlos veikt pasūtījumu.\n\n";
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
  
  teksts += `*Kopā apmaksai: ${kopa.toFixed(2)} €*`;
  
  // --- LABOTĀ REVOLUT SAITE (ORIĢINĀLĀ VERSIJA) ---
  teksts += `\n\n💳 *Apmaksa ar Revolut (Ievadiet summu manuāli):*\nhttps://revolut.me/igorsyeqd`;
  
  let kodetsTeksts = encodeURIComponent(teksts);
  let mansNumurs = "37124332563"; 
  
  window.open(`https://wa.me/${mansNumurs}?text=${kodetsTeksts}`, '_blank');
}
