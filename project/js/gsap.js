const circleContainer = document.getElementById("circleBackground");

function createCircle() {
    if (!circleContainer || typeof gsap === "undefined") return;

    const circle = document.createElement("div");
    circle.classList.add("bg-circle");
    
    // Random size
    const size = Math.random() * 180 + 80;
    
    // Position using client viewport bounds
    const maxX = document.documentElement.clientWidth;
    const maxY = document.documentElement.clientHeight;

    const x = Math.random() * maxX;
    const y = Math.random() * maxY;

    circle.style.width = `${size}px`;
    circle.style.height = `${size}px`;
    circle.style.left = `${x}px`;
    circle.style.top = `${y}px`;

    circleContainer.appendChild(circle);

    // GSAP Animation with explicit Centering transform
    gsap.fromTo(
        circle,
        { 
            scale: 0, 
            opacity: 0,
            xPercent: -50, // Center alignment for GSAP
            yPercent: -50 
        },
        {
            scale: 1,
            opacity: 1,
            duration: 0.5,
            ease: "power2.out",
            onComplete: () => {
                gsap.to(circle, {
                    scale: 1.5,
                    opacity: 0,
                    duration: 1.5,
                    ease: "power2.inOut",
                    onComplete: () => {
                        circle.remove();
                    }
                });
            }
        }
    );
}

setInterval(createCircle, 700);