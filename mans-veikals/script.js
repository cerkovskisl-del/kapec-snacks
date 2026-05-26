// --- GLOBĀLIE MAINĪGIE ---
let grozs = [];
const BEZMAKSAS_PIEGADE_LIMITS = 50.00;
const PIEGADES_MAKSA = 3.00; // Piegādes cena, ja pasūtījums nesasniedz limitu
let pakomatuSaraksts = [];

// --- INICIALIZĀCIJA ---
document.addEventListener("DOMContentLoaded", () => {
  filtrētKategoriju('visi', document.getElementById('poga-visi'));
  ieladetNoAtminas();
  atjaunotGrozuVizuāli();

  // Ielādējam Omnivas pakomātus no oficiālā saraksta
  fetch('https://www.omniva.lv/locations.json')
    .then(atbilde => atbilde.json())
    .then(dati => {
      pakomatuSaraksts = dati
        .filter(vieta => vieta.A0_NAME === 'LV' && vieta.TYPE === '0')
        .map(vieta => `${vieta.NAME} (${vieta.A2_NAME})`)
        .sort();

      ieladetPakomatus(pakomatuSaraksts);
      
      const saglabatsPakomats = localStorage.getItem('klients-pakomats');
      if (saglabatsPakomats) {
        const select = document.getElementById("klients-pakomats");
        if (select) select.value = saglabatsPakomats;
      }
    })
    .catch(kluda => {
      console.error("Kļūda ielādējot Omnivu:", kluda);
      pakomatuSaraksts = ["Smiltenes Top pakomāts (Dārza 1)", "Rīgas Origo pakomāts"];
      ieladetPakomatus(pakomatuSaraksts);
    });

  // Saglabājam formas datus, lai pie lapas pārlādes tie nepazūd
  ['klients-vards', 'klients-telefons', 'klients-pakomats'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => localStorage.setItem(id, el.value));
    }
  });

  // Meklētāji
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
    veikalaMekletajs.addEventListener('input', mekletPreci);
  }
});

// --- ATMIŅAS FUNKCIJAS ---
function saglabatGrozuAtmina() {
  localStorage.setItem('grozs', JSON.stringify(grozs));
}

function ieladetNoAtminas() {
  const saglabatsGrozs = localStorage.getItem('grozs');
  if (saglabatsGrozs) grozs = JSON.parse(saglabatsGrozs);
  
  const vards = localStorage.getItem('klients-vards');
  const telefons = localStorage.getItem('klients-telefons');
  if (vards && document.getElementById('klients-vards')) document.getElementById('klients-vards').value = vards;
  if (telefons && document.getElementById('klients-telefons')) document.getElementById('klients-telefons').value = telefons;
}

// --- UZNIRSTOŠIE PAZIŅOJUMI (TOAST) ---
function raditPaziņojumu(teksts) {
  let konteiners = document.getElementById('toast-konteiners');
  if (!konteiners) {
    konteiners = document.createElement('div');
    konteiners.id = 'toast-konteiners';
    konteiners.style.cssText = "position: fixed; bottom: 20px; right: 20px; z-index: 10000; display: flex; flex-direction: column; gap: 10px;";
    document.body.appendChild(konteiners);
  }
  const toast = document.createElement('div');
  toast.style.cssText = "background: #25D366; color: white; padding: 12px 20px; border-radius: 8px; font-weight: bold; box-shadow: 0 4px 12px rgba(0,0,0,0.15); animation: fade 0.3s ease;";
  toast.innerText = teksts;
  konteiners.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

// --- FILTRS UN MEKLĒTĀJS ---
function filtrētKategoriju(kategorija, poga) {
  const sadaļas = document.querySelectorAll('.sadaļa-bloks');
  const pogas = document.querySelectorAll('.izvelne button');
  pogas.forEach(p => p.classList.remove('aktiva'));
  if (poga) poga.classList.add('aktiva');
  sadaļas.forEach(s => s.style.display = (kategorija === 'visi' || s.id === kategorija) ? 'block' : 'none');
}

function mekletPreci() {
  const mekletajs = document.getElementById('veikala-mekletajs');
  if (!mekletajs) return;
  const teksts = mekletajs.value.toLowerCase().trim();
  const sadaļas = document.querySelectorAll('.sadaļa-bloks');

  sadaļas.forEach(sadaļa => {
    const kartes = sadaļa.querySelectorAll('.saldums-karte');
    let vaiIr = false;
    kartes.forEach(karte => {
      const h3 = karte.querySelector('h3');
      const apr = karte.querySelector('.apraksts');
      const nosaukums = h3 ? h3.innerText.toLowerCase() : "";
      const apraksts = apr ? apr.innerText.toLowerCase() : "";
      if (nosaukums.includes(teksts) || apraksts.includes(teksts)) {
        karte.style.setProperty('display', 'flex', 'important');
        vaiIr = true;
      } else {
        karte.style.setProperty('display', 'none', 'important');
      }
    });
    sadaļa.style.setProperty('display', (vaiIr || teksts === "") ? 'block' : 'none', 'important');
  });
}

// --- DAUDZUMA KONTROLE ---
function mainitKartesDaudzumu(id, izmaina) {
  const el = document.getElementById(`skaits-${id}`);
  if (!el) return;
  let skaits = parseInt(el.innerText) + izmaina;
  if (skaits < 1) skaits = 1;
  el.innerText = skaits;
}

// --- GROZA FUNKCIONALITĀTE (AUTOMĀTISKAIS BILŽU FILTRS 🛠️) ---
function pievienotNoKartes(nosaukums, cena, bildeUrl, event) {
  const el = document.getElementById(`skaits-${nosaukums}`);
  const daudzums = el ? parseInt(el.innerText) : 1;
  
  // GUDRAIS LABOJUMS: Atrodam īsto preces attēlu pa tiešo no mājaslapas kartītes DOM koka,
  // pilnībā ignorējot kļūdainos un salauztos placeholder linkus no HTML faila.
  let īstāBilde = bildeUrl;
  if (el) {
    const karte = el.closest('.saldums-karte');
    if (karte) {
      const img = karte.querySelector('img');
      if (img) {
        īstāBilde = img.getAttribute('src') || img.src;
      }
    }
  }

  // Papildus drošība: ja bilde joprojām ir kļūdaina vai satur "placeholder", uzliekam logo par rezervi
  if (!īstāBilde || īstāBilde.includes('placeholder') || typeof īstāBilde === 'object') {
    īstāBilde = 'logo.png';
  }
  
  const prece = grozs.find(item => item.nosaukums === nosaukums);
  
  if (prece) {
    prece.daudzums += daudzums;
  } else {
    grozs.push({ nosaukums, cena, bildeUrl: īstāBilde, daudzums });
  }
  if (el) el.innerText = "1";

  saglabatGrozuAtmina();
  atjaunotGrozuVizuāli();
  pulsētGrozaPogu();
  raditPaziņojumu(`🛒 ${nosaukums} pievienots grozam!`);
}

function mainitGrozaDaudzumu(nosaukums, izmaina) {
  const prece = grozs.find(item => item.nosaukums === nosaukums);
  if (!prece) return;
  prece.daudzums += izmaina;
  if (prece.daudzums <= 0) grozs = grozs.filter(item => item.nosaukums !== nosaukums);
  
  saglabatGrozuAtmina();
  atjaunotGrozuVizuāli();
}

// --- VIZUĀLĀ ATJAUNOŠANA AR PREČU ATTĒLIEM ---
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
  let prečuKopsumma = 0;
  let kopejaisPrecuSkaits = 0;

  grozs.forEach(prece => {
    prečuKopsumma += prece.cena * prece.daudzums;
    kopejaisPrecuSkaits += prece.daudzums;

    saraksts.innerHTML += `
      <li class="groza-prece-rindina" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee;">
        <div class="groza-preces-info" style="display: flex; align-items: center;">
          <img src="${prece.bildeUrl}" class="groza-mini-bilde" alt="${prece.nosaukums}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px; margin-right: 12px; display: block;">
          <div class="groza-preces-teksts">
            <strong>${prece.nosaukums}</strong><br>
            <span style="color: #666;">${prece.cena.toFixed(2)} € x ${prece.daudzums}</span>
          </div>
        </div>
        <div class="daudzuma-kontrole" style="display: flex; align-items: center; gap: 8px;">
          <button onclick="mainitGrozaDaudzumu('${prece.nosaukums}', -1)">-</button>
          <span style="min-width: 20px; text-align: center;">${prece.daudzums}</span>
          <button onclick="mainitGrozaDaudzumu('${prece.nosaukums}', 1)">+</button>
        </div>
      </li>
    `;
  });

  // Aprēķinām gala summu, ieskaitot piegādes maksu
  let galaSumma = prečuKopsumma;
  if (prečuKopsumma < BEZMAKSAS_PIEGADE_LIMITS) {
    galaSumma += PIEGADES_MAKSA;
    saraksts.innerHTML += `<li style="text-align: right; padding: 8px 0; color: #666; font-size: 0.9em;">Piegāde: ${PIEGADES_MAKSA.toFixed(2)} €</li>`;
  } else {
    saraksts.innerHTML += `<li style="text-align: right; padding: 8px 0; color: #25D366; font-weight: bold; font-size: 0.9em;">Piegāde: BEZMAKSAS</li>`;
  }

  kopaElements.innerText = galaSumma.toFixed(2);
  peldosaisSkaits.innerText = kopejaisPrecuSkaits;
  atjaunotProgresaJoslu(prečuKopsumma);
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

// Ielādē pakomātus select sarakstā
function ieladetPakomatus(saraksts) {
  const select = document.getElementById("klients-pakomats");
  if (!select) return;
  select.innerHTML = '<option value="" disabled selected>Izvēlies pakomātu...</option>';
  saraksts.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p;
    opt.textContent = p;
    select.appendChild(opt);
  });
}

function iztiritVisuGrozu() {
  grozs = [];
  localStorage.removeItem('grozs');
  atjaunotGrozuVizuāli();
  const nrBloks = document.getElementById('lapas-pasutijuma-nr');
  if (nrBloks) {
    nrBloks.style.display = 'none';
    nrBloks.innerText = '';
  }
  raditPaziņojumu("🗑️ Grozs ir iztīrīts!");
}

function generetUnikaluKodu() {
  const simboli = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; 
  let rez = "SWEET-";
  for (let i = 0; i < 5; i++) rez += simboli.charAt(Math.floor(Math.random() * simboli.length));
  return rez;
}

// --- WHATSAPP PASŪTĪJUMS ---
function sutitUzWhatsApp() {
  const vards = document.getElementById('klients-vards').value.trim();
  const telefons = document.getElementById('klients-telefons').value.trim();
  const pakomats = document.getElementById('klients-pakomats').value;

  if (!vards || !telefons || !pakomats) {
    alert("Lūdzu, aizpildi visus laukus!");
    return;
  }
  if (grozs.length === 0) {
    alert("Tavs grozs ir tukšs!");
    return;
  }

  const unikalsKods = generetUnikaluKodu();
  const nrBloks = document.getElementById('lapas-pasutijuma-nr');
  if (nrBloks) {
    nrBloks.innerHTML = `Maksājuma kods: <span style="color:#25D366; background:#f0f0f0; padding:2px 6px; border-radius:4px; font-family:monospace;">${unikalsKods}</span>`;
    nrBloks.style.display = 'block';
  }

  let zinasTeksts = `Sveiki! Vēlos veikt pasūtījumu:\n\n`;
  zinasTeksts += `🔑 Kods Revolut piezīmēm: ${unikalsKods}\n`;
  zinasTeksts += `👤 Klients: ${vards}\n`;
  zinasTeksts += `📞 Telefons: ${telefons}\n`;
  zinasTeksts += `📦 Pakomāts: ${pakomats}\n\n`;
  zinasTeksts += `🛒 Preces:\n`;

  let prečuKopsumma = 0;
  grozs.forEach(prece => {
    const rindasSumma = prece.cena * prece.daudzums;
    prečuKopsumma += rindasSumma;
    zinasTeksts += `- ${prece.nosaukums} (${prece.daudzums}gb) - ${rindasSumma.toFixed(2)} €\n`;
  });

  let jastandaPiegade = prečuKopsumma < BEZMAKSAS_PIEGADE_LIMITS;
  let galaKopa = jastandaPiegade ? (prečuKopsumma + PIEGADES_MAKSA) : prečuKopsumma;

  zinasTeksts += `\n📦 Piegāde: ${jastandaPiegade ? `${PIEGADES_MAKSA.toFixed(2)} €` : 'BEZMAKSAS'}\n`;
  zinasTeksts += `💰 KOPĀ APMAKSAI: ${galaKopa.toFixed(2)} €\n\n`;
  zinasTeksts += `ℹ️ Pēc tam veiciet apmaksu Revolut, norādot kodu: ${unikalsKods}`;

  const url = `https://wa.me/37124332563?text=${encodeURIComponent(zinasTeksts)}`;
  window.open(url, '_blank');
}

function parslēgtDarkMode() {
  document.body.classList.toggle('dark-mode');
  const poga = document.getElementById('dark-mode-poga');
  if (poga) poga.innerText = document.body.classList.contains('dark-mode') ? "☀️" : "🌙";
}
