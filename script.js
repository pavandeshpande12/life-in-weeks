/**
 * Life in Weeks Visualizer
 * Core calculation and rendering logic for the life-in-weeks view.
 */

(() => {
  const form = document.getElementById("dob-form");
  const dobInput = document.getElementById("dob");
  const gridEl = document.getElementById("weeks-grid");
  const ageEl = document.getElementById("stat-age");
  const livedEl = document.getElementById("stat-lived");
  const remainingEl = document.getElementById("stat-remaining");
  const reflectionToggle = document.getElementById("reflection-toggle");
  const reflectionText = document.getElementById("reflection-text");
  const dobErrorEl = document.getElementById("dob-error");

  if (!form || !dobInput || !gridEl) return;

  const AVERAGE_LIFESPAN_YEARS = 90;
  const WEEKS_PER_YEAR = 52;
  const MAX_REASONABLE_AGE_YEARS = 110;

  /**
   * Given a date of birth, derive total weeks in the model and how many have
   * elapsed so far. Throws if DOB is in the future.
   */
  function calculateWeeks(dob) {
    const now = new Date();

    if (dob > now) {
      throw new Error("Date of birth cannot be in the future.");
    }

    const totalWeeks = AVERAGE_LIFESPAN_YEARS * WEEKS_PER_YEAR;

    const msDiff = now.getTime() - dob.getTime();
    const weeksLived = Math.floor(msDiff / (1000 * 60 * 60 * 24 * 7));
    const yearsLived = msDiff / (1000 * 60 * 60 * 24 * 365.25);

    return {
      totalWeeks,
      weeksLived,
      yearsLived,
    };
  }

  /**
   * Render the 90×52 week grid, grouping weeks into rows by year and
   * marking each week as lived or remaining.
   */
  function renderWeeksGrid(totalWeeks, weeksLived) {
    // Ensure we never try to render negative or more lived weeks than exist.
    const safeTotal = Math.max(0, totalWeeks);
    const safeLived = Math.min(Math.max(0, weeksLived), safeTotal);

    // Clear any existing content for clean re-renders.
    gridEl.innerHTML = "";

    const years = AVERAGE_LIFESPAN_YEARS;
    const weeksPerYear = WEEKS_PER_YEAR;

    let globalIndex = 0;

    for (let year = 0; year < years; year += 1) {
      const row = document.createElement("div");
      row.classList.add("year-row");

      if (year > 0 && year % 10 === 0) {
        row.classList.add("year-row--decade");
      }

      for (let week = 0; week < weeksPerYear; week += 1) {
        if (globalIndex >= safeTotal) break;

        const cell = document.createElement("div");
        cell.classList.add("week-cell");

        if (globalIndex < safeLived) {
          cell.classList.add("week-cell--past");
        } else {
          cell.classList.add("week-cell--future");
        }

        row.appendChild(cell);
        globalIndex += 1;
      }

      gridEl.appendChild(row);

      if (globalIndex >= safeTotal) {
        break;
      }
    }
  }

  /**
   * Reflect the current age and week counts in the summary cards.
   */
  function updateSummary({ yearsLived, weeksLived, totalWeeks }) {
    if (ageEl) {
      ageEl.textContent = yearsLived.toFixed(1);
    }

    if (livedEl) {
      livedEl.textContent = weeksLived.toLocaleString();
    }

    if (remainingEl) {
      const remaining = Math.max(0, totalWeeks - weeksLived);
      remainingEl.textContent = remaining.toLocaleString();
    }
  }

  /**
   * Apply a fresh fade-in animation to the grid after each render.
   * The forced reflow ensures the animation restarts on subsequent updates.
   */
  function applyGridAnimation() {
    gridEl.classList.remove("is-fresh");

    // Force a reflow so the animation can restart on subsequent renders.
    // eslint-disable-next-line no-unused-expressions
    void gridEl.offsetWidth;

    gridEl.classList.add("is-fresh");
  }

  /**
   * Clear any visible DOB validation message.
   */
  function clearError() {
    if (!dobErrorEl) return;
    dobErrorEl.textContent = "";
    dobErrorEl.classList.remove("form-feedback--error");
  }

  /**
   * Show a DOB validation or informational message under the input.
   */
  function showError(message) {
    if (!dobErrorEl) return;
    dobErrorEl.textContent = message;
    dobErrorEl.classList.add("form-feedback--error");
  }

  // Optional reflective text beneath the stats, controlled via a small switch.
  if (reflectionToggle && reflectionText) {
    reflectionToggle.addEventListener("change", () => {
      reflectionText.style.display = reflectionToggle.checked ? "block" : "none";
    });
    // Initialize display state
    reflectionText.style.display = reflectionToggle.checked ? "block" : "none";
  }

  // Set copyright year dynamically
  const copyrightYearEl = document.getElementById("copyright-year");
  if (copyrightYearEl) {
    const currentYear = new Date().getFullYear();
    copyrightYearEl.textContent = `© ${currentYear} `;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const rawValue = dobInput.value;

    if (!rawValue) {
      showError("Please enter your date of birth.");
      return;
    }

    const dob = new Date(rawValue);

    if (Number.isNaN(dob.getTime())) {
      showError("That doesn't look like a valid date. Please try again.");
      return;
    }

    try {
      const { totalWeeks, weeksLived, yearsLived } = calculateWeeks(dob);

      if (yearsLived < 0.1) {
        showError("Welcome to the world. This chart shows your journey ahead.");
      } else if (yearsLived > MAX_REASONABLE_AGE_YEARS) {
        showError("That date is very far in the past. Please check your year.");
        return;
      } else if (yearsLived > AVERAGE_LIFESPAN_YEARS) {
        showError(
          "You've passed the 90-year mark in this model. Remaining weeks are shown as zero."
        );
      } else {
        clearError();
      }

      console.log("DOB:", dob.toISOString().slice(0, 10));
      console.log("Total weeks (90 years):", totalWeeks);
      console.log("Weeks lived so far:", weeksLived);

      renderWeeksGrid(totalWeeks, weeksLived);
      updateSummary({ yearsLived, weeksLived, totalWeeks });
      applyGridAnimation();
    } catch (error) {
      console.warn(error.message);
    }
  });
})();

