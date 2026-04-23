import { useEffect, useState, useCallback, useRef } from "react";

const API = "https://tea-tracker-be.onrender.com/api";
const TEA_PRICE = 10;
const COFFEE_PRICE = 20;
const PAGE_SIZE = 10;
const SIDEBAR_W = 240;
const COLLAPSED_W = 64;

function getInitials(name) {
  return name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();
}
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function isoToday() {
  return new Date().toISOString().split("T")[0];
}
function getPrice(type) {
  return type === "coffee" ? COFFEE_PRICE : TEA_PRICE;
}
function normalizeName(name) {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}
function formatINR(n) {
  return "₹" + n.toLocaleString("en-IN");
}

const AVATAR_COLORS = [
  ["#FDE8CC", "#9C4E0F"], ["#D4EDDA", "#1A6B36"], ["#D8EAF9", "#1A5E9B"],
  ["#F2D9F7", "#7A1FA5"], ["#FFDDE1", "#A0152A"], ["#D9F0EB", "#0E7060"],
];
function avatarColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

function Avatar({ name, size = 32 }) {
  const [bg, fg] = avatarColor(name);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: bg, color: fg, display: "flex", alignItems: "center",
      justifyContent: "center", fontSize: size * 0.35, fontWeight: 700,
      flexShrink: 0, letterSpacing: "0.02em",
    }}>
      {getInitials(name)}
    </div>
  );
}

function DrinkBadge({ type }) {
  const isCoffee = type === "coffee";
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20,
      background: isCoffee ? "#2D1A0E" : "#FFF0E0",
      color: isCoffee ? "#F5C07A" : "#8B4513",
      border: `1px solid ${isCoffee ? "#5C3010" : "#E8C49A"}`,
      whiteSpace: "nowrap",
    }}>
      {isCoffee ? "☕ Coffee" : "🍵 Tea"}
    </span>
  );
}

function PayBadge({ paid }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20,
      background: paid ? "#E8F5EE" : "#FFF3E0",
      color: paid ? "#1A6B36" : "#CC5500",
      border: `1px solid ${paid ? "#B0DFC0" : "#FBBF88"}`,
    }}>
      {paid ? "✓ Paid" : "⏳ Pending"}
    </span>
  );
}

function DrinkToggle({ value, onChange }) {
  return (
    <div style={{ display: "flex", background: "#F5EDE2", borderRadius: 10, padding: 3, gap: 2 }}>
      {["tea", "coffee"].map(t => (
        <button key={t} onClick={() => onChange(t)} style={{
          flex: 1, border: "none", borderRadius: 8, padding: "8px 0",
          cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit",
          transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
          background: value === t ? (t === "tea" ? "#8B4513" : "#2D1A0E") : "transparent",
          color: value === t ? "white" : "#9B7B5E",
        }}>
          {t === "tea" ? "🍵 Tea" : "☕ Coffee"}
        </button>
      ))}
    </div>
  );
}

