/* Lib’Services — interactions sans dépendance externe */
const select = (selector, root = document) => root.querySelector(selector);
const selectAll = (selector, root = document) => [...root.querySelectorAll(selector)];

select("#year").textContent = new Date().getFullYear();

const menuButton = select(".menu-toggle");
const navigation = select("#main-nav");
menuButton.addEventListener("click", () => {
  const isOpen = navigation.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(isOpen));
  menuButton.textContent = isOpen ? "✕" : "☰";
});
selectAll("#main-nav a").forEach(link => link.addEventListener("click", () => {
  navigation.classList.remove("open");
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.textContent = "☰";
}));

const revealItems = selectAll(".reveal");
if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealItems.forEach(item => observer.observe(item));
} else {
  revealItems.forEach(item => item.classList.add("visible"));
}

// Galerie des réalisations : 3 cartes par page, avec filtres compatibles.
const galleryGrid = select(".gallery-grid");
const galleryPagination = select("#galleryPagination");
const galleryCards = selectAll(".gallery-card", galleryGrid);
const cardsPerPage = 3;
let activeGalleryFilter = "all";
let activeGalleryPage = 1;

function renderGallery() {
  const matchingCards = galleryCards.filter(card =>
    activeGalleryFilter === "all" || card.dataset.category === activeGalleryFilter
  );
  const totalPages = Math.max(1, Math.ceil(matchingCards.length / cardsPerPage));
  activeGalleryPage = Math.min(Math.max(1, activeGalleryPage), totalPages);
  galleryCards.forEach(card => card.classList.add("is-hidden"));
  matchingCards
    .slice((activeGalleryPage - 1) * cardsPerPage, activeGalleryPage * cardsPerPage)
    .forEach(card => card.classList.remove("is-hidden"));

  galleryPagination.replaceChildren();
  if (totalPages > 1) {
    const addPageButton = (label, page, options = {}) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "gallery-page-button" + (options.active ? " active" : "");
      button.textContent = label;
      button.disabled = Boolean(options.disabled);
      if (options.active) button.setAttribute("aria-current", "page");
      if (options.ariaLabel) button.setAttribute("aria-label", options.ariaLabel);
      button.addEventListener("click", () => {
        activeGalleryPage = page;
        renderGallery();
      });
      galleryPagination.append(button);
    };
    addPageButton("←", activeGalleryPage - 1, { disabled: activeGalleryPage === 1, ariaLabel: "Page précédente" });
    for (let page = 1; page <= totalPages; page++) {
      addPageButton(String(page), page, { active: page === activeGalleryPage, ariaLabel: "Page " + page });
    }
    addPageButton("Voir plus →", activeGalleryPage + 1, { disabled: activeGalleryPage === totalPages, ariaLabel: "Page suivante" });
  }
  const status = document.createElement("p");
  status.className = "gallery-page-status";
  status.setAttribute("aria-live", "polite");
  status.textContent = matchingCards.length + " réalisation" + (matchingCards.length > 1 ? "s" : "") +
    " · page " + activeGalleryPage + " sur " + totalPages;
  galleryPagination.append(status);
}

selectAll(".filter-button").forEach(button => button.addEventListener("click", () => {
  selectAll(".filter-button").forEach(item => item.classList.remove("active"));
  button.classList.add("active");
  activeGalleryFilter = button.dataset.filter;
  activeGalleryPage = 1;
  renderGallery();
}));
renderGallery();

selectAll("[data-service]").forEach(link => link.addEventListener("click", () => {
  const serviceSelect = select("#service");
  const desired = link.dataset.service;
  const option = [...serviceSelect.options].find(item => item.textContent === desired);
  if (option) serviceSelect.value = option.value;
}));

const toast = select("#toast");
let toastTimer;
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 3200);
}

select("#contact-form").addEventListener("submit", event => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const value = name => String(data.get(name) || "Non renseigné").trim();
  const message = [
    "📋 DEMANDE DE DEVIS — LIB’SERVICES",
    "",
    "Nom : " + value("name"),
    "Téléphone du client : " + value("phone"),
    "E-mail : " + value("email"),
    "Service souhaité : " + value("service"),
    "",
    "Description du projet :",
    value("details"),
    "",
    "Merci de me recontacter pour confirmer le prix et le délai."
  ].join("\n");
  const whatsappUrl = "https://wa.me/24177855883?text=" + encodeURIComponent(message);
  window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  const result = select("#form-result");
  result.hidden = false;
  result.textContent = "Votre demande est prête dans WhatsApp. Vérifiez les informations puis appuyez sur Envoyer pour transmettre votre demande à Lib’Services.";
  showToast("WhatsApp s’ouvre avec votre demande préremplie.");
});
