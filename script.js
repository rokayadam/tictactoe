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
            spielfeldStatus[index] = aktuellerSpieler;
            knopf.textContent = aktuellerSpieler;

            if (aktuellerSpieler === 'X') {
                knopf.classList.add('spielerX');
            } else {
                knopf.classList.add('spielerO');
            }

            gewinnPruefung();

            if (spielAktiv) {
                if (aktuellerSpieler === 'X') {
                    aktuellerSpieler = 'O';
                } else {
                    aktuellerSpieler = 'X';     
                }
                
                const statusAnzeige = document.getElementById('status');
                statusAnzeige.textContent = 'Spieler ' + aktuellerSpieler + ' ist dran';
                
                if (aktuellerSpieler === 'X') {
                    statusAnzeige.style.color = '#3498db';
                } else {
                    statusAnzeige.style.color = '#e74c3c';
                }
            }
        }
    });
});

function gewinnPruefung() {
    let rundeGewonnen = false;

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

    if (rundeGewonnen) {
        document.getElementById('status').textContent = 'Spieler ' + aktuellerSpieler + ' hat gewonnen!';
        spielAktiv = false;
        return;
    }

    if (!spielfeldStatus.includes('')) {
        document.getElementById('status').textContent = 'Unentschieden!';
        spielAktiv = false;
    }
}

document.getElementById('neustart').addEventListener('click', () => {
    aktuellerSpieler = "X";
    spielfeldStatus = ["", "", "", "", "", "", "", "", ""];
    spielAktiv = true;
    
    const statusAnzeige = document.getElementById('status');
    statusAnzeige.textContent = 'Spieler ' + aktuellerSpieler + ' ist dran';
    statusAnzeige.style.color = '#3498db';
    
    document.querySelectorAll('.feld').forEach(knopf => {
        knopf.textContent = '';
        knopf.classList.remove('spielerX', 'spielerO');
    });
});