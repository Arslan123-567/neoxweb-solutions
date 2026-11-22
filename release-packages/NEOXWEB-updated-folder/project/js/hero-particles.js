/**
 * Hero background — subtle green dots floating upward (all premium heroes)
 */
(function () {

    function particleCount() {
        if (window.innerWidth < 480) return 14;
        if (window.innerWidth < 900) return 22;
        return 30;
    }

    function initCanvas(canvas) {
        var hero = canvas.closest(
            '.hero-section--premium, .hero-section--premium-home, .hero-section--neoxweb, .hero-section--pro, .hero-section--cinematic, .hero-section, .nx-page-hero, .web-hero, .svc-banner-hero, .contact-page-hero'
        );
        if (!hero) return;

        var ctx = canvas.getContext('2d');
        var particles = [];
        var rafId = 0;
        var width = 0;
        var height = 0;
        var visible = true;
        var pointer = { x: -1, y: -1 };

        function resize() {
            var rect = hero.getBoundingClientRect();
            width = Math.max(1, Math.floor(rect.width));
            height = Math.max(1, Math.floor(rect.height));
            canvas.width = width;
            canvas.height = height;
            canvas.style.width = width + 'px';
            canvas.style.height = height + 'px';
        }

        function createParticle(fromBottom) {
            var depth = 0.35 + Math.random() * 0.65;
            return {
                x: Math.random() * width,
                y: fromBottom ? height + Math.random() * 120 : Math.random() * height,
                vy: -(0.38 + depth * 0.72),
                vx: (Math.random() - 0.5) * 0.22,
                r: 3.5 + depth * 3,
                alpha: 0.34 + depth * 0.48,
                phase: Math.random() * Math.PI * 2
            };
        }

        function seedParticles() {
            particles = Array.from({ length: particleCount() }, function () {
                return createParticle(false);
            });
        }

        function resetParticle(p) {
            p.x = Math.random() * width;
            p.y = height + Math.random() * 40;
            var depth = 0.35 + Math.random() * 0.65;
            p.vy = -(0.38 + depth * 0.72);
            p.vx = (Math.random() - 0.5) * 0.22;
            p.r = 3.5 + depth * 3;
            p.alpha = 0.34 + depth * 0.48;
        }

        function drawParticle(p, time) {
            var pulse = 0.85 + Math.sin(time * 0.001 + p.phase) * 0.15;
            var a = Math.min(0.65, p.alpha * pulse);
            var r = p.r * pulse;
            ctx.beginPath();
            ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(74, 222, 128, ' + a + ')';
            ctx.shadowColor = 'rgba(74, 222, 128, 0.7)';
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        function drawPointerGlow() {
            if (pointer.x < 0 || pointer.y < 0) return;
            var glow = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 190);
            glow.addColorStop(0, 'rgba(74, 222, 128, 0.12)');
            glow.addColorStop(1, 'rgba(74, 222, 128, 0)');
            ctx.fillStyle = glow;
            ctx.fillRect(pointer.x - 190, pointer.y - 190, 380, 380);
        }

        function drawStatic() {
            resize();
            ctx.clearRect(0, 0, width, height);
            var t = performance.now();
            drawPointerGlow();
            particles.forEach(function (p) { drawParticle(p, t); });
        }

        function step(time) {
            ctx.clearRect(0, 0, width, height);
            drawPointerGlow();
            particles.forEach(function (p) {
                p.x += p.vx;
                p.y += p.vy;
                if (p.y < -20) resetParticle(p);
                drawParticle(p, time);
            });
            rafId = requestAnimationFrame(step);
        }

        function pause() {
            if (rafId) {
                cancelAnimationFrame(rafId);
                rafId = 0;
            }
        }

        function resume() {
            if (rafId || !visible || document.hidden) return;
            rafId = requestAnimationFrame(step);
        }

        function start() {
            pause();
            resize();
            seedParticles();
            if (visible) resume();
        }

        hero.addEventListener('pointermove', function (event) {
            var rect = hero.getBoundingClientRect();
            pointer.x = event.clientX - rect.left;
            pointer.y = event.clientY - rect.top;
        }, { passive: true });
        hero.addEventListener('pointerleave', function () {
            pointer.x = -1;
            pointer.y = -1;
        }, { passive: true });

        if (typeof IntersectionObserver === 'function') {
            var io = new IntersectionObserver(function (entries) {
                visible = entries[0] && entries[0].isIntersecting;
                if (visible) resume();
                else pause();
            }, { threshold: 0 });
            io.observe(hero);
        }

        var resizeTimer;
        window.addEventListener('resize', function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(start, 200);
        }, { passive: true });

        document.addEventListener('visibilitychange', function () {
            if (document.hidden) pause();
            else if (visible) resume();
        });

        start();
    }

    function boot() {
        document.querySelectorAll('.hero-particles-canvas, .nx-page-hero__particles, #heroParticles').forEach(function (canvas) {
            if (canvas.dataset.nxParticlesInit) return;
            canvas.dataset.nxParticlesInit = '1';
            initCanvas(canvas);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            setTimeout(boot, 80);
        });
        window.addEventListener('nx:heroes-upgraded', function () { setTimeout(boot, 20); });
    } else {
        setTimeout(boot, 80);
        window.addEventListener('nx:heroes-upgraded', function () { setTimeout(boot, 20); });
    }
})();
