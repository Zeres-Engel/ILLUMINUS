/**
 * Cosmic Effects - Quản lý visual effects và animations
 * ILLUMINUS Wav2Lip Cosmic Theme Effects
 */
class CosmicEffects {
    constructor() {
        this.initialized = false;
        this.backToTopButton = null;
        this.isScrollListenerActive = false;
    }

    /**
     * Initialize tất cả cosmic effects
     */
    initialize() {
        if (this.initialized) return;
        
        this.addCosmicCardEffects();
        this.setupBackToTop();
        this.addParticleEffects();
        this.setupSmoothScrolling();
        
        this.initialized = true;
        console.log('🌟 Cosmic effects initialized');
    }

    /**
     * Add hover effects cho cosmic cards
     */
    addCosmicCardEffects() {
        document.querySelectorAll('.cosmic-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-5px) scale(1.02)';
                card.style.transition = 'transform 0.3s ease';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
            });
        });

        // Add cosmic glow effect
        document.querySelectorAll('.cosmic-glow').forEach(element => {
            element.addEventListener('mouseenter', () => {
                element.style.boxShadow = '0 0 30px rgba(138, 43, 226, 0.5)';
                element.style.transition = 'box-shadow 0.3s ease';
            });
            
            element.addEventListener('mouseleave', () => {
                element.style.boxShadow = '';
            });
        });
    }

    /**
     * Setup back to top button
     */
    setupBackToTop() {
        this.backToTopButton = document.getElementById('backToTop');
        if (!this.backToTopButton) return;

        // Show/hide button dựa trên scroll position
        this.setupScrollListener();

        // Smooth scroll to top
        this.backToTopButton.addEventListener('click', () => {
            this.scrollToTop();
        });
    }

    /**
     * Setup scroll listener cho back to top
     */
    setupScrollListener() {
        if (this.isScrollListenerActive) return;
        
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                this.showBackToTop();
            } else {
                this.hideBackToTop();
            }
        });
        
        this.isScrollListenerActive = true;
    }

    /**
     * Show back to top button
     */
    showBackToTop() {
        if (this.backToTopButton) {
            this.backToTopButton.classList.remove('hidden');
            this.backToTopButton.style.opacity = '1';
            this.backToTopButton.style.transform = 'translateY(0)';
        }
    }

    /**
     * Hide back to top button
     */
    hideBackToTop() {
        if (this.backToTopButton) {
            this.backToTopButton.style.opacity = '0';
            this.backToTopButton.style.transform = 'translateY(20px)';
            setTimeout(() => {
                if (this.backToTopButton) {
                    this.backToTopButton.classList.add('hidden');
                }
            }, 300);
        }
    }

    /**
     * Smooth scroll to top
     */
    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    /**
     * Add particle effects cho background
     */
    addParticleEffects() {
        // Create particle container nếu chưa có
        let particleContainer = document.getElementById('particleContainer');
        if (!particleContainer) {
            particleContainer = document.createElement('div');
            particleContainer.id = 'particleContainer';
            particleContainer.className = 'fixed inset-0 pointer-events-none z-0';
            document.body.appendChild(particleContainer);
        }

        // Create floating particles
        this.createFloatingParticles(particleContainer, 20);
    }

    /**
     * Create floating particles
     */
    createFloatingParticles(container, count) {
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'cosmic-particle';
            
            // Random properties
            const size = Math.random() * 4 + 2; // 2-6px
            const left = Math.random() * 100; // 0-100%
            const animationDuration = Math.random() * 10 + 10; // 10-20s
            const delay = Math.random() * 5; // 0-5s delay
            
            particle.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                background: linear-gradient(45deg, #8a2be2, #4169e1);
                border-radius: 50%;
                left: ${left}%;
                top: 100%;
                animation: floatUp ${animationDuration}s infinite linear;
                animation-delay: ${delay}s;
                opacity: 0.6;
                box-shadow: 0 0 ${size * 2}px rgba(138, 43, 226, 0.5);
            `;
            
            container.appendChild(particle);
        }

        // Add CSS animation nếu chưa có
        this.addParticleStyles();
    }

    /**
     * Add CSS styles cho particles
     */
    addParticleStyles() {
        if (document.getElementById('cosmicParticleStyles')) return;
        
        const style = document.createElement('style');
        style.id = 'cosmicParticleStyles';
        style.textContent = `
            @keyframes floatUp {
                from {
                    transform: translateY(0) rotate(0deg);
                    opacity: 0;
                }
                10% {
                    opacity: 0.6;
                }
                90% {
                    opacity: 0.6;
                }
                to {
                    transform: translateY(-100vh) rotate(360deg);
                    opacity: 0;
                }
            }
            
            .cosmic-particle {
                pointer-events: none;
            }
            
            .cosmic-glow-animation {
                animation: cosmicGlow 3s ease-in-out infinite alternate;
            }
            
            @keyframes cosmicGlow {
                from {
                    box-shadow: 0 0 10px rgba(138, 43, 226, 0.3);
                }
                to {
                    box-shadow: 0 0 25px rgba(138, 43, 226, 0.7);
                }
            }
            
            .cosmic-pulse {
                animation: cosmicPulse 2s ease-in-out infinite;
            }
            
            @keyframes cosmicPulse {
                0%, 100% {
                    transform: scale(1);
                    opacity: 1;
                }
                50% {
                    transform: scale(1.05);
                    opacity: 0.8;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * Setup smooth scrolling cho toàn bộ site
     */
    setupSmoothScrolling() {
        // Add smooth scrolling cho tất cả anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    /**
     * Add cosmic loading animation
     */
    addLoadingAnimation(element) {
        if (!element) return;
        
        element.classList.add('cosmic-loading');
        
        // Add loading styles nếu chưa có
        if (!document.getElementById('cosmicLoadingStyles')) {
            const style = document.createElement('style');
            style.id = 'cosmicLoadingStyles';
            style.textContent = `
                .cosmic-loading {
                    position: relative;
                    overflow: hidden;
                }
                
                .cosmic-loading::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(
                        90deg,
                        transparent,
                        rgba(138, 43, 226, 0.3),
                        transparent
                    );
                    animation: cosmicShimmer 2s infinite;
                }
                
                @keyframes cosmicShimmer {
                    0% { left: -100%; }
                    100% { left: 100%; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Remove cosmic loading animation
     */
    removeLoadingAnimation(element) {
        if (!element) return;
        element.classList.remove('cosmic-loading');
    }

    /**
     * Add success effect
     */
    addSuccessEffect(element) {
        if (!element) return;
        
        element.style.animation = 'cosmicSuccess 0.6s ease-out';
        
        // Add success animation styles
        if (!document.getElementById('cosmicSuccessStyles')) {
            const style = document.createElement('style');
            style.id = 'cosmicSuccessStyles';
            style.textContent = `
                @keyframes cosmicSuccess {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.1); box-shadow: 0 0 30px rgba(34, 197, 94, 0.7); }
                    100% { transform: scale(1); }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Reset animation sau khi hoàn thành
        setTimeout(() => {
            element.style.animation = '';
        }, 600);
    }

    /**
     * Add error effect
     */
    addErrorEffect(element) {
        if (!element) return;
        
        element.style.animation = 'cosmicError 0.6s ease-out';
        
        // Add error animation styles
        if (!document.getElementById('cosmicErrorStyles')) {
            const style = document.createElement('style');
            style.id = 'cosmicErrorStyles';
            style.textContent = `
                @keyframes cosmicError {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); box-shadow: 0 0 20px rgba(239, 68, 68, 0.7); }
                    75% { transform: translateX(5px); }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Reset animation sau khi hoàn thành
        setTimeout(() => {
            element.style.animation = '';
        }, 600);
    }

    /**
     * Create cosmic ripple effect
     */
    createRippleEffect(event, element) {
        const ripple = document.createElement('span');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: radial-gradient(circle, rgba(138, 43, 226, 0.3) 0%, transparent 70%);
            border-radius: 50%;
            transform: scale(0);
            animation: cosmicRipple 0.6s ease-out;
            pointer-events: none;
        `;
        
        element.appendChild(ripple);
        
        // Add ripple animation
        if (!document.getElementById('cosmicRippleStyles')) {
            const style = document.createElement('style');
            style.id = 'cosmicRippleStyles';
            style.textContent = `
                @keyframes cosmicRipple {
                    to {
                        transform: scale(2);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Remove ripple sau animation
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    /**
     * Cleanup effects
     */
    cleanup() {
        // Remove particle container
        const particleContainer = document.getElementById('particleContainer');
        if (particleContainer) {
            particleContainer.remove();
        }
        
        // Remove style sheets
        const stylesToRemove = [
            'cosmicParticleStyles',
            'cosmicLoadingStyles', 
            'cosmicSuccessStyles',
            'cosmicErrorStyles',
            'cosmicRippleStyles'
        ];
        
        stylesToRemove.forEach(styleId => {
            const style = document.getElementById(styleId);
            if (style) {
                style.remove();
            }
        });
        
        this.initialized = false;
        this.isScrollListenerActive = false;
    }
}

export default CosmicEffects; 