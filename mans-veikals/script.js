// --- GLOBĀLIE MAINĪGIE ---
let grozs = [];
const BEZMAKSAS_PIEGADE_LIMITS = 50.00;

// Sākumā masīvs ir tukšs, jo mēs datus ielādēsim no interneta
let pakomatuSaraksts = []; 

// --- INICIALIZĀCIJA ---
document.addEventListener("DOMContentLoaded", () => {
  filtrētKategoriju('visi', document.getElementById('poga-visi'));
  atjaunotGrozuVizuāli();

  // 1. Ielādējam Omnivas pakomātus no oficiālā saraksta
  fetch('https://www.omniva.lv/locations.json')
    .then(atbilde => atbilde.json())
    .then(dati => {
      // Atlasām tikai Latvijas (LT vai EE vietā) un tikai pakomātus (TYPE "0")
      pakomatuSaraksts = dati
        .filter(vieta => vieta.A0_NAME === 'LV' && vieta.TYPE === '0')
        .map(vieta => `${vieta.NAME} (${vieta.A2_NAME}, ${vieta.A5_NAME})`)
        .sort(); // Sakārtojam alfabēta secībā

      // Kad dati gatavi, ielādējam tos izvēlnē
      ieladetPakomatus(pakomatuSaraksts);
    })
    .catch(kluda => {
      console.error("Neizdevās ielādēt Omnivas sarakstu:", kluda);
      // Rezerves variants, ja Omnivas lapa nedarbojas
      pakomatuSaraksts = ["Smiltenes Top pakomāts (Dārza 1)", "Rīgas Origo pakomāts"];
      ieladetPakomatus(pakomatuSaraksts);
    });

  // 2. Meklētāja loģika (paliek tā pati)
  const pakomatuMekletajs = document.getElementById("pakomatu-mekletajs");
  if (pakomatuMekletajs) {
    pakomatuMekletajs.addEventListener("input", (e) => {
      const meklesanasTeksts = e.target.value.toLowerCase();
      const atlasitie = pakomatuSaraksts.filter(p => p.toLowerCase().includes(meklesanasTeksts));
      ieladetPakomatus(atlasitie);
    });
  }

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

    // Šeit ir salabots un piespiedu kārtā noformēts bildes kods ar stiliem
    saraksts.innerHTML += `
      <li class="groza-prece-rindina" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee;">
        <div class="groza-preces-info" style="display: flex; align-items: center;">
          <img src="${prece.bildeUrl}" class="groza-mini-bilde" alt="${prece.nosaukums}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px; margin-right: 12px; display: block;">
          <div class="groza-preces-teksts">
            <strong>${prece.nosaukums}</strong><br>
            <span style="color: #666;">${prece.cena.toFixed(2)} € x ${prece.daudzums}</span>
          </div>
        </div>
        <div class="daudzuma-kontrole" style="margin: 0; display: flex; align-items: center; gap: 8px;">
          <button onclick="mainitGrozaDaudzumu('${prece.nosaukums}', -1)">-</button>
          <span style="min-width: 20px; text-align: center;">${prece.daudzums}</span>
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
  const nrBloks = document.getElementById('lapas-pasutijuma-nr');
  if (nrBloks) {
    nrBloks.style.display = 'none';
    nrBloks.innerText = '';
  }
}

// --- UNIKĀLA MAKSĀJUMA KODA ĢENERATORS ---
function generetUnikaluKodu() {
  const simboli = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; 
  let rezultats = "SWEET-";
  for (let i = 0; i < 5; i++) {
    rezultats += simboli.charAt(Math.floor(Math.random() * simboli.length));
  }
  return rezultats;
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

  if (grozs.length === 0) {
    alert("Tavs grozs ir tukšs!");
    return;
  }

  const unikalsKods = generetUnikaluKodu();

  const nrBloks = document.getElementById('lapas-pasutijuma-nr');
  if (nrBloks) {
    nrBloks.innerHTML = `Tavs maksājuma kods: <span style="color:#25D366; background:#f0f0f0; padding:2px 6px; border-radius:4px; font-family:monospace;">${unikalsKods}</span><br><small style="color:#666; font-weight:normal;">Ieraksti šo kodu Revolut piezīmēs!</small>`;
    nrBloks.style.display = 'block';
  }

  let zinasTeksts = `Sveiki! Vēlos veikt pasūtījumu:\n\n`;
  zinasTeksts += `🔑 Maksājuma kods piezīmēm: ${unikalsKods}\n`;
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
  
  zinasTeksts += `\n\nℹ️ Piezīme: Pēc tam veiciet apmaksu Revolut saitē, norādot kodu: ${unikalsKods}`;

  const manaWhatappMērķis = "37124332563"; 
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
