// static/js/auth.js

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
            e.preventDefault(); // Empêche tout comportement par défaut
            
            if (localStorage.getItem('access_token')) {
                // Déjà connecté : On propose la déconnexion
                if (confirm("Voulez-vous vous déconnecter ?")) {
                    logout();
                }
            } else {
                // Pas connecté : On ouvre la modale
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
        alert(endpoint.includes('register') ? "Compte créé et connecté !" : "Connexion réussie !");

    } catch (err) {
        errorElem.textContent = err.message;
        errorElem.style.color = "#ff6b6b";
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

function updateProfileUI(username) {
    const display = document.getElementById('profile-name-display');
    const btn = document.getElementById('btn-profile');
    
    if (display) display.textContent = username;
    if (btn) {
        btn.classList.add('logged-in');
        // On change l'icône pour montrer qu'on est connecté
        const avatar = btn.querySelector('.avatar');
        if(avatar) avatar.textContent = "😎";
    }
}

function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('arcade_user_pseudo'); // On garde le pseudo "invité" si on veut, ou on le supprime
    location.reload(); // On recharge pour remettre l'état à zéro
}