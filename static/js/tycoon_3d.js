import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { state } from "./state.js";
import { verifierPseudo } from "./session.js";

/* =========================================
   1. CONFIGURATION & ASSETS (Kenney Furniture Kit)
   ========================================= */
const ASSETS = {
    // Le setup du joueur (Clicker)
    myDesk: '/static/models/desk.glb',
    myComputer: '/static/models/computer.glb',
    
    // Les upgrades (Mobilier)
    stagiaire: '/static/models/desk.glb',       // Ajoute un bureau
    correcteur: '/static/models/chair.glb',     // Ajoute une chaise
    imprimerie: '/static/models/bookcaseClosed.glb',   // Ajoute une armoire
    serveur: '/static/models/trashcan.glb',    // Ajoute une bibliothèque (Savoir)
    ia: '/static/models/lampRoundFloor.glb'               // Ajoute une lampe (Lumière/Idée)
};

const CONFIG = {
    upgrades: {
        stagiaire: { id: 'stagiaire', name: "Nouveau Bureau", baseCost: 15, production: 1 },
        correcteur: { id: 'correcteur', name: "Chaise Ergo", baseCost: 100, production: 5 },
        imprimerie: { id: 'imprimerie', name: "Archives", baseCost: 1100, production: 40 },
        serveur: { id: 'serveur', name: "Bibliothèque", baseCost: 12000, production: 250 },
        ia: { id: 'ia', name: "Éclairage IA", baseCost: 130000, production: 1500 }
    }
};

let gameState = {
    currency: 0,
    inventory: { stagiaire: 0, correcteur: 0, imprimerie: 0, serveur: 0, ia: 0 },
    lastSaveTime: Date.now()
};

/* =========================================
   2. SCÈNE & CAMÉRA ISO
   ========================================= */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xdddddd); // Fond clair (style Kenney)

// Caméra Isométrique
const aspect = window.innerWidth / window.innerHeight;
const d = 10;
const camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);
camera.position.set(20, 20, 20); 
camera.lookAt(scene.position);

