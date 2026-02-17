// ===================================
// IMPORT FIREBASE
// ===================================
import { db } from './firebase.js';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";

// ===================================
// CANVAS BACKGROUND
// ===================================
const canvas = document.getElementById('creative-bg');
if (canvas) {
    const ctx = canvas.getContext('2d');

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const particles = [];
    const particleCount = window.innerWidth < 768 ? 50 : 100;

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.8;
            this.vy = (Math.random() - 0.5) * 0.8;
            this.radius = Math.random() * 2 + 1;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,107,53,0.6)';
            ctx.fill();
        }
    }

    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 120) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(255,107,53,${1 - dist / 120})`;
                    ctx.lineWidth = 0.5;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(animate);
    }
    animate();
}

// ===================================
// VARIABLES GLOBALES
// ===================================
let messagesData = [];
let currentMessage = null;
let currentFilter = 'all';

// DOM Elements
const messagesContainer = document.getElementById('messages-container');
const searchInput = document.getElementById('search-input');
const filterButtons = document.querySelectorAll('.filter-btn');
const btnRefresh = document.getElementById('btn-refresh');
const logoutBtn = document.getElementById('btn-logout');
const statTotal = document.getElementById('stat-total');
const statUnread = document.getElementById('stat-unread');
const statRead = document.getElementById('stat-read');
const statToday = document.getElementById('stat-today');
const messageModal = document.getElementById('message-modal');
const closeModalBtn = document.getElementById('close-modal');
const btnToggleRead = document.getElementById('btn-toggle-read');
const btnDeleteMessage = document.getElementById('btn-delete-message');
const responseText = document.getElementById('response-text');
const btnSendResponse = document.getElementById('btn-send-response');
const readStatusText = document.getElementById('read-status-text');

// Menu latéral
const btnMenu = document.getElementById('btn-menu');
const sideMenu = document.getElementById('side-menu');
const closeMenu = document.getElementById('close-menu');
const menuOverlay = document.getElementById('menu-overlay');

// ===================================
// NOTIFICATION
// ===================================
function showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notif = document.createElement('div');
    notif.className = `notification notification-${type}`;
    const icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
    notif.innerHTML = `<i class="fas ${icon}"></i><span>${message}</span>`;
    document.body.appendChild(notif);

    setTimeout(() => { notif.style.transform = 'translateX(0)'; notif.style.opacity = '1'; }, 10);
    setTimeout(() => { notif.style.transform = 'translateX(400px)'; notif.style.opacity = '0'; setTimeout(() => notif.remove(), 300); }, 5000);
}

// ===================================
// MENU LATÉRAL
// ===================================
if (btnMenu && sideMenu && closeMenu && menuOverlay) {
    btnMenu.addEventListener('click', () => {
        sideMenu.classList.add('active');
        menuOverlay.classList.add('active');
    });
    closeMenu.addEventListener('click', () => {
        sideMenu.classList.remove('active');
        menuOverlay.classList.remove('active');
    });
    menuOverlay.addEventListener('click', () => {
        sideMenu.classList.remove('active');
        menuOverlay.classList.remove('active');
    });
}

// ===================================
// LOAD MESSAGES FROM FIRESTORE
// ===================================
async function loadMessages() {
    if (!messagesContainer) return;

    messagesContainer.innerHTML = `<div class="loading"><i class="fas fa-spinner fa-spin"></i><p>Chargement des messages...</p></div>`;

    try {
        const messagesCol = collection(db, "messages");
        const q = query(messagesCol, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        messagesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        displayMessages(messagesData);
        updateStats();
    } catch (err) {
        console.error(err);
        messagesContainer.innerHTML = `<div style="color:white;text-align:center;padding:40px"><h3>Erreur de chargement</h3><p>${err.message}</p></div>`;
    }
}

// ===================================
// DISPLAY MESSAGES
// ===================================
function displayMessages(messages) {
    if (!messagesContainer) return;
    if (!Array.isArray(messages) || messages.length === 0) {
        messagesContainer.innerHTML = `<div class="empty-state"><i class="fas fa-inbox"></i><h3>Aucun message trouvé</h3></div>`;
        return;
    }

    messagesContainer.innerHTML = messages.map(m => {
        m.lu = m.lu ?? false;
        const date = m.createdAt ? new Date(m.createdAt.seconds * 1000).toLocaleString('fr-FR') : 'Date inconnue';
        return `
            <div class="message-card ${m.lu ? 'read' : 'unread'}" data-id="${m.id}">
                <div class="message-status ${m.lu ? 'read' : 'unread'}">
                    <i class="fas ${m.lu ? 'fa-check-circle' : 'fa-envelope'}"></i>
                </div>
                <div class="message-content">
                    <div class="message-header">
                        <h4>${m.nom || 'Nom inconnu'}</h4>
                        <span>${date}</span>
                    </div>
                    <p class="message-subject">${m.sujet || 'Sans sujet'}</p>
                    <p class="message-preview">${(m.message || '').substring(0,120)}...</p>
                    <small><i class="fas fa-envelope"></i> ${m.email || 'Email inconnu'}</small>
                </div>
            </div>
        `;
    }).join('');

    document.querySelectorAll('.message-card').forEach(card => {
        card.addEventListener('click', () => openMessageModal(card.dataset.id));
    });
}

// ===================================
// MODAL MESSAGE
// ===================================
function openMessageModal(id) {
    currentMessage = messagesData.find(m => m.id === id);
    if (!currentMessage) { showNotification('Message introuvable', 'error'); return; }

    document.getElementById('detail-nom').textContent = currentMessage.nom || 'Nom inconnu';
    document.getElementById('detail-email').textContent = currentMessage.email || 'Email inconnu';
    document.getElementById('detail-sujet').textContent = currentMessage.sujet || 'Pas de sujet';
    document.getElementById('detail-date').textContent = currentMessage.createdAt ? new Date(currentMessage.createdAt.seconds*1000).toLocaleString('fr-FR') : 'Date inconnue';
    document.getElementById('detail-message').textContent = currentMessage.message || 'Pas de message';
    readStatusText.textContent = currentMessage.lu ? 'Marquer comme non lu' : 'Marquer comme lu';
    responseText.value = '';
    if (messageModal) messageModal.style.display = 'flex';
}

if (closeModalBtn) closeModalBtn.addEventListener('click', () => { messageModal.style.display = 'none'; });

// ===================================
// MARQUER LU / NON LU
// ===================================
if (btnToggleRead) btnToggleRead.addEventListener('click', async () => {
    if (!currentMessage) return;
    const messageRef = doc(db, "messages", currentMessage.id);
    await updateDoc(messageRef, { lu: !currentMessage.lu });
    currentMessage.lu = !currentMessage.lu;
    displayMessages(messagesData);
    showNotification('Statut mis à jour', 'success');
});

// ===================================
// SUPPRIMER MESSAGE
// ===================================
if (btnDeleteMessage) btnDeleteMessage.addEventListener('click', async () => {
    if (!currentMessage) return;
    const confirmDelete = window.confirm('Voulez-vous supprimer ce message ?');
    if (!confirmDelete) return;
    await deleteDoc(doc(db, "messages", currentMessage.id));
    messagesData = messagesData.filter(m => m.id !== currentMessage.id);
    displayMessages(messagesData);
    messageModal.style.display = 'none';
    showNotification('Message supprimé', 'success');
});

// ===================================
// RECHERCHE & FILTRES
// ===================================
if (searchInput) searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase();
    displayMessages(applyFilter(messagesData.filter(m =>
        (m.nom||'').toLowerCase().includes(query) ||
        (m.email||'').toLowerCase().includes(query) ||
        (m.sujet||'').toLowerCase().includes(query) ||
        (m.message||'').toLowerCase().includes(query)
    )));
});

if (filterButtons) filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        displayMessages(applyFilter(messagesData));
    });
});

function applyFilter(messages) {
    if (currentFilter === 'read') return messages.filter(m => m.lu);
    if (currentFilter === 'unread') return messages.filter(m => !m.lu);
    return messages;
}

// ===================================
// STATS
// ===================================
function updateStats() {
    const total = messagesData.length;
    const read = messagesData.filter(m => m.lu).length;
    const unread = total - read;
    const today = messagesData.filter(m => {
        if (!m.createdAt) return false;
        const d = new Date(m.createdAt.seconds*1000);
        const now = new Date();
        return d.toDateString() === now.toDateString();
    }).length;
    if (statTotal) statTotal.textContent = total;
    if (statRead) statRead.textContent = read;
    if (statUnread) statUnread.textContent = unread;
    if (statToday) statToday.textContent = today;
}

// ===================================
// LOGOUT
// ===================================
if (logoutBtn) logoutBtn.addEventListener('click', () => {
    if (confirm('Voulez-vous vraiment vous déconnecter ?')) window.location.href = 'index.html';
});

// ===================================
// INIT
// ===================================
window.addEventListener('DOMContentLoaded', () => {
    loadMessages();
});
