/**
 * ARODATA - SCRIPT PRINCIPAL
 * Version simplifiée et robuste
 */

(function() {
    'use strict';

    // ============================================
    // MOBILE MENU - FONCTIONNEMENT SIMPLE
    // ============================================
    function initMobileMenu() {
        const menuToggle = document.getElementById('menuToggle');
        const mobileMenu = document.getElementById('mobileMenu');
        const mobileOverlay = document.getElementById('mobileOverlay');
        const mobileClose = document.getElementById('mobileClose');
        
        if (!menuToggle || !mobileMenu) return;

        function openMenu() {
            mobileMenu.classList.add('active');
            if (mobileOverlay) mobileOverlay.classList.add('active');
            menuToggle.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeMenu() {
            mobileMenu.classList.remove('active');
            if (mobileOverlay) mobileOverlay.classList.remove('active');
            menuToggle.classList.remove('active');
            document.body.style.overflow = '';
        }

        // Ouvrir le menu
        menuToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (mobileMenu.classList.contains('active')) {
                closeMenu();
            } else {
                openMenu();
            }
        });

        // Fermer avec le bouton X
        if (mobileClose) {
            mobileClose.addEventListener('click', closeMenu);
        }

        // Fermer en cliquant sur l'overlay
        if (mobileOverlay) {
            mobileOverlay.addEventListener('click', closeMenu);
        }

        // Fermer en cliquant sur un lien
        const mobileLinks = mobileMenu.querySelectorAll('.nav-mobile-link');
        mobileLinks.forEach(function(link) {
            link.addEventListener('click', closeMenu);
        });

        // Fermer avec la touche Escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
                closeMenu();
            }
        });
    }

    // ============================================
    // HEADER SCROLL EFFECT
    // ============================================
    function initHeaderScroll() {
        const header = document.getElementById('header');
        if (!header) return;

        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    // ============================================
    // SCROLL PROGRESS
    // ============================================
    function initScrollProgress() {
        const progressBar = document.querySelector('.scroll-progress-bar');
        if (!progressBar) return;

        window.addEventListener('scroll', function() {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = (scrollTop / docHeight) * 100;
            progressBar.style.width = scrollPercent + '%';
        });
    }

    // ============================================
    // BACK TO TOP
    // ============================================
    function initBackToTop() {
        const backToTop = document.getElementById('backToTop');
        if (!backToTop) return;

        window.addEventListener('scroll', function() {
            if (window.scrollY > 500) {
                backToTop.hidden = false;
            } else {
                backToTop.hidden = true;
            }
        });

        backToTop.addEventListener('click', function() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ============================================
    // FAQ ACCORDION
    // ============================================
    function initFAQ() {
        const faqItems = document.querySelectorAll('.faq-item');
        if (!faqItems.length) return;

        faqItems.forEach(function(item) {
            const question = item.querySelector('.faq-question');
            if (!question) return;

            question.addEventListener('click', function() {
                const isActive = item.classList.contains('active');

                // Fermer tous les autres
                faqItems.forEach(function(otherItem) {
                    otherItem.classList.remove('active');
                });

                // Ouvrir/fermer celui-ci
                if (!isActive) {
                    item.classList.add('active');
                }
            });
        });
    }

    // ============================================
    // ANIMATIONS AU SCROLL
    // ============================================
    function initScrollAnimations() {
        const animatedElements = document.querySelectorAll('.service-card, .stat-card, .why-feature');
        if (!animatedElements.length) return;

        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, { threshold: 0.1 });

        animatedElements.forEach(function(el) {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            observer.observe(el);
        });
    }

    // ============================================
    // COMPTEURS ANIMÉS
    // ============================================
    function initCounters() {
        const counters = document.querySelectorAll('[data-count]');
        if (!counters.length) return;

        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    const counter = entry.target;
                    const target = parseInt(counter.getAttribute('data-count'));
                    const duration = 2000;
                    const step = target / (duration / 16);
                    let current = 0;

                    function update() {
                        current += step;
                        if (current < target) {
                            counter.textContent = Math.floor(current);
                            requestAnimationFrame(update);
                        } else {
                            counter.textContent = target;
                        }
                    }

                    update();
                    observer.unobserve(counter);
                }
            });
        }, { threshold: 0.5 });

        counters.forEach(function(counter) {
            observer.observe(counter);
        });
    }

    // ============================================
    // INITIALISATION
    // ============================================
    document.addEventListener('DOMContentLoaded', function() {
        initMobileMenu();
        initHeaderScroll();
        initScrollProgress();
        initBackToTop();
        initFAQ();
        initScrollAnimations();
        initCounters();
    });

})();
