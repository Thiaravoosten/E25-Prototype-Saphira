document.addEventListener("DOMContentLoaded", () => {
    const track = document.querySelector(".moments-track");
    const slides = Array.from(document.querySelectorAll(".moments-slide"));
    const dotsContainer = document.querySelector(".moments-dots");

    let currentIndex = 0;
    const slideCount = slides.length;

    /* DOTS */
    slides.forEach((_, index) => {
        const dot = document.createElement("button");
        if (index === 0) dot.classList.add("active");

        dot.addEventListener("click", () => {
            currentIndex = index;
            updateCarousel();
            resetAutoplay();
        });

        dotsContainer.appendChild(dot);
    });

    const dots = Array.from(dotsContainer.children);

    function updateCarousel() {
        const slideWidth = slides[0].offsetWidth;
        track.style.transform = `translateX(-${currentIndex * slideWidth}px)`;

        dots.forEach(dot => dot.classList.remove("active"));
        dots[currentIndex].classList.add("active");
    }

    /* AUTOPLAY */
    let autoplay = setInterval(nextSlide, 4500);

    function nextSlide() {
        currentIndex = (currentIndex + 1) % slideCount;
        updateCarousel();
    }

    function resetAutoplay() {
        clearInterval(autoplay);
        autoplay = setInterval(nextSlide, 4500);
    }

    window.addEventListener("resize", updateCarousel);
});
