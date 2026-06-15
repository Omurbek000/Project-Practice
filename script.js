// ---------- КОНФИГУРАЦИЯ ----------
const DEFAULT_EMPLOYEES = [
    "Анна К.", "Борис Л.", "Виктор М.", "Галина П.",
    "Дмитрий С.", "Елена В.", "Жанна К.", "Игорь Р.",
    "Кирилл Н.", "Лариса Д.", "Михаил Т.", "Наталья Ш."
];

// 4 смены с читаемыми названиями
const SHIFTS = [
    { value: "shift1", label: "🌅 Смена 1 (Утро)" },
    { value: "shift2", label: "☀️ Смена 2 (День)" },
    { value: "shift3", label: "🌆 Смена 3 (Вечер)" },
    { value: "shift4", label: "🌙 Смена 4 (Ночь)" },
    { value: "off",   label: "🔴 Выходной" }
];

let employees = [];
let scheduleData = [];
let currentDates = [];

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : (m === '<' ? '&lt;' : '&gt;'));
}

function initEmptySchedule(empCount, daysCount) {
    const empty = [];
    for (let i = 0; i < empCount; i++) {
        empty[i] = [];
        for (let d = 0; d < daysCount; d++) empty[i][d] = "off";
    }
    return empty;
}

function generateDateRange(startStr) {
    const startDate = new Date(startStr);
    if (isNaN(startDate.getTime())) {
        const today = new Date(); today.setHours(0,0,0,0);
        return generateDateRange(today.toISOString().slice(0,10));
    }
    const dates = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        dates.push(`${year}-${month}-${day}`);
    }
    return dates;
}

function autoSaveToLocal() {
    const toStore = { employees, dates: currentDates, shiftsMatrix: scheduleData, lastUpdated: new Date().toISOString() };
    localStorage.setItem("workScheduleApp", JSON.stringify(toStore));
}

function loadFromLocal() {
    const raw = localStorage.getItem("workScheduleApp");
    if (!raw) return false;
    try {
        const data = JSON.parse(raw);
        if (data.employees && Array.isArray(data.employees)) employees = data.employees;
        else employees = [...DEFAULT_EMPLOYEES];

        if (data.dates && Array.isArray(data.dates) && data.dates.length === 7) {
            currentDates = data.dates;
            document.getElementById("startDate").value = currentDates[0];
        } else {
            const startInput = document.getElementById("startDate").value;
            currentDates = generateDateRange(startInput);
        }

        if (data.shiftsMatrix && Array.isArray(data.shiftsMatrix) && data.shiftsMatrix.length === employees.length) {
            scheduleData = data.shiftsMatrix;
            for (let i = 0; i < scheduleData.length; i++) {
                if (!scheduleData[i] || scheduleData[i].length !== currentDates.length) {
                    scheduleData[i] = new Array(currentDates.length).fill("off");
                }
            }
        } else {
            scheduleData = initEmptySchedule(employees.length, currentDates.length);
        }
        renderTable();
        return true;
    } catch(e) { return false; }
}

function resetAll() {
    employees = [...DEFAULT_EMPLOYEES];
    const startInput = document.getElementById("startDate").value;
    currentDates = generateDateRange(startInput);
    scheduleData = initEmptySchedule(employees.length, currentDates.length);
    renderTable();
    autoSaveToLocal();
}

function resetEmployeesToDefault() {
    employees = [...DEFAULT_EMPLOYEES];
    scheduleData = initEmptySchedule(employees.length, currentDates.length);
    renderTable();
    autoSaveToLocal();
}

function addEmployee() {
    const inputField = document.getElementById("newEmployeeName");
    let newName = inputField.value.trim();
    if (newName === "") { alert("Введите имя повара"); return; }
    employees.push(newName);
    const newRow = new Array(currentDates.length).fill("off");
    scheduleData.push(newRow);
    inputField.value = "";
    renderTable();
    autoSaveToLocal();
}

function deleteEmployee(index) {
    if (employees.length <= 1) { alert("Нельзя удалить единственного сотрудника"); return; }
    if (confirm(`Удалить повара "${employees[index]}"?`)) {
        employees.splice(index, 1);
        scheduleData.splice(index, 1);
        renderTable();
        autoSaveToLocal();
    }
}

function applyDates() {
    const startVal = document.getElementById("startDate").value;
    if (!startVal) return;
    const newDates = generateDateRange(startVal);
    if (JSON.stringify(newDates) === JSON.stringify(currentDates)) return;

    const oldDates = currentDates;
    const oldSchedule = scheduleData;
    const newDays = newDates.length;
    const newSchedule = initEmptySchedule(employees.length, newDays);

    if (oldDates.length && oldSchedule && oldSchedule.length === employees.length) {
        for (let emp = 0; emp < employees.length; emp++) {
            for (let oldDay = 0; oldDay < oldDates.length; oldDay++) {
                const oldDate = oldDates[oldDay];
                const newIdx = newDates.indexOf(oldDate);
                if (newIdx !== -1 && oldSchedule[emp] && oldSchedule[emp][oldDay] !== undefined) {
                    newSchedule[emp][newIdx] = oldSchedule[emp][oldDay];
                }
            }
        }
    }
    scheduleData = newSchedule;
    currentDates = newDates;
    renderTable();
    autoSaveToLocal();
}

