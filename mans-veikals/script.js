// --- GLOBĀLIE MAINĪGIE ---
let grozs = [];
const BEZMAKSAS_PIEGADE_LIMITS = 50.00;

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
  atjaunotGrozuVizuāli(); // Šeit bija drukas kļūda, tagad viss kārtībā!

  const pakomatuMekletajs = document.getElementById("pakomatu-mekletajs");
  if (pakomatuMekletajs) {
    pakomatuMekletajs.addEventListener("input", (e) => {
      const meklesanasTeksts = e.target.value.toLowerCase();
      const atlasitie = pakomatuSaraksts.filter(p => p.toLowerCase().includes(meklesanasTeksts));
      ieladetPakomatus(atlasitie);
    });
  }

  // Papildus drošība telefoniem — meklētājs reaģē uz jebkuru klaviatūru
  const veikalaMekletajs = document.getElementById('veikala-mekletajs');
  if (veikalaMekletajs) {
    veikalaMekletajs.addEventListener('keyup', mekletPreci);
    veikalaMekletajs.addEventListener('input', mekletPreci);
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
  if (!mekletajs) return;
  
  const teksts = mekletajs.value.toLowerCase().trim();
  const sadaļas = document.querySelectorAll('.sadaļa-bloks');
  const pogas = document.querySelectorAll('.izvelne button');

  pogas.forEach(p => p.classList.remove('aktiva'));
  if (teksts === "") {
    const pogaVisi = document.getElementById('poga-visi');
    if (pogaVisi) pogaVisi.classList.add('aktiva');
  }

  sadaļas.forEach(sadaļa => {
    const kartes = sadaļa.querySelectorAll('.saldums-karte');
    let vaiSadaļāIrAtbilstība = false;

    kartes.forEach(karte => {
      const virsraksts = karte.querySelector('h3');
      const aprakstsElements = karte.querySelector('.apraksts');
      
      const nosaukums = virsraksts ? virsraksts.innerText.toLowerCase() : "";
      const apraksts = aprakstsElements ? aprakstsElements.innerText.toLowerCase() : "";
      
      if (nosaukums.includes(teksts) || apraksts.includes(teksts)) {
        karte.style.setProperty('display', 'flex', 'important');
        vaiSadaļāIrAtbilstība = true;
      } else {
        karte.style.setProperty('display', 'none', 'important');
      }
    });

    if (vaiSadaļāIrAtbilstība || teksts === "") {
      sadaļa.style.setProperty('display', 'block', 'important');
    } else {
      sadaļa.style.setProperty('display', 'none', 'important');
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
  
  const esosāPrece = grozs.find(item => item.nosaukums === nosaukums);
  
  if (esosāPrece) {
    esosāPrece.daudzums += daudzums;
  } else {
    grozs.push({ nosaukums, cena, bildeUrl, daudzums });
  }

  if (skaitsElements) skaitsElements.innerText = "1";

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

// --- VIZUĀLĀS ATJAUNOŠANAS LOGIKA ---
function atjaunotGrozuVizuāli() {
  const saraksts = document.getElementById('groza-saraksts');
  const kopaElements = document.getElementById('groza-kopa');
  const peldosaisSkaits = document.getElementById('peldosais-skaits');
  const peldosaisGrozs = document.getElementById('peldosais-grozs');

  if (!saraksts || !kopaElements || !peldosaisSkaits || !peldosaisGrozs) return;

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
  if (!josla || !teksts) return;
  
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
    josla.style.backgroundColor = "#25D366";
  } else {
    const atlikums = (BEZMAKSAS_PIEGADE_LIMITS - kopa).toFixed(2);
    teksts.innerHTML = `Pērc vēl par <strong>${atlikums} €</strong>, lai saņemtu BEZMAKSAS piegādi!`;
    josla.style.backgroundColor = "#ff477e";
  }
}

function parslēgtGrozaSanjoslu() {
  const sanjosla = document.getElementById('groza-sanjosla');
  const ena = document.getElementById('groza-ena');
  if (sanjosla && ena) {
    sanjosla.classList.toggle('atvērts');
    ena.classList.toggle('atvērts');
  }
}

function pulsētGrozaPogu() {
  const poga = document.getElementById('peldosais-grozs');
  if (!poga) return;
  poga.classList.add('pulset');
  setTimeout(() => poga.classList.remove('pulset'), 400);
}

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

function iztiritVisuGrozu() {
  grozs = [];
  atjaunotGrozuVizuāli();
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

  const manaWhatappMērķis = "37120000000"; 
  const url = `https://wa.me/${manaWhatappMērķis}?text=${encodeURIComponent(zinasTeksts)}`;
  window.open(url, '_blank');
}

function parslēgtDarkMode() {
  const body = document.body;
  const poga = document.getElementById('dark-mode-poga');
  if (!body || !poga) return;
  body.classList.toggle('dark-mode');
  
  if (body.classList.contains('dark-mode')) {
    poga.innerText = "☀️";
  } else {
    poga.innerText = "🌙";
  }
}
