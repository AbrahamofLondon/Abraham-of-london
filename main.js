document.addEventListener("DOMContentLoaded", function() {
    // --- Debug checks ---
    console.log("Script loaded successfully");
    console.log("Mobile menu button exists:", document.querySelector('.mobile-menu-button') !== null);
    console.log("Mobile menu exists:", document.querySelector('.mobile-menu') !== null);
    console.log("Number of accordions found:", document.querySelectorAll('.accordion-question').length);

    console.log("New JS initialized");

    // --- Mobile Menu ---
    const menuButton = document.querySelector(".mobile-menu-button");
    const mobileMenu = document.querySelector(".mobile-menu");

    if (menuButton && mobileMenu) {
        menuButton.addEventListener("click", function() {
            const isOpen = mobileMenu.classList.contains("block");
            mobileMenu.classList.toggle("block");
            mobileMenu.classList.toggle("hidden");
            menuButton.setAttribute("aria-expanded", String(!isOpen));
        });
    } else {
        console.warn("Mobile menu elements not found");
    }

    // --- Accordions ---
    document.querySelectorAll(".accordion-question").forEach(item => {
        item.addEventListener("click", function() {
            const panel = this.nextElementSibling;
            panel.style.display = panel.style.display === "block" ? "none" : "block";
        });
    });
});