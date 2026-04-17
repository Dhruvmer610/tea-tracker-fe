import { useEffect, useState, useCallback, useRef } from "react";

const API = "https://tea-tracker-be.onrender.com/api";
const TEA_PRICE = 10;
const COFFEE_PRICE = 20;
const PAGE_SIZE = 10;

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

/* ── Avatar colors ── */
const AVATAR_COLORS = [
  ["#FDE8CC", "#9C4E0F"], ["#D4EDDA", "#1A6B36"], ["#D8EAF9", "#1A5E9B"],
  ["#F2D9F7", "#7A1FA5"], ["#FFDDE1", "#A0152A"], ["#D9F0EB", "#0E7060"],
];
function avatarColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

/* ── Reusable Avatar ── */
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

/* ── Drink Badge ── */
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
      {isCoffee ? "Coffee" : "Tea"}
    </span>
  );
}

/* ── Payment Badge ── */
function PayBadge({ paid }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20,
      background: paid ? "#E8F5EE" : "#FFF3E0",
      color: paid ? "#1A6B36" : "#CC5500",
      border: `1px solid ${paid ? "#B0DFC0" : "#FBBF88"}`,
    }}>
      {paid ? "Paid" : "Pending"}
    </span>
  );
}

/* ── Drink Toggle ── */
function DrinkToggle({ value, onChange }) {
  return (
    <div style={{ display: "flex", background: "#F5EDE2", borderRadius: 10, padding: 3, gap: 2 }}>
      {["tea", "coffee"].map(t => (
        <button key={t} onClick={() => onChange(t)} style={{
          flex: 1, border: "none", borderRadius: 8, padding: "8px 0",
          cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit",
          transition: "all 0.15s",
          background: value === t ? (t === "tea" ? "#8B4513" : "#2D1A0E") : "transparent",
          color: value === t ? "white" : "#9B7B5E",
        }}>
          {t === "tea" ? "☕ Tea" : "☕ Coffee"}
        </button>
      ))}
    </div>
  );
}

/* ── Date Picker ── */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function DatePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [vy, setVy] = useState(() => new Date(value || isoToday()).getFullYear());
  const [vm, setVm] = useState(() => new Date(value || isoToday()).getMonth());
  const ref = useRef();
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
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
        minWidth: 160,
      }}>
        📅 {value ? fmtDate(value + "T00:00:00") : "Pick a date"}
        <span style={{ marginLeft: "auto", color: "#9B7B5E", fontSize: 11 }}>▾</span>
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 999,
          background: "#FFF8F2", border: "1.5px solid #E0C8B0", borderRadius: 14,
          boxShadow: "0 8px 24px rgba(100,50,10,0.18)", padding: 14, width: 252,
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
                textAlign: "center", fontSize: 12, padding: "5px 0", borderRadius: 6, cursor: d ? "pointer" : "default",
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

/* ── Modal ── */
function Modal({ title, onClose, children }) {
  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(30,10,0,0.5)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#FFFAF4", border: "1px solid #E0C8B0", borderRadius: 20,
        width: "100%", maxWidth: 380, boxShadow: "0 24px 48px rgba(100,40,0,0.22)",
        padding: "1.6rem",
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

/* ── Field ── */
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
      outline: "none", boxSizing: "border-box", transition: "border-color 0.14s",
      ...props.style,
    }}
      onFocus={e => e.target.style.borderColor = "#8B4513"}
      onBlur={e => e.target.style.borderColor = "#E0C8B0"}
    />
  );
}

/* ── Stat Card ── */
function StatCard({ icon, label, value, sub, color = "#8B4513", bg = "#FFF0E0" }) {
  return (
    <div style={{ background: "#FFFAF4", border: "1px solid #EED8BC", borderRadius: 13, padding: "1rem 1.1rem" }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, marginBottom: 9 }}>{icon}</div>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#9B7B5E", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#B09070", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

/* ── Progress bar ── */
function Bar({ pct, color = "#8B4513" }) {
  return (
    <div style={{ width: "100%", height: 5, background: "#F0E0CC", borderRadius: 6, overflow: "hidden" }}>
      <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: color, borderRadius: 6, transition: "width 0.5s ease" }} />
    </div>
  );
}

