document.addEventListener("DOMContentLoaded", () => {
    // =========================
    // Basis elementen (Zoeken)
    // =========================
    const form = document.querySelector(".search-form");
    const popup = document.getElementById("search-results-popup");
    const closeBtn = document.querySelector(".close-results");
    const container = document.getElementById("results-container");
  
    // =========================
    // Tooltip (+meer kennisvelden)
    // =========================
    const tooltip = document.getElementById("kf-tooltip");
    const tooltipList = tooltip?.querySelector(".kf-tooltip-list");
  
    // =========================
    // Inline diagram
    // =========================
    const openDiagramBtn = document.getElementById("open-diagram");
    const diagramInline = document.getElementById("diagram-inline");
  
    if (!form || !popup || !closeBtn || !container) return;
  
    const norm = (s) => String(s ?? "").trim().toLowerCase();
  
    // -------------------------
    // Helpers: tooltip
    // -------------------------
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
  
    // -------------------------
    // Helpers: diagram inline
    // -------------------------
    const isDiagramOpen = () => !!(diagramInline && !diagramInline.hasAttribute("hidden"));
  
    const setDiagramButtonState = (open) => {
      if (!openDiagramBtn) return;
      openDiagramBtn.setAttribute("aria-expanded", String(open));
      openDiagramBtn.textContent = open ? "Verberg stroomdiagram" : "Zie stroomdiagram";
    };
  
    const openDiagram = () => {
      if (!diagramInline) return;
      diagramInline.removeAttribute("hidden");
      setDiagramButtonState(true);
  
      // Netter nu hij onder de cards staat:
      diagramInline.scrollIntoView({ behavior: "smooth", block: "start" });
    };
  
    const closeDiagram = () => {
      if (!diagramInline) return;
      diagramInline.setAttribute("hidden", "");
      setDiagramButtonState(false);
    };
  
    const toggleDiagram = () => {
      if (!diagramInline) return;
      isDiagramOpen() ? closeDiagram() : openDiagram();
    };
  
    // Start-state + click handler
    if (openDiagramBtn && diagramInline) {
      setDiagramButtonState(isDiagramOpen());
      openDiagramBtn.addEventListener("click", toggleDiagram);
    }
  
    // -------------------------
    // Zoek submit
    // -------------------------
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
  
      // 🔥 belangrijk: klap diagram dicht bij zoeken (scheelt layout “springen”)
      closeDiagram();
  
      popup.style.display = "flex";
      container.innerHTML = "<p>Bezig met zoeken...</p>";
      hideTooltip();
  
      const kennisveld = norm(document.getElementById("kennisveld")?.value);
      const functie = norm(document.getElementById("functie")?.value);
      const locatie = norm(document.getElementById("locatie")?.value);
  
      try {
        const res = await fetch("./data.json", { cache: "no-store" });
        if (!res.ok) throw new Error(`data.json niet gevonden (${res.status})`);
  
        const data = await res.json();
  
        const results = data.filter((item) => {
          const matchFunctie = !functie || norm(item.functie) === functie;
          const matchLocatie = !locatie || norm(item.locatie) === locatie;
  
          let matchKennisveld = true;
          if (kennisveld) {
            const fields = Array.isArray(item.kennisvelden) ? item.kennisvelden : [];
            matchKennisveld = fields.some((k) => norm(k) === kennisveld);
          }
  
          return matchFunctie && matchLocatie && matchKennisveld;
        });
  
        if (results.length === 0) {
          container.innerHTML = "<p>Geen resultaten gevonden voor deze filters.</p>";
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
                  ? `<button type="button" class="kf-more-btn" data-overige="${encodeURIComponent(
                      JSON.stringify(overige)
                    )}">+${overige.length} meer</button>`
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
  
    // -------------------------
    // Zoekresultaten popup sluiten
    // -------------------------
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
  
    // -------------------------
    // 1 centrale click handler
    // (+meer tooltip + buiten klik sluiten)
    // -------------------------
    document.addEventListener("click", (e) => {
      const moreBtn = e.target.closest(".kf-more-btn");
      if (moreBtn) {
        const raw = moreBtn.getAttribute("data-overige");
        if (!raw) return;
        const overige = JSON.parse(decodeURIComponent(raw));
        showTooltip(moreBtn, overige);
        return;
      }
  
      if (e.target.closest(".kf-tooltip-close")) {
        hideTooltip();
        return;
      }
  
      if (tooltip && tooltip.style.display === "block") {
        const insideTooltip = e.target.closest("#kf-tooltip");
        const clickedMoreBtn = e.target.closest(".kf-more-btn");
        if (!insideTooltip && !clickedMoreBtn) hideTooltip();
      }
    });
  
    // -------------------------
    // ESC sluit alles
    // -------------------------
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
  
      popup.style.display = "none";
      hideTooltip();
      closeDiagram();
    });
  });
  