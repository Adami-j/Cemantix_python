document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('auth-modal');
    const btnProfile = document.getElementById('btn-profile');
    
    // Vérification de la session au chargement
    const token = localStorage.getItem('access_token');
    const username = localStorage.getItem('arcade_user_pseudo'); // On utilise la même clé que main.js pour compatibilité
    
    if (token && username) {
        updateProfileUI(username);
    }

    // Gestion du clic sur le bouton Profil
    if (btnProfile) {
        btnProfile.addEventListener('click', (e) => {
            e.preventDefault();
            
            if (localStorage.getItem('access_token')) {
                if (confirm("Voulez-vous vous déconnecter ?")) {
                    logout();
                }
            } else {
                modal.classList.add('active');
            }
        });
    }

    // Gestion de la soumission Login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;
            await performAuth('/auth/login', { username, password }, 'login-error');
        });
    }

    // Gestion de la soumission Inscription
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('register-username').value;
            const password = document.getElementById('register-password').value;
            await performAuth('/auth/register', { username, password }, 'register-error');
        });
    }
});

// Fonction exposée globalement pour les boutons de tab
window.switchAuthTab = function(tab) {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');

    if (tab === 'login') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        tabLogin.classList.remove('active');
        tabRegister.classList.add('active');
    }
};

async function performAuth(endpoint, data, errorId) {
    const errorElem = document.getElementById(errorId);
    errorElem.textContent = "";
    
    // Feedback visuel (bouton en chargement)
    const btn = document.querySelector(endpoint.includes('login') ? '#login-form button' : '#register-form button');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Chargement...";

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.detail || "Erreur inconnue");
        }

        // Succès : Stockage
        localStorage.setItem('access_token', result.access_token);
        localStorage.setItem('arcade_user_pseudo', result.username);

        // Mise à jour UI et fermeture
        updateProfileUI(result.username);
        document.getElementById('auth-modal').classList.remove('active');
        
        // Optionnel : Notification de succès
        const msg = endpoint.includes('register') ? "Compte créé avec succès !" : "Connexion réussie !";
        showSuccessModal(msg);

    } catch (err) {
        errorElem.textContent = err.message;
        errorElem.style.color = "#ff6b6b";
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

function showSuccessModal(message) {
    const modal = document.getElementById('success-modal');
    const msgElement = document.getElementById('success-message');
    
    if (modal && msgElement) {
        msgElement.textContent = message;
        modal.classList.add('active');
        
        setTimeout(() => {
            modal.classList.remove('active');
        }, 2000);
    } else {
        alert(message);
    }
}

function updateProfileUI(username) {
    const display = document.getElementById('profile-name-display');
    const btn = document.getElementById('btn-profile');
    
    if (display) display.textContent = username;
    if (btn) {
        btn.classList.add('logged-in');
        const avatar = btn.querySelector('.avatar');
        if(avatar) avatar.textContent = "😎";
    }
}

function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('arcade_user_pseudo');
    location.reload();
}

function showSuccessModal(message) {
    const modal = document.getElementById('success-modal');
    const msgElement = document.getElementById('success-message');
    
    if (modal && msgElement) {
        msgElement.textContent = message;
        modal.classList.add('active');
        
        // Fermeture automatique après 2 secondes
        setTimeout(() => {
            modal.classList.remove('active');
        }, 2000);
    }
}

async function loginUser(username, password) {
    try {
        const formData = new URLSearchParams();
        formData.append("username", username);
        formData.append("password", password);

        const response = await fetch("/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: formData,
        });

        const data = await response.json();

        if (response.ok) {
            // Sauvegarder le token
            localStorage.setItem("access_token", data.access_token);
            localStorage.setItem("username", username); // On garde le pseudo pour l'affichage
            
            // Fermer la modale de connexion
            const authModal = document.getElementById('auth-modal');
            if (authModal) authModal.classList.remove('active');

            // AFFICHER LA NOUVELLE MODALE DE SUCCÈS
            showSuccessModal("Connexion réussie !");

            // Mettre à jour l'interface
            updateAuthUI();
        } else {
            // Idéalement, faire une modale d'erreur aussi ici
            alert("Erreur: " + (data.detail || "Identifiants incorrects"));
        }
    } catch (error) {
        console.error("Erreur login:", error);
        alert("Erreur de connexion au serveur.");
    }
}

export function setupAuthListeners() {
    // ... (votre code pour switchTab, loginForm submit, etc.) ...

    // Gestionnaire pour le bouton "Se déconnecter" du menu
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // OUVRIR LA MODALE DE CONFIRMATION AU LIEU DE CONFIRM()
            const logoutModal = document.getElementById('logout-modal');
            if (logoutModal) logoutModal.classList.add('active');
        });
    }

    // Gestionnaires pour la modale de déconnexion (Oui / Non)
    const confirmLogout = document.getElementById('confirm-logout-btn');
    const cancelLogout = document.getElementById('cancel-logout-btn');
    const logoutModal = document.getElementById('logout-modal');

    if (confirmLogout) {
        confirmLogout.addEventListener('click', () => {
            // Action réelle de déconnexion
            localStorage.removeItem("access_token");
            localStorage.removeItem("username");
            updateAuthUI();
            
            // Fermer la modale
            if (logoutModal) logoutModal.classList.remove('active');
            
            showSuccessModal("Vous êtes déconnecté.");
        });
    }

    if (cancelLogout) {
        cancelLogout.addEventListener('click', () => {
            // Juste fermer la modale
            if (logoutModal) logoutModal.classList.remove('active');
        });
    }
}