/* ── Toast ── */
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

/* ═══════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════ */
export default function App() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [busyId, setBusyId] = useState(null);

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

  /* list filters */
  const [filterDate, setFilterDate] = useState(isoToday());
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
    } catch (e) { notify("Failed to load data", "error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── Derived: today entries ── */
  const todayEntries = entries.filter(e => (e.date || today).split("T")[0] === today);

  /* ── Derived: per-person all-time ── */
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

  /* ── Today stats ── */
  let tTea = 0, tCoffee = 0, tAmt = 0, tPaid = 0, tPeople = new Set();
  todayEntries.forEach(e => {
    const amt = e.teaCount * getPrice(e.drinkType || "tea");
    if (e.drinkType === "coffee") tCoffee += e.teaCount;
    else tTea += e.teaCount;
    tAmt += amt;
    if (e.paid) tPaid += amt;
    tPeople.add(normalizeName(e.name));
  });
  const tPending = tAmt - tPaid;

  /* ── All-time stats ── */
  let allAmt = 0, allPaid = 0;
  entries.forEach(e => {
    const amt = e.teaCount * getPrice(e.drinkType || "tea");
    allAmt += amt;
    if (e.paid) allPaid += amt;
  });

  /* ── Duplicate check ── */
  const isDuplicate = (name, drink, forDate, excludeId = null) => {
    const d = forDate.split("T")[0];
    return entries.some(e =>
      normalizeName(e.name) === normalizeName(name) &&
      (e.drinkType || "tea") === drink &&
      (e.date || today).split("T")[0] === d &&
      e._id !== excludeId
    );
  };

  /* ── Add ── */
  const handleAdd = async () => {
    if (!addName.trim() || Number(addCount) < 1) return notify("Fill all fields correctly", "error");
    if (isDuplicate(addName, addDrink, addDate)) return notify(`${addName.trim()} already has a ${addDrink} entry on this date`, "error");
    setAddSaving(true);
    try {
      const res = await fetch(`${API}/tea`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: addName.trim(), teaCount: Number(addCount), drinkType: addDrink, date: addDate }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed"); }
      notify("Entry added");
      setShowAdd(false); setAddName(""); setAddCount("1"); setAddDrink("tea"); setAddDate(today);
      fetchData();
    } catch (e) { notify(e.message, "error"); }
    finally { setAddSaving(false); }
  };

  /* ── Edit ── */
  const openEdit = (entry) => {
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
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim(), teaCount: Number(editCount), drinkType: editDrink }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed"); }
      notify("Entry updated");
      setShowEdit(false); setEditEntry(null);
      fetchData();
    } catch (e) { notify(e.message, "error"); }
    finally { setEditSaving(false); }
  };

  /* ── Delete ── */
  const handleDelete = async (id) => {
    if (!window.confirm("Remove this entry?")) return;
    setBusyId(id);
    try {
      await fetch(`${API}/tea/${id}`, { method: "DELETE" });
      notify("Entry removed");
      fetchData();
    } catch { notify("Delete failed", "error"); }
    finally { setBusyId(null); }
  };

  /* ── Toggle payment ── */
  const togglePay = async (entry) => {
    setBusyId(entry._id);
    try {
      const res = await fetch(`${API}/tea/${entry._id}/pay`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paid: !entry.paid }),
      });
      if (!res.ok) throw new Error("Failed");
      notify(entry.paid ? "Marked unpaid" : "Marked as paid");
      fetchData();
    } catch { notify("Update failed", "error"); }
    finally { setBusyId(null); }
  };

  /* ── Adjust cups ── */
  const adjustCups = async (entry, delta) => {
    const newCount = entry.teaCount + delta;
    if (newCount < 1) return;
    setBusyId(entry._id + delta);
    try {
      await fetch(`${API}/tea/${entry._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: entry.name, teaCount: newCount, drinkType: entry.drinkType || "tea" }),
      });
      fetchData();
    } catch { notify("Update failed", "error"); }
    finally { setBusyId(null); }
  };

  /* ── Filtered entries for list tab ── */
  const filteredEntries = entries
    .filter(e => (e.date || today).split("T")[0] === filterDate)
    .filter(e => !filterUser || normalizeName(e.name).includes(normalizeName(filterUser)))
    .filter(e => filterDrink === "all" || (e.drinkType || "tea") === filterDrink)
    .filter(e => filterPaid === "all" || (filterPaid === "paid" ? e.paid : !e.paid))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalPages = Math.ceil(filteredEntries.length / PAGE_SIZE);
  const pagedEntries = filteredEntries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* ── Person detail entries ── */
  const personEntries = detailPerson
    ? entries.filter(e => normalizeName(e.name) === normalizeName(detailPerson))
    : [];

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=Nunito:wght@400;500;600;700&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #FBF4EC; font-family: 'Nunito', sans-serif; color: #2D1000; }
    ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-track { background: #F5EDE2; } ::-webkit-scrollbar-thumb { background: #D0A87A; border-radius: 10px; }
    @keyframes slideUp { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .layout { display: flex; min-height: 100vh; }
    .sidebar { width: 240px; background: #3A1800; display: flex; flex-direction: column; position: fixed; top:0; left:0; bottom:0; z-index:100; transition: transform 0.22s ease; }
    .sidebar-logo { padding: 1.6rem 1.3rem 1.2rem; border-bottom: 1px solid rgba(255,255,255,0.08); }
    .sidebar-logo h1 { font-family: 'Lora', serif; font-size: 18px; color: #F5C07A; line-height: 1.2; }
    .sidebar-logo span { font-size: 11px; color: rgba(245,192,122,0.5); display: block; margin-top: 3px; }
    .nav { padding: 0.8rem; flex: 1; }
    .nav-sep { font-size: 9.5px; font-weight: 700; color: rgba(245,192,122,0.35); text-transform: uppercase; letter-spacing: 1.5px; padding: 10px 10px 5px; }
    .nav-btn { display: flex; align-items: center; gap: 10px; width: 100%; padding: 9px 12px; border: none; background: transparent; color: rgba(255,255,255,0.55); font-family: inherit; font-size: 13.5px; font-weight: 500; border-radius: 9px; cursor: pointer; text-align: left; transition: 0.13s; margin-bottom: 2px; }
    .nav-btn:hover { background: rgba(255,255,255,0.07); color: #F5C07A; }
    .nav-btn.active { background: rgba(245,192,122,0.15); color: #F5C07A; font-weight: 700; }
    .nav-icon { width: 18px; text-align: center; }
    .sidebar-foot { padding: 1rem 1.3rem; border-top: 1px solid rgba(255,255,255,0.08); font-size: 11px; color: rgba(255,255,255,0.3); }
    .main { margin-left: 240px; flex: 1; min-height: 100vh; padding: 2rem 2rem 3rem; max-width: calc(100vw - 240px); }
    .page-header { border-bottom: 1px solid #E8D2B8; padding-bottom: 1.2rem; margin-bottom: 1.8rem; display: flex; align-items: flex-end; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
    .page-title { font-family: 'Lora', serif; font-size: 27px; color: #5C2E0A; line-height: 1.1; }
    .page-sub { font-size: 12.5px; color: #9B7B5E; margin-top: 3px; }
    .stats-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 11px; margin-bottom: 1.5rem; }
    .card { background: #FFFAF4; border: 1px solid #EED8BC; border-radius: 14px; }
    .card-head { padding: 0.85rem 1.3rem; border-bottom: 1px solid #EED8BC; display: flex; justify-content: space-between; align-items: center; }
    .card-title { font-size: 10.5px; font-weight: 700; color: #9B7B5E; text-transform: uppercase; letter-spacing: 0.7px; }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { padding: 9px 13px; text-align: left; font-size: 10px; font-weight: 700; color: #9B7B5E; text-transform: uppercase; letter-spacing: 0.7px; border-bottom: 1px solid #EED8BC; background: #FDF5EC; }
    td { padding: 11px 13px; border-bottom: 1px solid rgba(200,150,90,0.1); vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #FDF5EC; }
    .btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; border: none; border-radius: 8px; padding: 7px 14px; font-family: inherit; font-size: 13px; font-weight: 600; cursor: pointer; transition: 0.13s; white-space: nowrap; }
    .btn-primary { background: #8B4513; color: white; }
    .btn-primary:hover { background: #6B3410; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-ghost { background: #F5EDE2; color: #8B4513; }
    .btn-ghost:hover { background: #EAD9C4; }
    .btn-danger { background: #FDECEA; color: #A0152A; }
    .btn-danger:hover { background: #F9D0CE; }
    .btn-sm { padding: 4px 10px; font-size: 12px; border-radius: 6px; }
    .icon-btn { width: 26px; height: 26px; padding: 0; border-radius: 7px; font-size: 14px; }
    .filter-bar { background: #FFFAF4; border: 1px solid #EED8BC; border-radius: 13px; padding: 0.8rem 1.3rem; margin-bottom: 1.3rem; display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
    .filter-label { font-size: 11.5px; font-weight: 600; color: #9B7B5E; }
    select.filter-select { background: #F5EDE2; border: 1.5px solid #E0C8B0; border-radius: 8px; padding: 6px 10px; font-family: inherit; font-size: 13px; color: #4A2C0E; cursor: pointer; outline: none; }
    input.filter-input { background: #F5EDE2; border: 1.5px solid #E0C8B0; border-radius: 8px; padding: 6px 12px; font-family: inherit; font-size: 13px; color: #4A2C0E; outline: none; width: 160px; }
    input.filter-input:focus { border-color: #8B4513; }
    .pill { background: #F5EDE2; color: #8B4513; font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 20px; }
    .price-strip { display: flex; gap: 10px; margin-bottom: 1.4rem; flex-wrap: wrap; }
    .price-chip { background: #FFFAF4; border: 1.5px solid #E0C8B0; border-radius: 10px; padding: 7px 14px; font-size: 12.5px; color: #6B4020; font-weight: 500; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 14px; }
    .person-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px,1fr)); gap: 10px; padding: 1.1rem 1.3rem; }
    .person-mini { background: #FFF6EC; border: 1px solid #E8D2B8; border-radius: 12px; padding: 0.85rem; cursor: pointer; transition: 0.15s; }
    .person-mini:hover { border-color: #C08040; background: #FFF0DC; }
    .spinner { width: 24px; height: 24px; border: 2px solid #E0C8B0; border-top-color: #8B4513; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .center { display: flex; justify-content: center; align-items: center; }
    .empty { text-align: center; padding: 2.5rem; color: #B09070; font-size: 13.5px; }
    .mob-toggle { display: none; position: fixed; top: 12px; left: 12px; z-index: 200; background: #3A1800; color: #F5C07A; border: none; width: 38px; height: 38px; border-radius: 10px; font-size: 18px; cursor: pointer; align-items: center; justify-content: center; }
    .overlay-bg { display: none; position: fixed; inset: 0; background: rgba(30,8,0,0.4); z-index: 99; }
    @media (max-width: 1100px) { .stats-grid { grid-template-columns: repeat(3,1fr); } }
    @media (max-width: 900px) { .two-col { grid-template-columns: 1fr; } }
    @media (max-width: 700px) {
      .sidebar { transform: translateX(-100%); }
      .sidebar.open { transform: none; box-shadow: 4px 0 30px rgba(0,0,0,0.2); }
      .main { margin-left: 0; padding: 3.5rem 1rem 3rem; max-width: 100vw; }
      .stats-grid { grid-template-columns: repeat(2,1fr); }
      .mob-toggle { display: flex; }
      .overlay-bg.show { display: block; }
    }
  `;

  const navItems = [
    { id: "dashboard", icon: "🏠", label: "Dashboard" },
    { id: "entries", icon: "📋", label: "Entries" },
    { id: "people", icon: "👥", label: "People" },
  ];

  /* ═══════════ RENDER ═══════════ */
  return (
    <>
      <style>{CSS}</style>
      <div className="layout">
        {/* overlay */}
        <div className={`overlay-bg ${sidebarOpen ? "show" : ""}`} onClick={() => setSidebarOpen(false)} />

        {/* mobile toggle */}
        <button className="mob-toggle" onClick={() => setSidebarOpen(o => !o)}>☰</button>

        {/* SIDEBAR */}
        <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="sidebar-logo">
            <h1>☕ Amenities Tracker</h1>
            <span>Tea & Coffee</span>
          </div>
          <nav className="nav">
            <div className="nav-sep">Menu</div>
            {navItems.map(n => (
              <button key={n.id} className={`nav-btn ${tab === n.id ? "active" : ""}`}
                onClick={() => { setTab(n.id); setSidebarOpen(false); }}>
                <span className="nav-icon">{n.icon}</span> {n.label}
              </button>
            ))}
          </nav>
          <div className="sidebar-foot">
            <div style={{ marginBottom: 3, color: "#F5C07A", fontWeight: 600, fontSize: 12 }}>{fmtDate(today + "T00:00:00")}</div>
            {entries.length} total records
          </div>
        </aside>

        {/* MAIN */}
        <main className="main">

          {/* ─────────────── DASHBOARD ─────────────── */}
          {tab === "dashboard" && (
            <>
              <div className="page-header">
                <div>
                  <div className="page-title">Dashboard</div>
                  <div className="page-sub">Today — {fmtDate(today + "T00:00:00")}</div>
                </div>
                <button className="btn btn-primary" onClick={() => { setAddDate(today); setShowAdd(true); }}>
                  + Add Entry
                </button>
              </div>

              <div className="price-strip">
                <div className="price-chip">☕ Tea — <strong>₹{TEA_PRICE}/cup</strong></div>
                <div className="price-chip">☕ Coffee — <strong>₹{COFFEE_PRICE}/cup</strong></div>
              </div>

              {/* Today stats */}
              <div style={{ fontSize: 11, fontWeight: 700, color: "#9B7B5E", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 10 }}>Today</div>
              <div className="stats-grid">
                <StatCard icon="☕" label="Teas" value={tTea} bg="#FFF0E0" color="#8B4513" />
                <StatCard icon="☕" label="Coffees" value={tCoffee} bg="#2D1A0E" color="#CC8040" />
                <StatCard icon="💰" label="Expense" value={formatINR(tAmt)} bg="#E8F5EE" color="#1A6B36" />
                <StatCard icon="✅" label="Paid" value={formatINR(tPaid)} bg="#E8F5EE" color="#1A6B36" />
                <StatCard icon="⏳" label="Pending" value={formatINR(tPending)} bg="#FFF3E0" color="#CC5500" />
                <StatCard icon="👥" label="People" value={tPeople.size} bg="#E6F1FB" color="#1A5E9B" />
              </div>

              {/* All-time stats */}
              <div style={{ fontSize: 11, fontWeight: 700, color: "#9B7B5E", textTransform: "uppercase", letterSpacing: "0.8px", margin: "1.5rem 0 10px" }}>All-time</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 11, marginBottom: "1.5rem" }}>
                <StatCard icon="📊" label="Total Expense" value={formatINR(allAmt)} color="#5C2E0A" />
                <StatCard icon="💳" label="Total Collected" value={formatINR(allPaid)} bg="#E8F5EE" color="#1A6B36" />
                <StatCard icon="⏳" label="Total Pending" value={formatINR(allAmt - allPaid)} bg="#FFF3E0" color="#CC5500" />
              </div>

              {/* Today entries table */}
              <div className="card" style={{ marginBottom: 14 }}>
                <div className="card-head">
                  <span className="card-title">Today's Entries</span>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span className="pill">{todayEntries.length}</span>
                    <button className="btn btn-primary btn-sm" onClick={() => { setAddDate(today); setShowAdd(true); }}>+ Add</button>
                  </div>
                </div>
                <div className="table-wrap">
                  {loading ? (
                    <div className="center" style={{ padding: "2rem" }}><div className="spinner" /></div>
                  ) : todayEntries.length === 0 ? (
                    <div className="empty">No entries today yet. Add the first one!</div>
                  ) : (
                    <table>
                      <thead><tr><th>Name</th><th>Type</th><th>Cups</th><th>Amount</th><th>Adjust</th><th>Payment</th><th>Actions</th></tr></thead>
                      <tbody>
                        {todayEntries.map(e => {
                          const amt = e.teaCount * getPrice(e.drinkType || "tea");
                          return (
                            <tr key={e._id}>
                              <td>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <Avatar name={e.name} size={30} />
                                  <button onClick={() => { setDetailPerson(e.name); setTab("people"); }}
                                    style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 600, color: "#4A2C0E", fontFamily: "inherit", fontSize: 13, padding: 0 }}>
                                    {e.name}
                                  </button>
                                </div>
                              </td>
                              <td><DrinkBadge type={e.drinkType || "tea"} /></td>
                              <td><span className="pill">{e.teaCount} cups</span></td>
                              <td style={{ fontWeight: 700, color: "#8B4513" }}>{formatINR(amt)}</td>
                              <td>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <button className="btn btn-ghost icon-btn btn-sm" onClick={() => adjustCups(e, -1)} disabled={e.teaCount <= 1 || busyId === e._id + (-1)}>−</button>
                                  <span style={{ minWidth: 20, textAlign: "center", fontWeight: 600 }}>{e.teaCount}</span>
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
              </div>

              {/* Trends + Summary */}
              <div className="two-col">
                <div className="card" style={{ padding: "1.1rem 1.3rem" }}>
                  <div className="card-title" style={{ marginBottom: "0.9rem" }}>Spending trends (all-time)</div>
                  {allPersons.length === 0 ? <div className="empty" style={{ padding: "1rem" }}>No data</div> : (
                    <>
                      {allPersons[0] && (
                        <div style={{ background: "#FFF0DC", border: "1px solid #E8C49A", borderRadius: 10, padding: "9px 12px", marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 18 }}>🏆</span>
                          <div>
                            <div style={{ fontSize: 10, color: "#9B7B5E", fontWeight: 600 }}>Top spender</div>
                            <div style={{ fontSize: 13.5, fontWeight: 700, color: "#5C2E0A" }}>{allPersons[0].name} · {formatINR(allPersons[0].amount)}</div>
                          </div>
                        </div>
                      )}
                      {allPersons.slice(0, 7).map(p => (
                        <div key={p.name} style={{ marginBottom: 11 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 12.5 }}>
                            <span style={{ fontWeight: 500 }}>{p.name}</span>
                            <span style={{ color: "#9B7B5E" }}>{formatINR(p.amount)} · {p.tea + p.coffee} cups</span>
                          </div>
                          <Bar pct={(p.amount / (allPersons[0]?.amount || 1)) * 100} />
                        </div>
                      ))}
                    </>
                  )}
                </div>

                <div className="card" style={{ padding: "1.1rem 1.3rem" }}>
                  <div className="card-title" style={{ marginBottom: "0.9rem" }}>Today's person summary</div>
                  {Object.keys(allPersonMap).length === 0 ? <div className="empty" style={{ padding: "1rem" }}>No data yet</div> : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px,1fr))", gap: 9 }}>
                      {(() => {
                        const todayPersonMap = {};
                        todayEntries.forEach(e => {
                          const k = normalizeName(e.name);
                          if (!todayPersonMap[k]) todayPersonMap[k] = { name: e.name, tea: 0, coffee: 0, amount: 0, paid: 0 };
                          const amt = e.teaCount * getPrice(e.drinkType || "tea");
                          if (e.drinkType === "coffee") todayPersonMap[k].coffee += e.teaCount;
                          else todayPersonMap[k].tea += e.teaCount;
                          todayPersonMap[k].amount += amt;
                          if (e.paid) todayPersonMap[k].paid += amt;
                        });
                        return Object.values(todayPersonMap).map(p => (
                          <div key={p.name} style={{ background: "#FFF6EC", border: "1px solid #E8D2B8", borderRadius: 11, padding: "0.8rem" }}>
                            <div style={{ fontWeight: 700, fontSize: 13, color: "#2D1000" }}>{p.name}</div>
                            <div style={{ fontSize: 11, color: "#9B7B5E", marginTop: 2 }}>
                              {p.tea > 0 && `${p.tea}T`} {p.coffee > 0 && `${p.coffee}C`}
                            </div>
                            <div style={{ fontSize: 19, fontWeight: 700, color: "#8B4513", marginTop: 7, borderTop: "1px solid #E8D2B8", paddingTop: 6 }}>
                              {formatINR(p.amount)}
                            </div>
                            <div style={{ fontSize: 10.5, color: p.paid < p.amount ? "#CC5500" : "#1A6B36", marginTop: 2, fontWeight: 600 }}>
                              {p.paid < p.amount ? `⏳ ${formatINR(p.amount - p.paid)} due` : "✓ All paid"}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ─────────────── ENTRIES ─────────────── */}
          {tab === "entries" && (
            <>
              <div className="page-header">
                <div>
                  <div className="page-title">Entry List</div>
                  <div className="page-sub">Filter, view and manage all records</div>
                </div>
                <button className="btn btn-primary" onClick={() => { setAddDate(filterDate); setShowAdd(true); }}>+ Add Entry</button>
              </div>

              <div className="filter-bar">
                <span className="filter-label">Date:</span>
                <DatePicker value={filterDate} onChange={(d) => { setFilterDate(d); setPage(1); }} />
                <span className="filter-label">Person:</span>
                <input className="filter-input" placeholder="Search name…" value={filterUser} onChange={e => { setFilterUser(e.target.value); setPage(1); }} />
                <span className="filter-label">Drink:</span>
                <select className="filter-select" value={filterDrink} onChange={e => { setFilterDrink(e.target.value); setPage(1); }}>
                  <option value="all">All</option>
                  <option value="tea">Tea</option>
                  <option value="coffee">Coffee</option>
                </select>
                <span className="filter-label">Status:</span>
                <select className="filter-select" value={filterPaid} onChange={e => { setFilterPaid(e.target.value); setPage(1); }}>
                  <option value="all">All</option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                </select>
                <span className="pill">{filteredEntries.length} results</span>
                {(filterUser || filterDrink !== "all" || filterPaid !== "all") && (
                  <button className="btn btn-ghost btn-sm" onClick={() => { setFilterUser(""); setFilterDrink("all"); setFilterPaid("all"); setPage(1); }}>Clear filters</button>
                )}
              </div>

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
                                    <Avatar name={e.name} size={28} />
                                    <span style={{ fontWeight: 500 }}>{e.name}</span>
                                  </div>
                                </td>
                                <td><DrinkBadge type={e.drinkType || "tea"} /></td>
                                <td style={{ color: "#9B7B5E", fontSize: 12.5 }}>{fmtDate(e.date || today)}</td>
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

          {/* ─────────────── PEOPLE ─────────────── */}
          {tab === "people" && (
            <>
              <div className="page-header">
                <div>
                  <div className="page-title">{detailPerson ? detailPerson : "People"}</div>
                  <div className="page-sub">{detailPerson ? "Individual record" : "All-time per-person summary"}</div>
                </div>
                {detailPerson && (
                  <button className="btn btn-ghost" onClick={() => setDetailPerson(null)}>← All people</button>
                )}
              </div>

              {!detailPerson ? (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px,1fr))", gap: 11, marginBottom: "1.4rem" }}>
                    {allPersons.map(p => (
                      <div key={p.name} className="person-mini" onClick={() => setDetailPerson(p.name)}>
                        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8 }}>
                          <Avatar name={p.name} size={34} />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13, color: "#2D1000" }}>{p.name}</div>
                            <div style={{ fontSize: 11, color: "#9B7B5E" }}>{p.tea + p.coffee} total cups</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>
                          {p.tea > 0 && <span className="pill" style={{ fontSize: 10.5 }}>☕ {p.tea}</span>}
                          {p.coffee > 0 && <span style={{ background: "#2D1A0E", color: "#F5C07A", borderRadius: 20, padding: "3px 9px", fontSize: 10.5, fontWeight: 600 }}>☕ {p.coffee}</span>}
                        </div>
                        <div style={{ borderTop: "1px solid #E8D2B8", paddingTop: 8 }}>
                          <div style={{ fontSize: 18, fontWeight: 700, color: "#8B4513" }}>{formatINR(p.amount)}</div>
                          <div style={{ fontSize: 11, marginTop: 2, color: p.paid < p.amount ? "#CC5500" : "#1A6B36", fontWeight: 600 }}>
                            {p.paid < p.amount ? `${formatINR(p.amount - p.paid)} pending` : "Fully paid"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {allPersons.length === 0 && <div className="card"><div className="empty">No people yet. Add entries to see data here.</div></div>}
                </>
              ) : (
                /* ── Person detail ── */
                (() => {
                  const pd = allPersonMap[normalizeName(detailPerson)];
                  if (!pd) return <div className="empty">No data found.</div>;
                  const pending = pd.amount - pd.paid;
                  return (
                    <>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px,1fr))", gap: 11, marginBottom: "1.5rem" }}>
                        <StatCard icon="☕" label="Tea cups" value={pd.tea} />
                        <StatCard icon="☕" label="Coffee cups" value={pd.coffee} color="#CC8040" />
                        <StatCard icon="💰" label="Total spent" value={formatINR(pd.amount)} color="#5C2E0A" />
                        <StatCard icon="✅" label="Paid" value={formatINR(pd.paid)} bg="#E8F5EE" color="#1A6B36" />
                        <StatCard icon="⏳" label="Pending" value={formatINR(pending)} bg="#FFF3E0" color="#CC5500" />
                      </div>
                      {pending > 0 && (
                        <div style={{ background: "#FFF3E0", border: "1px solid #FBBF88", borderRadius: 12, padding: "10px 16px", marginBottom: "1.3rem", display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, color: "#8B3500" }}>
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
                            <thead><tr><th>Date</th><th>Type</th><th>Cups</th><th>Amount</th><th>Status</th><th>Toggle</th></tr></thead>
                            <tbody>
                              {personEntries.sort((a, b) => new Date(b.date) - new Date(a.date)).map(e => {
                                const amt = e.teaCount * getPrice(e.drinkType || "tea");
                                return (
                                  <tr key={e._id}>
                                    <td style={{ color: "#9B7B5E", fontSize: 12.5 }}>{fmtDate(e.date || today)}</td>
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
                })()
              )}
            </>
          )}
        </main>
      </div>

      {/* ── ADD MODAL ── */}
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
              Amount: <strong>{formatINR(Number(addCount) * getPrice(addDrink))}</strong> · {addDrink === "coffee" ? "Coffee" : "Tea"} @ {formatINR(getPrice(addDrink))}/cup
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

      {/* ── EDIT MODAL ── */}
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

      {/* ── TOAST ── */}
      {toast && <Toast key={toast.key} msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </>
  );
}