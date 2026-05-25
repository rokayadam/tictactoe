import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, update } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyBK0axwfOuQJF0r9rtxPKnRW0jR1FXbXI",
    authDomain: "tictactoe-online-r.firebaseapp.com",
    projectId: "tictactoe-online-r",
    storageBucket: "tictactoe-online-r.firebasestorage.app",
    messagingSenderId: "549984107904",
    appId: "1:549984107904:web:f5e0ba8fb86a5081681565",
    measurementId: "G-P6H6PBVBYD",
    databaseURL: "https://tictactoe-online-r-default-rtdb.europe-west1.firebasedatabase.app/"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const meineSpielerId = "spieler_" + Math.floor(Math.random() * 100000);
let aktuellerRaumId = null;
let meineRolle = null; 

let aktuellerSpieler = "X";
let spielfeldStatus = ["", "", "", "", "", "", "", "", ""];
let spielAktiv = true;

const gewinnBedingungen = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

// LOBBY-EMPFÄNGER
const raeumeRef = ref(db, 'raeume');
onValue(raeumeRef, (snapshot) => {
    const raeume = snapshot.val();
    const listeElement = document.getElementById('raeume-liste');
    
    if (!listeElement) return;
    listeElement.innerHTML = "";

    if (!raeume) {
        listeElement.innerHTML = "<p>Keine aktiven Räume. Erstelle den ersten!</p>";
        return;
    }

    Object.keys(raeume).forEach(id => {
        const raum = raeume[id];
        if (!raum || !raum.einstellungen) return;

        const eintrag = document.createElement('div');
        eintrag.className = "raum-eintrag";

        const istVoll = raum.spielerX && raum.spielerO;
        const zuschauerErlaubt = raum.einstellungen.zuschauer;
        
        let buttonText = "Beitreten";
        let buttonDisabled = false;

        if (istVoll) {
            if (zuschauerErlaubt) {
                buttonText = "Zuschauen";
            } else {
                buttonText = "Voll";
                buttonDisabled = true;
            }
        }

        eintrag.innerHTML = `
            <span><strong>${raum.einstellungen.name}</strong> ${raum.einstellungen.privat ? '🔒' : '🌐'}</span>
            <button id="join-${id}" ${buttonDisabled ? 'disabled' : ''}>${buttonText}</button>
        `;
        listeElement.appendChild(eintrag);

        const joinBtn = document.getElementById(`join-${id}`);
        if (joinBtn) {
            joinBtn.addEventListener('click', () => raumBeitreten(id, raum));
        }
    });
});

// BUTTON-REGISTRIERUNG FÜR ERSTELLEN
const erstellenBtn = document.getElementById('btn-erstellen');
if (erstellenBtn) {
    erstellenBtn.addEventListener('click', () => {
        const nameInput = document.getElementById('raum-name-input');
        const pwInput = document.getElementById('raum-passwort-input');
        const zuschauerInput = document.getElementById('zuschauer-erlauben');

        const name = nameInput ? nameInput.value.trim() : "";
        const passwort = pwInput ? pwInput.value : "";
        const zuschauer = zuschauerInput ? zuschauerInput.checked : true;

        if (!name) {
            alert("Bitte gib einen Raum-Namen ein!");
            return;
        }

        const neueRaumId = "raum_" + Date.now();
        
        set(ref(db, 'raeume/' + neueRaumId), {
            einstellungen: {
                name: name,
                passwort: passwort || null,
                privat: passwort.length > 0,
                zuschauer: zuschauer
            },
            spielerX: meineSpielerId,
            spielStand: {
                feld: ["", "", "", "", "", "", "", "", ""],
                spieler: "X",
                aktiv: true
            }
        }).then(() => {
            raumAktivieren(neueRaumId);
        }).catch((error) => {
            alert("Fehler beim Erstellen des Raums: " + error.message);
        });
    });
}

function raumBeitreten(id, raumDaten) {
    if (raumDaten.einstellungen.privat) {
        const pwEingabe = prompt("Dieser Raum ist privat. Bitte Passwort eingeben:");
        if (pwEingabe !== raumDaten.einstellungen.passwort) {
            alert("Falsches Passwort!");
            return;
        }
    }

    const updates = {};
    if (!raumDaten.spielerX) {
        updates['raeume/' + id + '/spielerX'] = meineSpielerId;
    } else if (!raumDaten.spielerO && raumDaten.spielerX !== meineSpielerId) {
        updates['raeume/' + id + '/spielerO'] = meineSpielerId;
    }
    
    update(ref(db), updates).then(() => {
        raumAktivieren(id);
    });
}

