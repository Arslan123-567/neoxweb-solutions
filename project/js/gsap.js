// ========================================
// CIRCLE BACKGROUND ANIMATION
// ========================================
const circleContainer = document.getElementById("circleBackground");

function createCircle() {
    if (!circleContainer) return;
    
    const circle = document.createElement("div");
    circle.classList.add("bg-circle");

    // Random size
    const size = Math.random() * 180 + 80;

    // Random position
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * window.innerHeight;

    circle.style.width = `${size}px`;
    circle.style.height = `${size}px`;
    circle.style.left = `${x}px`;
    circle.style.top = `${y}px`;

    circleContainer.appendChild(circle);

    // Animation
    if (typeof gsap !== 'undefined') {
        gsap.fromTo(
            circle,
            {
                scale: 0,
                opacity: 0
            },
            {
                scale: 1,
                opacity: 1,
                duration: 1.5,
                ease: "power2.out",
                onComplete: () => {
                    gsap.to(circle, {
                        scale: 1.5,
                        opacity: 0,
                        duration: 2.5,
                        ease: "power2.inOut",
                        onComplete: () => {
                            circle.remove();
                        }
                    });
                }
            }
        );
    }
}

// Create circles every 700ms
setTimeout(() => {
    if (typeof gsap !== 'undefined') {
        setInterval(createCircle, 700);
    }
}, 100);

// ========================================
// PARTICLE CANVAS ANIMATION
// ========================================
const canvas = document.getElementById("particleCanvas");
const ctx = canvas.getContext("2d");

let width;
let height;
let particles = [];
let orbs = [];

const mouse = {
    x: null,
    y: null,
    radius: 180
};

/* =========================
   CANVAS SIZE
========================= */

function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    width = canvas.offsetWidth;
    height = canvas.offsetHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    createParticles();
    createOrbs();
}

window.addEventListener("resize", resizeCanvas);


/* =========================
   PARTICLES
========================= */

function createParticles() {

    particles = [];

    const spacing = window.innerWidth < 768 ? 28 : 24;

    const columns = Math.ceil(width / spacing);
    const rows = Math.ceil(height / spacing);

    for (let y = 0; y < rows; y++) {

        for (let x = 0; x < columns; x++) {

            const px = x * spacing + spacing / 2;
            const py = y * spacing + spacing / 2;

            /*
             * Randomly remove some particles
             * to create organic clusters.
             */

            if (Math.random() > 0.72) continue;

            particles.push({
                baseX: px,
                baseY: py,

                x: px,
                y: py,

                size: Math.random() * 1.8 + 0.7,

                opacity: Math.random() * 0.55 + 0.2,

                phase: Math.random() * Math.PI * 2,

                speed: Math.random() * 0.015 + 0.005,

                drift: Math.random() * 10 + 5,

                cluster: Math.random() * 1.5 + 0.5
            });
        }
    }
}


/* =========================
   LARGE GLOWING ORBS
========================= */

function createOrbs() {

    orbs = [];

    const orbCount = window.innerWidth < 768 ? 5 : 9;

    for (let i = 0; i < orbCount; i++) {

        orbs.push({

            x: Math.random() * width,
            y: Math.random() * height,

            baseX: Math.random() * width,
            baseY: Math.random() * height,

            radius: Math.random() * 8 + 7,

            glow: Math.random() * 20 + 20,

            opacity: Math.random() * 0.4 + 0.45,

            phase: Math.random() * Math.PI * 2,

            speed: Math.random() * 0.008 + 0.003,

            movement: Math.random() * 80 + 40
        });
    }
}


/* =========================
   DRAW PARTICLE
========================= */

