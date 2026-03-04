/**
 * Schengen Visa Support - Main JavaScript
 * Minimal, performance-focused JavaScript for AdSense approval
 */

(function() {
    'use strict';
    
    // Initialize TOC with toggle functionality
    function initTOC() {
        const toc = document.querySelector('.toc');
        if (!toc) return;
        
        const heading = toc.querySelector('h2');
        if (!heading) return;
        
        // Add toggle icon if not present
        if (!heading.querySelector('.toc-toggle')) {
            const toggle = document.createElement('span');
            toggle.className = 'toc-toggle';
            toggle.innerHTML = '▶';
            heading.appendChild(toggle);
        }
        
        // Start expanded by default (TOC should be visible)
        // Only collapse on very small screens if needed
        if (window.innerWidth <= 480) {
            toc.classList.add('collapsed');
        }
        
        // Click handler to toggle - only when clicking on h2 or toggle button
        heading.addEventListener('click', function(e) {
            // Allow link clicks to work normally
            if (e.target.closest('a')) return;
            toc.classList.toggle('collapsed');
        });
    }
    
    // Mobile Menu Toggle
    function initMobileMenu() {
        const menuToggle = document.querySelector('.mobile-menu-toggle');
        const navMenu = document.querySelector('nav ul');
        
        if (menuToggle && navMenu) {
            menuToggle.addEventListener('click', function() {
                navMenu.classList.toggle('active');
                
                // Update aria-expanded for accessibility
                const isExpanded = navMenu.classList.contains('active');
                menuToggle.setAttribute('aria-expanded', isExpanded);
            });
            
            // Close menu when clicking outside
            document.addEventListener('click', function(e) {
                if (!menuToggle.contains(e.target) && !navMenu.contains(e.target)) {
                    navMenu.classList.remove('active');
                    menuToggle.setAttribute('aria-expanded', 'false');
                }
            });
            
            // Close menu when clicking on a link
            const navLinks = navMenu.querySelectorAll('a');
            navLinks.forEach(link => {
                link.addEventListener('click', function() {
                    navMenu.classList.remove('active');
                    menuToggle.setAttribute('aria-expanded', 'false');
                });
            });
        }
    }
    
    // Smooth Scrolling for Anchor Links
    function initSmoothScroll() {
        const links = document.querySelectorAll('a[href^="#"]');
        
        links.forEach(link => {
            link.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                
                // Don't prevent default if it's just "#"
                if (href === '#') return;
                
                const target = document.querySelector(href);
                
                if (target) {
                    e.preventDefault();
                    
                    const headerOffset = 80;
                    const elementPosition = target.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                    
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                    
                    // Update URL without jumping
                    if (history.pushState) {
                        history.pushState(null, null, href);
                    }
                }
            });
        });
    }
    
    // Add active class to current nav item
    function highlightCurrentPage() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('nav a');
        
        navLinks.forEach(link => {
            const linkPath = new URL(link.href).pathname;
            
            if (linkPath === currentPath || 
                (linkPath !== '/' && currentPath.startsWith(linkPath))) {
                link.classList.add('active');
            }
        });
    }
    
    // FAQ Accordion (Optional Enhancement)
    function initFAQAccordion() {
        const faqItems = document.querySelectorAll('.faq-item');
        
        faqItems.forEach((item, index) => {
            const question = item.querySelector('h3');
            const answer = item.querySelector('p');
            
            if (question && answer) {
                // Create button for accessibility
                const button = document.createElement('button');
                button.className = 'faq-question';
                button.innerHTML = question.innerHTML;
                button.setAttribute('aria-expanded', 'true');
                button.setAttribute('aria-controls', `faq-answer-${index}`);
                
                answer.id = `faq-answer-${index}`;
                
                // Replace h3 with button
                question.replaceWith(button);
                
                // Show all answers by default (better for SEO)
                // Users can click to collapse if needed
                button.addEventListener('click', function() {
                    const isExpanded = this.getAttribute('aria-expanded') === 'true';
                    this.setAttribute('aria-expanded', !isExpanded);
                    answer.style.display = isExpanded ? 'none' : 'block';
                });
            }
        });
    }
    
    // Lazy Load Images (Performance)
    function initLazyLoad() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        imageObserver.unobserve(img);
                    }
                });
            });
            
            const lazyImages = document.querySelectorAll('img.lazy');
            lazyImages.forEach(img => imageObserver.observe(img));
        } else {
            // Fallback for older browsers
            const lazyImages = document.querySelectorAll('img.lazy');
            lazyImages.forEach(img => {
                img.src = img.dataset.src;
                img.classList.remove('lazy');
            });
        }
    }
    
    // External Links - Open in New Tab
    function initExternalLinks() {
        const links = document.querySelectorAll('a[href^="http"]');
        const domain = window.location.hostname;
        
        links.forEach(link => {
            const linkDomain = new URL(link.href).hostname;
            
            if (linkDomain !== domain) {
                link.setAttribute('target', '_blank');
                link.setAttribute('rel', 'noopener noreferrer');
            }
        });
    }
    
    // Table of Contents - Highlight Active Section
    function initTOCHighlight() {
        const tocLinks = document.querySelectorAll('.toc a[href^="#"]');
        
        if (tocLinks.length === 0) return;
        
        const sections = Array.from(tocLinks).map(link => {
            const href = link.getAttribute('href');
            return document.querySelector(href);
        }).filter(section => section !== null);
        
        if (sections.length === 0) return;
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');
                    
                    // Remove active class from all links
                    tocLinks.forEach(link => link.classList.remove('active'));
                    
                    // Add active class to current link
                    const activeLink = document.querySelector(`.toc a[href="#${id}"]`);
                    if (activeLink) {
                        activeLink.classList.add('active');
                    }
                }
            });
        }, {
            rootMargin: '-80px 0px -80% 0px'
        });
        
        sections.forEach(section => observer.observe(section));
    }
    
    // Print Page Button
    function initPrintButton() {
        const printButtons = document.querySelectorAll('.print-page');
        
        printButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                window.print();
            });
        });
    }
    
    // Back to Top Button
    function initBackToTop() {
        const backToTopButton = document.querySelector('.back-to-top');
        
        if (backToTopButton) {
            window.addEventListener('scroll', function() {
                if (window.pageYOffset > 300) {
                    backToTopButton.classList.add('visible');
                } else {
                    backToTopButton.classList.remove('visible');
                }
            });
            
            backToTopButton.addEventListener('click', function(e) {
                e.preventDefault();
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        }
    }
    
    // Initialize all functions when DOM is ready
    function init() {
        initTOC();
        initMobileMenu();
        initSmoothScroll();
        highlightCurrentPage();
        initLazyLoad();
        initExternalLinks();
        initTOCHighlight();
        initPrintButton();
        initBackToTop();
        initCookieConsent();
        
        // Optional: Enable FAQ accordion only if needed
        // initFAQAccordion();
    }
    
    // ------------------------------------------------------------
    // Cookie Consent Banner (GDPR)
    // ------------------------------------------------------------
    function initCookieConsent() {
        var STORAGE_KEY = 'svs_cookie_consent';
        var existing = localStorage.getItem(STORAGE_KEY);
        if (existing) return; // already decided

        // Inject banner HTML if not present
        if (!document.getElementById('cookie-consent-banner')) {
            var banner = document.createElement('div');
            banner.id = 'cookie-consent-banner';
            banner.setAttribute('role', 'dialog');
            banner.setAttribute('aria-label', 'Cookie consent');
            banner.innerHTML =
                '<div class="cookie-banner-inner">' +
                  '<div class="cookie-banner-text">' +
                    '<strong>🍪 We use cookies on this site</strong>' +
                    'We use cookies to analyse traffic (Google Analytics) and to show relevant ads. ' +
                    'By clicking <em>Accept All</em> you consent to our use of cookies. ' +
                    'Choose <em>Essential Only</em> to disable analytics and advertising cookies. ' +
                    '<a href="/cookie-policy/">Cookie Policy</a> &nbsp;|&nbsp; ' +
                    '<a href="/privacy-policy/">Privacy Policy</a>' +
                  '</div>' +
                  '<div class="cookie-banner-buttons">' +
                    '<button class="cookie-btn-accept" id="cookie-accept-all">Accept All Cookies</button>' +
                    '<button class="cookie-btn-essential" id="cookie-essential-only">Essential Only</button>' +
                  '</div>' +
                '</div>';
            document.body.appendChild(banner);
        }

        var banner = document.getElementById('cookie-consent-banner');
        // Show on next frame so CSS transition can fire
        requestAnimationFrame(function() {
            banner.classList.add('cookie-visible');
        });

        document.getElementById('cookie-accept-all').addEventListener('click', function() {
            localStorage.setItem(STORAGE_KEY, 'all');
            banner.classList.remove('cookie-visible');
            // GA already loaded via gtag — nothing extra needed
        });

        document.getElementById('cookie-essential-only').addEventListener('click', function() {
            localStorage.setItem(STORAGE_KEY, 'essential');
            banner.classList.remove('cookie-visible');
            // Optionally disable GA for this session
            if (typeof window['ga-disable-G-16CJ2H74H1'] !== 'undefined') {
                window['ga-disable-G-16CJ2H74H1'] = true;
            }
        });
    }

    // Run init when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
