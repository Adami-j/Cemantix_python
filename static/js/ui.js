import { elements } from "./dom.js";

let messageTimeout;

export function addHistoryMessage(text, duration = 0) {
    if (!elements.messages) return;
    if (messageTimeout) clearTimeout(messageTimeout);

    elements.messages.innerHTML = "";
    
    const msg = document.createElement("div");
    msg.className = "log";
    msg.textContent = text;
    elements.messages.appendChild(msg);

    if (duration > 0) {
        messageTimeout = setTimeout(() => {
            elements.messages.innerHTML = "";
            messageTimeout = null;
        }, duration);
    }
}

export function setRoomInfo(text) {
    if (!elements.roomInfo) return;
    elements.roomInfo.textContent = text;
}

export function showModal(title, contentHTML, isVictory = false) {
    const overlay = document.getElementById('modal-overlay');
    const titleEl = document.getElementById('modal-title');
    const contentEl = document.getElementById('modal-content');
    const iconEl = document.getElementById('modal-icon');
    const actionsDiv = document.getElementById('modal-actions');

    if (!overlay) return;

    titleEl.textContent = title;
    contentEl.innerHTML = contentHTML;

    if (isVictory) {
        iconEl.style.display = "block";
        iconEl.textContent = "🏆";
    } else {
        iconEl.style.display = "none";
        
        actionsDiv.innerHTML = `<button id="modal-close-btn" class="btn">Fermer</button>`;
        document.getElementById('modal-close-btn').onclick = closeModal;
    }

    overlay.classList.add('active');
}

export function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.classList.remove('active');
}

document.addEventListener('keydown', (e) => {
    const overlay = document.getElementById('modal-overlay');
    
    if (e.key === "Enter" && overlay && overlay.classList.contains('active')) {
        e.preventDefault(); 
        e.stopPropagation(); 
        const replayBtn = document.getElementById('btn-replay');
        const closeBtn = document.getElementById('modal-close-btn');
        
        const targetBtn = replayBtn || closeBtn;

        if (targetBtn && !targetBtn.disabled) {
            targetBtn.click();
        }
    }
});