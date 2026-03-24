/**
 * ARODATA - SCRIPT PRINCIPAL
 * Version simplifiée et robuste
 */

(function() {
    'use strict';

    /** URL du proxy (Cloudflare Worker, etc.) qui appelle Places API (New). Vide = avis illustratifs uniquement. */
    var ARODATA_REVIEWS_PROXY_URL = (typeof window !== 'undefined' && window.ARODATA_REVIEWS_PROXY_URL) || '';

    var GOOGLE_BUSINESS_REVIEWS_URL = 'https://www.google.com/search?q=Arodata+Mougins+avis';

    var PLACEHOLDER_REVIEWS = [
        { author: 'Sophie M.', rating: 5, text: 'Intervention rapide sur notre baie réseau et très pédagogues. Nous recommandons Arodata pour l’infogérance.', relativeTime: 'Exemple' },
        { author: 'Thomas L.', rating: 5, text: 'Passage à la téléphonie IP sans coupure pour l’équipe. Devis clair et suivi au top.', relativeTime: 'Exemple' },
        { author: 'Claire R.', rating: 5, text: 'Fibre FTTO et WiFi pro refaits : enfin une connexion stable pour tout le bureau.', relativeTime: 'Exemple' }
    ];

    // ============================================
    // NAV ACTIVE (data-active-nav sur <body>)
    // ============================================
    function initActiveNav() {
        var key = document.body.getAttribute('data-active-nav');
        if (!key) return;
        document.querySelectorAll('.nav-link[data-nav="' + key + '"], .nav-mobile-link[data-nav="' + key + '"]').forEach(function(el) {
            el.classList.add('active');
        });
    }

    // ============================================
    // MOBILE MENU
    // ============================================
    function initMobileMenu() {
        var menuToggle = document.getElementById('menuToggle');
        var mobileMenu = document.getElementById('mobileMenu');
        var mobileOverlay = document.getElementById('mobileOverlay');
        var mobileClose = document.getElementById('mobileClose');
        
        if (!menuToggle || !mobileMenu) return;

        function setExpanded(open) {
            menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        }

        function openMenu() {
            mobileMenu.classList.add('active');
            if (mobileOverlay) mobileOverlay.classList.add('active');
            menuToggle.classList.add('active');
            document.body.style.overflow = 'hidden';
            setExpanded(true);
        }

        function closeMenu() {
            mobileMenu.classList.remove('active');
            if (mobileOverlay) mobileOverlay.classList.remove('active');
            menuToggle.classList.remove('active');
            document.body.style.overflow = '';
            setExpanded(false);
        }

        setExpanded(false);

        menuToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (mobileMenu.classList.contains('active')) {
                closeMenu();
            } else {
                openMenu();
            }
        });

        if (mobileClose) {
            mobileClose.addEventListener('click', closeMenu);
        }

        if (mobileOverlay) {
            mobileOverlay.addEventListener('click', closeMenu);
        }

        mobileMenu.querySelectorAll('.nav-mobile-link').forEach(function(link) {
            link.addEventListener('click', closeMenu);
        });

        mobileMenu.querySelectorAll('.nav-mobile-footer a').forEach(function(link) {
            link.addEventListener('click', closeMenu);
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
                closeMenu();
            }
        });
    }

    function starsHtml(rating) {
        var n = Math.round(Number(rating) || 0);
        var out = '';
        for (var i = 1; i <= 5; i++) {
            out += '<span class="review-star' + (i <= n ? ' is-on' : '') + '" aria-hidden="true">★</span>';
        }
        return out;
    }

    function renderReviewCard(r) {
        var author = r.author || r.authorName || 'Client';
        if (r.authorAttribution && r.authorAttribution.displayName) author = r.authorAttribution.displayName;
        if (author && typeof author === 'object' && author.displayName) author = author.displayName;
        var text = '';
        if (typeof r.text === 'string') text = r.text;
        else if (r.text && r.text.text) text = r.text.text;
        var when = r.relativeTime || r.relativePublishTimeDescription || '';
        var rating = r.rating || r.starRating || 5;
        return (
            '<article class="review-card">' +
            '<div class="review-card-top">' +
            '<span class="review-author">' + escapeHtml(String(author)) + '</span>' +
            '<div class="review-stars" aria-label="' + rating + ' sur 5">' + starsHtml(rating) + '</div>' +
            '</div>' +
            (when ? '<p class="review-when">' + escapeHtml(String(when)) + '</p>' : '') +
            '<p class="review-text">' + escapeHtml(String(text)) + '</p>' +
            '</article>'
        );
    }

    function escapeHtml(s) {
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function renderPlaceholderBlock() {
        var list = PLACEHOLDER_REVIEWS.map(renderReviewCard).join('');
        return (
            '<p class="reviews-disclaimer">Avis illustratifs — dès branchement de l’API Google, seuls les avis réels s’affichent.</p>' +
            '<div class="reviews-grid">' + list + '</div>'
        );
    }

    function renderRealBlock(data) {
        var reviews = data.reviews || data.items || [];
        var summary = '';
        if (data.rating != null) {
            summary =
                '<div class="reviews-summary">' +
                '<p class="reviews-rating-big">' + Number(data.rating).toFixed(1) + ' <span>/ 5</span></p>' +
                (data.userRatingCount ? '<p class="reviews-count">' + data.userRatingCount + ' avis Google</p>' : '') +
                '</div>';
        }
        var cards = reviews.slice(0, 8).map(renderReviewCard).join('');
        return summary + '<div class="reviews-grid">' + cards + '</div>';
    }

    function initGoogleReviews() {
        var root = document.getElementById('googleReviewsRoot');
        if (!root) return;

        var meta = document.querySelector('meta[name="arodata-reviews-api"]');
        var proxyUrl = (meta && meta.getAttribute('content')) || ARODATA_REVIEWS_PROXY_URL;
        proxyUrl = (proxyUrl || '').trim();

        if (!proxyUrl) {
            root.innerHTML = renderPlaceholderBlock();
            return;
        }

        root.innerHTML = '<p class="reviews-loading">Chargement des avis…</p>';
        fetch(proxyUrl, { credentials: 'omit' })
            .then(function(res) {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.json();
            })
            .then(function(data) {
                var reviews = data.reviews || data.items || [];
                var hasContent = reviews.length > 0 || (data.rating != null);
                if (!hasContent) throw new Error('empty');
                root.innerHTML = renderRealBlock(data);
                root.classList.add('reviews-root--live');
            })
            .catch(function() {
                root.innerHTML =
                    '<p class="reviews-error">Impossible de charger les avis pour le moment.</p>' +
                    '<a class="btn btn-outline reviews-google-link" href="' + GOOGLE_BUSINESS_REVIEWS_URL + '" target="_blank" rel="noopener">Voir les avis sur Google</a>';
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
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
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
        const animatedElements = document.querySelectorAll('.service-card, .stat-card, .why-feature, .review-card, .partner-techtrust-inner');
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
        initActiveNav();
        initMobileMenu();
        initHeaderScroll();
        initScrollProgress();
        initBackToTop();
        initFAQ();
        initScrollAnimations();
        initCounters();
        initGoogleReviews();
    });

})();