function raumAktivieren(id) {
    aktuellerRaumId = id;
    
    const lobbyView = document.getElementById('lobby-ansicht');
    const spielView = document.getElementById('spiel-ansicht');
    
    if (lobbyView) lobbyView.style.display = 'none';
    if (spielView) spielView.style.display = 'block';

    const spielRef = ref(db, 'raeume/' + id);
    onValue(spielRef, (snapshot) => {
        const raum = snapshot.val();
        if (!raum) return;

        const titelElement = document.getElementById('aktueller-raum-titel');
        if (titelElement) titelElement.textContent = "Raum: " + raum.einstellungen.name;

        if (raum.spielerX === meineSpielerId) meineRolle = "X";
        else if (raum.spielerO === meineSpielerId) meineRolle = "O";
        else meineRolle = "Zuschauer";

        const stand = raum.spielStand;
        spielfeldStatus = stand.feld;
        aktuellerSpieler = stand.spieler;
        spielAktiv = stand.aktiv;

        document.querySelectorAll('.feld').forEach((knopf, index) => {
            knopf.textContent = spielfeldStatus[index];
            knopf.classList.remove('spielerX', 'spielerO');
            if (spielfeldStatus[index] === 'X') knopf.classList.add('spielerX');
            if (spielfeldStatus[index] === 'O') knopf.classList.add('spielerO');
        });

        const statusAnzeige = document.getElementById('status');
        if (!statusAnzeige) return;

        if (!raum.spielerO) {
            statusAnzeige.textContent = "Warte auf Mitspieler... (Du bist " + meineRolle + ")";
            statusAnzeige.style.color = "#7f8c8d";
        } else if (spielAktiv) {
            if (meineRolle === "Zuschauer") {
                statusAnzeige.textContent = `Zuschauer-Modus: Spieler ${aktuellerSpieler} zieht`;
            } else {
                statusAnzeige.textContent = (aktuellerSpieler === meineRolle) ? "Du bist dran!" : "Gegner überlegt...";
            }
            statusAnzeige.style.color = (aktuellerSpieler === 'X') ? '#3498db' : '#e74c3c';
        } else {
            let xHatGewonnen = checkSieg('X');
            let oHatGewonnen = checkSieg('O');
            if (xHatGewonnen) statusAnzeige.textContent = 'Spieler X hat gewonnen!';
            else if (oHatGewonnen) statusAnzeige.textContent = 'Spieler O hat gewonnen!';
            else statusAnzeige.textContent = 'Unentschieden!';
            statusAnzeige.style.color = "#2c3e50";
        }
    });
}

document.querySelectorAll('.feld').forEach((knopf, index) => {
    knopf.addEventListener('click', () => {
        if (meineRolle === "Zuschauer" || aktuellerSpieler !== meineRolle) return;

        if (spielfeldStatus[index] === '' && spielAktiv) {
            spielfeldStatus[index] = aktuellerSpieler;
            gewinnPruefung();

            if (spielAktiv) {
                aktuellerSpieler = (aktuellerSpieler === 'X') ? 'O' : 'X';
            }
            
            set(ref(db, 'raeume/' + aktuellerRaumId + '/spielStand'), {
                feld: spielfeldStatus,
                spieler: aktuellerSpieler,
                aktiv: spielAktiv
            });
        }
    });
});

function gewinnPruefung() {
    if (checkSieg(aktuellerSpieler)) spielAktiv = false;
    else if (!spielfeldStatus.includes('')) spielAktiv = false;
}

function checkSieg(spieler) {
    return gewinnBedingungen.some(bedingung => {
        return bedingung.every(index => spielfeldStatus[index] === spieler);
    });
}

const neustartBtn = document.getElementById('neustart');
if (neustartBtn) {
    neustartBtn.addEventListener('click', () => {
        if (meineRolle === "Zuschauer") return;
        set(ref(db, 'raeume/' + aktuellerRaumId + '/spielStand'), {
            feld: ["", "", "", "", "", "", "", "", ""],
            spieler: "X",
            aktiv: true
        });
    });
}

const verlassenBtn = document.getElementById('btn-verlassen');
if (verlassenBtn) {
    verlassenBtn.addEventListener('click', () => {
        location.reload();
    });
}