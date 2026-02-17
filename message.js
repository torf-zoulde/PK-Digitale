// ===================================
// CONFIGURATION FIREBASE
// ===================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

// ⚡ Remplacez avec vos informations Firebase Web
const firebaseConfig = {
    apiKey: "AIzaSyC0BEXAMPLE_1234567890abcdef",  // ton apiKey
    authDomain: "sk-digitale.firebaseapp.com",     // ton authDomain
    projectId: "sk-digitale",                      // ton projectId
    storageBucket: "sk-digitale.appspot.com",     // ton storageBucket
    messagingSenderId: "1234567890",              // ton messagingSenderId
    appId: "1:1234567890:web:abcdef123456"        // ton appId
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ⚡ Exporter pour l’utiliser dans tes autres scripts
export { app, db, auth };

// ===================================
// VARIABLES GLOBALES
// ===================================
let messagesData = [];
let currentMessage = null;
let currentFilter = 'all';

// Éléments DOM
const messagesContainer = document.getElementById('messages-container');
const searchInput = document.getElementById('search-input');
const filterButtons = document.querySelectorAll('.filter-btn');
const btnRefresh = document.getElementById('btn-refresh');
const btnToggleRead = document.getElementById('btn-toggle-read');
const btnDeleteMessage = document.getElementById('btn-delete-message');
const btnSendResponse = document.getElementById('btn-send-response');
const responseText = document.getElementById('response-text');
const readStatusText = document.getElementById('read-status-text');

const messageModal = document.getElementById('message-modal');

// ===================================
// NOTIFICATIONS
// ===================================
function showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    const notif = document.createElement('div');
    notif.className = `notification notification-${type}`;
    const icon = type==='success'?'fa-check-circle':type==='error'?'fa-exclamation-circle':'fa-info-circle';
    notif.innerHTML = `<i class="fas ${icon}"></i><span>${message}</span>`;
    document.body.appendChild(notif);
    setTimeout(()=>{ notif.style.transform='translateX(0)'; notif.style.opacity='1'; },10);
    setTimeout(()=>{ notif.style.transform='translateX(400px)'; notif.style.opacity='0'; setTimeout(()=>notif.remove(),300); },5000);
}

// ===================================
// CHARGER LES MESSAGES
// ===================================
async function loadMessages() {
    if(!messagesContainer) return;
    messagesContainer.innerHTML = `<div class="loading"><i class="fas fa-spinner fa-spin"></i><p>Chargement des messages...</p></div>`;
    try {
        const snapshot = await getDocs(messagesCollection);
        messagesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        displayMessages(messagesData);
    } catch(err) {
        console.error(err);
        messagesContainer.innerHTML = `<p style="color:white;text-align:center;">Erreur de chargement</p>`;
    }
}

// ===================================
// AFFICHER LES MESSAGES
// ===================================
function displayMessages(messages) {
    if(!messagesContainer) return;
    if(!Array.isArray(messages) || messages.length===0){
        messagesContainer.innerHTML = `<div class="empty-state"><i class="fas fa-inbox"></i><h3>Aucun message trouvé</h3></div>`;
        return;
    }

    messagesContainer.innerHTML = messages.map(m=>{
        m.lu = m.lu ?? false;
        const date = m.createdAt ? new Date(m.createdAt).toLocaleString('fr-FR') : 'Date inconnue';
        return `<div class="message-card ${m.lu?'read':'unread'}" data-id="${m.id}">
                    <div class="message-status ${m.lu?'read':'unread'}">
                        <i class="fas ${m.lu?'fa-check-circle':'fa-envelope'}"></i>
                    </div>
                    <div class="message-content">
                        <div class="message-header"><h4>${m.nom||'Nom inconnu'}</h4><span>${date}</span></div>
                        <p class="message-subject">${m.sujet||'Sans sujet'}</p>
                        <p class="message-preview">${(m.message||'').substring(0,120)}...</p>
                        <small><i class="fas fa-envelope"></i> ${m.email||'Email inconnu'}</small>
                    </div>
                </div>`;
    }).join('');

    document.querySelectorAll('.message-card').forEach(card=>{
        card.addEventListener('click',()=>openMessageModal(card.dataset.id));
    });
}

