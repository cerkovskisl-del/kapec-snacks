// --- GLOBĀLIE MAINĪGIE ---
let grozs = [];
const BEZMAKSAS_PIEGADE_LIMITS = 30.00;

// Testam: Pakomātu saraksts (Reālajā dzīvē te var ielādēt pilno Omniva sarakstu)
const pakomatuSaraksts = [
  "Smiltenes Top pakomāts (Dārza 1)",
  "Smiltenes Centra pakomāts (Baznīcas laukums 2)",
  "Rīgas Origo pakomāts",
  "Rīgas Alfa pakomāts",
  "Valmieras Rimi pakomāts",
  "Cēsu Solo pakomāts"
];

// --- INICIALIZĀCIJA ---
document.addEventListener("DOMContentLoaded", () => {
  filtrētKategoriju('visi', document.getElementById('poga-visi'));
  ieladetPakomatus(pakomatuSaraksts);
  atjaunotGrozuVizuāli();

  // Omniva pakomātu meklētāja loģika
  const pakomatuMekletajs = document.getElementById("pakomatu-mekletajs");
  if (pakomatuMekletajs) {
    pakomatuMekletajs.addEventListener("input", (e) => {
      const meklesanasTeksts = e.target.value.toLowerCase();
      const atlasitie = pakomatuSaraksts.filter(p => p.toLowerCase().includes(meklesanasTeksts));
      ieladetPakomatus(atlasitie);
    });
  }
});

// --- KATEGORIJU FILTRS UN MEKLĒTĀJS ---
function filtrētKategoriju(kategorija, poga) {
  const sadaļas = document.querySelectorAll('.sadaļa-bloks');
  const pogas = document.querySelectorAll('.izvelne button');
  
  pogas.forEach(p => p.classList.remove('aktiva'));
  if (poga) poga.classList.add('aktiva');

  sadaļas.forEach(sadaļa => {
    if (kategorija === 'visi' || sadaļa.id === kategorija) {
      sadaļa.style.display = 'block';
    } else {
      sadaļa.style.display = 'none';
    }
  });
}

function mekletPreci() {
  const mekletajs = document.getElementById('veikala-mekletajs');
  const teksts = mekletajs.value.toLowerCase();
  const kartes = document.querySelectorAll('.saldums-karte');
  const sadaļas = document.querySelectorAll('.sadaļa-bloks');

  // Ja sāk meklēt, automātiski parādām visas iedaļas, lai redzētu rezultātus
  sadaļas.forEach(s => s.style.display = 'block');

  kartes.forEach(karte => {
    const nosaukums = karte.querySelector('h3').innerText.toLowerCase();
    const apraksts = karte.querySelector('.apraksts').innerText.toLowerCase();
    
    if (nosaukums.includes(teksts) || apraksts.includes(teksts)) {
      karte.style.display = 'flex';
    } else {
      karte.style.display = 'none';
    }
  });
}

// --- KARTĪŠU DAUDZUMA KONTROLE ---
function mainitKartesDaudzumu(id, izmaina) {
  const elements = document.getElementById(`skaits-${id}`);
  if (!elements) return;
  let pasreizējais = parseInt(elements.innerText);
  pasreizējais += izmaina;
  if (pasreizējais < 1) pasreizējais = 1;
  elements.innerText = pasreizējais;
}

// --- GROZA FUNKCIONALITĀTE ---
function pievienotNoKartes(nosaukums, cena, bildeUrl, event) {
  const skaitsElements = document.getElementById(`skaits-${nosaukums}`);
  const daudzums = skaitsElements ? parseInt(skaitsElements.innerText) : 1;
  
  // Pārbaudām vai prece jau ir grozā
  const esosāPrece = grozs.find(item => item.nosaukums === nosaukums);
  
  if (esosāPrece) {
    esosāPrece.daudzums += daudzums;
  } else {
    grozs.push({ nosaukums, cena, bildeUrl, daudzums });
  }

  // Atiestatām kartītes skaitītāju atpakaļ uz 1
  if (skaitsElements) skaitsElements.innerText = "1";

  // Lidošanas efekts (Ja nepieciešams, var izsaukt šeit)
  atjaunotGrozuVizuāli();
  pulsētGrozaPogu();
}

function mainitGrozaDaudzumu(nosaukums, izmaina) {
  const prece = grozs.find(item => item.nosaukums === nosaukums);
  if (!prece) return;

  prece.daudzums += izmaina;
  if (prece.daudzums <= 0) {
    grozs = grozs.filter(item => item.nosaukums !== nosaukums);
  }
  atjaunotGrozuVizuāli();
}

function iztiritVisuGrozu() {
  grozs = [];
  atjaunotGrozuVizuāli();
}

