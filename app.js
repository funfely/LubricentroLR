const STORAGE_KEY = "lubricentro-services-v1";
const MAX_HISTORY = 10;

const defaultServices = {
  AB123CD: [
    {
      id: "svc-1",
      cliente: "Juan Perez",
      trabajo: "Cambio de aceite + Filtro de aceite. Detalle: Aceite 10W40 semisintetico.",
      fechaService: "2026-03-04",
      proximoService: "2026-09-04",
      proximoKm: "55000",
    },
  ],
  AC456EF: [
    {
      id: "svc-2",
      cliente: "Maria Gomez",
      trabajo: "Cambio de aceite + Filtro de aire.",
      fechaService: "2026-02-20",
      proximoService: "2026-08-20",
      proximoKm: "62000",
    },
  ],
  AAA123: [
    {
      id: "svc-3",
      cliente: "Carlos Ruiz",
      trabajo: "Service completo + Revision de fluidos.",
      fechaService: "2026-01-12",
      proximoService: "2026-07-12",
      proximoKm: "73000",
    },
  ],
};

let selectedPlate = null;
let editingEntry = null;

const customerView = document.getElementById("customer-view");
const ownerView = document.getElementById("owner-view");
const tabCustomer = document.getElementById("tab-customer");
const tabOwner = document.getElementById("tab-owner");

const searchForm = document.getElementById("search-form");
const plateInput = document.getElementById("patente");
const resultSection = document.getElementById("result");
const emptySection = document.getElementById("empty");
const historySection = document.getElementById("history");
const historyList = document.getElementById("res-history-list");

const ownerForm = document.getElementById("owner-form");
const ownerSubmit = document.getElementById("owner-submit");
const ownerCancel = document.getElementById("owner-cancel");
const ownerFormStatus = document.getElementById("owner-form-status");
const ownerTableBody = document.getElementById("owner-table-body");
const ownerHistorySection = document.getElementById("owner-history");
const ownerHistoryTitle = document.getElementById("owner-history-title");
const ownerHistoryBody = document.getElementById("owner-history-body");

const ownerPlateInput = document.getElementById("owner-patente");
const ownerClienteInput = document.getElementById("owner-cliente");
const ownerFechaInput = document.getElementById("owner-fecha");
const ownerMesesInput = document.getElementById("owner-meses");
const ownerKmInput = document.getElementById("owner-km");
const ownerAceiteInput = document.getElementById("owner-aceite");
const ownerAditivoCarterInput = document.getElementById("owner-aditivo-carter");
const ownerAditivoTransmisionInput = document.getElementById("owner-aditivo-transmision");
const ownerAditivoCombustibleInput = document.getElementById("owner-aditivo-combustible");
const ownerTrabajoDetalleInput = document.getElementById("owner-trabajo-detalle");
const checklistRows = Array.from(document.querySelectorAll(".check-row[data-check-key]"));

const checklistLabels = checklistRows.reduce((acc, row) => {
  const key = row.dataset.checkKey;
  if (key) {
    acc[key] = row.dataset.checkLabel || key;
  }
  return acc;
}, {});

const fields = {
  patente: document.getElementById("res-patente"),
  cliente: document.getElementById("res-cliente"),
  trabajo: document.getElementById("res-trabajo"),
  fecha: document.getElementById("res-fecha"),
  proximo: document.getElementById("res-proximo"),
  proximoKm: document.getElementById("res-proximo-km"),
};

function normalizePlate(value) {
  return value.toUpperCase().replace(/\s+/g, "").trim();
}

function addMonths(dateStr, months) {
  const date = new Date(`${dateStr}T00:00:00`);
  date.setMonth(date.getMonth() + months);
  return date.toISOString().slice(0, 10);
}

