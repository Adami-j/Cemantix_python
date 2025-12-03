import { showModal, closeModal } from "./ui.js";
import { state } from "./state.js";

// C'est cette fonction qui est appelée quand on clique sur le bouton "Connexion"
export function openLoginModal() {
    // 1. On cherche d'abord la NOUVELLE fenêtre de connexion (celle du Hub)
    const authModal = document.getElementById('auth-modal');
    
    if (authModal) {
        // Si elle existe, on l'affiche simplement !
        authModal.classList.add('active');
        
        // On remet l'onglet "Connexion" par défaut si la fonction existe
        if (window.switchAuthTab) {
            window.switchAuthTab('login');
        }
        return; // On s'arrête là, c'est fini.
    }

    // 2. Si on n'a pas trouvé #auth-modal, c'est qu'on est probablement EN JEU.
    // On utilise alors l'ancien système pour afficher le pseudo verrouillé.
    const overlay = document.getElementById('modal-overlay');
    const titleEl = document.getElementById('modal-title');
    const contentEl = document.getElementById('modal-content');
    const actionsEl = document.getElementById('modal-actions') || document.querySelector('.modal-actions');

    if (overlay && actionsEl) {
        const htmlContent = `
            <div style="margin-bottom: 20px;">
                <p>Vous êtes connecté en tant que :</p>
                <input type="text" value="${state.currentUser || 'Invité'}" disabled style="margin-top:15px; text-align:center; opacity:0.7;">
                <p class="locked-message">🔒 Pseudo verrouillé en partie.</p>
            </div>`;
            
        const buttonsHtml = `
            <div style="display:flex; flex-direction:column; gap:10px; width:100%;">
                <button class="btn" onclick="closeModal()">Fermer</button>
                <button class="btn btn-danger" onclick="logout()">Se déconnecter & Quitter</button>
            </div>`;

        titleEl.textContent = "PROFIL";
        contentEl.innerHTML = htmlContent;
        actionsEl.innerHTML = buttonsHtml;
        overlay.classList.add('active');
    }
}

export function closeConfigModal() {
    const modal = document.getElementById('config-modal');
    if (modal) modal.classList.remove('active');
}

// --- Gestion des Bugs (Rien ne change ici) ---
export function openBugModal() {
    const htmlContent = `
        <div class="bug-form" style="text-align:left;">
            <p style="margin-bottom:10px;">Oups ! Quelque chose ne va pas ? Décrivez le problème :</p>
            <textarea id="bug-desc" placeholder="Ex: Le jeu plante quand je clique sur..."></textarea>
            <p style="font-size:0.8rem; color:var(--text-muted); margin-top:5px;">
                Signalé par : <strong>${state.currentUser || "Anonyme"}</strong>
            </p>
        </div>
    `;

    showModal("SIGNALER UN BUG", htmlContent);
    
    const actionsDiv = document.getElementById('modal-actions');
    if (actionsDiv) {
        actionsDiv.innerHTML = `
            <div style="display: flex; gap: 10px; justify-content: center; width: 100%;">
                <button id="btn-submit-bug" class="btn btn-danger">Envoyer</button>
                <button class="btn btn-outline" onclick="closeModal()">Annuler</button>
            </div>
        `;
    }

    // Attachement de l'événement au nouveau bouton créé
    setTimeout(() => {
        const submitBtn = document.getElementById('btn-submit-bug');
        if (submitBtn) {
            submitBtn.onclick = function() {
                sendBugReport(state.currentUser || "Anonyme");
            };
        }
        const txt = document.getElementById('bug-desc');
        if(txt) txt.focus();
    }, 50);
}

export async function sendBugReport(player) {
    const descInput = document.getElementById('bug-desc');
    const description = descInput.value.trim();
    
    if (!description) {
        descInput.style.borderColor = "red";
        return;
    }

    const btn = document.getElementById('btn-submit-bug');
    if(btn) {
        btn.disabled = true;
        btn.textContent = "Envoi...";
    }

    const params = new URLSearchParams(window.location.search);
    const roomId = params.get("room");
    const context = roomId ? `Room ${roomId}` : "Hub Principal";

    try {
        const res = await fetch('/report-bug', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                player_name: player,
                description: description,
                context: context
            })
        });

        if (res.ok) {
            const modalContent = document.getElementById('modal-content');
            if(modalContent) modalContent.innerHTML = `<div style="color:var(--success); font-size:1.2rem; margin:20px 0;">✅ Message envoyé !</div>`;
            setTimeout(() => { if(window.closeModal) window.closeModal(); }, 1500);
        } else {
            alert("Erreur lors de l'envoi.");
            if(window.closeModal) window.closeModal();
        }
    } catch (e) {
        console.error(e);
        alert("Erreur réseau.");
        if(window.closeModal) window.closeModal();
    }
};

export function injectBugButton() {
    if (document.getElementById('bug-trigger')) return;
    const btn = document.createElement('button');
    btn.id = 'bug-trigger';
    btn.className = 'bug-float-btn';
    btn.innerHTML = '🐛';
    btn.title = "Signaler un bug";
    btn.onclick = openBugModal;
    document.body.appendChild(btn);
}

// Initialisation globale
document.addEventListener("DOMContentLoaded", () => {
    injectBugButton();
});

// Exposition pour le HTML (onclick)
window.openLoginModal = openLoginModal;
window.closeModal = closeModal;