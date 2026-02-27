// Harry Potter 3D Portfolio - Main JavaScript
// Complete interactive 3D experience with magical effects

class MagicalPortfolio {
    constructor() {
        // State management
        this.state = {
            isLoaded: false,
            isSoundEnabled: false,
            scrollY: 0,
            mouseX: 0,
            mouseY: 0,
            targetRotation: { x: 0, y: 0 },
            currentRotation: { x: 0, y: 0 },
            orbPulse: false,
            orbHover: false
        };

        // Three.js setup
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.particles = null;
        this.orb = null;
        this.orbGlow = null;
        
        // Interaction systems
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.cursor = null;
        this.magicBursts = [];
        
        // Animation and timing
        this.clock = new THREE.Clock();
        this.lastTime = 0;
        
        // Sound system
        this.audioContext = null;
        this.ambientSound = null;
        this.soundGain = null;
        
        // Initialize everything
        this.init();
    }

    init() {
        this.setupThreeJS();
        this.setupInteractions();
        this.setupSound();
        this.setupAnimations();
        this.startAnimationLoop();
        
        // Remove loading screen after 2 seconds
        setTimeout(() => {
            this.hideLoadingScreen();
        }, 2000);
    }

    setupThreeJS() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x050614, 0.015);

        // Create camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 30;

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.autoClear = false;
        
        const container = document.getElementById('canvas-container');
        container.appendChild(this.renderer.domElement);

        // Create magical particles
        this.createParticles();
        
        // Create central glowing orb
        this.createOrb();
        
        // Handle resize
        window.addEventListener('resize', () => this.onWindowResize());
    }

    createParticles() {
        const geometry = new THREE.BufferGeometry();
        const count = 1500;
        
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        
        const color = new THREE.Color();
        
        for (let i = 0; i < count * 3; i += 3) {
            // Position in a sphere around center
            const radius = 20 + Math.random() * 30;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            positions[i] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i + 2] = radius * Math.cos(phi);
            
            // Golden color with variation
            const hue = 0.1 + Math.random() * 0.1; // Gold/yellow range
            const saturation = 0.8 + Math.random() * 0.2;
            const lightness = 0.5 + Math.random() * 0.3;
            
            color.setHSL(hue, saturation, lightness);
            colors[i] = color.r;
            colors[i + 1] = color.g;
            colors[i + 2] = color.b;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const material = new THREE.PointsMaterial({
            size: 0.8,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true,
            depthWrite: false
        });
        
        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    createOrb() {
        // Main orb geometry
        const geometry = new THREE.SphereGeometry(3, 64, 64);
        
        // Orb material with emissive glow
        const material = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            emissive: 0xffed41,
            emissiveIntensity: 1.5,
            roughness: 0.1,
            metalness: 0.8,
            transparent: true,
            opacity: 0.9
        });
        
        this.orb = new THREE.Mesh(geometry, material);
        this.orb.position.set(0, 0, 0);
        
        // Add subtle noise to make it look magical
        this.orb.rotation.x = Math.random() * Math.PI;
        this.orb.rotation.y = Math.random() * Math.PI;
        
        this.scene.add(this.orb);

        // Orb glow effect
        const glowGeometry = new THREE.SphereGeometry(3.5, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffed41,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending
        });
        
        this.orbGlow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.orb.add(this.orbGlow);
    }

    setupInteractions() {
        // Mouse tracking
        window.addEventListener('mousemove', (event) => {
            this.state.mouseX = (event.clientX / window.innerWidth) * 2 - 1;
            this.state.mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
            
            // Update cursor position
            this.updateCursor(event.clientX, event.clientY);
        });

        // Click interactions
        window.addEventListener('click', (event) => {
            this.createMagicBurst(event.clientX, event.clientY);
            this.pulseOrb();
        });

        // Scroll interactions
        window.addEventListener('scroll', () => {
            this.state.scrollY = window.scrollY;
            this.handleScrollMagic();
        });

        // Touch support
        window.addEventListener('touchmove', (event) => {
            if (event.touches.length > 0) {
                this.state.mouseX = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
                this.state.mouseY = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
                this.updateCursor(event.touches[0].clientX, event.touches[0].clientY);
            }
        });

        window.addEventListener('touchend', (event) => {
            if (event.changedTouches.length > 0) {
                this.createMagicBurst(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
                this.pulseOrb();
            }
        });

        // Raycaster for orb interaction
        window.addEventListener('mousemove', (event) => {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        });
    }

    setupSound() {
        // Create audio context on first user interaction
        document.addEventListener('click', () => {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                this.createAmbientSound();
            }
        }, { once: true });
    }

    createAmbientSound() {
        if (!this.audioContext) return;

        // Create oscillator for ambient magic sound
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        // Set up the sound
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 10);
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.3, this.audioContext.currentTime + 2);
        
        // Connect to output
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Start the sound
        oscillator.start();
        
        // Loop the sound
        setInterval(() => {
            if (this.state.isSoundEnabled && this.audioContext.state === 'running') {
                const newOscillator = this.audioContext.createOscillator();
                const newGain = this.audioContext.createGain();
                
                newOscillator.type = 'sine';
                newOscillator.frequency.setValueAtTime(150 + Math.random() * 50, this.audioContext.currentTime);
                
                newGain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                newGain.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + 1);
                newGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 5);
                
                newOscillator.connect(newGain);
                newGain.connect(this.audioContext.destination);
                newOscillator.start();
                newOscillator.stop(this.audioContext.currentTime + 5);
            }
        }, 5000);
    }

    setupAnimations() {
        // Typing animation for hero text
        this.setupTypingAnimation();
        
        // Section visibility animations
        this.setupSectionAnimations();
        
        // Skill card animations
        this.setupSkillCardAnimations();
        
        // Project card animations
        this.setupProjectCardAnimations();
        
        // Modal system
        this.setupModalSystem();
        
        // Sound toggle
        this.setupSoundToggle();
    }

    setupTypingAnimation() {
        const text = "Welcome to the Wizarding World of Artificial Intelligence.";
        const typingElement = document.getElementById('typing-text');
        let i = 0;
        
        const typeWriter = () => {
            if (i < text.length) {
                typingElement.innerHTML += text.charAt(i);
                i++;
                setTimeout(typeWriter, 100);
            } else {
                // Add cursor blink after typing
                typingElement.style.borderRight = '2px solid transparent';
            }
        };
        
        setTimeout(typeWriter, 1000);
    }

    setupSectionAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });
        
        document.querySelectorAll('.section').forEach(section => {
            observer.observe(section);
        });
    }

    setupSkillCardAnimations() {
        const skillCards = document.querySelectorAll('.skill-card');
        
        skillCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                // Add floating animation
                gsap.to(card, {
                    y: -10,
                    duration: 0.5,
                    ease: 'power2.out'
                });
            });
            
            card.addEventListener('mouseleave', () => {
                gsap.to(card, {
                    y: 0,
                    duration: 0.5,
                    ease: 'power2.out'
                });
            });
        });
    }

    setupProjectCardAnimations() {
        const projectCards = document.querySelectorAll('.project-card');
        
        projectCards.forEach(card => {
            card.addEventListener('click', () => {
                const projectId = card.dataset.project;
                this.showProjectModal(projectId);
            });
        });
    }

    setupModalSystem() {
        const modal = document.getElementById('project-modal');
        const closeBtn = document.querySelector('.close-btn');
        
        closeBtn.addEventListener('click', () => {
            this.hideProjectModal();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideProjectModal();
            }
        });
        
        // Keyboard close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideProjectModal();
            }
        });
    }

    setupSoundToggle() {
        const toggle = document.getElementById('sound-toggle');
        
        toggle.addEventListener('click', () => {
            this.toggleSound();
        });
    }

    showProjectModal(projectId) {
        const modal = document.getElementById('project-modal');
        const title = document.getElementById('modal-title');
        const description = document.getElementById('modal-description');
        
        // Project data
        const projects = {
            'ai-news-quiz': {
                title: 'AI News Quiz Platform',
                description: 'An intelligent quiz system that dynamically generates current affairs questions using AI algorithms and API integration. Features real-time question generation, adaptive difficulty, and comprehensive analytics for educational institutions.'
            },
            'tourist-safety': {
                title: 'Tourist Safety Application',
                description: 'A comprehensive GPS-based safety application for travelers featuring real-time location tracking, emergency alert system, safe route planning, and local emergency contact integration. Built with geolocation APIs and push notification systems.'
            },
            'fraud-detection': {
                title: 'Telecom Fraud Detection System',
                description: 'Advanced machine learning system utilizing Isolation Forest algorithms to detect fraudulent telecom activities in real-time. Processes call data records, identifies anomalous patterns, and provides automated alerting for suspicious behavior.'
            },
            '3d-portfolio': {
                title: '3D AI Portfolio',
                description: 'This very portfolio! An immersive 3D experience combining AI concepts with cinematic web design. Features interactive 3D elements, magical particle effects, and smooth animations showcasing the fusion of technology and creativity.'
            }
        };
        
        const project = projects[projectId];
        if (project) {
            title.textContent = project.title;
            description.textContent = project.description;
            
            modal.style.display = 'block';
            
            // Add shimmer animation to modal
            gsap.fromTo(modal.querySelector('.modal-content'), {
                scale: 0.8,
                opacity: 0
            }, {
                scale: 1,
                opacity: 1,
                duration: 0.5,
                ease: 'back.out(1.7)'
            });
            
            // Disable background scroll
            document.body.style.overflow = 'hidden';
        }
    }

    hideProjectModal() {
        const modal = document.getElementById('project-modal');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    toggleSound() {
        this.state.isSoundEnabled = !this.state.isSoundEnabled;
        const toggle = document.getElementById('sound-toggle');
        const icon = document.querySelector('.sound-icon');
        
        if (this.state.isSoundEnabled) {
            toggle.style.background = 'rgba(255, 215, 0, 0.2)';
            toggle.style.boxShadow = '0 0 20px #ffed41';
            icon.textContent = '🎵';
            
            // Resume audio context if paused
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
        } else {
            toggle.style.background = 'rgba(0, 0, 0, 0.5)';
            toggle.style.boxShadow = 'none';
            icon.textContent = '🔇';
            
            // Suspend audio context
            if (this.audioContext) {
                this.audioContext.suspend();
            }
        }
    }

    updateCursor(x, y) {
        const cursor = document.getElementById('magical-cursor');
        const dot = cursor.querySelector('.cursor-dot');
        const trail = cursor.querySelector('.cursor-trail');
        
        // Update main cursor position
        dot.style.left = x + 'px';
        dot.style.top = y + 'px';
        
        // Create trail effect
        const trailElement = document.createElement('div');
        trailElement.className = 'cursor-trail';
        trailElement.style.left = x + 'px';
        trailElement.style.top = y + 'px';
        trailElement.style.opacity = '0.5';
        
        cursor.appendChild(trailElement);
        
        // Remove trail after animation
        setTimeout(() => {
            if (trailElement.parentNode) {
                trailElement.parentNode.removeChild(trailElement);
            }
        }, 200);
    }

    createMagicBurst(x, y) {
        const burstContainer = document.getElementById('magic-bursts');
        
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'magic-particle';
            
            // Random direction and distance
            const angle = Math.random() * Math.PI * 2;
            const distance = 50 + Math.random() * 100;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            
            // Set position
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            
            // Set animation variables
            particle.style.setProperty('--tx', tx + 'px');
            particle.style.setProperty('--ty', ty + 'px');
            
            burstContainer.appendChild(particle);
            
            // Remove after animation
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 1000);
        }
    }

    pulseOrb() {
        if (!this.orb) return;
        
        // Scale pulse animation
        gsap.to(this.orb.scale, {
            x: 1.5,
            y: 1.5,
            z: 1.5,
            duration: 0.3,
            ease: 'power2.out',
            yoyo: true,
            repeat: 1
        });
        
        // Emissive pulse
        gsap.to(this.orb.material, {
            emissiveIntensity: 3,
            duration: 0.2,
            yoyo: true,
            repeat: 1
        });
    }

    handleScrollMagic() {
        const scrollPercent = Math.min(window.scrollY / (document.body.scrollHeight - window.innerHeight), 1);
        
        // Orb rotation speed increases with scroll
        const rotationSpeed = 0.001 + (scrollPercent * 0.005);
        
        // Lighting transition from blue to gold
        const fogColor = new THREE.Color().setHSL(0.6, 1, 0.05 + (scrollPercent * 0.05));
        this.scene.fog.color.copy(fogColor);
        
        // Particle movement speed increases
        const particleSpeed = 0.001 + (scrollPercent * 0.003);
        
        // Camera zoom in slightly
        const targetZ = 30 - (scrollPercent * 5);
        gsap.to(this.camera.position, {
            z: targetZ,
            duration: 1,
            ease: 'power2.inOut'
        });
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const loadingFill = document.querySelector('.loading-fill');
        
        // Complete the loading bar
        loadingFill.style.width = '100%';
        
        // Fade out
        gsap.to(loadingScreen, {
            opacity: 0,
            duration: 0.5,
            onComplete: () => {
                loadingScreen.style.display = 'none';
                this.state.isLoaded = true;
            }
        });
    }

    startAnimationLoop() {
        const animate = () => {
            requestAnimationFrame(animate);
            
            const time = this.clock.getElapsedTime();
            const delta = time - this.lastTime;
            this.lastTime = time;
            
            if (this.state.isLoaded) {
                this.updateScene(time, delta);
            }
            
            // Render multiple passes for depth effect
            this.renderer.clear();
            this.renderer.render(this.scene, this.camera);
        };
        
        animate();
    }

    updateScene(time, delta) {
        // Mouse-based camera movement
        this.state.targetRotation.x = this.state.mouseY * 0.5;
        this.state.targetRotation.y = this.state.mouseX * 0.5;
        
        // Smooth interpolation
        this.state.currentRotation.x += (this.state.targetRotation.x - this.state.currentRotation.x) * 0.05;
        this.state.currentRotation.y += (this.state.targetRotation.y - this.state.currentRotation.y) * 0.05;
        
        this.camera.rotation.x = this.state.currentRotation.x;
        this.camera.rotation.y = this.state.currentRotation.y;
        
        // Orb rotation and pulsing
        if (this.orb) {
            this.orb.rotation.x += 0.005;
            this.orb.rotation.y += 0.008;
            
            // Subtle breathing effect
            const scale = 1 + Math.sin(time) * 0.05;
            this.orb.scale.set(scale, scale, scale);
            
            // Hover effect
            if (this.state.orbHover) {
                this.orb.material.emissiveIntensity = 2.5;
                this.orbGlow.material.opacity = 0.5;
            } else {
                this.orb.material.emissiveIntensity = 1.5;
                this.orbGlow.material.opacity = 0.3;
            }
        }
        
        // Particle animation
        if (this.particles) {
            const positions = this.particles.geometry.attributes.position.array;
            const count = positions.length / 3;
            
            for (let i = 0; i < count; i++) {
                const i3 = i * 3;
                
                // Slow rotation of particles
                positions[i3] = positions[i3] * Math.cos(0.001) - positions[i3 + 1] * Math.sin(0.001);
                positions[i3 + 1] = positions[i3] * Math.sin(0.001) + positions[i3 + 1] * Math.cos(0.001);
                
                // Subtle floating motion
                positions[i3 + 1] += Math.sin(time + i) * 0.01;
            }
            
            this.particles.geometry.attributes.position.needsUpdate = true;
        }
        
        // Raycaster for orb interaction
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObject(this.orb);
        
        if (intersects.length > 0) {
            this.state.orbHover = true;
            document.body.style.cursor = 'pointer';
        } else {
            this.state.orbHover = false;
            document.body.style.cursor = 'default';
        }
    }
}

// Initialize the portfolio when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const portfolio = new MagicalPortfolio();
    
    // Add scroll-based magic effects
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        const scrollPercent = Math.min(scrollY / (document.body.scrollHeight - window.innerHeight), 1);
        
        // Adjust orb rotation speed based on scroll
        const orb = document.querySelector('.hero-name');
        if (orb) {
            orb.style.transform = `rotate(${scrollPercent * 5}deg)`;
        }
        
        // Change background intensity
        document.body.style.setProperty('--bg-intensity', 0.1 + (scrollPercent * 0.2));
    });
    
    // Add keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === ' ') {
            e.preventDefault();
            // Spacebar creates magic burst
            const x = window.innerWidth / 2;
            const y = window.innerHeight / 2;
            portfolio.createMagicBurst(x, y);
            portfolio.pulseOrb();
        }
    });
});