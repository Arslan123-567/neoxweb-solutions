const circleContainer = document.getElementById("circleBackground");

function createCircle() {
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

// New circle every 700ms
setInterval(createCircle, 700);