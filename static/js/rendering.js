import { state } from "./state.js";
import { elements } from "./dom.js";
import { setRoomInfo } from "./ui.js";

export function addEntry(entry) {
    // Ajoute en haut de la liste (unshift au lieu de push pour l'ordre chrono inverse visuel)
    state.entries.unshift(entry);
    renderHistory();
}

export function renderHistory() {
    elements.history.innerHTML = "";

    // 1. On crée une copie de la liste pour l'affichage (pour ne pas modifier l'ordre historique des données)
    let displayEntries = [...state.entries];

    // 2. LOGIQUE DE TRI
    // Si on est en mode Cémantix, on trie par "progression" (qui correspond au score/degré)
    if (state.gameType === "cemantix") {
        displayEntries.sort((a, b) => {
            // Tri décroissant : le plus grand score en haut
            return (b.progression || 0) - (a.progression || 0);
        });
    }
    // Sinon (Dictionnario), on garde l'ordre par défaut (chronologique inversé, géré par le unshift dans addEntry)

    
    // 3. Affichage
    // On utilise un index visuel. Attention : si trié, le #index ne correspond plus à l'ordre de tentative mais à la position dans le classement
    let index = displayEntries.length; 
    
    for (const entry of displayEntries) {
        const row = document.createElement("div");
        // Logique de victoire : soit feedback 'Correct !', soit score >= 1000
        const isWin = (entry.game_type === 'definition' && entry.feedback === 'Correct !') || (entry.progression >= 1000);
        
        row.className = `line ${isWin ? 'win' : ''}`;

        // Affichage du numéro de ligne (Classement ou ordre d'arrivée selon le mode)
        const num = `<div class="num">#${index}</div>`;
        const word = `<div class="word">${entry.word} <span style="opacity:0.5; font-size:0.8em">(${entry.player_name})</span></div>`;
        
        let meta = "";
        let bar = "";

        if (entry.game_type === "cemantix") {
            // Affichage Température
            const tempVal = entry.temp !== undefined ? `${entry.temp}°C` : "—";
            const icon = getIcon(entry.progression || 0);
            meta = `<div class="meta">${icon} ${tempVal}</div>`;
            bar = `<div class="score-bar"><div class="fill" style="width:${(entry.progression||0)/10}%"></div></div>`;
        } else {
            // Affichage Indice Dictionnario
            meta = `<div class="meta" style="color:var(--accent);">${entry.feedback || ""}</div>`;
            bar = `<div></div>`; 
        }

        row.innerHTML = `${num} ${word} ${meta} ${bar}`;
        elements.history.appendChild(row);
        
        index--;
    }
}

export function renderScoreboard(data) {
    if (!elements.scoreboard) return;
    elements.scoreboard.innerHTML = "";
    
    // Tri : Similitude décroissante, puis tentatives croissantes
    data.sort((a, b) => (b.best_similarity - a.best_similarity) || (a.attempts - b.attempts));

    for (const entry of data) {
        const row = document.createElement("div");
        row.className = "score-row";
        
        // Affichage différent selon le jeu (pourcentage pour cemantix, juste essais pour dictio)
        // Mais comme on n'a pas le game_type ici facilement, on affiche les essais, c'est universel.
        row.innerHTML = `
            <div class="score-name">${entry.player_name}</div>
            <div style="color:var(--text-muted)">${entry.attempts} essais</div>
        `;
        elements.scoreboard.appendChild(row);
    }
    updateRoomStatus();
}

export function updateRoomStatus() {
    if (!state.currentRoomId) return;
    setRoomInfo(`Room ${state.currentRoomId} • ${state.currentMode === 'race' ? 'Course' : 'Coop'}`);
}

export function triggerConfetti() {
    // Canvas Confetti doit être chargé dans le HTML
    if (window.confetti) {
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min, max) => Math.random() * (max - min) + min;

        const interval = setInterval(function() {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            window.confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
            window.confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
        }, 250);
    }
}

function getIcon(value) {
    if (value >= 1000) return "💥";
    if (value >= 990) return "🥵";
    if (value >= 900) return "🔥";
    if (value >= 500) return "😎";
    return "❄️";
}

function getColor(value) {
    // Plus utilisé avec le nouveau design CSS, mais gardé au cas où
    return `hsl(${value / 10}, 80%, 50%)`;
}