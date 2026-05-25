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

// Globale Variablen für den Spieler-Status
const meineSpielerId = "spieler_" + Math.floor(Math.random() * 100000);
let aktuellerRaumId = null;
let meineRolle = null; // "X", "O" oder "Zuschauer"

let aktuellerSpieler = "X";
let spielfeldStatus = ["", "", "", "", "", "", "", "", ""];
let spielAktiv = true;

const gewinnBedingungen = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

// 1. LOBBY-LOGIK: Räume anzeigen und aktualisieren
const raeumeRef = ref(db, 'raeume');
onValue(raeumeRef, (snapshot) => {
    const raeume = snapshot.val();
    const listeElement = document.getElementById('raeume-liste');
    listeElement.innerHTML = "";

    if (!raeume) {
        listeElement.innerHTML = "<p>Keine aktiven Räume. Erstelle den ersten!</p>";
        return;
    }

    Object.keys(raeume).forEach(id => {
        const raum = raeume[id];
        if (!raum.einstellungen) return;

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

        document.getElementById(`join-${id}`).addEventListener('click', () => raumBeitreten(id, raum));
    });
});

// 2. RAUM ERSTELLEN
document.getElementById('btn-erstellen').addEventListener('click', () => {
    const name = document.getElementById('raum-name-input').value.trim();
    const passwort = document.getElementById('raum-passwort-input').value;
    const zuschauer = document.getElementById('zuschauer-erlauben').checked;

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
    });
});

// 3. RAUM BEITRETEN (MIT RECHTE-PRÜFUNG)
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

// 4. IN DEN RAUM WECHSELN & SPIEL STARTEN
function raumAktivieren(id) {
    aktuellerRaumId = id;
    document.getElementById('lobby-ansicht').style.display = 'none';
    document.getElementById('spiel-ansicht').style.display = 'block';

    const spielRef = ref(db, 'raeume/' + id);
    onValue(spielRef, (snapshot) => {
        const raum = snapshot.val();
        if (!raum) return;

        document.getElementById('aktueller-raum-titel').textContent = "Raum: " + raum.einstellungen.name;

        // Rollenzuweisung bestimmen
        if (raum.spielerX === meineSpielerId) meineRolle = "X";
        else if (raum.spielerO === meineSpielerId) meineRolle = "O";
        else meineRolle = "Zuschauer";

        const stand = raum.spielStand;
        spielfeldStatus = stand.feld;
        aktuellerSpieler = stand.spieler;
        spielAktiv = stand