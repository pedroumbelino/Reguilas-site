document.documentElement.classList.remove("no-js");

// Menu móvel
const toggle = document.querySelector(".menu-toggle");
const mobileNav = document.getElementById("mobile-nav");
if (toggle && mobileNav) {
  const setOpen = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    mobileNav.classList.toggle("is-open", open);
    mobileNav.toggleAttribute("inert", !open);
    document.body.style.overflow = open ? "hidden" : "";
  };
  setOpen(false);
  toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
  mobileNav.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
}

// Carrosséis
document.querySelectorAll(".carousel").forEach((carousel) => {
  const track = carousel.querySelector(".carousel-track");
  carousel.querySelectorAll(".carousel-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const dir = Number(btn.dataset.dir);
      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
      const atStart = track.scrollLeft <= 4;
      if (dir > 0 && atEnd) track.scrollTo({ left: 0, behavior: "smooth" });
      else if (dir < 0 && atStart) track.scrollTo({ left: track.scrollWidth, behavior: "smooth" });
      else track.scrollBy({ left: dir * track.clientWidth * 0.9, behavior: "smooth" });
    });
  });
});

// Animações de entrada
const reveals = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: "0px 0px -8% 0px" });
  reveals.forEach((el) => io.observe(el));
} else {
  reveals.forEach((el) => el.classList.add("is-visible"));
}

// Formulário de orçamento: data mínima = hoje; pré-seleciona o tipo de evento via ?tipo=
const dateInput = document.getElementById("data");
if (dateInput) {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  dateInput.min = today.toISOString().slice(0, 10);
}
const tipo = new URLSearchParams(location.search).get("tipo");
const tipoSelect = document.getElementById("tipo");
if (tipo && tipoSelect && [...tipoSelect.options].some((o) => o.value === tipo)) {
  tipoSelect.value = tipo;
}

document.querySelectorAll("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });
