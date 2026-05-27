// --- GLOBĀLIE MAINĪGIE ---
let grozs = [];
const MINIMALAIS_PASUTIJUMS = 15.00; // Uzstādīts uz 15 Eiro
const BEZMAKSAS_PIEGADE_LIMITS = 50.00;
const PIEGADES_MAKSA = 3.00; 
let pakomatuSaraksts = [];

// Atlaižu kodu konfigurācija
const ATLAIZU_KODI = {
  "SWEET10": { tips: "procenti", vertiba: 10 } // 10% atlaide preču summai
};
let aktīvaisKods = "";

// --- INICIALIZĀCIJA ---
document.addEventListener("DOMContentLoaded", () => {
  filtrētKategoriju('visi', document.getElementById('poga-visi'));
  ieladetNoAtminas();
  atjaunotGrozuVizuāli();
  atjaunotTaimeri();

  // 5. UZLABOJUMS: Automātiska un stabila Omnivas pakomātu ielāde no oficiālā API
  fetch('https://www.omniva.lv/locations.json')
    .then(atbilde => atbilde.json())
    .then(dati => {
      pakomatuSaraksts = dati
        .filter(vieta => vieta.A0_NAME === 'LV' && vieta.TYPE === '0')
        .map(vieta => `${vieta.NAME} (${vieta.A2_NAME || ''})`)
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
      // Rezerves saraksts, ja API pēkšņi nav pieejams
      pakomatuSaraksts = [
        "Smiltenes Centra top! pakomāts (Dārza 1)", 
        "Rīgas Origo pakomāts (Stacijas laukums 4)", 
        "Valmieras Rimi pakomāts (Rīgas 4)"
      ];
      ieladetPakomatus(pakomatuSaraksts);
    });

  // Klausītāji formas datu saglabāšanai (ja ieķeksēts "saglabāt")
  ['klients-vards', 'klients-telefons', 'klients-pakomats'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => {
        const vaiSaglabat = document.getElementById('saglabat-datus');
        if (!vaiSaglabat || vaiSaglabat.checked) {
          localStorage.setItem(id, el.value);
        }
      });
    }
  });

  const checkboxSaglabat = document.getElementById('saglabat-datus');
  if (checkboxSaglabat) {
    checkboxSaglabat.addEventListener('change', (e) => {
      if (!e.target.checked) {
        localStorage.removeItem('klients-vards');
        localStorage.removeItem('klients-telefons');
        localStorage.removeItem('klients-pakomats');
      } else {
        localStorage.setItem('klients-vards', document.getElementById('klients-vards').value);
        localStorage.setItem('klients-telefons', document.getElementById('klients-telefons').value);
        localStorage.setItem('klients-pakomats', document.getElementById('klients-pakomats').value);
      }
    });
  }

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

// FOMO Taimera loģika (Skaita atpakaļ līdz plkst. 16:00 katru dienu preču izsūtīšanai)
function atjaunotTaimeri() {
  const taimeraElements = document.getElementById('fomo-taimeris');
  if (!taimeraElements) return;

  setInterval(() => {
    const tagad = new Date();
    const morkis = new Date();
    morkis.setHours(16, 0, 0, 0); // Izsūtīšanas laiks 16:00

    if (tagad > morkis) {
      morkis.setDate(morkis.getDate() + 1);
    }

    const starpiba = morkis - tagad;
    const stundas = Math.floor(starpiba / (1000 * 60 * 60));
    const minutes = Math.floor((starpiba % (1000 * 60 * 60)) / (1000 * 60));
    const sekundes = Math.floor((starpiba % (1000 * 60)) / 1000);

    taimeraElements.innerText = `${stundas}st ${minutes}m ${sekundes}s`;
  }, 1000);
}

// Atlaižu koda pārbaudes funkcija
function pielietotKuponu() {
  const lauks = document.getElementById('groza-kupons');
  if (!lauks) return;
  const kods = lauks.value.trim().toUpperCase();

  if (ATLAIZU_KODI[kods]) {
    aktīvaisKods = kods;
    raditPaziņojumu(`🎟️ Kods ${kods} veiksmīgi pievienots!`);
  } else {
    aktīvaisKods = "";
    alert("Kupona kods nav atrasts vai ir nederīgs!");
  }
  atjaunotGrozuVizuāli();
}

// --- ATMIŅAS FUNKCIJAS ---
function saglabatGrozuAtmina() {
  localStorage.setItem('grozs', JSON.stringify(grozs));
}

// Ielādējam datus
function ieladetNoAtminas() {
  const saglabatsGrozs = localStorage.getItem('grozs');
  if (saglabatsGrozs) grozs = JSON.parse(saglabatsGrozs);
  
  const vards = localStorage.getItem('klients-vards');
  const telefons = localStorage.getItem('klients-telefons');
  if (vards && document.getElementById('klients-vards')) document.getElementById('klients-vards').value = vards;
  if (telefons && document.getElementById('klients-telefons')) document.getElementById('klients-telefons').value = telefons;
}

// --- UZNIRSTOŠIE PAZIŅOJUMI (TOAST UN CROSS-SELLING 🍭) ---
function raditPaziņojumu(teksts) {
  let konteiners = document.getElementById('toast-konteiners');
  if (!konteiners) {
    konteiners = document.createElement('div');
    konteiners.id = 'toast-konteiners';
    konteiners.style.cssText = "position: fixed; bottom: 20px; right: 20px; z-index: 10000; display: flex; flex-direction: column; gap: 10px;";
    document.body.appendChild(konteiners);
  }
  const toast = document.createElement('div');
  // Stilistiski pieskaņots zīmola rozā krāsai un fadeIn animācijai
  toast.style.cssText = "background: #ff477e; color: white; padding: 12px 20px; border-radius: 8px; font-weight: bold; box-shadow: 0 4px 12px rgba(0,0,0,0.15); animation: fadeIn 0.3s ease; border-left: 5px solid #fff;";
  toast.innerText = teksts;
  konteiners.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
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

// --- GROZA FUNKCIONALITĀTE ---
function pievienotNoKartes(nosaukums, cena, bildeUrl, event) {
  const el = document.getElementById(`skaits-${nosaukums}`);
  const daudzums = el ? parseInt(el.innerText) : 1;
  
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

  if (!īstāBilde || īstāBilde.includes('placeholder') || typeof īstāBilde === 'object') {
    īstāBilde = 'logo.png';
  }
  
  const prece = grozs.find(item => item.nosaukums === nosaukums);
  
  if (prece) {
    prece.daudzums += daudzums;
    prece.bildeUrl = īstāBilde;
  } else {
    grozs.push({ nosaukums, cena, bildeUrl: īstāBilde, daudzums });
  }
  if (el) el.innerText = "1";

  saglabatGrozuAtmina();
  atjaunotGrozuVizuāli();
  pulsētGrozaPogu();
  
  // 5. UZLABOJUMS: Informatīvs pievienošanas paziņojums pircējam
  raditPaziņojumu(`🛒 Pievienots: ${nosaukums} (${daudzums}gb). Paņem arī kādu dzērienu! 🥤`);
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
    pārbaudītMinimaloSummu(0);
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
      <li class="groza-prece-rindina" style="display: flex !important; align-items: center !important; justify-content: space-between !important; padding: 10px 0 !important; border-bottom: 1px solid #eee !important; min-height: 60px !important;">
        <div class="groza-preces-info" style="display: flex !important; align-items: center !important; flex: 1 !important;">
          <img src="${prece.bildeUrl}" class="groza-mini-bilde" alt="${prece.nosaukums}" style="width: 50px !important; height: 50px !important; object-fit: cover !important; border-radius: 6px !important; margin-right: 12px !important; display: block !important;">
          <div class="groza-preces-teksts" style="text-align: left !important;">
            <strong style="font-size: 0.95rem !important; display: block !important;">${prece.nosaukums}</strong>
            <span style="color: #666 !important; font-size: 0.85rem !important;">${prece.cena.toFixed(2)} € x ${prece.daudzums}</span>
          </div>
        </div>
        <div class="daudzuma-kontrole" style="display: flex !important; align-items: center !important; gap: 8px !important;">
          <button onclick="mainitGrozaDaudzumu('${prece.nosaukums}', -1)">-</button>
          <span style="min-width: 20px !important; text-align: center !important;">${prece.daudzums}</span>
          <button onclick="mainitGrozaDaudzumu('${prece.nosaukums}', 1)">+</button>
        </div>
      </li>
    `;
  });

  let galaSumma = prečuKopsumma;

  // Kupona (Atlaides) aprēķins
  if (aktīvaisKods && ATLAIZU_KODI[aktīvaisKods]) {
    const kupons = ATLAIZU_KODI[aktīvaisKods];
    let atlaide = 0;
    if (kupons.tips === "procenti") {
      atlaide = prečuKopsumma * (kupons.vertiba / 100);
    }
    galaSumma -= atlaide;
    saraksts.innerHTML += `<li style="text-align: right; padding: 6px 0; color: #ff477e; font-weight: bold;">Atlaide (${aktīvaisKods}): -${atlaide.toFixed(2)} €</li>`;
  }

  // Dāvanu iesaiņojuma aprēķins
  const iesainojumsCheckbox = document.getElementById('klients-iesainojums');
  if (iesainojumsCheckbox && iesainojumsCheckbox.checked) {
    galaSumma += 1.50;
    saraksts.innerHTML += `<li style="text-align: right; padding: 6px 0; color: #666;">🎁 Dāvanu iesaiņojums: +1.50 €</li>`;
  }

  // Piegādes aprēķins
  if (prečuKopsumma < BEZMAKSAS_PIEGADE_LIMITS) {
    galaSumma += PIEGADES_MAKSA;
    saraksts.innerHTML += `<li style="text-align: right; padding: 8px 0; color: #666; font-size: 0.9em;">Piegāde: ${PIEGADES_MAKSA.toFixed(2)} €</li>`;
  } else {
    saraksts.innerHTML += `<li style="text-align: right; padding: 8px 0; color: #25D366; font-weight: bold; font-size: 0.9em;">Piegāde: BEZMAKSAS</li>`;
  }

  kopaElements.innerText = galaSumma.toFixed(2);
  peldosaisSkaits.innerText = kopejaisPrecuSkaits;
  atjaunotProgresaJoslu(prečuKopsumma);
  pārbaudītMinimaloSummu(prečuKopsumma);
}

// Striktā 15.00 € pārbaude pogas kontrolei
function pārbaudītMinimaloSummu(prečuSumma) {
  const poga = document.getElementById('whatsapp-sutisana-poga');
  const paziņojums = document.getElementById('minimalais-pasutijums-bridinajums');
  if (!poga) return;

  if (prečuSumma < MINIMALAIS_PASUTIJUMS) {
    poga.disabled = true;
    poga.style.backgroundColor = "#cccccc";
    poga.style.cursor = "not-allowed";
    poga.style.boxShadow = "none";
    
    const atlikums = (MINIMALAIS_PASUTIJUMS - prečuSumma).toFixed(2);
    if (paziņojums) {
      paziņojums.style.display = "block";
      paziņojums.innerHTML = `⚠️ Lai veiktu pasūtījumu, jāpievieno preces vēl par <strong>${atlikums} €</strong> (Min. pasūtījums ir 15.00 €)`;
    }
  } else {
    poga.disabled = false;
    poga.style.backgroundColor = "#25D366";
    poga.style.cursor = "pointer";
    poga.style.boxShadow = "0 3px 8px rgba(37, 211, 102, 0.3)";
    if (paziņojums) paziņojums.style.display = "none";
  }
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
  saraksts.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p;
    opt.textContent = p;
    select.appendChild(opt);
  });
}

function iztiritVisuGrozu() {
  grozs = [];
  aktīvaisKods = "";
  localStorage.removeItem('grozs');
  
  const checkboxSaglabat = document.getElementById('saglabat-datus');
  if (!checkboxSaglabat || !checkboxSaglabat.checked) {
    localStorage.removeItem('klients-vards');
    localStorage.removeItem('klients-telefons');
    localStorage.removeItem('klients-pakomats');
    if(document.getElementById('klients-vards')) document.getElementById('klients-vards').value = "";
    if(document.getElementById('klients-telefons')) document.getElementById('klients-telefons').value = "";
    if(document.getElementById('klients-pakomats')) document.getElementById('klients-pakomats').value = "";
  }
  
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
  const iesainojumsCheckbox = document.getElementById('klients-iesainojums');

  if (!vards || !telefons || !pakomats) {
    alert("Lūdzu, aizpildi visus rekvizītu laukus!");
    return;
  }

  let prečuKopsumma = 0;
  grozs.forEach(p => prečuKopsumma += p.cena * p.daudzums);

  if (prečuKopsumma < MINIMALAIS_PASUTIJUMS) {
    alert(`Pasūtījumu nevar nosūtīt. Minimālā summa ir ${MINIMALAIS_PASUTIJUMS.toFixed(2)} €.`);
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
  zinasTeksts += `📦 Pakomāts: ${pakomats}\n`;
  zinasTeksts += `🎁 Dāvanu iesaiņojums: ${iesainojumsCheckbox && iesainojumsCheckbox.checked ? 'JĀ (+1.50 €)' : 'NĒ'}\n\n`;
  zinasTeksts += `🛒 Preces:\n`;

  grozs.forEach(prece => {
    const rindasSumma = prece.cena * prece.daudzums;
    zinasTeksts += `- ${prece.nosaukums} (${prece.daudzums}gb) - ${rindasSumma.toFixed(2)} €\n`;
  });

  let galaKopa = prečuKopsumma;

  if (aktīvaisKods && ATLAIZU_KODI[aktīvaisKods]) {
    const kupons = ATLAIZU_KODI[aktīvaisKods];
    let atlaide = prečuKopsumma * (kupons.vertiba / 100);
    galaKopa -= atlaide;
    zinasTeksts += `\n🎟️ Izmantotais kupons: ${aktīvaisKods} (-${atlaide.toFixed(2)} €)`;
  }

  if (iesainojumsCheckbox && iesainojumsCheckbox.checked) {
    galaKopa += 1.50;
  }

  let jastandaPiegade = prečuKopsumma < BEZMAKSAS_PIEGADE_LIMITS;
  galaKopa = jastandaPiegade ? (galaKopa + PIEGADES_MAKSA) : galaKopa;

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
