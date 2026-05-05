document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".search-form");
  const popup = document.getElementById("search-results-popup");
  const closeBtn = document.querySelector(".close-results");
  const container = document.getElementById("results-container");

  const tooltip = document.getElementById("kf-tooltip");
  const tooltipList = tooltip?.querySelector(".kf-tooltip-list");

  const diagramInline = document.getElementById("diagram-inline");

  const kennisveldEl = document.getElementById("kennisveld");
  const functieEl = document.getElementById("functie");
  const locatieEl = document.getElementById("locatie");

  const warningBox = document.getElementById("inline-warning");
  const searchSummary = document.getElementById("search-summary");

  if (!form || !popup || !closeBtn || !container) return;

  const norm = (s) => String(s ?? "").trim().toLowerCase();
  const emptyDash = (v) => (v && v.trim() ? v : "-");

  // =========================
  // UI HELPERS
  // =========================
  const showDiagram = () => diagramInline?.removeAttribute("hidden");
  const hideDiagram = () => diagramInline?.setAttribute("hidden", "");

  const showWarning = (msg) => {
    if (!warningBox) return;
    warningBox.innerHTML = msg;
    warningBox.style.display = "block";
    showDiagram();
  };

  const hideWarning = () => {
    if (!warningBox) return;
    warningBox.style.display = "none";
  };

  const resetUI = () => {
    hideWarning();
    hideDiagram();
  };

  [kennisveldEl, functieEl, locatieEl].forEach((el) => {
    el?.addEventListener("change", resetUI);
  });

  // =========================
  // SEARCH SUMMARY (ALTIJD 3 REGELS)
  // =========================
  const updateSummary = (kennisveld, functie, locatie) => {
    if (!searchSummary) return;

    searchSummary.textContent =
      `Kennisveld: ${emptyDash(kennisveld)} | ` +
      `Functie: ${emptyDash(functie)} | ` +
      `Locatie: ${emptyDash(locatie)}`;
  };

  // =========================
  // TOOLTIP
  // =========================
  const hideTooltip = () => {
    if (!tooltip) return;
    tooltip.style.display = "none";
  };

  const showTooltip = (btn, items) => {
    if (!tooltip || !tooltipList) return;

    tooltipList.innerHTML = items.map((k) => `<li>${k}</li>`).join("");

    const rect = btn.getBoundingClientRect();
    const width = 320;

    const left = Math.min(
      rect.left + window.scrollX,
      window.innerWidth + window.scrollX - width - 20
    );

    const top = rect.bottom + window.scrollY + 8;

    tooltip.style.left = `${Math.max(12 + window.scrollX, left)}px`;
    tooltip.style.top = `${top}px`;
    tooltip.style.display = "block";
  };

  // =========================
  // FORM SUBMIT
  // =========================
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    hideTooltip();

    const kennisveld = norm(kennisveldEl?.value);
    const functie = norm(functieEl?.value);
    const locatie = norm(locatieEl?.value);

    // WARNING LOGICA
    if (!functie && (kennisveld || locatie)) {
      showWarning(`
        <strong>Geen functie geselecteerd</strong><br>
        Bekijk hiernaast het stroomdiagram om volgens de juiste route uw zoekvraag te beantwoorden.
      `);
      return;
    }

    hideWarning();
    hideDiagram();

    updateSummary(kennisveld, functie, locatie);

    popup.style.display = "flex";
    container.innerHTML = "<p>Bezig met zoeken...</p>";

    try {
      const res = await fetch("./data.json", { cache: "no-store" });
      if (!res.ok) throw new Error("data.json niet gevonden");

      const data = await res.json();

      const results = data.filter((item) => {
        const matchFunctie = !functie || norm(item.functie) === functie;
        const matchLocatie = !locatie || norm(item.locatie) === locatie;

        let matchKennisveld = true;
        if (kennisveld) {
          const fields = Array.isArray(item.kennisvelden)
            ? item.kennisvelden
            : [];
          matchKennisveld = fields.some((k) => norm(k) === kennisveld);
        }

        return matchFunctie && matchLocatie && matchKennisveld;
      });

      if (results.length === 0) {
        container.innerHTML = "<p>Geen resultaten gevonden.</p>";
        return;
      }

      let table = `
        <table class="result-table">
          <thead>
            <tr>
              <th>Naam</th>
              <th>Email</th>
              <th>Telefoon</th>
              <th>Locatie</th>
              <th>Functie</th>
              <th>Kennisvelden</th>
            </tr>
          </thead>
          <tbody>
      `;

      results.forEach((r) => {
        const fields = Array.isArray(r.kennisvelden) ? r.kennisvelden : [];

        let kennisveldCell = "";

        if (kennisveld) {
          const matched = fields.find((k) => norm(k) === kennisveld) || "";
          const overige = fields.filter((k) => norm(k) !== kennisveld);

          kennisveldCell = `
            <span class="kf-main">${matched}</span>
            ${
              overige.length
                ? `<button type="button" class="kf-more-btn"
                    data-overige="${encodeURIComponent(JSON.stringify(overige))}">
                    +${overige.length} meer
                   </button>`
                : ""
            }
          `;
        } else {
          kennisveldCell = fields.join(", ");
        }

        table += `
          <tr>
            <td>${r.naam ?? ""}</td>
            <td>${r.email ? `<a href="mailto:${r.email}">${r.email}</a>` : ""}</td>
            <td>${r.telefoon ? `<a href="tel:${r.telefoon}">${r.telefoon}</a>` : ""}</td>
            <td>${r.locatie ?? ""}</td>
            <td>${r.functie ?? ""}</td>
            <td>${kennisveldCell}</td>
          </tr>
        `;
      });

      table += "</tbody></table>";
      container.innerHTML = table;

    } catch (err) {
      console.error(err);
      container.innerHTML = `<p><strong>Fout:</strong> ${err.message}</p>`;
    }
  });

  // =========================
  // CLOSE POPUP
  // =========================
  closeBtn.addEventListener("click", () => {
    popup.style.display = "none";
    hideTooltip();
  });

  popup.addEventListener("click", (e) => {
    if (e.target === popup) {
      popup.style.display = "none";
      hideTooltip();
    }
  });

  // =========================
  // TOOLTIP GLOBAL
  // =========================
  document.addEventListener("click", (e) => {
    const moreBtn = e.target.closest(".kf-more-btn");

    if (moreBtn) {
      const raw = moreBtn.getAttribute("data-overige");
      const overige = JSON.parse(decodeURIComponent(raw));
      showTooltip(moreBtn, overige);
      return;
    }

    if (tooltip && tooltip.style.display === "block") {
      const inside = e.target.closest("#kf-tooltip");
      const clicked = e.target.closest(".kf-more-btn");

      if (!inside && !clicked) hideTooltip();
    }
  });

  // =========================
  // ESC
  // =========================
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;

    popup.style.display = "none";
    hideTooltip();
    hideWarning();
    hideDiagram();
  });
});