const renderer = new THREE.WebGLRenderer({ 
    canvas: document.getElementById('game-canvas'), 
    antialias: true 
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

/* =========================================
   3. ÉCLAIRAGE (Style Bureau Lumineux)
   ========================================= */
const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(10, 20, 10);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
scene.add(dirLight);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // Lumière ambiante forte
scene.add(ambientLight);

/* =========================================
   4. CHARGEMENT & MONDE
   ========================================= */
const loader = new GLTFLoader();
const loadedModels = {};
let clickTargetMesh = null; // L'objet à cliquer (l'ordi)

async function loadWorld() {
    // 1. Sol (Tapis géant)
    const floorGeo = new THREE.PlaneGeometry(50, 50);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x8ecca6 }); // Vert pastel Kenney
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // 2. Précharger tous les modèles
    const promises = Object.entries(ASSETS).map(([key, url]) => {
        return new Promise((resolve) => {
            loader.load(url, (gltf) => {
                const model = gltf.scene;
                // Activer les ombres sur tout
                model.traverse(c => { if(c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
                loadedModels[key] = model;
                resolve();
            }, undefined, (e) => { console.warn(`Manque: ${url}`, e); resolve(); });
        });
    });

    await Promise.all(promises);
    console.log("Modèles chargés.");

    // 3. Installer le bureau du joueur (Centre)
    if (loadedModels.myDesk) {
        const desk = loadedModels.myDesk.clone();
        desk.position.set(0, 0, 0);
        scene.add(desk);
    } else {
        // Fallback cube si pas de modèle
        const cube = new THREE.Mesh(new THREE.BoxGeometry(2,1,1), new THREE.MeshStandardMaterial({color:0x555555}));
        cube.position.y = 0.5;
        scene.add(cube);
    }

    if (loadedModels.myComputer) {
        const pc = loadedModels.myComputer.clone();
        pc.position.set(0, 1, 0); // Posé sur le bureau (ajuster Y selon modèle)
        pc.userData = { isClickable: true }; // C'est lui qu'on clique !
        clickTargetMesh = pc;
        scene.add(pc);
    }
    
    // Spawn des objets déjà possédés
    sync3DWorld();
}

/* =========================================
   5. SPAWN D'OBJETS (Logique de Grille)
   ========================================= */
const spawnedObjects = { stagiaire: [], correcteur: [], imprimerie: [], serveur: [], ia: [] };

function spawnBuilding(type) {
    if (!loadedModels[type]) return;

    const mesh = loadedModels[type].clone();
    const index = spawnedObjects[type].length;

    // --- LOGIQUE DE PLACEMENT EN GRILLE / ZONES ---
    // On définit des zones pour chaque type d'objet pour que ça ressemble à un bureau organisé
    let x = 0, z = 0;
    const spacing = 2.5; // Espace entre les objets

    if (type === 'stagiaire') {
        // Zone Bureaux : Devant le joueur (Z positif)
        const rowSize = 4;
        const row = Math.floor(index / rowSize);
        const col = index % rowSize;
        x = (col - 1.5) * spacing; 
        z = 4 + (row * spacing); // Commence à Z=4
    } 
    else if (type === 'correcteur') {
        // Les chaises vont... avec les bureaux des stagiaires !
        // On essaie de les placer derrière les bureaux existants
        const rowSize = 4;
        const row = Math.floor(index / rowSize);
        const col = index % rowSize;
        x = (col - 1.5) * spacing;
        z = 4 + (row * spacing) + 1; // +1 en Z pour être derrière le bureau
        mesh.rotation.y = Math.PI; // Face au bureau
    }
    else if (type === 'imprimerie') {
        // Zone Archives : À gauche (X négatif)
        x = -8 - (Math.floor(index/5) * 2);
        z = (index % 5) * 2 - 4;
        mesh.rotation.y = Math.PI / 2;
    }
    else if (type === 'serveur') {
        // Zone Serveurs : À droite (X positif)
        x = 8 + (Math.floor(index/5) * 2);
        z = (index % 5) * 2 - 4;
        mesh.rotation.y = -Math.PI / 2;
    }
    else if (type === 'ia') {
        // Lampes : Dispersées aléatoirement pour l'ambiance
        const angle = index * 137.5; // Angle d'or pour dispersion naturelle
        const radius = 6 + (index * 0.5);
        x = Math.cos(angle) * radius;
        z = Math.sin(angle) * radius;
    }

    mesh.position.set(x, 0, z);
    
    // Animation Pop
    mesh.scale.set(0,0,0);
    scene.add(mesh);
    spawnedObjects[type].push(mesh);

    let s = 0;
    const anim = setInterval(() => {
        s += 0.1;
        mesh.scale.set(s,s,s);
        if(s >= 1) clearInterval(anim);
    }, 16);
}

function sync3DWorld() {
    for (const [key, count] of Object.entries(gameState.inventory)) {
        if (!spawnedObjects[key]) continue;
        const diff = count - spawnedObjects[key].length;
        if (diff > 0) {
            for(let i=0; i<diff; i++) spawnBuilding(key);
        }
    }
}

/* =========================================
   6. INTERACTION (CLIC)
   ========================================= */
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('mousedown', onMouseDown);

function onMouseDown(event) {
    if (event.target.closest('.hud-bottom') || event.target.closest('.hud-top')) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    // On peut cliquer sur l'ordi ou le bureau
    const intersects = raycaster.intersectObjects(scene.children, true);
    let clicked = false;

    // Si on clique sur l'ordi (cible prioritaire)
    for (let i = 0; i < intersects.length; i++) {
        // On remonte jusqu'à l'objet racine du modèle si besoin
        let obj = intersects[i].object;
        while(obj.parent && obj.parent !== scene) obj = obj.parent;
        
        // Si c'est l'ordi ou le bureau
        if (obj === clickTargetMesh || (loadedModels.myDesk && obj === loadedModels.myDesk) || intersects[i].object.userData.isClickable) {
            triggerClickEffect();
            clicked = true;
            break;
        }
    }
    
    // Fallback : Si on clique dans le vide mais qu'on veut être sympa pour l'UX
    if (!clicked) triggerClickEffect();
}

function triggerClickEffect() {
    gameState.currency += 1;
    updateUI();

    // Animation de saut de l'ordi
    if (clickTargetMesh) {
        clickTargetMesh.position.y += 0.2;
        setTimeout(() => clickTargetMesh.position.y -= 0.2, 50);
    }
}

/* =========================================
   7. LOGIQUE MOTEUR (Idem précédent)
   ========================================= */
function initHUD() {
    const container = document.getElementById("upgrades-container");
    container.innerHTML = "";
    for (const key in CONFIG.upgrades) {
        const item = CONFIG.upgrades[key];
        const div = document.createElement("div");
        div.className = "upgrade-card-3d";
        div.id = `card-${key}`;
        div.onclick = () => buyUpgrade(key);
        div.innerHTML = `
            <div>${item.name}</div>
            <div style="font-size:0.7em; color:#aaa;">+${item.production}/s</div>
            <div style="color:var(--accent); font-weight:bold;" id="cost-${key}">...</div>
            <div style="font-size:0.7em;">Qté: <span id="count-${key}">0</span></div>
        `;
        container.appendChild(div);
    }
}

function getCost(id) {
    const base = CONFIG.upgrades[id].baseCost;
    const count = gameState.inventory[id];
    return Math.floor(base * Math.pow(1.15, count));
}

function calculatePPS() {
    let pps = 0;
    for (const [key, count] of Object.entries(gameState.inventory)) {
        if (CONFIG.upgrades[key]) pps += count * CONFIG.upgrades[key].production;
    }
    return pps;
}

function buyUpgrade(id) {
    const cost = getCost(id);
    if (gameState.currency >= cost) {
        gameState.currency -= cost;
        gameState.inventory[id]++;
        spawnBuilding(id);
        updateUI();
        saveGame();
    }
}

function updateUI() {
    document.getElementById("currency-display").textContent = Math.floor(gameState.currency).toLocaleString();
    document.getElementById("pps-display").textContent = calculatePPS().toLocaleString();
    for (const key in CONFIG.upgrades) {
        const cost = getCost(key);
        const card = document.getElementById(`card-${key}`);
        document.getElementById(`cost-${key}`).textContent = cost.toLocaleString();
        document.getElementById(`count-${key}`).textContent = gameState.inventory[key];
        if (gameState.currency < cost) card.classList.add("disabled");
        else card.classList.remove("disabled");
    }
}

async function saveGame() {
    if (!state.currentUser) return;
    try {
        await fetch("/tycoon/save", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json", 
                "Authorization": `Bearer ${localStorage.getItem("access_token")}` 
            },
            body: JSON.stringify({ save_data: { 
                currency: gameState.currency, 
                inventory: gameState.inventory, 
                last_timestamp: Date.now() 
            }})
        });
    } catch (e) { console.error(e); }
}

async function loadGame() {
    if (!state.currentUser) return;
    try {
        const res = await fetch("/tycoon/load", {
            headers: { "Authorization": `Bearer ${localStorage.getItem("access_token")}` }
        });
        if (res.ok) {
            const data = await res.json();
            if (data && data.inventory) {
                gameState.currency = data.currency || 0;
                gameState.inventory = { ...gameState.inventory, ...data.inventory };
                if (data.last_timestamp) {
                    const sec = (Date.now() - data.last_timestamp) / 1000;
                    const gain = calculatePPS() * sec;
                    if (gain > 0) gameState.currency += gain;
                }
            }
        }
    } catch (e) { console.error(e); }
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    
    // Idle logic
    const pps = calculatePPS();
    if (pps > 0) {
        gameState.currency += pps / 60;
        updateUI();
    }
}

window.addEventListener('resize', () => {
    const aspect = window.innerWidth / window.innerHeight;
    camera.left = -d * aspect;
    camera.right = d * aspect;
    camera.top = d;
    camera.bottom = -d;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

document.addEventListener("DOMContentLoaded", async () => {
    if (!verifierPseudo()) return;
    initHUD();
    await loadWorld();
    await loadGame();
    sync3DWorld(); 
    setInterval(saveGame, 30000);
    animate();
});