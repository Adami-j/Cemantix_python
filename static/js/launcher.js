import { openGameConfig, toggleDurationDisplay } from "./launcher.js";
import { currentConfigType } from "./main.js";
import { verifierPseudo } from "./session.js";

let currentConfigType = "definition";

async function submitGameConfig() {
    const mode = document.getElementById('config-mode').value;
    let duration = 0;
    if (mode === 'blitz') {
        duration = parseInt(document.getElementById('config-duration').value);
    }
    closeConfigModal();
    if (window.createGame) {
        await window.createGame(currentConfigType, mode, duration);
    }
}

function openGameConfig(type) {
    if (!verifierPseudo()) return;
    
    currentConfigType = type;
    const modal = document.getElementById('config-modal');
    const modeGroup = document.getElementById('mode-group');
    const durationGroup = document.getElementById('duration-group');
    const title = document.getElementById('config-modal-title');
    const desc = document.getElementById('mode-desc');
    const modeSelect = document.getElementById('config-mode');

    modal.classList.add('active');

    if (type === 'intruder') {
        title.textContent = "L'Intrus : Contre la montre";
        modeGroup.style.display = 'none'; 
        modeSelect.value = 'blitz'; 
        durationGroup.style.display = 'block';
        desc.textContent = "Trouvez un maximum d'intrus avant la fin du temps imparti !";
    } else {
        title.textContent = "Config. Dictionnario";
        modeGroup.style.display = 'block';
        modeSelect.value = 'coop';
        toggleDurationDisplay();
    }
}
function openDictioConfig() {
    if (!verifierPseudo()) return;
    const modal = document.getElementById('config-modal');
    modal.classList.add('active');
    currentConfigType = "definition"; 
    openGameConfig('definition');
    document.getElementById('config-mode').value = "coop";
    toggleDurationDisplay();
}

