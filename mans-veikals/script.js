// --- SĀKOTNĒJIE MAINĪGIE ---
let grozs = JSON.parse(localStorage.getItem('iepirkumu_grozs')) || [];
const fiksētaisPasutījumaNumurs = Math.floor(1000 + Math.random() * 9000);

// --- 1. AUTOMĀTISKA VISU LATVIJAS OMNIVA PAKOMĀTU IELĀDE UN MEKLĒŠANA ---
document.addEventListener("DOMContentLoaded", function() {
  const pakomatuSelekts = document.getElementById('klients-pakomats');
  const mekletajs = document.getElementById('pakomatu-mekletajs');
  let visiPakomati = [];

  if (pakomatuSelekts) {
    fetch('https://www.omniva.lv/locations.json')
      .then(response => response.json())
      .then(data => {
        visiPakomati = data.filter(item => item.A0_NAME === 'LV');
        visiPakomati.sort((a, b) => a.NAME.localeCompare(b.NAME));
        atjaunotPakomatuSarakstu(visiPakomati);
      })
      .catch(error => {
        console.error('Kļūda ielādējot pakomātus:', error);
        pakomatuSelekts.innerHTML = '<option value="" disabled selected>Kļūda! Ierakstiet pakomātu WhatsApp</option>';
      });
  }

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

    const saglabatsPakomats = localStorage.getItem('pakomats');
    if (saglabatsPakomats) {
      pakomatuSelekts.value = saglabatsPakomats;
    }
  }

  if (mekletajs) {
    mekletajs.addEventListener('input', function() {
      const meklesanasTeksts = mekletajs.value.toLowerCase().trim();
      const filtretie = visiPakomati.filter(pakomats => 
        pakomats.NAME.toLowerCase().includes(meklesanasTeksts)
      );
      atjaunotPakomatuSarakstu(filtretie);
    });
  }

  if(localStorage.getItem('vards')) document.getElementById('klients-vards').value = localStorage.getItem('vards');
  if(localStorage.getItem('telefons')) document.getElementById('klients-telefons').value = localStorage.getItem('telefons');

  atjaunotGrozu();
});

// --- DATU SAGLABĀŠANAS KLAUSĪTĀJI ---
document.getElementById('klients-vards')?.addEventListener('input', (e) => localStorage.setItem('vards', e.target.value));
document.getElementById('klients-telefons')?.addEventListener('input', (e) => localStorage.setItem('telefons', e.target.value));
document.getElementById('klients-pakomats')?.addEventListener('change', (e) => localStorage.setItem('pakomats', e.target.value));


// --- 2. SĀNOS IZBĪDĀMĀ GROZA KONTROLE ---
function parslēgtGrozaSanjoslu() {
  const sanjosla = document.getElementById("groza-sanjosla");
  const ena = document.getElementById("groza-ena");
  
  if (sanjosla && ena) {
    sanjosla.classList.toggle("atvērts");
    ena.classList.toggle("atvērts");
  }
}


// --- 3. GROZA LOĢIKA UN LIDOŠANAS EFEKTS ---

function mainitKartesDaudzumu(nosaukums, izmaina) {
  const skaitaElements = document.getElementById(`skaits-${nosaukums}`);
  if (skaitaElements) {
    let pasreizejaisDaudzums = parseInt(skaitaElements.innerText);
    pasreizejaisDaudzums += izmaina;
    if (pasreizejaisDaudzums < 1) pasreizejaisDaudzums = 1;
    skaitaElements.innerText = pasreizejaisDaudzums;
  }
}

// Papildināta galvenā funkcija, kas reaģē uz klikšķa pozīciju, lai palaistu lidojošo bildi
function pievienotNoKartes(nosaukums, cena, bilde, event) {
  const skaitaElements = document.getElementById(`skaits-${nosaukums}`);
  let daudzumsKoPievienot = 1;
  
  if (skaitaElements) {
    daudzumsKoPievienot = parseInt(skaitaElements.innerText);
  }

  if (nosaukums === 'Reeses') {
    nosaukums = "Reese's Peanut Butter Cups";
  } else if (nosaukums === 'Hersheys Cookies N Creme') {
    nosaukums = "Hershey's Cookies 'N' Creme (43g)";
  } else if (nosaukums === 'Herrs Carolina Reaper') {
    nosaukums = "Herr's Carolina Reaper Curls (113g)";
  }

  // --- LIDOŠANAS ANIMĀCIJAS IZPILDE ---
  if (event && bilde) {
    const peldosaisGrozs = document.getElementById('peldosais-grozs');
    if (peldosaisGrozs) {
      const grozaIzmeri = peldosaisGrozs.getBoundingClientRect();
      
      // Izveidojam pagaidu bildes elementu animācijai
      const lidojosaBilde = document.createElement('img');
      lidojosaBilde.src = bilde;
      lidojosaBilde.className = 'lidojosa-preces-bilde';
      
      // Novietojam bildi tieši tur, kur lietotājs noklikšķināja pogu
      lidojosaBilde.style.left = `${event.clientX - 25}px`;
      lidojosaBilde.style.top = `${event.clientY - 25}px`;
      
      document.body.appendChild(lidojosaBilde);
      
      // Izmantojam nelielu pauzi, lai pārlūks paspēj reģistrēt sākuma CSS stāvokli pirms kustības
      setTimeout(() => {
        lidojosaBilde.style.left = `${grozaIzmeri.left + 15}px`;
        lidojosaBilde.style.top = `${grozaIzmeri.top + 15}px`;
        lidojosaBilde.style.transform = 'scale(0.1) rotate(360deg)';
        lidojosaBilde.style.opacity = '0.3';
      }, 50);
      
      // Kad animācija ir galā (pēc 0.8 sekundēm), izdzēšam elementu
      setTimeout(() => {
        lidojosaBilde.remove();
      }, 800);
    }
  }

  const esosaPrece = grozs.find(item => item.nosaukums === nosaukums);
  
  if (esosaPrece) {
    esosaPrece.daudzums += daudzumsKoPievienot;
    if (bilde) esosaPrece.bilde = bilde;
  } else {
    grozs.push({ 
      nosaukums: nosaukums, 
      cena: cena, 
      daudzums: daudzumsKoPievienot,
      bilde: bilde || 'logo.png'
    });
  }
  
  if (skaitaElements) {
    skaitaElements.innerText = 1;
  }
  
  atjaunotGrozu();
}

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

