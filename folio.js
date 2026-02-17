// ===================================
// IMPORTS FIREBASE
// ===================================
import { db, auth } from './firebase.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

// ===================================
// CANVAS BACKGROUND ANIMATION
// ===================================
const canvas = document.getElementById('creative-bg');
if (canvas) {
    const ctx = canvas.getContext('2d');
    function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
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
            ctx.fillStyle = 'rgba(14, 165, 233, 0.6)';
            ctx.fill();
        }
    }

    for (let i = 0; i < particleCount; i++) particles.push(new Particle());

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => { p.update(); p.draw(); });
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 120) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(14, 165, 233, ${1 - dist / 120})`;
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
    document.querySelectorAll('.menu-link').forEach(link => link.addEventListener('click', () => {
        menu.classList.remove('active');
        menuBtn.classList.remove('active');
    }));
}

// ===================================
// VOIR PLUS PARCOURS
// ===================================
const btnVoirParcours = document.getElementById('btn-voir-parcours');
const parcoursComplet = document.getElementById('parcours-complet');
if (btnVoirParcours && parcoursComplet) {
    btnVoirParcours.addEventListener('click', () => {
        if (parcoursComplet.style.display === 'none' || parcoursComplet.style.display === '') {
            parcoursComplet.style.display = 'block';
            btnVoirParcours.innerHTML = '<i class="fas fa-chevron-up"></i> Voir moins';
            btnVoirParcours.classList.add('active');
            setTimeout(() => { parcoursComplet.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 100);
        } else {
            parcoursComplet.style.display = 'none';
            btnVoirParcours.innerHTML = '<i class="fas fa-chevron-down"></i> Voir plus';
            btnVoirParcours.classList.remove('active');
        }
    });
}

// ===================================
// SCROLL ANIMATIONS
// ===================================
const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -100px 0px' };
const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);
document.querySelectorAll('.timeline-item, .experience-card, .skill-category, .soft-skill-card, .project-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(50px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// ===================================
// BARRES DE COMPETENCES
// ===================================
const skillBars = document.querySelectorAll('.skill-progress');
const skillObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const bar = entry.target;
            const width = bar.style.width;
            bar.style.width = '0';
            setTimeout(() => { bar.style.width = width; }, 100);
        }
    });
}, { threshold: 0.5 });
skillBars.forEach(bar => skillObserver.observe(bar));

// ===================================
// FORMULAIRE CONTACT FIRESTORE
// ===================================
const btnContact = document.getElementById('btn-contact');
const formContact = document.getElementById('form-contact');
if (btnContact && formContact) {
    btnContact.addEventListener('click', () => {
        formContact.classList.toggle('active');
        btnContact.innerHTML = formContact.classList.contains('active')
            ? '<i class="fas fa-times"></i> Fermer le formulaire'
            : '<i class="fas fa-paper-plane"></i> Envoyer un message';
    });

    formContact.addEventListener('submit', async e => {
        e.preventDefault();
        const nom = document.getElementById('nom').value.trim();
        const email = document.getElementById('email').value.trim();
        const sujet = document.getElementById('sujet').value.trim();
        const message = document.getElementById('message').value.trim();

        if (!nom || !email || !sujet || !message) {
            showNotification('Veuillez remplir tous les champs', 'error');
            return;
        }

        const submitBtn = formContact.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';

        try {
            await addDoc(collection(db, 'messages'), {
                nom, email, sujet, message,
                lu: false,
                createdAt: serverTimestamp()
            });
            showNotification('Message envoyé avec succès ! 🎉', 'success');
            formContact.reset();
            formContact.classList.remove('active');
            btnContact.innerHTML = '<i class="fas fa-paper-plane"></i> Envoyer un message';
        } catch (err) {
            console.error(err);
            showNotification('Impossible de contacter le serveur', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    });
}

// ===================================
// NOTIFICATIONS
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
    setTimeout(() => {
        notif.style.transform = 'translateX(400px)';
        notif.style.opacity = '0';
        setTimeout(() => notif.remove(), 300);
    }, 5000);
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
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    });
}

if (loginForm) {
    loginForm.addEventListener('submit', async e => {
        e.preventDefault();
        errorMessage.style.display = 'none';
        loadingIndicator.style.display = 'flex';
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        try {
            await signInWithEmailAndPassword(auth, username, password);
            window.location.href = 'Messages.html';
        } catch (err) {
            console.error(err);
            // CORRECTION : apostrophe typographique remplacée
            errorText.textContent = "Nom d'utilisateur ou mot de passe incorrect";
            errorMessage.style.display = 'flex';
        } finally {
            loadingIndicator.style.display = 'none';
        }
    });
}

// ===================================
// SCROLL TOP
// ===================================
const scrollTopBtn = document.getElementById('scroll-top');
if (scrollTopBtn) {
    window.addEventListener('scroll', () => {
        scrollTopBtn.classList.toggle('visible', window.pageYOffset > 300);
    });
    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ===================================
// SMOOTH SCROLL ANCRE
// ===================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

// ===================================
// HEADER SCROLL EFFECT
// ===================================
const header = document.getElementById('header');
if (header) {
    window.addEventListener('scroll', () => {
        header.style.boxShadow = window.pageYOffset > 100
            ? '0 4px 20px rgba(0,0,0,0.5)'
            : '0 4px 16px rgba(0,0,0,0.4)';
    });
}

// ===================================
// PHOTO HERO EFFECT
// ===================================
const photoFrame = document.querySelector('.photo-frame');
if (photoFrame) {
    photoFrame.addEventListener('mouseenter', () => { photoFrame.style.transform = 'scale(1.05) rotate(5deg)'; });
    photoFrame.addEventListener('mouseleave', () => { photoFrame.style.transform = 'scale(1) rotate(0deg)'; });
}

// ===================================
// ANIMATION CHARGEMENT
// ===================================
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
    if (photoFrame) {
        setTimeout(() => {
            photoFrame.style.opacity = '1';
            photoFrame.style.transform = 'scale(1)';
        }, 500);
    }
});

// ===================================
// DETECTION MOBILE
// ===================================
if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) document.body.classList.add('mobile');