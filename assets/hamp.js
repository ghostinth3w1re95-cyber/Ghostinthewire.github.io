document.addEventListener("DOMContentLoaded", () => {
      const menuToggle = document.querySelector(".menu-toggle");
      const menuLinks = document.querySelector(".menu-links");

      menuToggle.addEventListener("click", () => {
        menuLinks.classList.toggle("active");
        const expanded = menuToggle.getAttribute("aria-expanded") === "true";
        menuToggle.setAttribute("aria-expanded", !expanded);
      });
    });