function formatDisplayDate(dateStr) {
  if (!dateStr) {
    return "-";
  }

  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

function formatKm(value) {
  const numeric = Number(String(value).replace(/\D/g, ""));
  if (!numeric) {
    return "-";
  }

  return `${numeric.toLocaleString("es-AR")} km`;
}

function buildServiceId() {
  return `svc-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function readCheckValue(key) {
  const selected = document.querySelector(`input[name="check-${key}"]:checked`);
  return selected ? selected.value : "";
}

function resetChecklistForm() {
  ownerAceiteInput.value = "";
  ownerAditivoCarterInput.value = "";
  ownerAditivoTransmisionInput.value = "";
  ownerAditivoCombustibleInput.value = "";
  ownerTrabajoDetalleInput.value = "";

  checklistRows.forEach((row) => {
    const key = row.dataset.checkKey;
    if (!key) {
      return;
    }

    document
      .querySelectorAll(`input[name="check-${key}"]`)
      .forEach((input) => {
        input.checked = false;
      });
  });
}

function buildChecklistFromForm() {
  const checks = {};

  checklistRows.forEach((row) => {
    const key = row.dataset.checkKey;
    if (!key) {
      return;
    }
    checks[key] = readCheckValue(key);
  });

  const checklist = {
    aceite: ownerAceiteInput.value.trim(),
    aditivoCarter: ownerAditivoCarterInput.value.trim(),
    aditivoTransmision: ownerAditivoTransmisionInput.value.trim(),
    aditivoCombustible: ownerAditivoCombustibleInput.value.trim(),
    detalle: ownerTrabajoDetalleInput.value.trim(),
    checks,
  };

  const hasCheckInSi = Object.values(checks).some((value) => value === "si");
  const hasText = Boolean(
    checklist.aceite ||
      checklist.aditivoCarter ||
      checklist.aditivoTransmision ||
      checklist.aditivoCombustible ||
      checklist.detalle
  );

  if (!hasCheckInSi && !hasText) {
    return null;
  }

  return checklist;
}

function summarizeChecklist(checklist) {
  if (!checklist) {
    return null;
  }

  const parts = [];

  if (checklist.aceite) {
    parts.push(`Aceite: ${checklist.aceite}`);
  }

  const checksInSi = Object.entries(checklist.checks || {})
    .filter(([, value]) => value === "si")
    .map(([key]) => checklistLabels[key] || key);

  if (checksInSi.length > 0) {
    parts.push(`Checks SI: ${checksInSi.join(", ")}`);
  }

  if (checklist.aditivoCarter) {
    parts.push(`Aditivo Carter: ${checklist.aditivoCarter}`);
  }

  if (checklist.aditivoTransmision) {
    parts.push(`Aditivo Transmision: ${checklist.aditivoTransmision}`);
  }

  if (checklist.aditivoCombustible) {
    parts.push(`Aditivo Combustible: ${checklist.aditivoCombustible}`);
  }

  if (checklist.detalle) {
    parts.push(`Detalle: ${checklist.detalle}`);
  }

  return parts.join(" | ");
}

function normalizeChecklist(rawChecklist) {
  if (!rawChecklist || typeof rawChecklist !== "object") {
    return null;
  }

  const checks = {};

  Object.keys(checklistLabels).forEach((key) => {
    const value = rawChecklist.checks && rawChecklist.checks[key];
    checks[key] = value === "si" || value === "no" ? value : "";
  });

  const checklist = {
    aceite: String(rawChecklist.aceite || "").trim(),
    aditivoCarter: String(rawChecklist.aditivoCarter || "").trim(),
    aditivoTransmision: String(rawChecklist.aditivoTransmision || "").trim(),
    aditivoCombustible: String(rawChecklist.aditivoCombustible || "").trim(),
    detalle: String(rawChecklist.detalle || "").trim(),
    checks,
  };

  const hasCheckInSi = Object.values(checks).some((value) => value === "si");
  const hasText = Boolean(
    checklist.aceite ||
      checklist.aditivoCarter ||
      checklist.aditivoTransmision ||
      checklist.aditivoCombustible ||
      checklist.detalle
  );

  return hasCheckInSi || hasText ? checklist : null;
}

function applyChecklistToForm(checklist) {
  resetChecklistForm();

  if (!checklist) {
    return;
  }

  ownerAceiteInput.value = checklist.aceite || "";
  ownerAditivoCarterInput.value = checklist.aditivoCarter || "";
  ownerAditivoTransmisionInput.value = checklist.aditivoTransmision || "";
  ownerAditivoCombustibleInput.value = checklist.aditivoCombustible || "";
  ownerTrabajoDetalleInput.value = checklist.detalle || "";

  Object.entries(checklist.checks || {}).forEach(([key, value]) => {
    if (value !== "si" && value !== "no") {
      return;
    }
    const radio = document.querySelector(`input[name="check-${key}"][value="${value}"]`);
    if (radio) {
      radio.checked = true;
    }
  });
}

function loadServices() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultServices));
    return { ...defaultServices };
  }

  try {
    const parsed = JSON.parse(stored);
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
  } catch (error) {
    console.error("No se pudo leer storage, se cargan datos por defecto", error);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultServices));
  return { ...defaultServices };
}

function normalizeStorageShape(data) {
  const normalized = {};

  for (const [rawPlate, value] of Object.entries(data)) {
    const plate = normalizePlate(rawPlate);
    if (!plate) {
      continue;
    }

    let history = [];

    if (Array.isArray(value)) {
      history = value;
    } else if (value && typeof value === "object" && value.fechaService) {
      history = [value];
    }

    normalized[plate] = history
      .filter((item) => item && item.fechaService && item.trabajo && item.cliente)
      .map((item) => ({
        id: item.id || buildServiceId(),
        cliente: item.cliente,
        checklist: normalizeChecklist(item.checklist),
        trabajo: item.trabajo,
        fechaService: item.fechaService,
        proximoService: item.proximoService,
        proximoKm: String(item.proximoKm || "").replace(/\D/g, ""),
      }))
      .map((item) => ({
        ...item,
        trabajo: item.trabajo || summarizeChecklist(item.checklist) || "Service sin detalle",
      }))
      .slice(0, MAX_HISTORY);
  }

  return normalized;
}

function persistServices(services) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(services));
}

let servicesByPlate = normalizeStorageShape(loadServices());
persistServices(servicesByPlate);

function switchView(mode) {
  const isCustomer = mode === "customer";

  customerView.classList.toggle("hidden", !isCustomer);
  ownerView.classList.toggle("hidden", isCustomer);
  tabCustomer.classList.toggle("is-active", isCustomer);
  tabOwner.classList.toggle("is-active", !isCustomer);
}

function clearOwnerForm() {
  ownerForm.reset();
  ownerMesesInput.value = "6";
  resetChecklistForm();
  editingEntry = null;
  ownerSubmit.textContent = "Guardar registro";
  ownerCancel.classList.add("hidden");
}

function setOwnerStatus(message) {
  ownerFormStatus.textContent = message;
}

function parseLegacyTrabajoToForm(trabajo) {
  resetChecklistForm();
  ownerTrabajoDetalleInput.value = trabajo || "";
}

function renderOwnerTable() {
  const entries = Object.entries(servicesByPlate).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  if (entries.length === 0) {
    ownerTableBody.innerHTML =
      '<tr><td class="empty-row" colspan="7">No hay registros cargados.</td></tr>';
    return;
  }

  ownerTableBody.innerHTML = entries
    .map(([plate, history]) => {
      const lastService = history[0];
      return `<tr>
        <td>${plate}</td>
        <td>${lastService ? lastService.cliente : "-"}</td>
        <td>${lastService ? formatDisplayDate(lastService.fechaService) : "-"}</td>
        <td>${lastService ? formatDisplayDate(lastService.proximoService) : "-"}</td>
        <td>${lastService ? formatKm(lastService.proximoKm) : "-"}</td>
        <td>${history.length} / ${MAX_HISTORY}</td>
        <td class="actions">
          <button type="button" class="row-btn edit" data-action="view-history" data-plate="${plate}">Ver historial</button>
          <button type="button" class="row-btn delete" data-action="delete-plate" data-plate="${plate}">Borrar patente</button>
        </td>
      </tr>`;
    })
    .join("");
}

function renderOwnerPlateHistory(plate) {
  const history = servicesByPlate[plate];

  if (!history || history.length === 0) {
    ownerHistorySection.classList.add("hidden");
    return;
  }

  selectedPlate = plate;
  ownerHistoryTitle.textContent = `Historial de patente ${plate}`;

  ownerHistoryBody.innerHTML = history
    .map((entry, index) => {
      return `<tr>
        <td>${index + 1}</td>
        <td>${formatDisplayDate(entry.fechaService)}</td>
        <td>${entry.trabajo}</td>
        <td>${formatDisplayDate(entry.proximoService)}</td>
        <td>${formatKm(entry.proximoKm)}</td>
        <td class="actions">
          <button type="button" class="row-btn edit" data-action="edit-service" data-plate="${plate}" data-service-id="${entry.id}">Editar</button>
          <button type="button" class="row-btn delete" data-action="delete-service" data-plate="${plate}" data-service-id="${entry.id}">Borrar</button>
        </td>
      </tr>`;
    })
    .join("");

  ownerHistorySection.classList.remove("hidden");
}

function renderCustomerResult(plate) {
  const history = servicesByPlate[plate];

  if (!history || history.length === 0) {
    resultSection.classList.add("hidden");
    historySection.classList.add("hidden");
    emptySection.classList.remove("hidden");
    return;
  }

  const latest = history[0];

  fields.patente.textContent = plate;
  fields.cliente.textContent = latest.cliente;
  fields.trabajo.textContent = latest.trabajo;
  fields.fecha.textContent = formatDisplayDate(latest.fechaService);
  fields.proximo.textContent = formatDisplayDate(latest.proximoService);
  fields.proximoKm.textContent = formatKm(latest.proximoKm);

  historyList.innerHTML = history
    .map(
      (item, index) =>
        `<li>${index + 1}. ${formatDisplayDate(item.fechaService)} - ${item.trabajo} (proximo: ${formatDisplayDate(item.proximoService)} / ${formatKm(item.proximoKm)})</li>`
    )
    .join("");

  emptySection.classList.add("hidden");
  resultSection.classList.remove("hidden");
  historySection.classList.remove("hidden");
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const plate = normalizePlate(plateInput.value);
  renderCustomerResult(plate);
});

ownerForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const plate = normalizePlate(ownerPlateInput.value);
  const cliente = ownerClienteInput.value.trim();
  const fechaService = ownerFechaInput.value;
  const meses = Number(ownerMesesInput.value);
  const proximoKm = ownerKmInput.value.trim().replace(/\D/g, "");
  const checklist = buildChecklistFromForm();
  const trabajo = summarizeChecklist(checklist);

  if (!plate || !cliente || !fechaService || Number.isNaN(meses) || !checklist || !proximoKm) {
    setOwnerStatus("Completa patente, cliente, fecha, km y al menos un check en SI o detalle de service.");
    return;
  }

  if (Number(proximoKm) <= 0) {
    setOwnerStatus("El campo de km debe ser mayor a 0.");
    return;
  }

  const proximoService = addMonths(fechaService, meses);
  const newEntry = {
    id: editingEntry ? editingEntry.id : buildServiceId(),
    cliente,
    checklist,
    trabajo,
    fechaService,
    proximoService,
    proximoKm,
  };

  const currentHistory = servicesByPlate[plate] || [];

  if (editingEntry) {
    const sourcePlate = editingEntry.plate;
    const sourceHistory = servicesByPlate[sourcePlate] || [];
    servicesByPlate[sourcePlate] = sourceHistory.filter((item) => item.id !== editingEntry.id);
    if (servicesByPlate[sourcePlate].length === 0) {
      delete servicesByPlate[sourcePlate];
    }
  }

  servicesByPlate[plate] = [newEntry, ...(servicesByPlate[plate] || [])].slice(0, MAX_HISTORY);

  persistServices(servicesByPlate);
  renderOwnerTable();
  renderOwnerPlateHistory(plate);
  clearOwnerForm();

  if (currentHistory.length > 0 && !editingEntry) {
    setOwnerStatus(`Se agrego un nuevo service a la patente existente ${plate}.`);
  } else if (editingEntry) {
    setOwnerStatus(`Service actualizado en la patente ${plate}.`);
  } else {
    setOwnerStatus(`Patente ${plate} creada con su primer service.`);
  }
});

ownerCancel.addEventListener("click", () => {
  clearOwnerForm();
  setOwnerStatus("Edicion cancelada.");
});

ownerTableBody.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }

  const plate = button.dataset.plate;
  const action = button.dataset.action;
  const history = servicesByPlate[plate];

  if (!history) {
    return;
  }

  if (action === "delete-plate") {
    delete servicesByPlate[plate];
    persistServices(servicesByPlate);
    renderOwnerTable();
    if (selectedPlate === plate) {
      ownerHistorySection.classList.add("hidden");
    }
    setOwnerStatus(`Patente ${plate} eliminada con todo su historial.`);
    return;
  }

  if (action === "view-history") {
    renderOwnerPlateHistory(plate);
    ownerPlateInput.value = plate;
    setOwnerStatus(`Historial cargado para ${plate}. Puedes agregar otro service.`);
  }
});

ownerHistoryBody.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }

  const plate = button.dataset.plate;
  const serviceId = button.dataset.serviceId;
  const action = button.dataset.action;
  const history = servicesByPlate[plate] || [];
  const service = history.find((item) => item.id === serviceId);

  if (!service) {
    return;
  }

  if (action === "delete-service") {
    servicesByPlate[plate] = history.filter((item) => item.id !== serviceId);
    if (servicesByPlate[plate].length === 0) {
      delete servicesByPlate[plate];
      ownerHistorySection.classList.add("hidden");
    }
    persistServices(servicesByPlate);
    renderOwnerTable();
    if (servicesByPlate[plate]) {
      renderOwnerPlateHistory(plate);
    }
    setOwnerStatus(`Service eliminado de la patente ${plate}.`);
    return;
  }

  editingEntry = { plate, id: serviceId };
  ownerPlateInput.value = plate;
  ownerClienteInput.value = service.cliente;
  ownerFechaInput.value = service.fechaService;
  ownerMesesInput.value = "6";
  ownerKmInput.value = service.proximoKm || "";
  if (service.checklist) {
    applyChecklistToForm(service.checklist);
  } else {
    parseLegacyTrabajoToForm(service.trabajo);
  }
  ownerSubmit.textContent = "Guardar cambios del service";
  ownerCancel.classList.remove("hidden");
  setOwnerStatus(`Editando un service de la patente ${plate}.`);
});

tabCustomer.addEventListener("click", () => switchView("customer"));
tabOwner.addEventListener("click", () => switchView("owner"));

renderOwnerTable();
