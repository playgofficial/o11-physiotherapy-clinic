const STORAGE_KEY = "o11_physio_appointments_v1";

const form = document.getElementById("bookingForm");
const nameInput = document.getElementById("patientName");
const phoneInput = document.getElementById("patientPhone");
const dateInput = document.getElementById("preferredDate");
const serviceSelect = document.getElementById("serviceType");
const sessionsInput = document.getElementById("sessionCount");
const notesInput = document.getElementById("notes");
const consentInput = document.getElementById("consentCheck");
const totalEl = document.getElementById("estimatedTotal");
const breakdownEl = document.getElementById("estimateBreakdown");
const listEl = document.getElementById("appointmentsList");
const clearAllBtn = document.getElementById("clearAllBtn");

function getModeExtra() {
  const checked = document.querySelector('input[name="sessionMode"]:checked');
  return checked && checked.value.startsWith("Home Visit") ? 300 : 0;
}

function calculateEstimate() {
  const baseRate = Number(serviceSelect.value) || 800;
  const sessions = Math.max(1, Math.min(20, Number(sessionsInput.value) || 1));
  const perSession = baseRate + getModeExtra();
  const rawTotal = perSession * sessions;
  const discount = sessions >= 4 ? Math.round(rawTotal * 0.1) : 0;
  const finalTotal = rawTotal - discount;

  totalEl.textContent = `₹${finalTotal.toLocaleString("en-IN")}`;
  breakdownEl.textContent =
    discount > 0
      ? `${sessions} × ₹${perSession} (−10% bundle ₹${discount})`
      : `${sessions} × ₹${perSession}`;

  return { sessions, perSession, discount, finalTotal };
}

function loadAppointments() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveAppointments(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function renderAppointments() {
  const items = loadAppointments();
  listEl.innerHTML = "";

  if (items.length === 0) {
    listEl.innerHTML = '<p class="text-secondary small mb-0">No appointments saved yet.</p>';
    return;
  }

  items.forEach((appt) => {
    const row = document.createElement("div");
    row.className = "border rounded p-3 bg-light d-flex justify-content-between align-items-start gap-2";

    const info = document.createElement("div");
    info.innerHTML = `
      <div class="fw-semibold">${escapeHtml(appt.name)} &bull; <span class="text-brand-teal">₹${appt.total.toLocaleString("en-IN")}</span></div>
      <div class="small text-secondary">${escapeHtml(appt.serviceLabel)} (${appt.sessions} session${appt.sessions > 1 ? "s" : ""})</div>
      <div class="small text-secondary">Date: ${escapeHtml(appt.date)} &bull; ${escapeHtml(appt.mode)}</div>
    `;

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "btn btn-sm btn-outline-secondary";
    delBtn.textContent = "Remove";
    delBtn.addEventListener("click", () => {
      const updated = loadAppointments().filter((item) => item.id !== appt.id);
      saveAppointments(updated);
      renderAppointments();
    });

    row.appendChild(info);
    row.appendChild(delBtn);
    listEl.appendChild(row);
  });
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function validateForm() {
  let valid = true;
  const digitsOnly = phoneInput.value.replace(/\D/g, "");

  if (nameInput.value.trim().length < 2) {
    nameInput.classList.add("is-invalid");
    valid = false;
  } else {
    nameInput.classList.remove("is-invalid");
  }

  if (digitsOnly.length < 10) {
    phoneInput.classList.add("is-invalid");
    valid = false;
  } else {
    phoneInput.classList.remove("is-invalid");
  }

  if (!dateInput.value) {
    dateInput.classList.add("is-invalid");
    valid = false;
  } else {
    dateInput.classList.remove("is-invalid");
  }

  const sessVal = Number(sessionsInput.value);
  if (!sessVal || sessVal < 1 || sessVal > 20) {
    sessionsInput.classList.add("is-invalid");
    valid = false;
  } else {
    sessionsInput.classList.remove("is-invalid");
  }

  if (!consentInput.checked) {
    consentInput.classList.add("is-invalid");
    valid = false;
  } else {
    consentInput.classList.remove("is-invalid");
  }

  return valid;
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  const est = calculateEstimate();
  const modeChecked = document.querySelector('input[name="sessionMode"]:checked');
  const selectedOpt = serviceSelect.options[serviceSelect.selectedIndex];

  const newAppt = {
    id: Date.now().toString(),
    name: nameInput.value.trim(),
    phone: phoneInput.value.trim(),
    date: dateInput.value,
    serviceLabel: selectedOpt.dataset.label || selectedOpt.textContent.trim(),
    sessions: est.sessions,
    mode: modeChecked ? modeChecked.value : "In-Clinic",
    notes: notesInput.value.trim(),
    total: est.finalTotal,
  };

  const current = loadAppointments();
  current.unshift(newAppt);
  saveAppointments(current);
  renderAppointments();

  form.reset();
  sessionsInput.value = "1";
  calculateEstimate();
});

[serviceSelect, sessionsInput].forEach((el) =>
  el.addEventListener("input", calculateEstimate)
);
document.querySelectorAll('input[name="sessionMode"]').forEach((radio) =>
  radio.addEventListener("change", calculateEstimate)
);

clearAllBtn.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  renderAppointments();
});

calculateEstimate();
renderAppointments();