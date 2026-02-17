console.log('🔥 main.js chargé');

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
// FIREBASE IMPORTS
// ===================================


import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// ===================================
// CANVAS BACKGROUND ANIMATION
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
            ctx.fillStyle = 'rgba(14,165,233,0.6)';
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
        requestAnimationFrame(animate);
    }
    animate();
}

// ===================================
// MENU MOBILE
// ===================================
const menuBtn = document.getElementById('menuBtn');
const menu = document.getElementById('menu');

if (menuBtn && menu) {
    menuBtn.addEventListener('click', e => {
        e.stopPropagation();
        menu.classList.toggle('active');
        menuBtn.classList.toggle('active');
    });

    document.addEventListener('click', e => {
        if (!menu.contains(e.target) && !menuBtn.contains(e.target)) {
            menu.classList.remove('active');
            menuBtn.classList.remove('active');
        }
    });
}

// ===================================
// FORMULAIRE CONTACT → FIRESTORE
// ===================================
const btnContact = document.getElementById('btn-contact');
const formContact = document.getElementById('form-contact');

if (btnContact && formContact) {
    btnContact.addEventListener('click', () => {
        formContact.classList.toggle('active');
    });

    formContact.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nom = document.getElementById('nom').value.trim();
        const email = document.getElementById('email').value.trim();
        const sujet = document.getElementById('sujet').value.trim();
        const message = document.getElementById('message').value.trim();

        if (!nom || !email || !sujet || !message) {
            showNotification('Veuillez remplir tous les champs', 'error');
            return;
        }

        try {
            await addDoc(collection(db, "messages"), {
                nom,
                email,
                sujet,
                message,
                createdAt: serverTimestamp()
            });

            showNotification('Message envoyé avec succès 🎉', 'success');
            formContact.reset();
            formContact.classList.remove('active');

        } catch (error) {
            console.error(error);
            showNotification('Erreur lors de l’envoi', 'error');
        }
    });
}

// ===================================
// LOGIN ADMIN FIREBASE
// ===================================

const loginForm = document.getElementById('login-form');
const errorMessage = document.getElementById('error-message');
const errorText = document.getElementById('error-text');
const loadingIndicator = document.getElementById('loading-indicator');
const togglePassword = document.getElementById('toggle-password');

if (togglePassword) {
  togglePassword.addEventListener('click', () => {
    const passwordInput = document.getElementById('password');
    const icon = togglePassword.querySelector('i');
    passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
    icon.classList.toggle('fa-eye');
    icon.classList.toggle('fa-eye-slash');
  });
}

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    errorMessage.style.display = 'none';
    loadingIndicator.style.display = 'flex';

    const email = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    try {
      await signInWithEmailAndPassword(auth, email, password);

      // ✅ REDIRECTION CORRECTE
      window.location.href = 'Messages.html';

    } catch (err) {
      console.error(err);
      errorText.textContent = 'Email ou mot de passe incorrect';
      errorMessage.style.display = 'flex';
    } finally {
      loadingIndicator.style.display = 'none';
    }
  });
}


// ===================================
// NOTIFICATION
// ===================================
function showNotification(message, type = 'info') {
    const notif = document.createElement('div');
    notif.className = `notification notification-${type}`;
    notif.textContent = message;
    document.body.appendChild(notif);

    setTimeout(() => notif.remove(), 4000);
}

// ===================================
// SCROLL TO TOP
// ===================================
const scrollTopBtn = document.getElementById('scroll-top');
if (scrollTopBtn) {
    window.addEventListener('scroll', () => {
        scrollTopBtn.classList.toggle('visible', window.scrollY > 300);
    });

    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ===================================
// CONSOLE
// ===================================
console.log('%c🚀 Portfolio connecté à Firebase',
    'color:#38bdf8;font-size:16px;font-weight:bold;'
);
