/**
 * Kovasähkö Oy - Modern Web Interactivity & Cost Calculator
 */

document.addEventListener('DOMContentLoaded', () => {
  initHeaderScroll();
  initMobileMenu();
  initServiceFilters();
  initCostCalculator();
  initContactForm();
  initFaqSchemaTracker();
});

/* ==========================================================================
   Header Scroll State
   ========================================================================== */
function initHeaderScroll() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const onScroll = () => {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ==========================================================================
   Mobile Navigation
   ========================================================================== */
function initMobileMenu() {
  const toggleBtn = document.querySelector('.mobile-menu-btn');
  const nav = document.querySelector('.main-nav');
  if (!toggleBtn || !nav) return;

  const toggle = (force) => {
    const isOpen = typeof force === 'boolean' ? force : !nav.classList.contains('active');
    nav.classList.toggle('active', isOpen);
    toggleBtn.classList.toggle('active', isOpen);
    toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    toggleBtn.setAttribute('aria-label', isOpen ? 'Sulje valikko' : 'Avaa valikko');
    document.body.classList.toggle('nav-open', isOpen);
  };

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggle();
  });

  // Close when tapping any link inside the navigation drawer
  const allNavLinks = nav.querySelectorAll('a');
  allNavLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        toggle(false);
      }
    });
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('active')) {
      toggle(false);
    }
  });

  // Close when clicking outside open drawer
  document.addEventListener('click', (e) => {
    if (nav.classList.contains('active') && !nav.contains(e.target) && !toggleBtn.contains(e.target)) {
      toggle(false);
    }
  });
}

/* ==========================================================================
   Service Filtering
   ========================================================================== */