function iztiritVisuGrozu() {
  if (grozs.length === 0) {
    alert("Grozs jau ir tukšs!");
    return;
  }
  
  if (confirm("Vai tiešām vēlies pilnībā iztīrīt iepirkumu grozu?")) {
    grozs = [];
    localStorage.removeItem('iepirkumu_grozs');
    atjaunotGrozu();
  }
}

// Atjaunināta vizuālā funkcija, kas uzzīmē sānjoslu un vada progresa joslu
function atjaunotGrozu() {
  const sarakstsElement = document.getElementById("groza-saraksts");
  const kopaElement = document.getElementById("groza-kopa");
  const progressJosla = document.getElementById("piegades-progress-josla");
  const progressTeksts = document.getElementById("piegades-progress-teksts");
  
  if (!sarakstsElement || !kopaElement) return;

  sarakstsElement.innerHTML = "";
  let kopa = 0;
  let kopejaisPrecuSkaits = 0;
  
  grozs.forEach((prece) => {
    const rindasCena = prece.cena * prece.daudzums;
    const li = document.createElement("li");
    li.className = "groza-prece-rindina";
    
    const drošsNosaukums = prece.nosaukums.replace(/'/g, "\\'");
    
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
  localStorage.setItem('iepirkumu_grozs', JSON.stringify(grozs));

  // Peldošās pogas statusa atjaunināšana
  const peldosaisGrozs = document.getElementById("peldosais-grozs");
  const peldosaisSkaits = document.getElementById("peldosais-skaits");
  
  if (peldosaisGrozs && peldosaisSkaits) {
    peldosaisSkaits.innerText = kopejaisPrecuSkaits;
    if (kopejaisPrecuSkaits > 0) {
      peldosaisGrozs.classList.add("aktivs");
      peldosaisGrozs.classList.remove('pulset');
      void peldosaisGrozs.offsetWidth; 
      peldosaisGrozs.classList.add('pulset');
    } else {
      peldosaisGrozs.classList.remove("aktivs");
    }
  }

  // --- DINAMISKĀS BEZMAKSAS PIEGĀDES PROGRESA JOSLAS LOĢIKA ---
  const limitsBezmaksasPiegadei = 30.00;
  if (progressJosla && progressTeksts) {
    if (kopa === 0) {
      progressJosla.style.width = "0%";
      progressTeksts.innerHTML = "Ieliec preces grozā, lai redzētu piegādes statusu!";
      progressTeksts.style.color = "#888";
    } else if (kopa < limitsBezmaksasPiegadei) {
      let cikTruks = limitsBezmaksasPiegadei - kopa;
      let procenti = (kopa / limitsBezmaksasPiegadei) * 100;
      
      progressJosla.style.width = `${procenti}%`;
      progressJosla.style.backgroundColor = "#ff477e"; // Rozā, kamēr krājas progress
      progressTeksts.innerHTML = `🛒 Pērc vēl par <strong>${cikTruks.toFixed(2)} €</strong>, lai saņemtu BEZMAKSAS piegādi!`;
      progressTeksts.style.color = "#ff477e";
    } else {
      progressJosla.style.width = "100%";
      progressJosla.style.backgroundColor = "#2a9d8f"; // Zaļš, kad mērķis sasniegts
      progressTeksts.innerHTML = "🎉 Apsveicam! Tu esi ieguvis <strong>BEZMAKSAS piegādi!</strong>";
      progressTeksts.style.color = "#2a9d8f";
    }
  }

  // Pasūtījuma numura loģika sānjoslā
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

// --- 4. PASŪTĪŠANA UZ WHATSAPP ---
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