// ===================================
// MODAL MESSAGE
// ===================================
function openMessageModal(id){
    currentMessage = messagesData.find(m => m.id===id);
    if(!currentMessage) return showNotification('Message introuvable','error');

    document.getElementById('detail-nom').textContent = currentMessage.nom || '';
    document.getElementById('detail-email').textContent = currentMessage.email || '';
    document.getElementById('detail-sujet').textContent = currentMessage.sujet || '';
    document.getElementById('detail-date').textContent = currentMessage.createdAt ? new Date(currentMessage.createdAt).toLocaleString('fr-FR'):'';
    document.getElementById('detail-message').textContent = currentMessage.message || '';

    readStatusText.textContent = currentMessage.lu ? 'Marquer comme non lu' : 'Marquer comme lu';
    responseText.value = '';

    if(messageModal) messageModal.style.display='flex';
}

const closeModalBtn = document.getElementById('close-modal');
if(closeModalBtn) closeModalBtn.addEventListener('click',()=>{if(messageModal) messageModal.style.display='none';});

// ===================================
// MARQUER COMME LU / NON LU
// ===================================
if(btnToggleRead){
    btnToggleRead.addEventListener('click', async()=>{
        if(!currentMessage) return;
        const docRef = doc(db,'messages',currentMessage.id);
        currentMessage.lu = !currentMessage.lu;
        await updateDoc(docRef,{lu: currentMessage.lu});
        readStatusText.textContent = currentMessage.lu ? 'Marquer comme non lu' : 'Marquer comme lu';
        loadMessages();
        showNotification('Statut mis à jour','success');
    });
}

// ===================================
// SUPPRIMER MESSAGE
// ===================================
if(btnDeleteMessage){
    btnDeleteMessage.addEventListener('click', async()=>{
        if(!currentMessage) return;
        if(confirm('Voulez-vous vraiment supprimer ce message ?')){
            const docRef = doc(db,'messages',currentMessage.id);
            await deleteDoc(docRef);
            if(messageModal) messageModal.style.display='none';
            loadMessages();
            showNotification('Message supprimé','success');
        }
    });
}

// ===================================
// ENVOYER RÉPONSE
// ===================================
if(btnSendResponse){
    btnSendResponse.addEventListener('click', async()=>{
        if(!currentMessage) return;
        const response = responseText.value.trim();
        if(!response) return showNotification('Écrire un message','error');
        const docRef = doc(db,'messages',currentMessage.id);
        await updateDoc(docRef,{response, respondedAt: new Date().toISOString()});
        showNotification('Réponse enregistrée','success');
        responseText.value='';
        loadMessages();
    });
}

// ===================================
// RECHERCHE ET FILTRE
// ===================================
if(searchInput){
    searchInput.addEventListener('input', ()=>{
        const query = searchInput.value.toLowerCase();
        const filtered = messagesData.filter(m =>
            (m.nom||'').toLowerCase().includes(query) ||
            (m.email||'').toLowerCase().includes(query) ||
            (m.sujet||'').toLowerCase().includes(query) ||
            (m.message||'').toLowerCase().includes(query)
        );
        displayMessages(applyFilter(filtered));
    });
}

function applyFilter(messages){
    if(currentFilter==='read') return messages.filter(m=>m.lu);
    if(currentFilter==='unread') return messages.filter(m=>!m.lu);
    return messages;
}

if(filterButtons){
    filterButtons.forEach(btn=>{
        btn.addEventListener('click', ()=>{
            filterButtons.forEach(b=>b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            displayMessages(applyFilter(messagesData));
        });
    });
}

// ===================================
// ACTUALISER
// ===================================
if(btnRefresh){
    btnRefresh.addEventListener('click',()=>{
        loadMessages();
        showNotification('Messages actualisés','success');
    });
}

// ===================================
// EXPORT CSV
// ===================================
function exportData(){
    if(messagesData.length===0) return showNotification('Aucune donnée à exporter','error');
    const csvContent = [
        ['Date','Nom','Email','Sujet','Message','Statut'].join(','),
        ...messagesData.map(m=>[
            m.createdAt ? new Date(m.createdAt).toLocaleString('fr-FR') : 'N/A',
            `"${m.nom||'N/A'}"`,
            m.email||'N/A',
            `"${m.sujet||'N/A'}"`,
            `"${(m.message||'').replace(/"/g,'""')}"`,
            m.lu ? 'Lu' : 'Non lu'
        ].join(','))
    ].join('\n');
    const blob = new Blob([csvContent],{type:'text/csv;charset=utf-8;'});
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `messages_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showNotification('Données exportées','success');
}

// ===================================
// INIT
// ===================================
window.addEventListener('DOMContentLoaded', ()=>{
    console.log('📂 Messages.js Firebase chargé');
    loadMessages();
});