function getShiftClass(shiftValue) {
    switch(shiftValue) {
        case 'shift1': return 'shift1-bg';
        case 'shift2': return 'shift2-bg';
        case 'shift3': return 'shift3-bg';
        case 'shift4': return 'shift4-bg';
        default: return 'off-bg';
    }
}

function renderTable() {
    const headerRow = document.getElementById("tableHeader");
    const bodyContainer = document.getElementById("tableBody");
    if (!headerRow || !bodyContainer) return;

    let theadHtml = '<tr><th class="employee-col">Повар / Дата</th>';
    for (let dayIdx = 0; dayIdx < currentDates.length; dayIdx++) {
        const dateStr = currentDates[dayIdx];
        const dateObj = new Date(dateStr);
        const weekdays = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
        const weekday = weekdays[dateObj.getDay()];
        const formatted = `${weekday} ${dateStr.slice(5)}`;
        theadHtml += `<th>${formatted}</th>`;
    }
    theadHtml += '</table>';
    headerRow.innerHTML = theadHtml;

    let tbodyHtml = '';
    for (let empIdx = 0; empIdx < employees.length; empIdx++) {
        const empName = employees[empIdx];
        tbodyHtml += `<tr>
            <td class="employee-col">
                ${escapeHtml(empName)}
                <button class="delete-employee-btn" data-emp-index="${empIdx}" title="Удалить">🗑️</button>
            </td>`;
        for (let dayIdx = 0; dayIdx < currentDates.length; dayIdx++) {
            let shiftVal = (scheduleData[empIdx] && scheduleData[empIdx][dayIdx]) ? scheduleData[empIdx][dayIdx] : "off";
            let selectHtml = `<select data-emp="${empIdx}" data-day="${dayIdx}" class="shift-select">`;
            for (let s of SHIFTS) {
                const selected = (shiftVal === s.value) ? 'selected' : '';
                selectHtml += `<option value="${s.value}" ${selected}>${s.label}</option>`;
            }
            selectHtml += `</select>`;
            const bgClass = getShiftClass(shiftVal);
            tbodyHtml += `<td class="${bgClass}">${selectHtml}</td>`;
        }
        tbodyHtml += `</tr>`;
    }
    bodyContainer.innerHTML = tbodyHtml;

    document.querySelectorAll('.shift-select').forEach(select => {
        select.addEventListener('change', function(e) {
            const empIdx = parseInt(this.dataset.emp);
            const dayIdx = parseInt(this.dataset.day);
            const newValue = this.value;
            if (!isNaN(empIdx) && !isNaN(dayIdx) && scheduleData[empIdx]) {
                scheduleData[empIdx][dayIdx] = newValue;
                const td = this.closest('td');
                if (td) {
                    td.classList.remove('shift1-bg','shift2-bg','shift3-bg','shift4-bg','off-bg');
                    td.classList.add(getShiftClass(newValue));
                }
                autoSaveToLocal();
            }
        });
    });

    document.querySelectorAll('.delete-employee-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(btn.dataset.empIndex);
            if (!isNaN(idx)) deleteEmployee(idx);
        });
    });
}

function init() {
    const startDateInput = document.getElementById("startDate");
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    const defaultMonday = monday.toISOString().slice(0,10);
    startDateInput.value = defaultMonday;

    const loaded = loadFromLocal();
    if (!loaded) {
        employees = [...DEFAULT_EMPLOYEES];
        currentDates = generateDateRange(defaultMonday);
        scheduleData = initEmptySchedule(employees.length, currentDates.length);
        renderTable();
        autoSaveToLocal();
    }

    document.getElementById("applyDatesBtn").addEventListener("click", applyDates);
    document.getElementById("saveBtn").addEventListener("click", () => { autoSaveToLocal(); alert("✅ Сохранено"); });
    document.getElementById("loadBtn").addEventListener("click", () => { loadFromLocal(); alert("📀 Загружено"); });
    document.getElementById("resetBtn").addEventListener("click", () => { if(confirm("Сбросить всё?")) resetAll(); });
    document.getElementById("addEmployeeBtn").addEventListener("click", addEmployee);
    document.getElementById("resetEmployeesBtn").addEventListener("click", () => { if(confirm("Сбросить список поваров?")) resetEmployeesToDefault(); });
    document.getElementById("newEmployeeName").addEventListener("keypress", (e) => { if(e.key === "Enter") addEmployee(); });
}

init();