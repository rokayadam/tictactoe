let aktuellerSpieler = "X";
let spielfeldStatus = ["", "", "", "", "", "", "", "", ""];
let spielAktiv = true;

const gewinnBedingungen = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

document.querySelectorAll('.feld').forEach((knopf, index) => {
    knopf.addEventListener('click', () => {

        if (spielfeldStatus[index] === '' && spielAktiv) {
            // 1. Symbol ins Array und auf den Button eintragen
            spielfeldStatus[index] = aktuellerSpieler;
            knopf.textContent = aktuellerSpieler;

            // 2. SOFORT prüfen, ob dieser Spieler gerade gewonnen hat!
            gewinnPruefung();

            // 3. Wenn das Spiel noch aktiv ist (kein Gewinn/Unentschieden), Spieler wechseln
            if (spielAktiv) {
                if (aktuellerSpieler === 'X') {
                    aktuellerSpieler = 'O';
                } else {
                    aktuellerSpieler = 'X';     
                }
                document.getElementById('status').textContent = 'Spieler ' + aktuellerSpieler + ' ist dran';
            }
        }
    });
});

function gewinnPruefung() {
    let rundeGewonnen = false;

    // Alle 8 Kombinationen prüfen
    for (let i = 0; i < gewinnBedingungen.length; i++) {
        const bedingung = gewinnBedingungen[i];
        let a = spielfeldStatus[bedingung[0]];
        let b = spielfeldStatus[bedingung[1]];
        let c = spielfeldStatus[bedingung[2]];

        if (a === '' || b === '' || c === '') {
            continue;
        }
        if (a === b && b === c) {
            rundeGewonnen = true;
            break;
        }
    }

    // Wenn gewonnen wurde: Spiel stoppen und aktuellen Spieler als Sieger küren
    if (rundeGewonnen) {
        document.getElementById('status').textContent = 'Spieler ' + aktuellerSpieler + ' hat gewonnen!';
        spielAktiv = false;
        return;
    }

    // Wenn kein Feld mehr frei ist und niemand gewonnen hat: Unentschieden
    if (!spielfeldStatus.includes('')) {
        document.getElementById('status').textContent = 'Unentschieden!';
        spielAktiv = false;
    }
}

// Neustart-Knopf
document.getElementById('neustart').addEventListener('click', () => {
    aktuellerSpieler = "X";
    spielfeldStatus = ["", "", "", "", "", "", "", "", ""];
    spielAktiv = true;
    document.getElementById('status').textContent = 'Spieler ' + aktuellerSpieler + ' ist dran';
    document.querySelectorAll('.feld').forEach(knopf => knopf.textContent = '');
});