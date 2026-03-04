document.addEventListener("DOMContentLoaded", () => {
    // --- 0. Internationalization (i18n) ---
    const langBtns = document.querySelectorAll('.lang-btn');
    const entityBtns = document.querySelectorAll('.entity-btn');
    const entitySwitcher = document.querySelector('.entity-switcher');

    let currentLang = localStorage.getItem('lang') || getBrowserLang();
    let currentEntity = localStorage.getItem('entity') || 'individual';

    function getBrowserLang() {
        const lang = navigator.language || navigator.userLanguage;
        if (lang.startsWith('en')) return 'en';
        if (lang.startsWith('de')) return 'de';
        return 'uk';
    }

    function setLanguage(lang) {
        // Revert split-type animations before changing text to prevent "memory" of old text
        document.querySelectorAll('.split-text').forEach(text => {
            if (text.revert) {
                text.revert();
                text.revert = null;
            }
        });

        currentLang = lang;
        localStorage.setItem('lang', lang);
        document.documentElement.lang = lang;

        const allLangBtns = document.querySelectorAll('.lang-btn');
        allLangBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });

        // Translate content
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.dataset.i18n;
            if (translations[lang] && translations[lang][key]) {
                el.innerHTML = translations[lang][key];
            }
        });

        // Translate attributes
        const attrElements = document.querySelectorAll('[data-i18n-attr]');
        attrElements.forEach(el => {
            const attrData = el.dataset.i18nAttr.split(',');
            attrData.forEach(item => {
                const [attr, key] = item.split(':');
                if (translations[lang] && translations[lang][key]) {
                    el.setAttribute(attr.trim(), translations[lang][key]);
                }
            });
        });

        // Special case for title if not handled by selector
        if (translations[lang] && translations[lang]['page-title']) {
            document.title = translations[lang]['page-title'];
        }

        // Re-initialize animations for new text
        initAnimations();
    }

    function setEntity(entity) {
        currentEntity = entity;
        localStorage.setItem('entity', entity);

        if (entitySwitcher) entitySwitcher.setAttribute('data-active', entity);
        document.body.setAttribute('data-active-entity', entity);

        const allEntityBtns = document.querySelectorAll('.entity-btn, .entity-btn-mobile');
        allEntityBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.entity === entity);
        });

        // Re-init animations for the newly visible section
        if (typeof initAnimations === 'function') initAnimations();
        if (window.ScrollTrigger) ScrollTrigger.refresh();
    }

    // Initial state
    setLanguage(currentLang);
    setEntity(currentEntity);

    // Event Listeners
    document.addEventListener('click', (e) => {
        if (e.target.closest('.lang-btn')) {
            setLanguage(e.target.closest('.lang-btn').dataset.lang);
        }
        if (e.target.closest('.entity-btn') || e.target.closest('.entity-btn-mobile')) {
            setEntity(e.target.closest('.entity-btn, .entity-btn-mobile').dataset.entity);
        }
    });

    // --- Mobile Menu Toggle ---
    const burger = document.querySelector('.burger-menu');
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-menu-links a');

    if (burger) {
        burger.addEventListener('click', () => {
            burger.classList.toggle('active');
            mobileMenu.classList.toggle('active');
            document.body.classList.toggle('mobile-menu-active');
        });
    }

    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            burger.classList.remove('active');
            mobileMenu.classList.remove('active');
            document.body.classList.remove('mobile-menu-active');
        });
    });


    // --- 2. Magnetic Buttons ---
    function initMagnetic() {
        const magneticElements = document.querySelectorAll('.magnetic');
        magneticElements.forEach(elem => {
            elem.addEventListener('mousemove', (e) => {
                const rect = elem.getBoundingClientRect();
                const strength = elem.dataset.strength || 20;
                const x = (e.clientX - rect.left - rect.width / 2) / rect.width * strength;
                const y = (e.clientY - rect.top - rect.height / 2) / rect.height * strength;

                gsap.to(elem, {
                    x: x,
                    y: y,
                    duration: 0.4,
                    ease: 'power2.out'
                });
            });

            elem.addEventListener('mouseleave', () => {
                gsap.to(elem, {
                    x: 0,
                    y: 0,
                    duration: 0.7,
                    ease: 'elastic.out(1, 0.3)'
                });
            });
        });
    }
    initMagnetic();

    // --- 2.5 Mouse Parallax ---
    function initHeroParallax() {
        const hero = document.querySelector('.hero');
        if (!hero) return;

        hero.addEventListener('mousemove', (e) => {
            const { clientX, clientY } = e;
            const xPos = (clientX / window.innerWidth - 0.5);
            const yPos = (clientY / window.innerHeight - 0.5);

            /* 
            // BG Texture -1%
            gsap.to('.bg-texture', {
                x: xPos * -20,
                y: yPos * -20,
                duration: 1,
                ease: 'power2.out'
            });

            // Hero Image 2%
            gsap.to('.hero-image-wrapper', {
                x: xPos * 40,
                y: yPos * 40,
                duration: 1.2,
                ease: 'power2.out'
            });
            */

            // Hero Title 4%
            gsap.to('.hero-title', {
                x: xPos * 80,
                y: yPos * 80,
                duration: 0.8,
                ease: 'power2.out'
            });

            // Hero Subtitle/CTA 3%
            gsap.to('.hero-subtitle, .hero-cta', {
                x: xPos * 60,
                y: yPos * 60,
                duration: 1,
                ease: 'power2.out'
            });
        });
    }
    initHeroParallax();

    // --- 3. Preloader & Intro Animation ---
    const tl = gsap.timeline();
    const heroTitle = new SplitType('.hero-title', { types: 'lines, words' });
    const logo = document.querySelector('.logo');
    const loaderText = document.querySelector('.loader-text');

    gsap.set('.hero-subtitle, .hero-cta', { opacity: 0, y: 40 });
    gsap.set(heroTitle.words, { yPercent: 110, opacity: 0 }); // Pre-set for word reveal
    gsap.set('.hero-image-wrapper', { clipPath: "polygon(0 100%, 100% 100%, 100% 100%, 0 100%)" });

    // New Loader Animation: Shrink and Fly to Logo
    const logoRect = logo.getBoundingClientRect();
    const loaderRect = loaderText.getBoundingClientRect();

    tl.to(loaderText, {
        scale: 0.4,
        x: logoRect.left - loaderRect.left,
        y: logoRect.top - loaderRect.top,
        opacity: 0,
        duration: 1.2,
        delay: 0.8,
        ease: 'power4.inOut'
    })
        .to('.loader', {
            yPercent: -100, // Slide up
            duration: 1.2,
            ease: 'expo.inOut'
        }, "-=0.8")
        .to('.hero-image-wrapper', {
            clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
            duration: 2,
            ease: "power4.inOut"
        }, "-=1.2")
        .to(heroTitle.words, {
            yPercent: 0,
            opacity: 1,
            duration: 1.5,
            stagger: 0.05,
            ease: 'power4.out'
        }, "-=1.4")
        .to('.hero-subtitle, .hero-cta', {
            y: 0,
            opacity: 1,
            duration: 1.2,
            stagger: 0.1,
            ease: 'power3.out'
        }, "-=1");


    // --- 4. Scroll Animations ---
    gsap.registerPlugin(ScrollTrigger);

    function initAnimations() {
        document.querySelectorAll('.split-text').forEach(text => {
            if (text.revert) {
                text.revert();
                text.revert = null;
            }
        });

        const splitTexts = document.querySelectorAll('.split-text');
        splitTexts.forEach(text => {
            const bg = new SplitType(text, { types: 'chars, words' });
            text.revert = () => bg.revert(); // Store revert function

            gsap.from(bg.chars, {
                scrollTrigger: {
                    trigger: text,
                    start: 'top 85%',
                },
                y: 50,
                opacity: 0,
                duration: 0.8,
                stagger: 0.02,
                ease: 'back.out(1.7)'
            });
        });

        // Fade Up Elements
        const fadeElements = document.querySelectorAll('.fade-up');
        fadeElements.forEach(el => {
            let delay = 0;
            if (el.classList.contains('delay-1')) delay = 0.1;
            if (el.classList.contains('delay-2')) delay = 0.2;
            if (el.classList.contains('delay-3')) delay = 0.3;

            gsap.to(el, {
                scrollTrigger: {
                    trigger: el,
                    start: 'top 85%',
                },
                y: 0,
                opacity: 1,
                duration: 1,
                delay: delay,
                ease: 'power3.out'
            });
        });

    }

    initAnimations();

    // Parallax Images
    const parallaxImages = document.querySelectorAll('.parallax-img');
    parallaxImages.forEach(imgContainer => {
        const image = imgContainer.querySelector('img');
        if (image) {
            gsap.to(image, {
                scrollTrigger: {
                    trigger: imgContainer,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: true
                },
                y: 80,
                ease: 'none'
            });
        }
    });


    // Navbar color inversion
    ScrollTrigger.create({
        start: 'top -50',
        end: 99999,
        toggleClass: { className: 'scrolled', targets: '.navbar' }
    });

    // --- 5. Hero Scroll Parallax ---
    gsap.to('.hero-image', {
        yPercent: 15,
        ease: "none",
        scrollTrigger: {
            trigger: ".hero",
            start: "top top",
            end: "bottom top",
            scrub: true
        }
    });

    gsap.to('.hero-content', {
        yPercent: -50,
        opacity: 0,
        filter: "blur(4px)",
        ease: "none",
        scrollTrigger: {
            trigger: ".hero",
            start: "top top",
            end: "bottom top",
            scrub: true
        }
    });

    // Dynamic blur for overlay
    gsap.to('.hero-overlay', {
        "--hero-blur": "8px",
        ease: "none",
        scrollTrigger: {
            trigger: ".hero",
            start: "top top",
            end: "bottom top",
            scrub: true
        }
    });
});
