import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue } from "firebase/database";

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
const spielRef = ref(db, 'spielStand');

let aktuellerSpieler = "X";
let spielfeldStatus = ["", "", "", "", "", "", "", "", ""];
let spielAktiv = true;

const gewinnBedingungen = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

function datenbankAktualisieren() {
    set(spielRef, {
        feld: spielfeldStatus,
        spieler: aktuellerSpieler,
        aktiv: spielAktiv
    });
}

document.querySelectorAll('.feld').forEach((knopf, index) => {
    knopf.addEventListener('click', () => {
        if (spielfeldStatus[index] === '' && spielAktiv) {
            spielfeldStatus[index] = aktuellerSpieler;
            
            gewinnPruefung();

            if (spielAktiv) {
                aktuellerSpieler = (aktuellerSpieler === 'X') ? 'O' : 'X';
            }
            
            datenbankAktualisieren();
        }
    });
});

onValue(spielRef, (snapshot) => {
    const daten = snapshot.val();
    
    // HIER KORRIGIERT: Wenn die Datenbank noch leer ist, erstellen wir den ersten Spielstand
    if (!daten) {
        datenbankAktualisieren();
        return;
    }

    spielfeldStatus = daten.feld;
    aktuellerSpieler = daten.spieler;
    spielAktiv = daten.aktiv;
    
    document.querySelectorAll('.feld').forEach((knopf, index) => {
        knopf.textContent = spielfeldStatus[index];
        knopf.classList.remove('spielerX', 'spielerO');
        if (spielfeldStatus[index] === 'X') knopf.classList.add('spielerX');
        if (spielfeldStatus[index] === 'O') knopf.classList.add('spielerO');
    });
    
    const statusAnzeige = document.getElementById('status');
    if (spielAktiv) {
        statusAnzeige.textContent = 'Spieler ' + aktuellerSpieler + ' ist dran';
        statusAnzeige.style.color = (aktuellerSpieler === 'X') ? '#3498db' : '#e74c3c';
    } else {
        let xHatGewonnen = checkSieg('X');
        let oHatGewonnen = checkSieg('O');
        
        if (xHatGewonnen) {
            statusAnzeige.textContent = 'Spieler X hat gewonnen!';
        } else if (oHatGewonnen) {
            statusAnzeige.textContent = 'Spieler O hat gewonnen!';
        } else {
            statusAnzeige.textContent = 'Unentschieden!';
        }
    }
});

function gewinnPruefung() {
    if (checkSieg(aktuellerSpieler)) {
        spielAktiv = false;
    } else if (!spielfeldStatus.includes('')) {
        spielAktiv = false;
    }
}

function checkSieg(spieler) {
    return gewinnBedingungen.some(bedingung => {
        return bedingung.every(index => spielfeldStatus[index] === spieler);
    });
}

document.getElementById('neustart').addEventListener('click', () => {
    aktuellerSpieler = "X";
    spielfeldStatus = ["", "", "", "", "", "", "", "", ""];
    spielAktiv = true;
    datenbankAktualisieren();
});