function initServiceFilters() {
  const tabs = document.querySelectorAll('.filter-tab');
  const cards = document.querySelectorAll('.service-card');

  if (!tabs.length || !cards.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      const filter = tab.dataset.filter;

      cards.forEach(card => {
        const category = card.dataset.category || '';
        if (filter === 'all' || category.includes(filter)) {
          card.style.display = 'flex';
          card.style.opacity = '0';
          setTimeout(() => {
            card.style.opacity = '1';
          }, 20);
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

/* ==========================================================================
   Cost Estimator (Kustannusarviolaskuri)
   Empowers customer with realistic Finnish market prices and tax deductions
   ========================================================================== */
function initCostCalculator() {
  const projectInputs = document.querySelectorAll('input[name="calc-project"]');
  const scopeRange = document.getElementById('calc-scope-range');
  const scopeValDisplay = document.getElementById('calc-scope-val');
  const scopeLabel = document.getElementById('calc-scope-label');
  
  const displayTotal = document.getElementById('calc-display-total');
  const displayLabor = document.getElementById('calc-display-labor');
  const displayMaterials = document.getElementById('calc-display-materials');
  const displayDeduction = document.getElementById('calc-display-deduction');
  const displayNet = document.getElementById('calc-display-net');
  const applyEstimateBtn = document.getElementById('apply-estimate-btn');

  if (!projectInputs.length || !scopeRange) return;

  // Configuration for the 4 requested electrical services
  const projectData = {
    'panel-upgrade': {
      title: 'Sähkökeskuksen saneeraus',
      unit: 'sulakeryhmää',
      min: 12,
      max: 42,
      step: 2,
      default: 24,
      baseMaterial: 900,
      meterMaterial: 25,
      baseLaborHours: 7,
      meterLaborHours: 0.25,
      hourRate: 72,
      eligibleForDeduction: true,
      formatVal: (val) => `${val} sulakeryhmää`
    },
    'ev-charger': {
      title: 'Sähköauton lataus',
      unit: 'm kaapelointia',
      min: 5,
      max: 40,
      step: 1,
      default: 15,
      baseMaterial: 690,
      meterMaterial: 14,
      baseLaborHours: 3.5,
      meterLaborHours: 0.15,
      hourRate: 72,
      eligibleForDeduction: true,
      formatVal: (val) => `${val} m kaapelointia`
    },
    'solar-system': {
      title: 'Aurinkopaneelit',
      unit: 'kWp teho',
      min: 4,
      max: 16,
      step: 1,
      default: 8,
      baseMaterial: 1200,
      meterMaterial: 550,
      baseLaborHours: 12,
      meterLaborHours: 1.5,
      hourRate: 72,
      eligibleForDeduction: true,
      formatVal: (val) => `${val} kWp (n. ${Math.round(val * 2.25)} paneelia)`
    },
    'hourly-work': {
      title: 'Asennus & huolto',
      unit: 'työtuntia',
      min: 2,
      max: 40,
      step: 1,
      default: 4,
      baseMaterial: 0,
      meterMaterial: 0,
      baseLaborHours: 0,
      meterLaborHours: 1,
      hourRate: 72,
      eligibleForDeduction: true,
      formatVal: (val) => `${val} työtuntia (72 €/h)`
    }
  };

  let currentProjectKey = 'panel-upgrade';

  const updateRangeUi = () => {
    const config = projectData[currentProjectKey];
    scopeRange.min = config.min;
    scopeRange.max = config.max;
    scopeRange.step = config.step || 1;
    scopeRange.value = config.default;
    scopeLabel.textContent = `Kohteen laajuus (${config.unit})`;
    scopeValDisplay.textContent = config.formatVal ? config.formatVal(scopeRange.value) : `${scopeRange.value} ${config.unit}`;
  };

  const calculate = () => {
    const config = projectData[currentProjectKey];
    const scope = parseFloat(scopeRange.value);

    const materials = Math.round(config.baseMaterial + (scope * config.meterMaterial));
    const laborHours = config.baseLaborHours + (scope * config.meterLaborHours);
    const labor = Math.round(laborHours * config.hourRate);
    const total = materials + labor;

    // Finnish Kotitalousvähennys: 60% of labour cost
    const deduction = config.eligibleForDeduction ? Math.round(labor * 0.60) : 0;
    const net = total - deduction;

    // Update UI numbers with non-breaking spaces
    displayTotal.textContent = `${formatEur(total)}\u00A0€`;
    displayLabor.textContent = `${formatEur(labor)}\u00A0€`;
    displayMaterials.textContent = `${formatEur(materials)}\u00A0€`;
    displayDeduction.textContent = `-\u00A0${formatEur(deduction)}\u00A0€`;
    displayNet.textContent = `${formatEur(net)}\u00A0€`;

    const scopeStr = config.formatVal ? config.formatVal(scope) : `${scope} ${config.unit}`;
    return { title: config.title, scope: scopeStr, total, labor, deduction, net };
  };

  const formatEur = (val) => {
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");
  };

  projectInputs.forEach(input => {
    input.addEventListener('change', () => {
      currentProjectKey = input.value;
      updateRangeUi();
      calculate();
    });
  });

  scopeRange.addEventListener('input', () => {
    const config = projectData[currentProjectKey];
    scopeValDisplay.textContent = config.formatVal ? config.formatVal(scopeRange.value) : `${scopeRange.value} ${config.unit}`;
    calculate();
  });

  // Apply Estimate to Quote Form
  if (applyEstimateBtn) {
    applyEstimateBtn.addEventListener('click', () => {
      const result = calculate();
      const messageField = document.getElementById('form-viesti');
      const serviceField = document.getElementById('form-palvelu');

      if (serviceField) {
        serviceField.value = result.title;
      }

      if (messageField) {
        messageField.value = `Hei! Laskin alustavan arvion sivustonne laskurilla:
- Kohde: ${result.title}
- Laajuus: ${result.scope}
- Arvioitu kokonaishinta: n. ${formatEur(result.total)} € (työ n. ${formatEur(result.labor)} €)
- Kotitalousvähennyksen jälkeen n. ${formatEur(result.net)} €

Pyytäisin teiltä tarkempaa tarjousta tai maksutonta kartoituskäyntiä.`;
      }

      // Smooth scroll to form
      const contactSection = document.getElementById('kontakti');
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
        messageField?.focus();
      }
    });
  }

  // Initialize
  updateRangeUi();
  calculate();
}

/* ==========================================================================
   Contact Form Validation & Feedback Modal
   ========================================================================== */
function initContactForm() {
  const form = document.getElementById('tarjouspyynto-lomake');
  const modal = document.getElementById('kiitos-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Check validity
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Lähetetään...';

    // Simulate reliable dispatch
    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      form.reset();

      if (modal) {
        modal.classList.add('active');
        modalCloseBtn?.focus();
      }
    }, 600);
  });

  if (modal && modalCloseBtn) {
    modalCloseBtn.addEventListener('click', () => {
      modal.classList.remove('active');
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        modal.classList.remove('active');
      }
    });
  }
}

/* ==========================================================================
   FAQ Tracker for Accessibility & Analytics
   ========================================================================== */
function initFaqSchemaTracker() {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    item.addEventListener('toggle', () => {
      // Keep state clean for screen-reader users
    });
  });

  // Ensure current copyright year
  const yearEl = document.getElementById('current-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}