function drawParticle(p) {

    const glowRadius = p.size * 7;

    const gradient = ctx.createRadialGradient(
        p.x,
        p.y,
        0,
        p.x,
        p.y,
        glowRadius
    );

    gradient.addColorStop(0, `rgba(0,255,50,${p.opacity})`);
    gradient.addColorStop(0.25, `rgba(0,255,50,${p.opacity * 0.45})`);
    gradient.addColorStop(1, "rgba(0,255,50,0)");

    ctx.beginPath();

    ctx.fillStyle = gradient;

    ctx.arc(
        p.x,
        p.y,
        glowRadius,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /*
     * Bright center
     */

    ctx.beginPath();

    ctx.fillStyle = `rgba(40,255,70,${p.opacity})`;

    ctx.arc(
        p.x,
        p.y,
        p.size,
        0,
        Math.PI * 2
    );

    ctx.fill();
}


/* =========================
   DRAW LARGE ORB
========================= */

function drawOrb(orb, time) {

    const pulse =
        Math.sin(time * orb.speed + orb.phase) * 4;

    const radius = orb.radius + pulse;

    const gradient = ctx.createRadialGradient(
        orb.x,
        orb.y,
        0,
        orb.x,
        orb.y,
        radius + orb.glow
    );

    gradient.addColorStop(
        0,
        `rgba(0,255,40,${orb.opacity})`
    );

    gradient.addColorStop(
        0.15,
        `rgba(0,255,40,${orb.opacity * 0.8})`
    );

    gradient.addColorStop(
        0.4,
        `rgba(0,255,40,${orb.opacity * 0.25})`
    );

    gradient.addColorStop(
        1,
        "rgba(0,255,40,0)"
    );

    ctx.beginPath();

    ctx.fillStyle = gradient;

    ctx.arc(
        orb.x,
        orb.y,
        radius + orb.glow,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /*
     * Bright center
     */

    ctx.beginPath();

    ctx.fillStyle = `rgba(30,255,50,${orb.opacity})`;

    ctx.arc(
        orb.x,
        orb.y,
        radius * 0.42,
        0,
        Math.PI * 2
    );

    ctx.fill();
}


/* =========================
   ANIMATION
========================= */

function animate(time) {

    ctx.clearRect(0, 0, width, height);

    /*
     * Pure black background
     */

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);


    /* =====================
       PARTICLES
    ===================== */

    particles.forEach((p) => {

        /*
         * Organic floating movement
         */

        p.x =
            p.baseX +
            Math.sin(
                time * p.speed +
                p.phase
            ) * p.drift;

        p.y =
            p.baseY +
            Math.cos(
                time * p.speed * 0.8 +
                p.phase
            ) * p.drift;


        /*
         * Mouse interaction
         */

        if (mouse.x !== null) {

            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;

            const distance = Math.sqrt(
                dx * dx + dy * dy
            );

            if (distance < mouse.radius) {

                const force =
                    (mouse.radius - distance) /
                    mouse.radius;

                p.x +=
                    (dx / distance) *
                    force *
                    12;

                p.y +=
                    (dy / distance) *
                    force *
                    12;
            }
        }


        /*
         * Twinkle effect
         */

        const twinkle =
            Math.sin(
                time * 0.002 +
                p.phase
            ) * 0.25;

        const originalOpacity = p.opacity;

        p.opacity =
            Math.max(
                0.08,
                originalOpacity + twinkle
            );

        drawParticle(p);

        p.opacity = originalOpacity;
    });


    /* =====================
       LARGE ORBS
    ===================== */

    orbs.forEach((orb) => {

        orb.x =
            orb.baseX +
            Math.sin(
                time * orb.speed +
                orb.phase
            ) * orb.movement;

        orb.y =
            orb.baseY +
            Math.cos(
                time * orb.speed * 0.7 +
                orb.phase
            ) * orb.movement;

        drawOrb(orb, time);
    });


    requestAnimationFrame(animate);
}


/* =========================
   MOUSE
========================= */

window.addEventListener("mousemove", (event) => {

    const rect = canvas.getBoundingClientRect();

    mouse.x = event.clientX - rect.left;
    mouse.y = event.clientY - rect.top;
});


window.addEventListener("mouseleave", () => {

    mouse.x = null;
    mouse.y = null;
});


/* =========================
   START
========================= */

resizeCanvas();

requestAnimationFrame(animate);