const MONTHS_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function DatePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [vy, setVy] = useState(() => new Date(value || isoToday()).getFullYear());
  const [vm, setVm] = useState(() => new Date(value || isoToday()).getMonth());
  const ref = useRef();
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const sel = value ? new Date(value + "T00:00:00") : null;
  const totalDays = new Date(vy, vm + 1, 0).getDate();
  const firstDay = new Date(vy, vm, 1).getDay();
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: totalDays }, (_, i) => i + 1)];
  function prevM() { vm === 0 ? (setVm(11), setVy(y => y - 1)) : setVm(m => m - 1); }
  function nextM() { vm === 11 ? (setVm(0), setVy(y => y + 1)) : setVm(m => m + 1); }
  function pick(d) {
    if (!d) return;
    onChange(`${vy}-${String(vm + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
    setOpen(false);
  }
  const isSel = d => d && sel && sel.getFullYear() === vy && sel.getMonth() === vm && sel.getDate() === d;
  const isTod = d => { const t = new Date(); return d && t.getFullYear() === vy && t.getMonth() === vm && t.getDate() === d; };
  return (
    <div style={{ position: "relative", display: "inline-block" }} ref={ref}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: "flex", alignItems: "center", gap: 8, background: "#FFF8F2",
        border: "1.5px solid #E0C8B0", borderRadius: 10, padding: "8px 14px",
        cursor: "pointer", fontFamily: "inherit", fontSize: 13.5, color: "#4A2C0E",
        minWidth: 155,
      }}>
        📅 {value ? fmtDate(value + "T00:00:00") : "Pick a date"}
        <span style={{ marginLeft: "auto", color: "#9B7B5E", fontSize: 11 }}>▾</span>
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 1100,
          background: "#FFF8F2", border: "1.5px solid #E0C8B0", borderRadius: 14,
          boxShadow: "0 8px 32px rgba(100,50,10,0.18)", padding: 14, width: 248,
        }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
            <button onClick={prevM} style={{ background: "#F5EDE2", border: "none", color: "#8B4513", width: 26, height: 26, borderRadius: 7, cursor: "pointer", fontWeight: 700, fontSize: 15 }}>‹</button>
            <span style={{ flex: 1, textAlign: "center", fontWeight: 700, fontSize: 13, color: "#8B4513" }}>{MONTHS_FULL[vm]} {vy}</span>
            <button onClick={nextM} style={{ background: "#F5EDE2", border: "none", color: "#8B4513", width: 26, height: 26, borderRadius: 7, cursor: "pointer", fontWeight: 700, fontSize: 15 }}>›</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 1, marginBottom: 4 }}>
            {DAYS.map(d => <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: "#9B7B5E" }}>{d}</div>)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 1 }}>
            {cells.map((d, i) => (
              <div key={i} onClick={() => pick(d)} style={{
                textAlign: "center", fontSize: 12, padding: "5px 0", borderRadius: 6,
                cursor: d ? "pointer" : "default",
                background: isSel(d) ? "#8B4513" : isTod(d) ? "#F5EDE2" : "transparent",
                color: isSel(d) ? "white" : isTod(d) ? "#8B4513" : d ? "#4A2C0E" : "transparent",
                fontWeight: isSel(d) || isTod(d) ? 700 : 400,
              }}>
                {d || ""}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #E0C8B0", display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => { onChange(isoToday()); setOpen(false); setVm(new Date().getMonth()); setVy(new Date().getFullYear()); }}
              style={{ background: "#F5EDE2", color: "#8B4513", border: "none", borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(30,10,0,0.55)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#FFFAF4", border: "1px solid #E0C8B0", borderRadius: 20,
        width: "100%", maxWidth: 400, boxShadow: "0 24px 56px rgba(100,40,0,0.22)",
        padding: "1.6rem", animation: "modalIn 0.22s cubic-bezier(0.4,0,0.2,1)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: 20, color: "#5C2E0A", margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: "#F5EDE2", border: "none", width: 30, height: 30, borderRadius: 8, cursor: "pointer", fontSize: 16, color: "#8B4513" }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#9B7B5E", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );
}

function Input({ ...props }) {
  return (
    <input {...props} style={{
      width: "100%", background: "#FFF8F2", border: "1.5px solid #E0C8B0", borderRadius: 10,
      padding: "9px 13px", fontFamily: "inherit", fontSize: 13.5, color: "#2D1000",
      outline: "none", boxSizing: "border-box", transition: "border-color 0.15s",
      ...props.style,
    }}
      onFocus={e => e.target.style.borderColor = "#8B4513"}
      onBlur={e => e.target.style.borderColor = "#E0C8B0"}
    />
  );
}

function StatCard({ icon, label, value, sub, color = "#8B4513", bg = "#FFF0E0" }) {
  return (
    <div style={{ background: "#FFFAF4", border: "1px solid #EED8BC", borderRadius: 13, padding: "1rem 1.1rem" }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, marginBottom: 9 }}>{icon}</div>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#9B7B5E", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#B09070", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function Bar({ pct, color = "#8B4513" }) {
  return (
    <div style={{ width: "100%", height: 5, background: "#F0E0CC", borderRadius: 6, overflow: "hidden" }}>
      <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: color, borderRadius: 6, transition: "width 0.5s ease" }} />
    </div>
  );
}

function Toast({ msg, type = "success", onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t); }, [onDone]);
  const colors = { success: ["#E8F5EE", "#1A6B36"], error: ["#FDECEA", "#A0152A"], info: ["#E6F1FB", "#1A5E9B"] };
  const [bg, fg] = colors[type] || colors.info;
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 2000,
      background: bg, color: fg, border: `1.5px solid ${fg}40`, borderRadius: 12,
      padding: "10px 18px", fontSize: 13.5, fontWeight: 600,
      boxShadow: "0 8px 24px rgba(0,0,0,0.12)", maxWidth: 320,
      animation: "slideUp 0.25s ease",
    }}>
      {msg}
    </div>
  );
}

function Select({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  const current = options.find(o => o.value === value);
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block", minWidth: 110 }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
        width: "100%", background: "#FFF8F2", border: "1.5px solid #E0C8B0",
        borderColor: open ? "#8B4513" : "#E0C8B0",
        boxShadow: open ? "0 0 0 3px rgba(139,69,19,0.12)" : "none",
        borderRadius: 10, padding: "7px 12px", cursor: "pointer",
        fontFamily: "inherit", fontSize: 13, fontWeight: 600, color: "#5C2E0A",
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}>
        <span>{current?.icon} {current?.label}</span>
        <span style={{ fontSize: 10, color: "#9B7B5E", transition: "transform 0.2s", display: "inline-block", transform: open ? "rotate(180deg)" : "none" }}>▾</span>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 5px)", left: 0, zIndex: 1100,
          background: "#FFF8F2", border: "1.5px solid #E0C8B0", borderRadius: 12,
          boxShadow: "0 8px 24px rgba(100,50,10,0.16)", overflow: "hidden", minWidth: "100%",
        }}>

          {options.map(o => (
            <div key={o.value} onClick={() => { onChange(o.value); setOpen(false); }} style={{
              padding: "9px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600,
              color: o.value === value ? "#8B4513" : "#5C2E0A",
              background: o.value === value ? "#FFF0DC" : "transparent",
              display: "flex", alignItems: "center", gap: 8,
              borderLeft: o.value === value ? "3px solid #8B4513" : "3px solid transparent",
              transition: "background 0.12s",
            }}
              onMouseEnter={e => { if (o.value !== value) e.currentTarget.style.background = "#FFF4E8"; }}
              onMouseLeave={e => { if (o.value !== value) e.currentTarget.style.background = "transparent"; }}
            >
              {o.icon && <span style={{ fontSize: 14 }}>{o.icon}</span>}
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
/* ═══════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════ */
export default function App() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [toast, setToast] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* add modal */
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState("");
  const [addCount, setAddCount] = useState("1");
  const [addDrink, setAddDrink] = useState("tea");
  const [addDate, setAddDate] = useState(isoToday());
  const [addSaving, setAddSaving] = useState(false);

  /* edit modal */
  const [showEdit, setShowEdit] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [editName, setEditName] = useState("");
  const [editCount, setEditCount] = useState("1");
  const [editDrink, setEditDrink] = useState("tea");
  const [editSaving, setEditSaving] = useState(false);

  /* filters */
  const [filterStartDate, setFilterStartDate] = useState(isoToday());
  const [filterEndDate, setFilterEndDate] = useState(isoToday());
  const [filterUser, setFilterUser] = useState("");
  const [filterDrink, setFilterDrink] = useState("all");
  const [filterPaid, setFilterPaid] = useState("all");
  const [page, setPage] = useState(1);

  /* person detail */
  const [detailPerson, setDetailPerson] = useState(null);

  const today = isoToday();
  const notify = (msg, type = "success") => setToast({ msg, type, key: Date.now() });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/tea`);
      const data = await res.json();
      setEntries(data);
    } catch { notify("Failed to load data", "error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* derived */
  const allPersonMap = {};
  entries.forEach(e => {
    const k = normalizeName(e.name);
    if (!allPersonMap[k]) allPersonMap[k] = { name: e.name, tea: 0, coffee: 0, amount: 0, paid: 0, entries: [] };
    const amt = e.teaCount * getPrice(e.drinkType || "tea");
    allPersonMap[k][e.drinkType === "coffee" ? "coffee" : "tea"] += e.teaCount;
    allPersonMap[k].amount += amt;
    if (e.paid) allPersonMap[k].paid += amt;
    allPersonMap[k].entries.push(e);
  });
  const allPersons = Object.values(allPersonMap).sort((a, b) => b.amount - a.amount);

  let allTea = 0, allCoffee = 0, allAmt = 0, allPaid = 0, allPeople = new Set();
  entries.forEach(e => {
    const amt = e.teaCount * getPrice(e.drinkType || "tea");
    if (e.drinkType === "coffee") allCoffee += e.teaCount; else allTea += e.teaCount;
    allAmt += amt;
    if (e.paid) allPaid += amt;
    allPeople.add(normalizeName(e.name));
  });
  const allPending = allAmt - allPaid;

  const isDuplicate = (name, drink, forDate, excludeId = null) => {
    const d = forDate.split("T")[0];
    return entries.some(e =>
      normalizeName(e.name) === normalizeName(name) &&
      (e.drinkType || "tea") === drink &&
      (e.date || today).split("T")[0] === d &&
      e._id !== excludeId
    );
  };

  const handleAdd = async () => {
    if (!addName.trim() || Number(addCount) < 1) return notify("Fill all fields correctly", "error");
    if (isDuplicate(addName, addDrink, addDate)) return notify(`${addName.trim()} already has a ${addDrink} entry on this date`, "error");
    setAddSaving(true);
    try {
      const res = await fetch(`${API}/tea`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: addName.trim(), teaCount: Number(addCount), drinkType: addDrink, date: addDate }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed"); }
      notify("Entry added");
      setShowAdd(false); setAddName(""); setAddCount("1"); setAddDrink("tea"); setAddDate(today);
      fetchData();
    } catch (e) { notify(e.message, "error"); }
    finally { setAddSaving(false); }
  };

  const openEdit = entry => {
    setEditEntry(entry); setEditName(entry.name);
    setEditCount(String(entry.teaCount)); setEditDrink(entry.drinkType || "tea");
    setShowEdit(true);
  };
  const handleEdit = async () => {
    if (!editName.trim() || Number(editCount) < 1) return notify("Fill all fields correctly", "error");
    const entryDate = (editEntry.date || today).split("T")[0];
    if (isDuplicate(editName, editDrink, entryDate, editEntry._id)) return notify("Duplicate entry for this date", "error");
    setEditSaving(true);
    try {
      const res = await fetch(`${API}/tea/${editEntry._id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim(), teaCount: Number(editCount), drinkType: editDrink }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed"); }
      notify("Entry updated"); setShowEdit(false); setEditEntry(null); fetchData();
    } catch (e) { notify(e.message, "error"); }
    finally { setEditSaving(false); }
  };

  const handleDelete = async id => {
    if (!window.confirm("Remove this entry?")) return;
    setBusyId(id);
    try { await fetch(`${API}/tea/${id}`, { method: "DELETE" }); notify("Entry removed"); fetchData(); }
    catch { notify("Delete failed", "error"); }
    finally { setBusyId(null); }
  };

  const togglePay = async entry => {
    setBusyId(entry._id);
    try {
      const res = await fetch(`${API}/tea/${entry._id}/pay`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paid: !entry.paid }),
      });
      if (!res.ok) throw new Error("Failed");
      notify(entry.paid ? "Marked unpaid" : "Marked as paid"); fetchData();
    } catch { notify("Update failed", "error"); }
    finally { setBusyId(null); }
  };

  const adjustCups = async (entry, delta) => {
    const newCount = entry.teaCount + delta;
    if (newCount < 1) return;
    setBusyId(entry._id + delta);
    try {
      await fetch(`${API}/tea/${entry._id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: entry.name, teaCount: newCount, drinkType: entry.drinkType || "tea" }),
      });
      fetchData();
    } catch { notify("Update failed", "error"); }
    finally { setBusyId(null); }
  };

  const filteredEntries = entries
    .filter(e => { const d = (e.date || today).split("T")[0]; return d >= filterStartDate && d <= filterEndDate; })
    .filter(e => !filterUser || normalizeName(e.name).includes(normalizeName(filterUser)))
    .filter(e => filterDrink === "all" || (e.drinkType || "tea") === filterDrink)
    .filter(e => filterPaid === "all" || (filterPaid === "paid" ? e.paid : !e.paid))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalPages = Math.ceil(filteredEntries.length / PAGE_SIZE);
  const pagedEntries = filteredEntries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  let fTea = 0, fCoffee = 0, fAmt = 0, fPaid = 0;
  filteredEntries.forEach(e => {
    const amt = e.teaCount * getPrice(e.drinkType || "tea");
    if (e.drinkType === "coffee") fCoffee += e.teaCount; else fTea += e.teaCount;
    fAmt += amt;
    if (e.paid) fPaid += amt;
  });

  const personEntries = detailPerson
    ? entries.filter(e => normalizeName(e.name) === normalizeName(detailPerson))
    : [];

  const sidebarWidth = isMobile ? SIDEBAR_W : (collapsed ? COLLAPSED_W : SIDEBAR_W);
  const mainML = isMobile ? 0 : (collapsed ? COLLAPSED_W : SIDEBAR_W);

  const navItems = [
    { id: "dashboard", icon: "🏠", label: "Dashboard" },
    { id: "entries", icon: "📋", label: "Entries" },
    { id: "people", icon: "👥", label: "People" },
  ];

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=Nunito:wght@400;500;600;700&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #FBF4EC; font-family: 'Nunito', sans-serif; color: #2D1000; }
    ::-webkit-scrollbar { width: 5px; }
    ::-webkit-scrollbar-track { background: #F5EDE2; }
    ::-webkit-scrollbar-thumb { background: #D0A87A; border-radius: 10px; }

    @keyframes slideUp { from { transform: translateY(14px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes modalIn { from { transform: scale(0.95) translateY(8px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .layout { display: flex; min-height: 100vh; }

    /* ── Sidebar ── */
    .sidebar {
      width: ${SIDEBAR_W}px;
      background: #3A1800;
      display: flex; flex-direction: column;
      position: fixed; top: 0; left: 0; bottom: 0; z-index: 200;
      transition: width 0.45s cubic-bezier(0.4,0,0.2,1), transform 0.3s cubic-bezier(0.4,0,0.2,1);
      overflow: hidden;
    }
    .sidebar.collapsed { width: ${COLLAPSED_W}px; }
    .sidebar.mobile-hidden { transform: translateX(-100%); }
    .sidebar.mobile-open { transform: translateX(0); width: ${SIDEBAR_W}px; box-shadow: 6px 0 40px rgba(0,0,0,0.3); }

    /* logo row */
    .sidebar-logo {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 14px; height: 64px; flex-shrink: 0;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      gap: 10px; overflow: hidden;
    }
    .logo-text { overflow: hidden; flex: 1; min-width: 0; }
    .logo-text h1 {
      font-family: 'Lora', serif; font-size: 16px; color: #F5C07A;
      line-height: 1.25; white-space: nowrap; overflow: hidden;
      transition: opacity 0.3s ease, max-width 0.45s cubic-bezier(0.4,0,0.2,1);
    }
    .logo-text span {
      font-size: 10px; color: rgba(245,192,122,0.5); white-space: nowrap;
      display: block; margin-top: 1px;
      transition: opacity 0.3s ease;
    }
    .sidebar.collapsed .logo-text h1,
    .sidebar.collapsed .logo-text span { opacity: 0; }

    /* collapse toggle button */
    .collapse-btn {
      flex-shrink: 0; width: 28px; height: 28px; border-radius: 8px;
      border: none; background: rgba(255,255,255,0.09); color: #F5C07A;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      font-size: 15px; transition: background 0.2s;
    }
    .collapse-btn:hover { background: rgba(255,255,255,0.17); }
    .collapse-btn-icon {
      display: inline-block;
      transition: transform 0.45s cubic-bezier(0.4,0,0.2,1);
    }
    .sidebar.collapsed .collapse-btn-icon { transform: rotate(180deg); }

    /* nav */
    .nav { padding: 10px 8px; flex: 1; overflow-y: auto; overflow-x: hidden; }
    .nav-sep {
      font-size: 9px; font-weight: 700; color: rgba(245,192,122,0.3);
      text-transform: uppercase; letter-spacing: 1.5px;
      padding: 10px 10px 5px;
      white-space: nowrap; overflow: hidden;
      transition: opacity 0.3s ease;
    }
    .sidebar.collapsed .nav-sep { opacity: 0; }
    .nav-btn {
      display: flex; align-items: center; gap: 10px;
      width: 100%; padding: 10px 12px; border: none; background: transparent;
      color: rgba(255,255,255,0.52); font-family: inherit; font-size: 13.5px;
      font-weight: 500; border-radius: 9px; cursor: pointer;
      text-align: left; transition: background 0.15s, color 0.15s;
      margin-bottom: 2px; white-space: nowrap;
    }
    .nav-btn:hover { background: rgba(255,255,255,0.07); color: #F5C07A; }
    .nav-btn.active { background: rgba(245,192,122,0.15); color: #F5C07A; font-weight: 700; }
    .nav-icon { width: 20px; text-align: center; flex-shrink: 0; font-size: 16px; }
    .nav-label {
      overflow: hidden; transition: opacity 0.3s ease, max-width 0.45s cubic-bezier(0.4,0,0.2,1);
      max-width: 160px;
    }
    .sidebar.collapsed .nav-label { opacity: 0; max-width: 0; }
    .sidebar.collapsed .nav-btn { justify-content: center; padding: 10px 0; }
    .sidebar.collapsed .nav-icon { width: 10px; }
    .sidebar.collapsed .sidebar-logo { padding: 14px 18px 14px 0px; }
    /* footer */
    .sidebar-foot {
      padding: 12px 14px; border-top: 1px solid rgba(255,255,255,0.08);
      font-size: 10.5px; color: rgba(255,255,255,0.28); flex-shrink: 0;
      overflow: hidden; white-space: nowrap;
      transition: opacity 0.3s ease;
    }
    .sidebar.collapsed .sidebar-foot { opacity: 0; pointer-events: none; }

    /* ── Main ── */
    .main {
      margin-left: ${SIDEBAR_W}px;
      flex: 1; min-height: 100vh;
      padding: 2rem 2rem 4rem;
      transition: margin-left 0.45s cubic-bezier(0.4,0,0.2,1);
      max-width: 100%;
      overflow-x: hidden;
    }
    .main.collapsed { margin-left: ${COLLAPSED_W}px; }
    .main.mobile { margin-left: 0; padding: 4rem 1rem 3rem; }

    /* mobile topbar */
    .mob-bar {
      display: none; position: fixed; top: 0; left: 0; right: 0; z-index: 150;
      background: #3A1800; height: 52px; align-items: center;
      padding: 0 14px; gap: 12px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    .mob-bar-title { font-family: 'Lora', serif; font-size: 15px; color: #F5C07A; flex: 1; }
    .mob-menu-btn {
      width: 36px; height: 36px; border-radius: 9px; border: none;
      background: rgba(255,255,255,0.09); color: #F5C07A;
      cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center;
    }

    /* overlay */
    .overlay {
      display: none; position: fixed; inset: 0; background: rgba(20,6,0,0.45);
      z-index: 190; animation: fadeIn 0.2s ease;
    }
    .overlay.show { display: block; }

    /* page */
    .page-header {
      border-bottom: 1px solid #E8D2B8; padding-bottom: 1.2rem; margin-bottom: 1.8rem;
      display: flex; align-items: flex-end; justify-content: space-between;
      flex-wrap: wrap; gap: 12px;
    }
    .page-title { font-family: 'Lora', serif; font-size: 26px; color: #5C2E0A; line-height: 1.1; }
    .page-sub { font-size: 12px; color: #9B7B5E; margin-top: 3px; }

    /* stats */
    .stats-grid { display: grid; grid-template-columns: repeat(6,1fr); gap: 10px; margin-bottom: 1.4rem; }
    .stats-grid-3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin-bottom: 1.4rem; }

    /* card */
    .card { background: #FFFAF4; border: 1px solid #EED8BC; border-radius: 14px; }
    .card-head {
      padding: 0.85rem 1.2rem; border-bottom: 1px solid #EED8BC;
      display: flex; justify-content: space-between; align-items: center;
    }
    .card-title { font-size: 10px; font-weight: 700; color: #9B7B5E; text-transform: uppercase; letter-spacing: 0.7px; }

    /* table */
    .table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 600px; }
    th { padding: 9px 12px; text-align: left; font-size: 10px; font-weight: 700; color: #9B7B5E; text-transform: uppercase; letter-spacing: 0.7px; border-bottom: 1px solid #EED8BC; background: #FDF5EC; white-space: nowrap; }
    td { padding: 10px 12px; border-bottom: 1px solid rgba(200,150,90,0.1); vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #FDF5EC; }

    /* buttons */
    .btn { display: inline-flex; align-items: center; justify-content: center; gap: 5px; border: none; border-radius: 8px; padding: 7px 14px; font-family: inherit; font-size: 13px; font-weight: 600; cursor: pointer; transition: 0.15s; white-space: nowrap; }
    .btn-primary { background: #8B4513; color: white; }
    .btn-primary:hover { background: #6B3410; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-ghost { background: #F5EDE2; color: #8B4513; }
    .btn-ghost:hover { background: #EAD9C4; }
    .btn-danger { background: #FDECEA; color: #A0152A; }
    .btn-danger:hover { background: #F9D0CE; }
    .btn-sm { padding: 4px 10px; font-size: 12px; border-radius: 6px; }
    .icon-btn { width: 26px; height: 26px; padding: 0; border-radius: 7px; font-size: 14px; }

    /* filter */
    .filter-bar { background: #FFFAF4; border: 1px solid #EED8BC; border-radius: 12px; padding: 0.75rem 1.2rem; margin-bottom: 1rem; display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
    .filter-label { font-size: 11px; font-weight: 600; color: #9B7B5E; }
    select.filter-select {

  appearance: none; -webkit-appearance: none;

  background: #FFF8F2

    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%238B4513' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")

    no-repeat right 10px center;

  border: 1.5px solid #E0C8B0;

  border-radius: 10px;

  padding: 7px 32px 7px 12px;

  font-family: inherit; font-size: 13px; font-weight: 600;

  color: #5C2E0A;

  cursor: pointer; outline: none;

  transition: border-color 0.15s, box-shadow 0.15s;

}

select.filter-select:hover { border-color: #C08040; }

select.filter-select:focus { border-color: #8B4513; box-shadow: 0 0 0 3px rgba(139,69,19,0.12); }

select.filter-select option { background: #FFF8F2; color: #5C2E0A; font-weight: 600; }
    input.filter-input { background: #F5EDE2; border: 1.5px solid #E0C8B0; border-radius: 8px; padding: 6px 12px; font-family: inherit; font-size: 13px; color: #4A2C0E; outline: none; width: 150px; }
    input.filter-input:focus { border-color: #8B4513; outline: none; }

    /* misc */
    .pill { background: #F5EDE2; color: #8B4513; font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: 20px; }
    .price-strip { display: flex; gap: 10px; margin-bottom: 1.3rem; flex-wrap: wrap; }
    .price-chip { background: #FFFAF4; border: 1.5px solid #E0C8B0; border-radius: 10px; padding: 6px 13px; font-size: 12px; color: #6B4020; font-weight: 500; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 14px; }
    .person-mini { background: #FFF6EC; border: 1px solid #E8D2B8; border-radius: 12px; padding: 0.85rem; cursor: pointer; transition: 0.15s; }
    .person-mini:hover { border-color: #C08040; background: #FFF0DC; transform: translateY(-1px); }
    .spinner { width: 24px; height: 24px; border: 2px solid #E0C8B0; border-top-color: #8B4513; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
    .center { display: flex; justify-content: center; align-items: center; }
    .empty { text-align: center; padding: 2.5rem; color: #B09070; font-size: 13.5px; }
    .date-range-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .date-range-sep { font-size: 12px; color: #9B7B5E; font-weight: 600; }
    .range-summary { background: #FFF0DC; border: 1px solid #E8C49A; border-radius: 10px; padding: 8px 14px; display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 1rem; }
    .range-stat { font-size: 12px; color: #6B4020; }
    .range-stat strong { color: #5C2E0A; }

    /* ── Responsive ── */
    @media (max-width: 1200px) {
      .stats-grid { grid-template-columns: repeat(3,1fr); }
    }
    @media (max-width: 900px) {
      .stats-grid { grid-template-columns: repeat(2,1fr); }
      .stats-grid-3 { grid-template-columns: repeat(2,1fr); }
      .two-col { grid-template-columns: 1fr; }
    }
    @media (max-width: 768px) {
      .sidebar { transform: translateX(-100%); width: ${SIDEBAR_W}px !important; }
      .sidebar.mobile-open { transform: translateX(0); box-shadow: 6px 0 40px rgba(0,0,0,0.3); }
      .main { margin-left: 0 !important; padding: 4.5rem 1rem 3rem; }
      .mob-bar { display: flex; }
      .stats-grid { grid-template-columns: repeat(2,1fr); }
      .stats-grid-3 { grid-template-columns: repeat(2,1fr); }
      .two-col { grid-template-columns: 1fr; }
      .page-header { flex-direction: column; align-items: flex-start; }
      .filter-bar { flex-direction: column; align-items: flex-start; }
      .date-range-row { flex-direction: column; align-items: flex-start; }
      input.filter-input { width: 100%; }
    }
    @media (max-width: 480px) {
      .stats-grid { grid-template-columns: 1fr 1fr; }
      .stats-grid-3 { grid-template-columns: 1fr 1fr; }
      .main { padding: 4.5rem 0.75rem 3rem; }
    }
  `;

  return (
    <>
      <style>{CSS}</style>
      <div className="layout">

        {/* Mobile overlay */}
        <div className={`overlay ${mobileOpen ? "show" : ""}`} onClick={() => setMobileOpen(false)} />

        {/* Mobile topbar */}
        <div className="mob-bar">
          <button className="mob-menu-btn" onClick={() => setMobileOpen(o => !o)}>☰</button>
          <span className="mob-bar-title">☕ Tea & Coffee</span>
          <button className="btn btn-primary btn-sm" onClick={() => { setAddDate(today); setShowAdd(true); }}>+ Add</button>
        </div>

        {/* SIDEBAR */}
        <aside className={`sidebar ${collapsed && !isMobile ? "collapsed" : ""} ${isMobile && mobileOpen ? "mobile-open" : ""}`}>

          {/* Logo row with collapse toggle */}
          <div className="sidebar-logo">
            <div className="logo-text">
              <h1>☕ Tea & Coffee</h1>
              <span>Tracker</span>
            </div>
            {!isMobile && (
              <button
                className="collapse-btn"
                onClick={() => setCollapsed(c => !c)}
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <span className="collapse-btn-icon">‹</span>
              </button>
            )}
            {isMobile && (
              <button className="collapse-btn" onClick={() => setMobileOpen(false)} title="Close">×</button>
            )}
          </div>

          {/* Nav */}
          <nav className="nav">
            <div className="nav-sep">Menu</div>
            {navItems.map(n => (
              <button
                key={n.id}
                className={`nav-btn ${tab === n.id ? "active" : ""}`}
                onClick={() => { setTab(n.id); setMobileOpen(false); }}
                title={collapsed && !isMobile ? n.label : ""}
              >
                <span className="nav-icon">{n.icon}</span>
                <span className="nav-label">{n.label}</span>
              </button>
            ))}
          </nav>

          {/* Footer */}
          <div className="sidebar-foot">
            <div style={{ marginBottom: 2, color: "#F5C07A", fontWeight: 600, fontSize: 11 }}>{fmtDate(today + "T00:00:00")}</div>
            {entries.length} total records
          </div>
        </aside>

        {/* MAIN */}
        <main className={`main ${collapsed && !isMobile ? "collapsed" : ""} ${isMobile ? "mobile" : ""}`}>

          {/* ── DASHBOARD ── */}
          {tab === "dashboard" && (
            <>
              <div className="page-header">
                <div>
                  <div className="page-title">Dashboard</div>
                  <div className="page-sub">All-time overview · {fmtDate(today + "T00:00:00")}</div>
                </div>
                <button className="btn btn-primary" onClick={() => { setAddDate(today); setShowAdd(true); }}>+ Add Entry</button>
              </div>

              <div className="price-strip">
                <div className="price-chip">🍵 Tea — <strong>₹{TEA_PRICE}/cup</strong></div>
                <div className="price-chip">☕ Coffee — <strong>₹{COFFEE_PRICE}/cup</strong></div>
              </div>

              <div style={{ fontSize: 10, fontWeight: 700, color: "#9B7B5E", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }}>Overview</div>
              <div className="stats-grid">
                <StatCard icon="🍵" label="Total Teas" value={allTea} bg="#FFF0E0" color="#8B4513" />
                <StatCard icon="☕" label="Total Coffees" value={allCoffee} bg="#2D1A0E" color="#CC8040" />
                <StatCard icon="💰" label="Total Expense" value={formatINR(allAmt)} bg="#E8F5EE" color="#1A6B36" />
                <StatCard icon="✅" label="Total Paid" value={formatINR(allPaid)} bg="#E8F5EE" color="#1A6B36" />
                <StatCard icon="⏳" label="Pending" value={formatINR(allPending)} bg="#FFF3E0" color="#CC5500" />
                <StatCard icon="👥" label="People" value={allPeople.size} bg="#E6F1FB" color="#1A5E9B" />
              </div>

              <div style={{ fontSize: 10, fontWeight: 700, color: "#9B7B5E", textTransform: "uppercase", letterSpacing: "0.8px", margin: "1.4rem 0 8px" }}>Records</div>
              <div className="stats-grid-3">
                <StatCard icon="📋" label="Total Records" value={entries.length} color="#5C2E0A" />
                <StatCard icon="📅" label="Days Tracked" value={new Set(entries.map(e => (e.date || today).split("T")[0])).size} bg="#E6F1FB" color="#1A5E9B" />
                <StatCard icon="🏆" label="Avg per Person" value={allPeople.size ? formatINR(Math.round(allAmt / allPeople.size)) : "₹0"} bg="#FFF0E0" color="#8B4513" />
              </div>

              {/* All entries table */}
              <div className="card" style={{ marginBottom: 14 }}>
                <div className="card-head">
                  <span className="card-title">All Entries</span>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span className="pill">{entries.length} total</span>
                  </div>
                </div>
                <div className="table-wrap">
                  {loading ? (
                    <div className="center" style={{ padding: "2rem" }}><div className="spinner" /></div>
                  ) : entries.length === 0 ? (
                    <div className="empty">No entries yet. Add the first one!</div>
                  ) : (
                    <table>
                      <thead>
                        <tr><th>Name</th><th>Type</th><th>Date</th><th>Cups</th><th>Amount</th><th>Adjust</th><th>Payment</th><th>Actions</th></tr>
                      </thead>
                      <tbody>
                        {[...entries].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20).map(e => {
                          const amt = e.teaCount * getPrice(e.drinkType || "tea");
                          return (
                            <tr key={e._id}>
                              <td>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <Avatar name={e.name} size={28} />
                                  <button onClick={() => { setDetailPerson(e.name); setTab("people"); }}
                                    style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 600, color: "#4A2C0E", fontFamily: "inherit", fontSize: 13, padding: 0 }}>
                                    {e.name}
                                  </button>
                                </div>
                              </td>
                              <td><DrinkBadge type={e.drinkType || "tea"} /></td>
                              <td style={{ color: "#9B7B5E", fontSize: 12 }}>{fmtDate(e.date || today)}</td>
                              <td><span className="pill">{e.teaCount}</span></td>
                              <td style={{ fontWeight: 700, color: "#8B4513" }}>{formatINR(amt)}</td>
                              <td>
                                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                  <button className="btn btn-ghost icon-btn btn-sm" onClick={() => adjustCups(e, -1)} disabled={e.teaCount <= 1 || busyId === e._id + (-1)}>−</button>
                                  <span style={{ minWidth: 18, textAlign: "center", fontWeight: 600, fontSize: 12 }}>{e.teaCount}</span>
                                  <button className="btn btn-ghost icon-btn btn-sm" onClick={() => adjustCups(e, 1)} disabled={busyId === e._id + 1}>+</button>
                                </div>
                              </td>
                              <td>
                                <button onClick={() => togglePay(e)} disabled={busyId === e._id} className="btn btn-sm"
                                  style={{ background: e.paid ? "#E8F5EE" : "#FFF3E0", color: e.paid ? "#1A6B36" : "#CC5500", border: `1px solid ${e.paid ? "#B0DFC0" : "#FBBF88"}` }}>
                                  {e.paid ? "✓ Paid" : "⏳ Pending"}
                                </button>
                              </td>
                              <td>
                                <div style={{ display: "flex", gap: 4 }}>
                                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(e)}>Edit</button>
                                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(e._id)} disabled={busyId === e._id}>Del</button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
                {entries.length > 20 && (
                  <div style={{ padding: "10px 16px", borderTop: "1px solid #EED8BC", fontSize: 12, color: "#9B7B5E", textAlign: "center" }}>
                    Showing 20 of {entries.length} ·{" "}
                    <button onClick={() => setTab("entries")} style={{ background: "none", border: "none", color: "#8B4513", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", fontSize: 12 }}>
                      View all →
                    </button>
                  </div>
                )}
              </div>

              {/* Trends + Summary */}
              <div className="two-col">
                <div className="card" style={{ padding: "1rem 1.2rem" }}>
                  <div className="card-title" style={{ marginBottom: "0.9rem" }}>Spending trends</div>
                  {allPersons.length === 0 ? <div className="empty" style={{ padding: "1rem" }}>No data</div> : (
                    <>
                      {allPersons[0] && (
                        <div style={{ background: "#FFF0DC", border: "1px solid #E8C49A", borderRadius: 10, padding: "8px 11px", marginBottom: 12, display: "flex", alignItems: "center", gap: 9 }}>
                          <span style={{ fontSize: 16 }}>🏆</span>
                          <div>
                            <div style={{ fontSize: 10, color: "#9B7B5E", fontWeight: 600 }}>Top spender</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#5C2E0A" }}>{allPersons[0].name} · {formatINR(allPersons[0].amount)}</div>
                          </div>
                        </div>
                      )}
                      {allPersons.slice(0, 7).map(p => (
                        <div key={p.name} style={{ marginBottom: 10 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, fontSize: 12 }}>
                            <span style={{ fontWeight: 500 }}>{p.name}</span>
                            <span style={{ color: "#9B7B5E" }}>{formatINR(p.amount)}</span>
                          </div>
                          <Bar pct={(p.amount / (allPersons[0]?.amount || 1)) * 100} />
                        </div>
                      ))}
                    </>
                  )}
                </div>

                <div className="card" style={{ padding: "1rem 1.2rem" }}>
                  <div className="card-title" style={{ marginBottom: "0.9rem" }}>Person summary</div>
                  {allPersons.length === 0 ? <div className="empty" style={{ padding: "1rem" }}>No data yet</div> : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px,1fr))", gap: 8 }}>
                      {allPersons.map(p => (
                        <div key={p.name} style={{ background: "#FFF6EC", border: "1px solid #E8D2B8", borderRadius: 10, padding: "0.7rem" }}>
                          <div style={{ fontWeight: 700, fontSize: 12.5, color: "#2D1000" }}>{p.name}</div>
                          <div style={{ fontSize: 10.5, color: "#9B7B5E", marginTop: 1 }}>
                            {p.tea > 0 && `${p.tea}T`} {p.coffee > 0 && `${p.coffee}C`}
                          </div>
                          <div style={{ fontSize: 17, fontWeight: 700, color: "#8B4513", marginTop: 6, borderTop: "1px solid #E8D2B8", paddingTop: 5 }}>
                            {formatINR(p.amount)}
                          </div>
                          <div style={{ fontSize: 10, color: p.paid < p.amount ? "#CC5500" : "#1A6B36", marginTop: 2, fontWeight: 600 }}>
                            {p.paid < p.amount ? `⏳ ${formatINR(p.amount - p.paid)} due` : "✓ All paid"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ── ENTRIES ── */}
          {tab === "entries" && (
            <>
              <div className="page-header">
                <div>
                  <div className="page-title">Entry List</div>
                  <div className="page-sub">Filter by date range, person, drink & payment</div>
                </div>
                <button className="btn btn-primary" onClick={() => { setAddDate(filterStartDate); setShowAdd(true); }}>+ Add Entry</button>
              </div>

              <div className="filter-bar">
                <span className="filter-label">Date Range:</span>
                <div className="date-range-row">
                  <DatePicker value={filterStartDate} onChange={d => { setFilterStartDate(d); if (d > filterEndDate) setFilterEndDate(d); setPage(1); }} />
                  <span className="date-range-sep">→</span>
                  <DatePicker value={filterEndDate} onChange={d => { setFilterEndDate(d); if (d < filterStartDate) setFilterStartDate(d); setPage(1); }} />
                </div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {[
                    { label: "Today", fn: () => { setFilterStartDate(today); setFilterEndDate(today); setPage(1); } },
                    { label: "This Week", fn: () => { const d = new Date(), day = d.getDay(), mon = new Date(d); mon.setDate(d.getDate() - (day === 0 ? 6 : day - 1)); setFilterStartDate(mon.toISOString().split("T")[0]); setFilterEndDate(today); setPage(1); } },
                    { label: "This Month", fn: () => { const d = new Date(); setFilterStartDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`); setFilterEndDate(today); setPage(1); } },
                    { label: "All Time", fn: () => { const dates = entries.map(e => (e.date || today).split("T")[0]).sort(); setFilterStartDate(dates[0] || today); setFilterEndDate(today); setPage(1); } },
                  ].map(({ label, fn }) => (
                    <button key={label} className="btn btn-ghost btn-sm" onClick={fn}>{label}</button>
                  ))}
                </div>
              </div>

              <div className="filter-bar" style={{ marginTop: -4 }}>
                <span className="filter-label">Person:</span>
                <input className="filter-input" placeholder="Search name…" value={filterUser} onChange={e => { setFilterUser(e.target.value); setPage(1); }} />
                <span className="filter-label">Drink:</span>
                <Select value={filterDrink} onChange={v => { setFilterDrink(v); setPage(1); }} options={[
                  { value: "all", label: "All Drinks", icon: "🍶" },
                  { value: "tea", label: "Tea", icon: "🍵" },
                  { value: "coffee", label: "Coffee", icon: "☕" },
                ]} />
                <span className="filter-label">Status:</span>
                <Select value={filterPaid} onChange={v => { setFilterPaid(v); setPage(1); }} options={[
                  { value: "all", label: "All Status", icon: "📋" },
                  { value: "paid", label: "Paid", icon: "✅" },
                  { value: "unpaid", label: "Pending", icon: "⏳" },
                ]} />
                <span className="pill">{filteredEntries.length} results</span>
                {(filterUser || filterDrink !== "all" || filterPaid !== "all") && (
                  <button className="btn btn-ghost btn-sm" onClick={() => { setFilterUser(""); setFilterDrink("all"); setFilterPaid("all"); setPage(1); }}>Clear</button>
                )}
              </div>

              {filteredEntries.length > 0 && (
                <div className="range-summary">
                  <span className="range-stat">🍵 Tea: <strong>{fTea}</strong></span>
                  <span className="range-stat">☕ Coffee: <strong>{fCoffee}</strong></span>
                  <span className="range-stat">💰 Expense: <strong>{formatINR(fAmt)}</strong></span>
                  <span className="range-stat">✅ Paid: <strong>{formatINR(fPaid)}</strong></span>
                  <span className="range-stat">⏳ Pending: <strong>{formatINR(fAmt - fPaid)}</strong></span>
                </div>
              )}

              {loading ? (
                <div className="center" style={{ padding: "3rem" }}><div className="spinner" /></div>
              ) : filteredEntries.length === 0 ? (
                <div className="card"><div className="empty">No entries match your filters.</div></div>
              ) : (
                <>
                  <div className="card" style={{ marginBottom: 12 }}>
                    <div className="table-wrap">
                      <table>
                        <thead><tr><th>Name</th><th>Type</th><th>Date</th><th>Cups</th><th>Amount</th><th>Adjust</th><th>Payment</th><th>Actions</th></tr></thead>
                        <tbody>
                          {pagedEntries.map(e => {
                            const amt = e.teaCount * getPrice(e.drinkType || "tea");
                            return (
                              <tr key={e._id}>
                                <td>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <Avatar name={e.name} size={26} />
                                    <span style={{ fontWeight: 500 }}>{e.name}</span>
                                  </div>
                                </td>
                                <td><DrinkBadge type={e.drinkType || "tea"} /></td>
                                <td style={{ color: "#9B7B5E", fontSize: 12 }}>{fmtDate(e.date || today)}</td>
                                <td><span className="pill">{e.teaCount}</span></td>
                                <td style={{ fontWeight: 700, color: "#8B4513" }}>{formatINR(amt)}</td>
                                <td>
                                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                    <button className="btn btn-ghost icon-btn btn-sm" onClick={() => adjustCups(e, -1)} disabled={e.teaCount <= 1}>−</button>
                                    <span style={{ minWidth: 18, textAlign: "center", fontWeight: 600, fontSize: 12 }}>{e.teaCount}</span>
                                    <button className="btn btn-ghost icon-btn btn-sm" onClick={() => adjustCups(e, 1)}>+</button>
                                  </div>
                                </td>
                                <td>
                                  <button onClick={() => togglePay(e)} disabled={busyId === e._id} className="btn btn-sm"
                                    style={{ background: e.paid ? "#E8F5EE" : "#FFF3E0", color: e.paid ? "#1A6B36" : "#CC5500", border: `1px solid ${e.paid ? "#B0DFC0" : "#FBBF88"}` }}>
                                    {e.paid ? "✓ Paid" : "⏳ Pending"}
                                  </button>
                                </td>
                                <td>
                                  <div style={{ display: "flex", gap: 4 }}>
                                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(e)}>Edit</button>
                                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(e._id)} disabled={busyId === e._id}>Del</button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {totalPages > 1 && (
                    <div style={{ display: "flex", justifyContent: "center", gap: 6, flexWrap: "wrap" }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <button key={p} className="btn btn-sm" onClick={() => setPage(p)}
                          style={{ background: p === page ? "#8B4513" : "#F5EDE2", color: p === page ? "white" : "#8B4513" }}>
                          {p}
                        </button>
                      ))}
                      <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next →</button>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* ── PEOPLE ── */}
          {tab === "people" && (
            <>
              <div className="page-header">
                <div>
                  <div className="page-title">{detailPerson || "People"}</div>
                  <div className="page-sub">{detailPerson ? "Individual record" : "All-time per-person summary"}</div>
                </div>
                {detailPerson && (
                  <button className="btn btn-ghost" onClick={() => setDetailPerson(null)}>← All people</button>
                )}
              </div>

              {!detailPerson ? (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px,1fr))", gap: 10, marginBottom: "1.3rem" }}>
                    {allPersons.map(p => (
                      <div key={p.name} className="person-mini" onClick={() => setDetailPerson(p.name)}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                          <Avatar name={p.name} size={32} />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13, color: "#2D1000" }}>{p.name}</div>
                            <div style={{ fontSize: 11, color: "#9B7B5E" }}>{p.tea + p.coffee} cups</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
                          {p.tea > 0 && <span className="pill" style={{ fontSize: 10.5 }}>🍵 {p.tea}</span>}
                          {p.coffee > 0 && <span style={{ background: "#2D1A0E", color: "#F5C07A", borderRadius: 20, padding: "3px 8px", fontSize: 10.5, fontWeight: 600 }}>☕ {p.coffee}</span>}
                        </div>
                        <div style={{ borderTop: "1px solid #E8D2B8", paddingTop: 7 }}>
                          <div style={{ fontSize: 17, fontWeight: 700, color: "#8B4513" }}>{formatINR(p.amount)}</div>
                          <div style={{ fontSize: 11, marginTop: 2, color: p.paid < p.amount ? "#CC5500" : "#1A6B36", fontWeight: 600 }}>
                            {p.paid < p.amount ? `${formatINR(p.amount - p.paid)} pending` : "Fully paid"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {allPersons.length === 0 && <div className="card"><div className="empty">No people yet.</div></div>}
                </>
              ) : (() => {
                const pd = allPersonMap[normalizeName(detailPerson)];
                if (!pd) return <div className="empty">No data found.</div>;
                const pending = pd.amount - pd.paid;
                return (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px,1fr))", gap: 10, marginBottom: "1.4rem" }}>
                      <StatCard icon="🍵" label="Tea cups" value={pd.tea} />
                      <StatCard icon="☕" label="Coffee cups" value={pd.coffee} color="#CC8040" />
                      <StatCard icon="💰" label="Total spent" value={formatINR(pd.amount)} color="#5C2E0A" />
                      <StatCard icon="✅" label="Paid" value={formatINR(pd.paid)} bg="#E8F5EE" color="#1A6B36" />
                      <StatCard icon="⏳" label="Pending" value={formatINR(pending)} bg="#FFF3E0" color="#CC5500" />
                    </div>
                    {pending > 0 && (
                      <div style={{ background: "#FFF3E0", border: "1px solid #FBBF88", borderRadius: 11, padding: "10px 15px", marginBottom: "1.2rem", display: "flex", alignItems: "center", gap: 9, fontSize: 13, color: "#8B3500" }}>
                        ⚠️ <strong>{formatINR(pending)}</strong> pending from {pd.name}
                      </div>
                    )}
                    <div className="card">
                      <div className="card-head">
                        <span className="card-title">All entries for {pd.name}</span>
                        <span className="pill">{personEntries.length} records</span>
                      </div>
                      <div className="table-wrap">
                        <table>
                          <thead><tr><th>Date</th><th>Type</th><th>Cups</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
                          <tbody>
                            {personEntries.sort((a, b) => new Date(b.date) - new Date(a.date)).map(e => {
                              const amt = e.teaCount * getPrice(e.drinkType || "tea");
                              return (
                                <tr key={e._id}>
                                  <td style={{ color: "#9B7B5E", fontSize: 12 }}>{fmtDate(e.date || today)}</td>
                                  <td><DrinkBadge type={e.drinkType || "tea"} /></td>
                                  <td><span className="pill">{e.teaCount}</span></td>
                                  <td style={{ fontWeight: 700, color: "#8B4513" }}>{formatINR(amt)}</td>
                                  <td><PayBadge paid={e.paid} /></td>
                                  <td>
                                    <button onClick={() => togglePay(e)} disabled={busyId === e._id} className="btn btn-sm"
                                      style={{ background: e.paid ? "#FFF3E0" : "#E8F5EE", color: e.paid ? "#CC5500" : "#1A6B36", border: `1px solid ${e.paid ? "#FBBF88" : "#B0DFC0"}` }}>
                                      {e.paid ? "Mark unpaid" : "Mark paid"}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                );
              })()}
            </>
          )}
        </main>
      </div>

      {/* ADD MODAL */}
      {showAdd && (
        <Modal title="Add Entry" onClose={() => setShowAdd(false)}>
          <Field label="Drink type"><DrinkToggle value={addDrink} onChange={setAddDrink} /></Field>
          <Field label="Full name">
            <Input type="text" placeholder="e.g. Rahul Shah" value={addName} onChange={e => setAddName(e.target.value)} />
          </Field>
          <Field label="Number of cups">
            <Input type="number" min="1" placeholder="1" value={addCount} onChange={e => setAddCount(e.target.value)} />
          </Field>
          <Field label="Date">
            <DatePicker value={addDate} onChange={setAddDate} />
          </Field>
          {addName && addCount && (
            <div style={{ fontSize: 12.5, background: "#FFF0DC", border: "1px solid #E8C49A", borderRadius: 9, padding: "8px 12px", marginBottom: 10, color: "#8B4513" }}>
              Amount: <strong>{formatINR(Number(addCount) * getPrice(addDrink))}</strong> · {addDrink === "coffee" ? "Coffee" : "Tea"} @ ₹{getPrice(addDrink)}/cup
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 9, marginTop: 4 }}>
            <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAdd} disabled={addSaving || !addName.trim() || Number(addCount) < 1}>
              {addSaving ? "Saving…" : "Save Entry"}
            </button>
          </div>
        </Modal>
      )}

      {/* EDIT MODAL */}
      {showEdit && editEntry && (
        <Modal title="Edit Entry" onClose={() => { setShowEdit(false); setEditEntry(null); }}>
          <Field label="Drink type"><DrinkToggle value={editDrink} onChange={setEditDrink} /></Field>
          <Field label="Name">
            <Input type="text" value={editName} onChange={e => setEditName(e.target.value)} />
          </Field>
          <Field label="Cups">
            <Input type="number" min="1" value={editCount} onChange={e => setEditCount(e.target.value)} />
          </Field>
          {editName && editCount && (
            <div style={{ fontSize: 12.5, background: "#FFF0DC", border: "1px solid #E8C49A", borderRadius: 9, padding: "8px 12px", marginBottom: 10, color: "#8B4513" }}>
              Amount: <strong>{formatINR(Number(editCount) * getPrice(editDrink))}</strong>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 9, marginTop: 4 }}>
            <button className="btn btn-ghost" onClick={() => { setShowEdit(false); setEditEntry(null); }}>Cancel</button>
            <button className="btn btn-primary" onClick={handleEdit} disabled={editSaving || !editName.trim() || Number(editCount) < 1}>
              {editSaving ? "Saving…" : "Update Entry"}
            </button>
          </div>
        </Modal>
      )}

      {toast && <Toast key={toast.key} msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </>
  );
}