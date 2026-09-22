(function initDateRangePickers() {
  var MAX_RANGE_DAYS = 30;
  function parseYmd(str) {
    if (!str) return null;
    var p = String(str).trim().split("-");
    if (p.length !== 3) return null;
    var y = Number(p[0]);
    var m = Number(p[1]);
    var d = Number(p[2]);
    if (!y || !m || !d) return null;
    var date = new Date(y, m - 1, d);
    if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
    return date;
  }

  function parseDateInput(str) {
    var t = (str || "").trim();
    if (!t) return null;
    var ymd = parseYmd(t);
    if (ymd) return ymd;
    var slash = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slash) {
      return parseYmd(
        slash[3] + "-" + String(slash[1]).padStart(2, "0") + "-" + String(slash[2]).padStart(2, "0")
      );
    }
    var parsed = Date.parse(t);
    if (!isNaN(parsed)) return startOfDay(new Date(parsed));
    return null;
  }

  function formatYmd(date) {
    return (
      date.getFullYear() +
      "-" +
      String(date.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(date.getDate()).padStart(2, "0")
    );
  }

  function formatDisplay(date) {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  function addDays(date, days) {
    var d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    d.setDate(d.getDate() + days);
    return d;
  }

  function addMonths(date, months) {
    return new Date(date.getFullYear(), date.getMonth() + months, 1);
  }

  function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function todayLocal() {
    return startOfDay(new Date());
  }

  function mondayOfWeek(date) {
    var d = startOfDay(date);
    var day = d.getDay();
    var diff = day === 0 ? -6 : 1 - day;
    return addDays(d, diff);
  }

  function countDays(start, end) {
    return Math.floor((startOfDay(end) - startOfDay(start)) / 86400000) + 1;
  }

  function maxEndForStart(start) {
    var maxEnd = addDays(start, MAX_RANGE_DAYS - 1);
    var cap = todayLocal();
    return maxEnd > cap ? cap : maxEnd;
  }

  function normalizeRange(nextStart, nextEnd) {
    var cap = todayLocal();
    if (nextStart > cap) nextStart = cap;
    if (nextEnd > cap) nextEnd = cap;
    if (nextEnd < nextStart) {
      var tmp = nextStart;
      nextStart = nextEnd;
      nextEnd = tmp;
    }
    var maxEnd = maxEndForStart(nextStart);
    var adjusted = false;
    if (nextEnd > maxEnd) {
      nextEnd = maxEnd;
      adjusted = true;
    }
    return { start: nextStart, end: nextEnd, adjusted: adjusted };
  }

  function emitInput(input) {
    if (!input) return;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function monthLabel(date) {
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  }

  function buildPresetRange(kind) {
    var today = todayLocal();
    var yesterday = addDays(today, -1);
    var start;
    var end;
    if (kind === "last-week") {
      var thisMon = mondayOfWeek(today);
      start = addDays(thisMon, -7);
      end = addDays(thisMon, -1);
    } else if (kind === "last-30") {
      end = yesterday;
      start = addDays(end, -(MAX_RANGE_DAYS - 1));
    } else if (kind === "last-month") {
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      end = new Date(today.getFullYear(), today.getMonth(), 0);
      if (end > yesterday) end = yesterday;
      if (countDays(start, end) > MAX_RANGE_DAYS) {
        start = addDays(end, -(MAX_RANGE_DAYS - 1));
      }
    } else if (kind === "this-week") {
      start = mondayOfWeek(today);
      end = yesterday;
      if (end < start) end = start;
    } else if (kind === "this-month") {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = yesterday;
      if (end < start) end = start;
      if (countDays(start, end) > MAX_RANGE_DAYS) {
        start = addDays(end, -(MAX_RANGE_DAYS - 1));
      }
    } else {
      return null;
    }
    return normalizeRange(start, end);
  }

  document.querySelectorAll(".date-range-picker").forEach(function (root) {
    if (root.dataset.initialized === "1") return;
    root.dataset.initialized = "1";

    var startInput = root.querySelector("[data-range-part=start-input]");
    var endInput = root.querySelector("[data-range-part=end-input]");
    var suppressBlur = false;
    var summaryEl = root.querySelector("[data-range-part=range-summary]");
    var hintEl = root.querySelector("[data-range-part=range-hint]");
    var prevBtn = root.querySelector("[data-range-part=prev-month]");
    var nextBtn = root.querySelector("[data-range-part=next-month]");
    var calendarEl = root.querySelector(".date-range-calendar");
    var monthLabels = [
      root.querySelector("[data-range-part=month-label-0]"),
      root.querySelector("[data-range-part=month-label-1]"),
    ];
    var grids = [
      root.querySelector("[data-range-part=grid-0]"),
      root.querySelector("[data-range-part=grid-1]"),
    ];

    var startDate = parseDateInput(startInput && startInput.value);
    var endDate = parseDateInput(endInput && endInput.value);
    if (startDate && endDate) {
      var initial = normalizeRange(startDate, endDate);
      startDate = initial.start;
      endDate = initial.end;
    } else if (startDate && !endDate) {
      endDate = null;
    } else if (!startDate && endDate) {
      endDate = null;
      if (endInput) endInput.value = "";
    } else {
      startDate = null;
      endDate = null;
    }

    var viewMonth = new Date(todayLocal().getFullYear(), todayLocal().getMonth(), 1);
    var activeField = startDate ? "end" : "start";
    var hintTimer = null;

    function showHint(message) {
      if (!hintEl) return;
      hintEl.textContent = message;
      hintEl.hidden = false;
      if (hintTimer) clearTimeout(hintTimer);
      hintTimer = setTimeout(function () {
        hintEl.hidden = true;
      }, 3500);
    }

    function updateSummary() {
      if (!summaryEl) return;
      if (!startDate && !endDate) {
        summaryEl.textContent = "Pick dates · max " + MAX_RANGE_DAYS + "d";
        return;
      }
      if (startDate && !endDate) {
        summaryEl.textContent = "Pick end · " + MAX_RANGE_DAYS + "d window";
        return;
      }
      if (startDate && endDate) {
        var days = countDays(startDate, endDate);
        summaryEl.textContent = days + "d selected";
      }
    }

    function syncInputs() {
      if (startInput) {
        startInput.value = startDate ? formatYmd(startDate) : "";
        startInput.classList.remove("invalid");
      }
      if (endInput) {
        endInput.value = endDate ? formatYmd(endDate) : "";
        endInput.classList.remove("invalid");
      }
      updateSummary();
      emitInput(startInput);
      emitInput(endInput);
    }

    function setActiveField(field) {
      activeField = field;
      if (startInput) startInput.classList.toggle("active", field === "start");
      if (endInput) endInput.classList.toggle("active", field === "end");
    }

    function commitTypedField(field) {
      var input = field === "start" ? startInput : endInput;
      if (!input) return;
      var raw = input.value.trim();
      if (!raw) {
        if (field === "start") {
          startDate = null;
          endDate = null;
          if (endInput) endInput.value = "";
        } else {
          endDate = null;
        }
        syncInputs();
        if (root.classList.contains("is-calendar-open")) renderCalendar();
        return;
      }
      var parsed = parseDateInput(raw);
      if (!parsed) {
        input.classList.add("invalid");
        showHint("Use YYYY-MM-DD, 9/5/2026, or Sep 5, 2026");
        return;
      }
      var cap = todayLocal();
      if (parsed > cap) parsed = cap;

      if (field === "start") {
        startDate = parsed;
        endDate = null;
        setActiveField("end");
        alignViewToStartWindow();
      } else {
        if (!startDate) {
          startDate = parsed;
          endDate = null;
          setActiveField("end");
          alignViewToStartWindow();
        } else if (parsed < startDate) {
          startDate = parsed;
          endDate = null;
          setActiveField("end");
          alignViewToStartWindow();
        } else {
          var disabledReason = dayDisabled(parsed);
          if (disabledReason) {
            input.classList.add("invalid");
            showHint(disabledReason);
            syncInputs();
            return;
          }
          endDate = parsed;
          closeCalendar();
        }
      }
      syncInputs();
      if (root.classList.contains("is-calendar-open")) renderCalendar();
    }

    function bindDateInput(input, field) {
      if (!input) return;
      input.addEventListener("focus", function () {
        openCalendar(field === "end" && !startDate ? "start" : field);
      });
      input.addEventListener("blur", function () {
        if (suppressBlur) return;
        commitTypedField(field);
      });
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          commitTypedField(field);
          input.blur();
        }
        if (e.key === "Escape") {
          syncInputs();
          input.blur();
          closeCalendar();
        }
      });
      input.addEventListener("input", function () {
        input.classList.remove("invalid");
      });
    }

    function alignViewToSelection(field) {
      var anchor = field === "start" ? startDate : endDate;
      if (!anchor) anchor = todayLocal();
      viewMonth = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
      if (field === "end" && startDate && endDate && countDays(startDate, endDate) > 1) {
        var endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
        var secondMonth = addMonths(viewMonth, 1);
        if (endMonth.getTime() > secondMonth.getTime()) {
          viewMonth = addMonths(endMonth, -1);
        } else if (endMonth.getTime() < viewMonth.getTime()) {
          viewMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        }
      }
    }

    function openCalendar(field) {
      if (field === "end" && !startDate) field = "start";
      setActiveField(field);
      alignViewToSelection(field);
      root.classList.add("is-calendar-open");
      renderCalendar();
    }

    function closeCalendar() {
      root.classList.remove("is-calendar-open");
    }

    function sameDay(a, b) {
      return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    }

    function dayDisabled(cellDate) {
      var cap = todayLocal();
      if (cellDate > cap) return "Future dates are not allowed";
      if (activeField === "end") {
        if (!startDate) return "Pick a start date first";
        if (cellDate < startDate) return "End must be on or after start";
        if (cellDate > maxEndForStart(startDate)) {
          return "Queries support at most " + MAX_RANGE_DAYS + " days — pick an earlier end date";
        }
      }
      return "";
    }

    function isInSelectableWindow(cellDate) {
      if (!startDate || endDate) return false;
      return cellDate > startDate && cellDate <= maxEndForStart(startDate);
    }

    function dayClasses(cellDate, monthAnchor) {
      var cls = ["date-range-day"];
      if (cellDate.getMonth() !== monthAnchor.getMonth()) cls.push("other-month");
      if (sameDay(cellDate, todayLocal())) cls.push("is-today");
      if (startDate && sameDay(cellDate, startDate)) cls.push("range-start");
      if (endDate && sameDay(cellDate, endDate)) cls.push("range-end");
      if (startDate && endDate && cellDate > startDate && cellDate < endDate) cls.push("in-range");
      if (isInSelectableWindow(cellDate)) cls.push("in-window");
      var disabledReason = dayDisabled(cellDate);
      if (disabledReason) cls.push("is-disabled");
      return { className: cls.join(" "), disabledReason: disabledReason };
    }

    function alignViewToStartWindow() {
      if (!startDate) return;
      viewMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      var windowEnd = maxEndForStart(startDate);
      var endMonth = new Date(windowEnd.getFullYear(), windowEnd.getMonth(), 1);
      if (endMonth.getTime() > addMonths(viewMonth, 1).getTime()) {
        viewMonth = addMonths(endMonth, -1);
      }
    }

    function applyPickedDate(picked) {
      var cap = todayLocal();
      if (picked > cap) picked = cap;

      if (!startDate || activeField === "start") {
        startDate = picked;
        endDate = null;
        setActiveField("end");
        alignViewToStartWindow();
        syncInputs();
        renderCalendar();
        return;
      }

      if (picked < startDate) {
        startDate = picked;
        endDate = null;
        setActiveField("end");
        alignViewToStartWindow();
        syncInputs();
        renderCalendar();
        return;
      }

      var disabledReason = dayDisabled(picked);
      if (disabledReason) {
        showHint(disabledReason);
        return;
      }
      endDate = picked;
      closeCalendar();
      syncInputs();
      renderCalendar();
    }

    function renderMonthGrid(gridEl, monthAnchor, labelEl) {
      if (!gridEl) return;
      if (labelEl) labelEl.textContent = monthLabel(monthAnchor);
      gridEl.innerHTML = "";
      var first = new Date(monthAnchor.getFullYear(), monthAnchor.getMonth(), 1);
      var startPad = first.getDay();
      startPad = startPad === 0 ? 6 : startPad - 1;
      var cursor = addDays(first, -startPad);
      for (var i = 0; i < 42; i += 1) {
        var cellDate = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());
        cursor = addDays(cursor, 1);
        var meta = dayClasses(cellDate, monthAnchor);
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = meta.className;
        btn.textContent = String(cellDate.getDate());
        btn.dataset.ymd = formatYmd(cellDate);
        if (meta.disabledReason) {
          btn.disabled = true;
          btn.title = meta.disabledReason;
        }
        btn.addEventListener("click", function () {
          if (this.disabled) return;
          var picked = parseYmd(this.dataset.ymd);
          if (!picked) return;
          applyPickedDate(picked);
        });
        gridEl.appendChild(btn);
      }
    }

    function renderCalendar() {
      renderMonthGrid(grids[0], viewMonth, monthLabels[0]);
      renderMonthGrid(grids[1], addMonths(viewMonth, 1), monthLabels[1]);
    }

    bindDateInput(startInput, "start");
    bindDateInput(endInput, "end");

    document.addEventListener("click", function (e) {
      if (!root.classList.contains("is-calendar-open")) return;
      if (root.contains(e.target)) return;
      closeCalendar();
    });

    if (calendarEl) {
      calendarEl.addEventListener("mousedown", function () {
        suppressBlur = true;
      });
      calendarEl.addEventListener("click", function (e) {
        e.stopPropagation();
      });
    }
    document.addEventListener("mouseup", function () {
      setTimeout(function () {
        suppressBlur = false;
      }, 0);
    });

    prevBtn &&
      prevBtn.addEventListener("click", function () {
        viewMonth = addMonths(viewMonth, -1);
        renderCalendar();
      });
    nextBtn &&
      nextBtn.addEventListener("click", function () {
        viewMonth = addMonths(viewMonth, 1);
        renderCalendar();
      });

    root.querySelectorAll("[data-range-preset]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var range = buildPresetRange(btn.dataset.rangePreset);
        if (!range) return;
        startDate = range.start;
        endDate = range.end;
        setActiveField("end");
        alignViewToSelection("end");
        syncInputs();
        if (root.classList.contains("is-calendar-open")) renderCalendar();
      });
    });

    setActiveField(activeField);
    syncInputs();
  });
})();