// --- VIZUĀLĀS ATJAUNOŠANAS LOGIKA (Ar Progresa joslu) ---
function atjaunotGrozuVizuāli() {
  const saraksts = document.getElementById('groza-saraksts');
  const kopaElements = document.getElementById('groza-kopa');
  const peldosaisSkaits = document.getElementById('peldosais-skaits');
  const peldosaisGrozs = document.getElementById('peldosais-grozs');

  if (grozs.length === 0) {
    saraksts.innerHTML = '<li class="tukss" style="text-align: center; padding: 15px; color: #888;">Grozs ir tukšs</li>';
    kopaElements.innerText = "0.00";
    peldosaisSkaits.innerText = "0";
    peldosaisGrozs.classList.remove('aktivs');
    atjaunotProgresaJoslu(0);
    return;
  }

  peldosaisGrozs.classList.add('aktivs');
  saraksts.innerHTML = "";
  let kopa = 0;
  let kopejaisPrecuSkaits = 0;

  grozs.forEach(prece => {
    const precesKopa = prece.cena * prece.daudzums;
    kopa += precesKopa;
    kopejaisPrecuSkaits += prece.daudzums;

    saraksts.innerHTML += `
      <li class="groza-prece-rindina">
        <div class="groza-preces-info">
          <img src="${prece.bildeUrl}" class="groza-mini-bilde" alt="${prece.nosaukums}">
          <div class="groza-preces-teksts">
            <strong>${prece.nosaukums}</strong><br>
            ${prece.cena.toFixed(2)} € x ${prece.daudzums}
          </div>
        </div>
        <div class="daudzuma-kontrole" style="margin: 0;">
          <button onclick="mainitGrozaDaudzumu('${prece.nosaukums}', -1)">-</button>
          <span>${prece.daudzums}</span>
          <button onclick="mainitGrozaDaudzumu('${prece.nosaukums}', 1)">+</button>
        </div>
      </li>
    `;
  });

  kopaElements.innerText = kopa.toFixed(2);
  peldosaisSkaits.innerText = kopejaisPrecuSkaits;
  atjaunotProgresaJoslu(kopa);
}

function atjaunotProgresaJoslu(kopa) {
  const josla = document.getElementById('piegades-progress-josla');
  const teksts = document.getElementById('piegades-progress-teksts');
  
  if (kopa === 0) {
    josla.style.width = "0%";
    teksts.innerText = "Ieliec preces grozā, lai redzētu piegādes statusu!";
    return;
  }

  let procenti = (kopa / BEZMAKSAS_PIEGADE_LIMITS) * 100;
  if (procenti > 100) procenti = 100;
  josla.style.width = `${procenti}%`;

  if (kopa >= BEZMAKSAS_PIEGADE_LIMITS) {
    teksts.innerHTML = "🎉 Apsveicam! Tev pienākas <strong>BEZMAKSAS piegāde!</strong>";
    josla.style.backgroundColor = "#25D366"; // Zaļa krāsa, kad sasniegts
  } else {
    const atlikums = (BEZMAKSAS_PIEGADE_LIMITS - kopa).toFixed(2);
    teksts.innerHTML = `Pērc vēl par <strong>${atlikums} €</strong>, lai saņemtu BEZMAKSAS piegādi!`;
    josla.style.backgroundColor = "#ff477e"; // Rozā, kamēr pildās
  }
}

// --- SĀNJOSLAS ATVĒRŠANA / AIZVĒRŠANA ---
function parslēgtGrozaSanjoslu() {
  const sanjosla = document.getElementById('groza-sanjosla');
  const ena = document.getElementById('groza-ena');
  sanjosla.classList.toggle('atvērts');
  ena.classList.toggle('atvērts');
}

function pulsētGrozaPogu() {
  const poga = document.getElementById('peldosais-grozs');
  poga.classList.add('pulset');
  setTimeout(() => poga.classList.remove('pulset'), 400);
}

// --- OMNIVA SARAKSTA POPULĒŠANA ---
function ieladetPakomatus(saraksts) {
  const select = document.getElementById("klients-pakomats");
  if (!select) return;
  select.innerHTML = '<option value="" disabled selected>Izvēlies pakomātu...</option>';
  
  saraksts.forEach(pakomats => {
    const opt = document.createElement("option");
    opt.value = pakomats;
    opt.textContent = pakomats;
    select.appendChild(opt);
  });
}

// --- WHATSAPP PASŪTĪJUMA SŪTĪŠANA ---
function sutitUzWhatsApp() {
  const vards = document.getElementById('klients-vards').value.trim();
  const telefons = document.getElementById('klients-telefons').value.trim();
  const pakomats = document.getElementById('klients-pakomats').value;

  if (!vards || !telefons || !pakomats) {
    alert("Lūdzu, aizpildi visus laukus (Vārdu, Telefonu un izvēlies Pakomātu)!");
    return;
  }

  let zinasTeksts = `Sveiki! Vēlos veikt pasūtījumu:\n\n`;
  zinasTeksts += `👤 Klients: ${vards}\n`;
  zinasTeksts += `📞 Telefons: ${telefons}\n`;
  zinasTeksts += `📦 Omniva pakomāts: ${pakomats}\n\n`;
  zinasTeksts += `🛒 Pasūtītās preces:\n`;

  let kopa = 0;
  grozs.forEach(prece => {
    const precesKopa = prece.cena * prece.daudzums;
    kopa += precesKopa;
    zinasTeksts += `- ${prece.nosaukums} (Daudzums: ${prece.daudzums}) - ${precesKopa.toFixed(2)} €\n`;
  });

  zinasTeksts += `\n💰 Kopējā summa: ${kopa.toFixed(2)} €`;
  if (kopa >= BEZMAKSAS_PIEGADE_LIMITS) {
    zinasTeksts += ` (Bezmaksas piegāde)`;
  } else {
    zinasTeksts += ` + piegādes izdevumi`;
  }

  // Tavs telefona numurs starptautiskā formātā (bez plus zīmes), kur saņemsi ziņu:
  const manaWhatappMērķis = "37120000000"; 
  const url = `https://wa.me/${manaWhatappMērķis}?text=${encodeURIComponent(zinasTeksts)}`;
  window.open(url, '_blank');
}

// --- DARK MODE PARSLĒGŠANA ---
function parslēgtDarkMode() {
  const body = document.body;
  const poga = document.getElementById('dark-mode-poga');
  body.classList.toggle('dark-mode');
  
  if (body.classList.contains('dark-mode')) {
    poga.innerText = "☀️";
  } else {
    poga.innerText = "🌙";
  }
}
