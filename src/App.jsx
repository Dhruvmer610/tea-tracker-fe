import { useEffect, useState, useCallback, useRef } from "react";
import {
  LayoutDashboard, Calendar, ListChecks, Users, Plus, X, ChevronLeft, ChevronRight,
  Edit3, Trash2, Check, Clock, Search, Filter, TrendingUp, Trophy, Coffee,
  Wallet, CheckCircle2, AlertCircle, FileText, Sun, Menu, ChevronDown,
  Save, Info, ArrowLeft, CalendarDays, DollarSign, UserCircle, BarChart3,
  Award, Sparkles, Eye,
  Minus, History,
} from "lucide-react";

const API = "https://tea-tracker-be.onrender.com/api";
const TEA_PRICE = 10;
const COFFEE_PRICE = 20;
const PAGE_SIZE = 10;
const SIDEBAR_W = 260;
const COLLAPSED_W = 72;

function getInitials(name) {
  return name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();
}
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function isoToday() {
  return new Date().toISOString().split("T")[0];
}
function isoYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
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
  ["#DBEAFE", "#1E40AF"], ["#D1FAE5", "#065F46"], ["#FEE2E2", "#991B1B"],
  ["#E0E7FF", "#3730A3"], ["#FCE7F3", "#9D174D"], ["#FEF3C7", "#92400E"],
  ["#CFFAFE", "#155E75"], ["#EDE9FE", "#5B21B6"], ["#FFE4E6", "#9F1239"],
  ["#ECFDF5", "#047857"],
];
function avatarColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[Math.abs(h)];
}

function Avatar({ name, size = 36 }) {
  const [bg, fg] = avatarColor(name);
  return (
    <div style={{
      width: size, height: size, borderRadius: 12,
      background: `linear-gradient(135deg, ${bg}, ${bg}dd)`,
      color: fg, display: "flex", alignItems: "center",
      justifyContent: "center", fontSize: size * 0.34, fontWeight: 800,
      flexShrink: 0, letterSpacing: "0.03em",
      boxShadow: `0 2px 8px ${bg}80`,
    }}>
      {getInitials(name)}
    </div>
  );
}

function DrinkBadge({ type }) {
  const isCoffee = type === "coffee";
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8,
      background: isCoffee ? "linear-gradient(135deg, #1C1917, #292524)" : "linear-gradient(135deg, #FEF3C7, #FDE68A)",
      color: isCoffee ? "#FBBF24" : "#92400E",
      display: "inline-flex", alignItems: "center", gap: 5,
      letterSpacing: "0.02em",
    }}>
      <Coffee size={11} strokeWidth={2.5} />
      {isCoffee ? "Coffee" : "Tea"}
    </span>
  );
}

function PayBadge({ paid }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8,
      background: paid ? "linear-gradient(135deg, #D1FAE5, #A7F3D0)" : "linear-gradient(135deg, #FEF3C7, #FDE68A)",
      color: paid ? "#065F46" : "#92400E",
      display: "inline-flex", alignItems: "center", gap: 5,
    }}>
      {paid ? <Check size={11} strokeWidth={3} /> : <Clock size={11} strokeWidth={2.5} />}
      {paid ? "Paid" : "Pending"}
    </span>
  );
}

function DrinkToggle({ value, onChange }) {
  return (
    <div style={{
      display: "flex", background: "#F3F4F6", borderRadius: 14, padding: 4, gap: 4,
      border: "1px solid #E5E7EB",
    }}>
      {["tea", "coffee"].map(t => (
        <button key={t} onClick={() => onChange(t)} style={{
          flex: 1, border: "none", borderRadius: 11, padding: "10px 0",
          cursor: "pointer", fontSize: 13.5, fontWeight: 700, fontFamily: "inherit",
          transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
          background: value === t
            ? (t === "tea" ? "linear-gradient(135deg, #F59E0B, #D97706)" : "linear-gradient(135deg, #1C1917, #44403C)")
            : "transparent",
          color: value === t ? "white" : "#9CA3AF",
          boxShadow: value === t ? "0 4px 12px rgba(0,0,0,0.15)" : "none",
          transform: value === t ? "scale(1.02)" : "scale(1)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}>
          <Coffee size={14} strokeWidth={2.5} />
          {t === "tea" ? "Tea" : "Coffee"}
        </button>
      ))}
    </div>
  );
}

const MONTHS_FULL = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function DatePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [vy, setVy] = useState(() => new Date(value || isoToday()).getFullYear());
  const [vm, setVm] = useState(() => new Date(value || isoToday()).getMonth());
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef();
  const popupRef = useRef();

  const updatePosition = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const popupHeight = 340;
    const popupWidth = 280;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    let top, left = rect.left;
    if (spaceBelow >= popupHeight + 12 || spaceBelow > spaceAbove) {
      top = rect.bottom + 8;
    } else {
      top = rect.top - popupHeight - 8;
    }
    if (left + popupWidth > window.innerWidth - 12) left = window.innerWidth - popupWidth - 12;
    if (left < 12) left = 12;
    setPos({ top: Math.max(12, top), left });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const h = e => {
      if (
        btnRef.current && !btnRef.current.contains(e.target) &&
        popupRef.current && !popupRef.current.contains(e.target)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

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
    <>
      <button ref={btnRef} onClick={() => setOpen(o => !o)} style={{
        display: "flex", alignItems: "center", gap: 8, background: "white",
        border: "1.5px solid #E5E7EB", borderRadius: 12, padding: "9px 14px",
        cursor: "pointer", fontFamily: "inherit", fontSize: 13.5, color: "#1F2937",
        minWidth: 170, transition: "all 0.2s",
        boxShadow: open ? "0 0 0 3px rgba(245,158,11,0.15)" : "0 1px 3px rgba(0,0,0,0.06)",
        borderColor: open ? "#F59E0B" : "#E5E7EB", fontWeight: 600,
      }}>
        <CalendarDays size={16} strokeWidth={2.2} color="#F59E0B" />
        <span>{value ? fmtDate(value + "T00:00:00") : "Pick a date"}</span>
        <ChevronDown size={14} strokeWidth={2.5} color="#9CA3AF"
          style={{ marginLeft: "auto", transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "none" }} />
      </button>

      {open && (
        <div ref={popupRef} style={{
          position: "fixed", top: pos.top, left: pos.left, zIndex: 99999,
          background: "white", border: "1px solid #E5E7EB", borderRadius: 16,
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)", padding: 16, width: 280,
          animation: "calendarIn 0.2s ease",
        }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
            <button onClick={prevM} style={{
              background: "#F3F4F6", border: "none", color: "#374151",
              width: 32, height: 32, borderRadius: 10, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}><ChevronLeft size={18} strokeWidth={2.5} /></button>
            <span style={{ flex: 1, textAlign: "center", fontWeight: 800, fontSize: 14, color: "#1F2937" }}>
              {MONTHS_FULL[vm]} {vy}
            </span>
            <button onClick={nextM} style={{
              background: "#F3F4F6", border: "none", color: "#374151",
              width: 32, height: 32, borderRadius: 10, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}><ChevronRight size={18} strokeWidth={2.5} /></button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 6 }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 800, color: "#9CA3AF", padding: "4px 0" }}>{d}</div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
            {cells.map((d, i) => (
              <div key={i} onClick={() => pick(d)} style={{
                textAlign: "center", fontSize: 13, padding: "7px 0", borderRadius: 10,
                cursor: d ? "pointer" : "default",
                background: isSel(d) ? "linear-gradient(135deg, #F59E0B, #D97706)" : isTod(d) ? "#FEF3C7" : "transparent",
                color: isSel(d) ? "white" : isTod(d) ? "#92400E" : d ? "#1F2937" : "transparent",
                fontWeight: isSel(d) || isTod(d) ? 800 : 500, transition: "all 0.15s",
              }}
                onMouseEnter={e => { if (d && !isSel(d)) e.currentTarget.style.background = "#F3F4F6"; }}
                onMouseLeave={e => {
                  if (d && !isSel(d) && !isTod(d)) e.currentTarget.style.background = "transparent";
                  else if (isTod(d) && !isSel(d)) e.currentTarget.style.background = "#FEF3C7";
                }}
              >{d || ""}</div>
            ))}
          </div>
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #F3F4F6", display: "flex", justifyContent: "space-between", gap: 8 }}>
            <button onClick={() => { onChange(isoYesterday()); setOpen(false); const y = new Date(); y.setDate(y.getDate()-1); setVm(y.getMonth()); setVy(y.getFullYear()); }}
              style={{
                background: "#F3F4F6", color: "#374151",
                border: "none", borderRadius: 10, padding: "6px 12px",
                fontSize: 12, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 5,
              }}>
              <History size={12} strokeWidth={2.5} /> Yesterday
            </button>
            <button onClick={() => { onChange(isoToday()); setOpen(false); setVm(new Date().getMonth()); setVy(new Date().getFullYear()); }}
              style={{
                background: "linear-gradient(135deg, #F59E0B, #D97706)", color: "white",
                border: "none", borderRadius: 10, padding: "6px 16px",
                fontSize: 12, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 5,
              }}>
              <Sun size={12} strokeWidth={2.5} /> Today
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function Modal({ title, onClose, children, width = 460, accent = false }) {
  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", h); document.body.style.overflow = ""; };
  }, [onClose]);
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      backdropFilter: "blur(4px)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 5000, padding: 16,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "white", borderRadius: 24, width: "100%", maxWidth: width,
        boxShadow: "0 32px 80px rgba(0,0,0,0.2)",
        padding: 0, animation: "modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1)",
        maxHeight: "90vh", display: "flex", flexDirection: "column",
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "18px 22px", borderBottom: "1px solid #F3F4F6",
          background: accent
            ? "linear-gradient(135deg, #EFF6FF, #DBEAFE)"
            : "linear-gradient(135deg, #FFFBEB, #FEF3C7)",
          borderRadius: "24px 24px 0 0", flexShrink: 0,
        }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: "#1F2937", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>{title}</h2>
          <button onClick={onClose} style={{
            background: "white", border: "none", width: 32, height: 32, borderRadius: 10,
            cursor: "pointer", color: "#6B7280", display: "flex",
            alignItems: "center", justifyContent: "center",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)", transition: "all 0.15s",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "#FEE2E2"; e.currentTarget.style.color = "#DC2626"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "white"; e.currentTarget.style.color = "#6B7280"; }}
          ><X size={18} strokeWidth={2.5} /></button>
        </div>
        <div style={{ padding: "20px 22px", overflowY: "auto", flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{
        display: "block", fontSize: 11.5, fontWeight: 800, color: "#6B7280",
        textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 7,
      }}>{label}</label>
      {children}
    </div>
  );
}

function Input({ ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <input {...props} style={{
      width: "100%", background: focused ? "white" : "#F9FAFB",
      border: `2px solid ${focused ? "#F59E0B" : "#E5E7EB"}`,
      borderRadius: 12, padding: "11px 14px", fontFamily: "inherit",
      fontSize: 14, color: "#1F2937", outline: "none", boxSizing: "border-box",
      transition: "all 0.2s", boxShadow: focused ? "0 0 0 3px rgba(245,158,11,0.12)" : "none",
      ...props.style,
    }}
      onFocus={e => { setFocused(true); props.onFocus?.(e); }}
      onBlur={e => { setFocused(false); props.onBlur?.(e); }}
    />
  );
}

function StatCard({ icon: Icon, label, value, sub, color = "#1F2937", accent = "#F59E0B" }) {
  return (
    <div style={{
      background: "white", borderRadius: 16, padding: "18px 20px",
      border: "1px solid #F3F4F6", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      transition: "all 0.2s", position: "relative", overflow: "hidden",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.08)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"; }}
    >
      <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: `${accent}08` }} />
      <div style={{ width: 40, height: 40, borderRadius: 12, background: `${accent}15`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, color: accent }}>
        <Icon size={20} strokeWidth={2.2} />
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11.5, color: "#9CA3AF", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function Bar({ pct, color = "#F59E0B" }) {
  return (
    <div style={{ width: "100%", height: 6, background: "#F3F4F6", borderRadius: 10, overflow: "hidden" }}>
      <div style={{
        width: `${Math.min(pct, 100)}%`, height: "100%",
        background: `linear-gradient(90deg, ${color}, ${color}cc)`,
        borderRadius: 10, transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
      }} />
    </div>
  );
}

function Toast({ msg, type = "success", onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  const configs = {
    success: { bg: "#ECFDF5", fg: "#065F46", border: "#A7F3D0", Icon: CheckCircle2 },
    error: { bg: "#FEF2F2", fg: "#991B1B", border: "#FECACA", Icon: AlertCircle },
    info: { bg: "#EFF6FF", fg: "#1E40AF", border: "#BFDBFE", Icon: Info },
  };
  const c = configs[type] || configs.info;
  const { Icon } = c;
  return (
    <div style={{
      position: "fixed", bottom: 28, right: 28, zIndex: 99999,
      background: c.bg, color: c.fg, border: `1.5px solid ${c.border}`,
      borderRadius: 16, padding: "14px 20px", fontSize: 14, fontWeight: 700,
      boxShadow: "0 12px 40px rgba(0,0,0,0.12)", maxWidth: 360,
      animation: "slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)",
      display: "flex", alignItems: "center", gap: 10,
    }}>
      <Icon size={20} strokeWidth={2.5} />
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
    <div ref={ref} style={{ position: "relative", display: "inline-block", minWidth: 130 }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
        width: "100%", background: "white", border: `2px solid ${open ? "#F59E0B" : "#E5E7EB"}`,
        borderRadius: 12, padding: "8px 14px", cursor: "pointer",
        fontFamily: "inherit", fontSize: 13, fontWeight: 700, color: "#1F2937",
        transition: "all 0.2s",
        boxShadow: open ? "0 0 0 3px rgba(245,158,11,0.12)" : "0 1px 3px rgba(0,0,0,0.04)",
      }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {current?.Icon && <current.Icon size={14} strokeWidth={2.2} color="#F59E0B" />}
          {current?.label}
        </span>
        <ChevronDown size={14} strokeWidth={2.5}
          style={{ color: "#9CA3AF", transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "none" }} />
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 1100,
          background: "white", border: "1px solid #E5E7EB", borderRadius: 14,
          boxShadow: "0 12px 40px rgba(0,0,0,0.12)", overflow: "hidden",
          minWidth: "100%", animation: "dropIn 0.15s ease",
        }}>
          {options.map(o => (
            <div key={o.value} onClick={() => { onChange(o.value); setOpen(false); }} style={{
              padding: "10px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600,
              color: o.value === value ? "#D97706" : "#374151",
              background: o.value === value ? "#FFFBEB" : "transparent",
              display: "flex", alignItems: "center", gap: 8,
              borderLeft: o.value === value ? "3px solid #F59E0B" : "3px solid transparent",
              transition: "all 0.12s",
            }}
              onMouseEnter={e => { if (o.value !== value) e.currentTarget.style.background = "#F9FAFB"; }}
              onMouseLeave={e => { if (o.value !== value) e.currentTarget.style.background = "transparent"; }}
            >
              {o.Icon && <o.Icon size={14} strokeWidth={2.2} />}
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TODAY ENTRIES TABLE
═══════════════════════════════════════════════════════════════ */
function TodayEntriesTable({
  entries: tableEntries,
  allPersons,
  loading, busyId, localAdjustments, onLocalAdjust,
  onTogglePay, onEdit, onDelete, emptyMsg, onNameClick,
  onDirectAdd,
  onDirectSave,
}) {
  if (loading) {
    return <div className="center" style={{ padding: "3rem" }}><div className="spinner" /></div>;
  }

  const todayMap = {};
  tableEntries.forEach(e => {
    todayMap[normalizeName(e.name)] = e;
  });

  const rows = allPersons.map(p => {
    const key = normalizeName(p.name);
    const entry = todayMap[key] || null;
    return { personName: p.name, entry, hasEntry: !!entry };
  });

  let grandTotal = 0;
  tableEntries.forEach(e => {
    const adj = localAdjustments[e._id] ?? e.teaCount;
    grandTotal += adj * getPrice(e.drinkType || "tea");
  });

  if (rows.length === 0) {
    return <div className="empty-state">{emptyMsg}</div>;
  }

  return (
    <>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Person</th>
              <th>Type</th>
              <th>Date</th>
              <th>Cups</th>
              <th>Amount</th>
              <th>Adjust</th>
              <th>Payment</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ personName, entry, hasEntry }) => {
              if (hasEntry) {
                const e = entry;
                const adjCount = localAdjustments[e._id] ?? e.teaCount;
                const amt = adjCount * getPrice(e.drinkType || "tea");
                const isModified = localAdjustments[e._id] !== undefined && localAdjustments[e._id] !== e.teaCount;

                return (
                  <tr key={e._id} style={{ background: isModified ? "#FFFBEB" : undefined }}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Avatar name={e.name} size={30} />
                        <button onClick={() => onNameClick?.(e.name)}
                          style={{
                            background: "none", border: "none", cursor: "pointer",
                            fontWeight: 700, color: "#1F2937", fontFamily: "inherit",
                            fontSize: 13.5, padding: 0,
                          }}>
                          {e.name}
                        </button>
                      </div>
                    </td>
                    <td><DrinkBadge type={e.drinkType || "tea"} /></td>
                    <td style={{ color: "#6B7280", fontSize: 12.5, fontWeight: 500 }}>
                      {fmtDate(e.date || isoToday())}
                    </td>
                    <td>
                      <span style={{
                        background: isModified ? "#FEF3C7" : "#F3F4F6",
                        color: isModified ? "#92400E" : "#374151",
                        padding: "4px 10px", borderRadius: 8, fontWeight: 800, fontSize: 12.5,
                        border: isModified ? "1.5px solid #FDE68A" : "1px solid #E5E7EB",
                        display: "inline-flex", alignItems: "center", gap: 4,
                      }}>
                        {adjCount}
                        {isModified && <Edit3 size={9} strokeWidth={3} />}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 800, color: "#D97706", fontSize: 14 }}>{formatINR(amt)}</span>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <button className="adj-btn" onClick={() => onLocalAdjust(e._id, -1)} disabled={adjCount <= 1}
                          style={{
                            width: 28, height: 28, borderRadius: 8, border: "1.5px solid #E5E7EB",
                            background: adjCount <= 1 ? "#F9FAFB" : "white",
                            color: adjCount <= 1 ? "#D1D5DB" : "#374151",
                            cursor: adjCount <= 1 ? "not-allowed" : "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontFamily: "inherit", transition: "all 0.15s",
                          }}><Minus size={12} /></button>
                        <span style={{ minWidth: 24, textAlign: "center", fontWeight: 800, fontSize: 14, color: "#1F2937" }}>
                          {adjCount}
                        </span>
                        <button className="adj-btn" onClick={() => onLocalAdjust(e._id, 1)}
                          style={{
                            width: 28, height: 28, borderRadius: 8, border: "1.5px solid #E5E7EB",
                            background: "white", color: "#374151", cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontFamily: "inherit", transition: "all 0.15s",
                          }}><Plus size={12} /></button>
                      </div>
                    </td>
                    <td>
                      <button onClick={() => onTogglePay(e)} disabled={busyId === e._id}
                        style={{
                          padding: "5px 12px", borderRadius: 8, border: "none",
                          fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: "pointer",
                          background: e.paid
                            ? "linear-gradient(135deg, #D1FAE5, #A7F3D0)"
                            : "linear-gradient(135deg, #FEF3C7, #FDE68A)",
                          color: e.paid ? "#065F46" : "#92400E",
                          transition: "all 0.15s",
                          opacity: busyId === e._id ? 0.5 : 1,
                          display: "inline-flex", alignItems: "center", gap: 4,
                        }}>
                        {e.paid ? <Check size={11} strokeWidth={3} /> : <Clock size={11} strokeWidth={2.5} />}
                        {e.paid ? "Paid" : "Pending"}
                      </button>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => isModified ? onDirectSave(e, adjCount) : onEdit(e)}
                          disabled={busyId === e._id}
                          style={{
                            padding: "5px 10px", borderRadius: 8, border: "1.5px solid #E5E7EB",
                            background: isModified ? "linear-gradient(135deg, #F59E0B, #D97706)" : "white",
                            color: isModified ? "white" : "#374151", fontFamily: "inherit",
                            fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
                            display: "inline-flex", alignItems: "center", gap: 4,
                            boxShadow: isModified ? "0 2px 8px rgba(245,158,11,0.3)" : "none",
                            opacity: busyId === e._id ? 0.5 : 1,
                          }}>
                          {isModified
                            ? <><Save size={12} strokeWidth={2.5} />Save</>
                            : <><Edit3 size={12} strokeWidth={2.5} />Edit</>}
                        </button>
                        <button onClick={() => onDelete(e._id)} disabled={busyId === e._id}
                          style={{
                            padding: "5px 10px", borderRadius: 8, border: "1.5px solid #FEE2E2",
                            background: "#FEF2F2", color: "#DC2626", fontFamily: "inherit",
                            cursor: "pointer", transition: "all 0.15s",
                            opacity: busyId === e._id ? 0.5 : 1,
                            display: "inline-flex", alignItems: "center",
                          }}>
                          <Trash2 size={12} strokeWidth={2.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }

              /* Ghost row */
              const isAdding = busyId === "add-" + personName;
              return (
                <tr key={`ghost-${personName}`} style={{ opacity: isAdding ? 0.3 : 0.55 }}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar name={personName} size={30} />
                      <button onClick={() => onNameClick?.(personName)}
                        style={{
                          background: "none", border: "none", cursor: "pointer",
                          fontWeight: 700, color: "#6B7280", fontFamily: "inherit",
                          fontSize: 13.5, padding: 0,
                        }}>
                        {personName}
                      </button>
                    </div>
                  </td>
                  <td>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8,
                      background: "#F3F4F6", color: "#9CA3AF",
                      display: "inline-flex", alignItems: "center", gap: 5,
                    }}>
                      <Minus size={11} strokeWidth={2.5} /> None
                    </span>
                  </td>
                  <td style={{ color: "#9CA3AF", fontSize: 12.5, fontWeight: 500 }}>
                    {fmtDate(isoToday() + "T00:00:00")}
                  </td>
                  <td>
                    <span style={{
                      background: "#F3F4F6", color: "#9CA3AF",
                      padding: "4px 10px", borderRadius: 8, fontWeight: 800, fontSize: 12.5,
                      border: "1px solid #E5E7EB",
                    }}>0</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 800, color: "#9CA3AF", fontSize: 14 }}>₹0</span>
                  </td>
                  <td>
                    <span style={{ fontSize: 12, color: "#D1D5DB", fontWeight: 600 }}>—</span>
                  </td>
                  <td>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 8,
                      background: "#F3F4F6", color: "#D1D5DB",
                      display: "inline-flex", alignItems: "center", gap: 4,
                    }}>
                      <Minus size={11} /> N/A
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => onDirectAdd?.(personName)}
                      disabled={isAdding}
                      style={{
                        padding: "5px 12px", borderRadius: 8,
                        border: "1.5px solid #D1FAE5",
                        background: "#ECFDF5", color: "#065F46",
                        fontFamily: "inherit", fontSize: 12, fontWeight: 700,
                        cursor: isAdding ? "wait" : "pointer", transition: "all 0.15s",
                        display: "inline-flex", alignItems: "center", gap: 4,
                      }}
                      onMouseEnter={e => {
                        if (!isAdding) {
                          e.currentTarget.style.background = "linear-gradient(135deg, #D1FAE5, #A7F3D0)";
                          e.currentTarget.style.transform = "translateY(-1px)";
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isAdding) {
                          e.currentTarget.style.background = "#ECFDF5";
                          e.currentTarget.style.transform = "translateY(0)";
                        }
                      }}
                    >
                      {isAdding ? "Adding..." : <><Plus size={12} strokeWidth={2.5} /> Add</>}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{
        padding: "14px 20px", borderTop: "2px solid #F3F4F6",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: "linear-gradient(135deg, #FFFBEB, #FEF3C7)",
        borderRadius: "0 0 16px 16px",
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#92400E", display: "flex", alignItems: "center", gap: 6 }}>
          <Wallet size={15} strokeWidth={2.5} />
          Today's Total ({tableEntries.length} / {rows.length} people ordered)
        </span>
        <span style={{ fontSize: 22, fontWeight: 900, color: "#D97706" }}>
          {formatINR(grandTotal)}
        </span>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════
   READ-ONLY ENTRIES TABLE
═══════════════════════════════════════════ */
function ReadOnlyEntriesTable({ entries: tableEntries, loading, emptyMsg, onRowClick }) {
  if (loading) return <div className="center" style={{ padding: "3rem" }}><div className="spinner" /></div>;
  if (tableEntries.length === 0) return <div className="empty-state">{emptyMsg}</div>;

  let grandTotal = 0;
  tableEntries.forEach(e => { grandTotal += e.teaCount * getPrice(e.drinkType || "tea"); });

  return (
    <>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Person</th><th>Type</th><th>Date</th>
              <th>Cups</th><th>Amount</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {tableEntries.map(e => {
              const amt = e.teaCount * getPrice(e.drinkType || "tea");
              return (
                <tr key={e._id} onClick={() => onRowClick(e.name)} style={{ cursor: "pointer" }}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar name={e.name} size={32} />
                      <div>
                        <div style={{ fontWeight: 700, color: "#1F2937", fontSize: 13.5 }}>{e.name}</div>
                        <div style={{ fontSize: 10.5, color: "#9CA3AF", fontWeight: 500, display: "flex", alignItems: "center", gap: 3, marginTop: 1 }}>
                          <Eye size={10} strokeWidth={2.5} /> View details
                        </div>
                      </div>
                    </div>
                  </td>
                  <td><DrinkBadge type={e.drinkType || "tea"} /></td>
                  <td style={{ color: "#6B7280", fontSize: 12.5, fontWeight: 500 }}>{fmtDate(e.date || isoToday())}</td>
                  <td>
                    <span style={{ background: "#F3F4F6", color: "#374151", padding: "4px 10px", borderRadius: 8, fontWeight: 800, fontSize: 12.5, border: "1px solid #E5E7EB" }}>
                      {e.teaCount}
                    </span>
                  </td>
                  <td><span style={{ fontWeight: 800, color: "#D97706", fontSize: 14 }}>{formatINR(amt)}</span></td>
                  <td><PayBadge paid={e.paid} /></td>
                  <td style={{ textAlign: "right", color: "#9CA3AF" }}><ChevronRight size={16} strokeWidth={2.5} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{
        padding: "14px 20px", borderTop: "2px solid #F3F4F6",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: "linear-gradient(135deg, #FFFBEB, #FEF3C7)",
        borderRadius: "0 0 16px 16px",
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#92400E", display: "flex", alignItems: "center", gap: 6 }}>
          <Wallet size={15} strokeWidth={2.5} /> Total ({tableEntries.length} entries)
        </span>
        <span style={{ fontSize: 22, fontWeight: 900, color: "#D97706" }}>{formatINR(grandTotal)}</span>
      </div>
    </>
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
  const [localAdjustments, setLocalAdjustments] = useState({});

  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      setIsMobile(w < 768);
      if (w >= 768) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ── ADD PEOPLE ENTRY modal (today, full control) ──
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState("");
  const [addCount, setAddCount] = useState("1");
  const [addDrink, setAddDrink] = useState("tea");
  const [addDate, setAddDate] = useState(isoToday());
  const [addSaving, setAddSaving] = useState(false);

  // ── ADD PREVIOUS ENTRY modal (defaults yesterday) ──
  const [showPrev, setShowPrev] = useState(false);
  const [prevName, setPrevName] = useState("");
  const [prevCount, setPrevCount] = useState("1");
  const [prevDrink, setPrevDrink] = useState("tea");
  const [prevDate, setPrevDate] = useState(isoYesterday());
  const [prevSaving, setPrevSaving] = useState(false);

  const openAddPrev = (prefillName = "", prefillDate = isoYesterday()) => {
    setPrevName(prefillName);
    setPrevCount("1");
    setPrevDrink("tea");
    setPrevDate(prefillDate);
    setShowPrev(true);
  };

  // ── EDIT modal ──
  const [showEdit, setShowEdit] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [editName, setEditName] = useState("");
  const [editCount, setEditCount] = useState("1");
  const [editDrink, setEditDrink] = useState("tea");
  const [editSaving, setEditSaving] = useState(false);

  const [filterStartDate, setFilterStartDate] = useState(isoToday());
  const [filterEndDate, setFilterEndDate] = useState(isoToday());
  const [filterUser, setFilterUser] = useState("");
  const [filterDrink, setFilterDrink] = useState("all");
  const [filterPaid, setFilterPaid] = useState("all");
  const [page, setPage] = useState(1);

  const [allFilterUser, setAllFilterUser] = useState("");
  const [allFilterDrink, setAllFilterDrink] = useState("all");
  const [allFilterPaid, setAllFilterPaid] = useState("all");
  const [allPage, setAllPage] = useState(1);

  const [detailPerson, setDetailPerson] = useState(null);

  const today = isoToday();
  const notify = (msg, type = "success") => setToast({ msg, type, key: Date.now() });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/tea`);
      const data = await res.json();
      setEntries(data);
      setLocalAdjustments({});
    } catch { notify("Failed to load data", "error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleLocalAdjust = (entryId, delta) => {
    setLocalAdjustments(prev => {
      const entry = entries.find(e => e._id === entryId);
      if (!entry) return prev;
      const current = prev[entryId] ?? entry.teaCount;
      const newVal = current + delta;
      if (newVal < 1) return prev;
      if (newVal === entry.teaCount) {
        const next = { ...prev };
        delete next[entryId];
        return next;
      }
      return { ...prev, [entryId]: newVal };
    });
  };

  /* ── derived ── */
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

  const todayEntries = entries
    .filter(e => (e.date || today).split("T")[0] === today)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  let todayTea = 0, todayCoffee = 0, todayAmt = 0;
  todayEntries.forEach(e => {
    const amt = e.teaCount * getPrice(e.drinkType || "tea");
    if (e.drinkType === "coffee") todayCoffee += e.teaCount; else todayTea += e.teaCount;
    todayAmt += amt;
  });

  const isDuplicate = (name, drink, forDate, excludeId = null) => {
    const d = forDate.split("T")[0];
    return entries.some(e =>
      normalizeName(e.name) === normalizeName(name) &&
      (e.drinkType || "tea") === drink &&
      (e.date || today).split("T")[0] === d &&
      e._id !== excludeId
    );
  };

  /* ── DIRECT ADD today (ghost row) ── */
  const handleDirectAdd = async (personName) => {
    setBusyId("add-" + personName);
    try {
      const res = await fetch(`${API}/tea`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: personName, teaCount: 1, drinkType: "tea", date: today }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed"); }
      notify(`Added 1 Tea for ${personName}`);
      fetchData();
    } catch (e) { notify(e.message, "error"); }
    finally { setBusyId(null); }
  };

  /* ── DIRECT SAVE adjusted cups ── */
  const handleDirectSave = async (entry, newCount) => {
    setBusyId(entry._id);
    try {
      const res = await fetch(`${API}/tea/${entry._id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: entry.name, teaCount: newCount, drinkType: entry.drinkType }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed"); }
      setLocalAdjustments(prev => { const next = { ...prev }; delete next[entry._id]; return next; });
      notify(`Updated cups for ${entry.name}`);
      fetchData();
    } catch (e) { notify(e.message, "error"); }
    finally { setBusyId(null); }
  };

  /* ── ADD PEOPLE ENTRY modal submit ── */
  const handleAdd = async () => {
    if (!addName.trim() || Number(addCount) < 1) return notify("Fill all fields correctly", "error");
    if (isDuplicate(addName, addDrink, addDate))
      return notify(`${addName.trim()} already has a ${addDrink} entry on this date`, "error");
    setAddSaving(true);
    try {
      const res = await fetch(`${API}/tea`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: addName.trim(), teaCount: Number(addCount), drinkType: addDrink, date: addDate }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed"); }
      notify("Entry added successfully!");
      setShowAdd(false); setAddName(""); setAddCount("1"); setAddDrink("tea"); setAddDate(today);
      fetchData();
    } catch (e) { notify(e.message, "error"); }
    finally { setAddSaving(false); }
  };

  /* ── ADD PREVIOUS ENTRY modal submit ── */
  const handleAddPrev = async () => {
    if (!prevName.trim() || Number(prevCount) < 1) return notify("Fill all fields correctly", "error");
    if (prevDate >= today) return notify("Date must be before today for previous entry", "error");
    if (isDuplicate(prevName, prevDrink, prevDate))
      return notify(`${prevName.trim()} already has a ${prevDrink} entry on ${fmtDate(prevDate + "T00:00:00")}`, "error");
    setPrevSaving(true);
    try {
      const res = await fetch(`${API}/tea`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: prevName.trim(), teaCount: Number(prevCount), drinkType: prevDrink, date: prevDate }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed"); }
      notify(`Previous entry added for ${prevName.trim()} on ${fmtDate(prevDate + "T00:00:00")}`);
      setShowPrev(false); setPrevName(""); setPrevCount("1"); setPrevDrink("tea"); setPrevDate(isoYesterday());
      fetchData();
    } catch (e) { notify(e.message, "error"); }
    finally { setPrevSaving(false); }
  };

  /* ── EDIT modal ── */
  const openEdit = entry => {
    const adjCount = localAdjustments[entry._id] ?? entry.teaCount;
    setEditEntry(entry); setEditName(entry.name);
    setEditCount(String(adjCount)); setEditDrink(entry.drinkType || "tea");
    setShowEdit(true);
  };

  const handleEdit = async () => {
    if (!editName.trim() || Number(editCount) < 1) return notify("Fill all fields correctly", "error");
    const entryDate = (editEntry.date || today).split("T")[0];
    if (isDuplicate(editName, editDrink, entryDate, editEntry._id))
      return notify("Duplicate entry for this date", "error");
    setEditSaving(true);
    try {
      const res = await fetch(`${API}/tea/${editEntry._id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim(), teaCount: Number(editCount), drinkType: editDrink }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed"); }
      setLocalAdjustments(prev => { const next = { ...prev }; delete next[editEntry._id]; return next; });
      notify("Entry updated successfully!"); setShowEdit(false); setEditEntry(null); fetchData();
    } catch (e) { notify(e.message, "error"); }
    finally { setEditSaving(false); }
  };

  const handleDelete = async id => {
    if (!window.confirm("Remove this entry permanently?")) return;
    setBusyId(id);
    try {
      await fetch(`${API}/tea/${id}`, { method: "DELETE" });
      setLocalAdjustments(prev => { const next = { ...prev }; delete next[id]; return next; });
      notify("Entry removed"); fetchData();
    } catch { notify("Delete failed", "error"); }
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
      notify(entry.paid ? "Marked as unpaid" : "Marked as paid"); fetchData();
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

  const allEntriesFiltered = entries
    .filter(e => !allFilterUser || normalizeName(e.name).includes(normalizeName(allFilterUser)))
    .filter(e => allFilterDrink === "all" || (e.drinkType || "tea") === allFilterDrink)
    .filter(e => allFilterPaid === "all" || (allFilterPaid === "paid" ? e.paid : !e.paid));

  const groupedByPerson = {};
  allEntriesFiltered.forEach(e => {
    const k = normalizeName(e.name);
    if (!groupedByPerson[k]) groupedByPerson[k] = { name: e.name, tea: 0, coffee: 0, teaAmount: 0, coffeeAmount: 0, totalAmount: 0, paidAmount: 0, entries: [] };
    const amt = e.teaCount * getPrice(e.drinkType || "tea");
    if (e.drinkType === "coffee") { groupedByPerson[k].coffee += e.teaCount; groupedByPerson[k].coffeeAmount += amt; }
    else { groupedByPerson[k].tea += e.teaCount; groupedByPerson[k].teaAmount += amt; }
    groupedByPerson[k].totalAmount += amt;
    if (e.paid) groupedByPerson[k].paidAmount += amt;
    groupedByPerson[k].entries.push(e);
  });
  const groupedPersons = Object.values(groupedByPerson).sort((a, b) => b.totalAmount - a.totalAmount);

  const allPersonsPageSize = 10;
  const allTotalPages = Math.ceil(groupedPersons.length / allPersonsPageSize);
  const allPagedPersons = groupedPersons.slice((allPage - 1) * allPersonsPageSize, allPage * allPersonsPageSize);

  let aeGrandTotal = 0, aeTotalPaid = 0, aeTotalTea = 0, aeTotalCoffee = 0;
  groupedPersons.forEach(p => {
    aeGrandTotal += p.totalAmount; aeTotalPaid += p.paidAmount;
    aeTotalTea += p.tea; aeTotalCoffee += p.coffee;
  });

  const personEntries = detailPerson
    ? entries.filter(e => normalizeName(e.name) === normalizeName(detailPerson))
    : [];

  const handleNameClick = (name) => { setDetailPerson(name); setTab("people"); };

  const navItems = [
    { id: "dashboard", Icon: LayoutDashboard, label: "Dashboard" },
    { id: "entries", Icon: Calendar, label: "Date Entries" },
    { id: "allEntries", Icon: ListChecks, label: "All Entries" },
    { id: "people", Icon: Users, label: "People" },
  ];

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #F9FAFB; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color: #1F2937; -webkit-font-smoothing: antialiased; }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 10px; }
    ::-webkit-scrollbar-thumb:hover { background: #9CA3AF; }

    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes modalIn { from { transform: scale(0.9) translateY(10px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes calendarIn { from { transform: translateY(-8px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes dropIn { from { transform: translateY(-6px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes slideRight { from { transform: translateX(-12px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

    .layout { display: flex; min-height: 100vh; }
    .sidebar {
      width: ${SIDEBAR_W}px;
      background: linear-gradient(180deg, #111827 0%, #1F2937 50%, #111827 100%);
      display: flex; flex-direction: column;
      position: fixed; top: 0; left: 0; bottom: 0; z-index: 200;
      transition: all 0.4s cubic-bezier(0.4,0,0.2,1);
      overflow: hidden;
      border-right: 1px solid rgba(255,255,255,0.06);
    }
    .sidebar.collapsed { width: ${COLLAPSED_W}px; }
    .sidebar-logo {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 16px; height: 68px; flex-shrink: 0;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      gap: 12px; overflow: hidden;
    }
    .logo-icon-wrap {
      width: 40px; height: 40px; border-radius: 12px;
      background: linear-gradient(135deg, #F59E0B, #D97706);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; color: white; box-shadow: 0 4px 12px rgba(245,158,11,0.3);
    }
    .logo-text { overflow: hidden; flex: 1; min-width: 0; transition: all 0.4s ease; }
    .logo-text h1 { font-size: 16px; font-weight: 900; color: white; line-height: 1.2; white-space: nowrap; letter-spacing: -0.02em; }
    .logo-text span { font-size: 10.5px; color: rgba(255,255,255,0.4); white-space: nowrap; display: block; font-weight: 500; letter-spacing: 0.05em; }
    .sidebar.collapsed .logo-text { opacity: 0; max-width: 0; overflow: hidden; }
    .collapse-btn {
      flex-shrink: 0; width: 32px; height: 32px; border-radius: 10px;
      border: 1.5px solid rgba(255,255,255,0.1);
      background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.6);
      cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.25s;
    }
    .collapse-btn:hover { background: rgba(245,158,11,0.15); color: #F59E0B; border-color: rgba(245,158,11,0.3); transform: scale(1.05); }
    .top-toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; padding: 8px 0; }
    .expand-sidebar-btn {
      width: 38px; height: 38px; border-radius: 11px; background: white;
      border: 1.5px solid #E5E7EB; color: #374151; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
      box-shadow: 0 1px 3px rgba(0,0,0,0.04); flex-shrink: 0;
      animation: slideRight 0.3s ease;
    }
    .expand-sidebar-btn:hover { background: linear-gradient(135deg, #F59E0B, #D97706); color: white; border-color: transparent; transform: translateX(2px); box-shadow: 0 4px 14px rgba(245,158,11,0.3); }
    .nav { padding: 16px 10px; flex: 1; overflow-y: auto; overflow-x: hidden; }
    .nav-sep { font-size: 9px; font-weight: 800; color: rgba(255,255,255,0.2); text-transform: uppercase; letter-spacing: 2px; padding: 12px 12px 8px; white-space: nowrap; overflow: hidden; transition: all 0.3s ease; }
    .sidebar.collapsed .nav-sep { opacity: 0; height: 0; padding: 0; margin: 0; overflow: hidden; }
    .nav-btn { display: flex; align-items: center; gap: 12px; width: 100%; padding: 11px 14px; border: none; background: transparent; color: rgba(255,255,255,0.5); font-family: inherit; font-size: 13.5px; font-weight: 600; border-radius: 12px; cursor: pointer; text-align: left; transition: all 0.2s cubic-bezier(0.4,0,0.2,1); margin-bottom: 4px; white-space: nowrap; position: relative; overflow: hidden; }
    .nav-btn::before { content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 3px; height: 0; background: #F59E0B; border-radius: 0 4px 4px 0; transition: height 0.2s ease; }
    .nav-btn:hover { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.85); transform: translateX(2px); }
    .nav-btn.active { background: linear-gradient(135deg, rgba(245,158,11,0.15), rgba(217,119,6,0.1)); color: #F59E0B; font-weight: 800; }
    .nav-btn.active::before { height: 60%; }
    .nav-icon-wrap { width: 22px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .nav-label { overflow: hidden; transition: all 0.35s cubic-bezier(0.4,0,0.2,1); max-width: 180px; opacity: 1; }
    .sidebar.collapsed .nav-label { opacity: 0; max-width: 0; padding: 0; }
    .sidebar.collapsed .nav-btn { justify-content: center; padding: 12px 0; }
    .sidebar.collapsed .nav-icon-wrap { width: 24px; }
    .sidebar-foot { padding: 16px 18px; border-top: 1px solid rgba(255,255,255,0.06); font-size: 11px; color: rgba(255,255,255,0.25); flex-shrink: 0; overflow: hidden; white-space: nowrap; transition: all 0.3s ease; background: rgba(0,0,0,0.15); }
    .sidebar.collapsed .sidebar-foot { opacity: 0; height: 0; padding: 0; pointer-events: none; }
    .sidebar-foot-date { color: #F59E0B; font-weight: 700; font-size: 12px; margin-bottom: 3px; display: flex; align-items: center; gap: 6px; }
    .main { margin-left: ${SIDEBAR_W}px; flex: 1; min-height: 100vh; padding: 28px 32px 60px; transition: margin-left 0.4s cubic-bezier(0.4,0,0.2,1); max-width: 100%; overflow-x: hidden; background: #F9FAFB; }
    .main.collapsed { margin-left: ${COLLAPSED_W}px; }
    .main.mobile { margin-left: 0; padding: 72px 16px 40px; }
    .mob-bar { display: none; position: fixed; top: 0; left: 0; right: 0; z-index: 150; background: linear-gradient(135deg, #111827, #1F2937); height: 56px; align-items: center; padding: 0 16px; gap: 14px; border-bottom: 1px solid rgba(255,255,255,0.06); }
    .mob-bar-title { font-size: 15px; font-weight: 800; color: white; flex: 1; display: flex; align-items: center; gap: 10px; }
    .mob-menu-btn { width: 40px; height: 40px; border-radius: 12px; border: 1.5px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
    .mob-menu-btn:hover { background: rgba(245,158,11,0.15); color: #F59E0B; }
    .overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 190; animation: fadeIn 0.25s ease; }
    .overlay.show { display: block; }
    .page-header { margin-bottom: 28px; display: flex; align-items: flex-end; justify-content: space-between; flex-wrap: wrap; gap: 16px; }
    .page-title { font-size: 28px; font-weight: 900; color: #111827; line-height: 1.1; letter-spacing: -0.03em; }
    .page-sub { font-size: 13px; color: #6B7280; margin-top: 4px; font-weight: 500; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(155px, 1fr)); gap: 14px; margin-bottom: 24px; }
    .card { background: white; border-radius: 18px; border: 1px solid #F3F4F6; box-shadow: 0 1px 3px rgba(0,0,0,0.04); overflow: hidden; }
    .card-head { padding: 16px 20px; border-bottom: 1px solid #F3F4F6; display: flex; justify-content: space-between; align-items: center; background: #FAFAFA; }
    .card-title { font-size: 11px; font-weight: 800; color: #6B7280; text-transform: uppercase; letter-spacing: 0.08em; display: flex; align-items: center; gap: 6px; }
    .table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    table { width: 100%; border-collapse: collapse; font-size: 13.5px; min-width: 650px; }
    th { padding: 12px 16px; text-align: left; font-size: 10.5px; font-weight: 800; color: #6B7280; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 2px solid #F3F4F6; background: #FAFAFA; white-space: nowrap; }
    td { padding: 12px 16px; border-bottom: 1px solid #F9FAFB; vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    tr { transition: background 0.15s; }
    tr:hover td { background: #FAFAFA; }
    .btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; border: none; border-radius: 12px; padding: 10px 18px; font-family: inherit; font-size: 13.5px; font-weight: 700; cursor: pointer; transition: all 0.2s cubic-bezier(0.4,0,0.2,1); white-space: nowrap; }
    .btn-primary { background: linear-gradient(135deg, #F59E0B, #D97706); color: white; box-shadow: 0 4px 14px rgba(245,158,11,0.3); }
    .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(245,158,11,0.4); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    .btn-secondary { background: linear-gradient(135deg, #EFF6FF, #DBEAFE); color: #1E40AF; border: 1.5px solid #BFDBFE; box-shadow: 0 2px 8px rgba(37,99,235,0.1); }
    .btn-secondary:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(37,99,235,0.2); background: linear-gradient(135deg, #DBEAFE, #BFDBFE); }
    .btn-ghost { background: #F3F4F6; color: #374151; border: 1.5px solid #E5E7EB; }
    .btn-ghost:hover { background: #E5E7EB; transform: translateY(-1px); }
    .btn-sm { padding: 6px 12px; font-size: 12px; border-radius: 10px; }
    .filter-bar { background: white; border: 1px solid #F3F4F6; border-radius: 16px; padding: 14px 20px; margin-bottom: 14px; display: flex; flex-wrap: wrap; gap: 12px; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    .filter-label { font-size: 11px; font-weight: 800; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.06em; display: flex; align-items: center; gap: 5px; }
    input.filter-input { background: #F9FAFB; border: 2px solid #E5E7EB; border-radius: 10px; padding: 8px 14px; font-family: inherit; font-size: 13px; color: #1F2937; outline: none; width: 180px; font-weight: 500; transition: all 0.2s; }
    input.filter-input:focus { border-color: #F59E0B; background: white; box-shadow: 0 0 0 3px rgba(245,158,11,0.12); }
    .pill { background: #F3F4F6; color: #374151; font-size: 12px; font-weight: 700; padding: 4px 10px; border: 1px solid #E5E7EB; border-radius: 8px; display: inline-flex; align-items: center; gap: 5px; }
    .price-strip { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
    .price-chip { background: white; border: 1.5px solid #E5E7EB; border-radius: 12px; padding: 8px 16px; font-size: 13px; color: #374151; font-weight: 600; display: flex; align-items: center; gap: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    .price-chip strong { color: #D97706; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-top: 18px; }
    .person-mini { background: white; border: 1.5px solid #F3F4F6; border-radius: 16px; padding: 18px; cursor: pointer; transition: all 0.25s cubic-bezier(0.4,0,0.2,1); box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    .person-mini:hover { border-color: #FDE68A; background: #FFFBEB; transform: translateY(-3px); box-shadow: 0 8px 30px rgba(245,158,11,0.12); }
    .spinner { width: 28px; height: 28px; border: 3px solid #E5E7EB; border-top-color: #F59E0B; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
    .center { display: flex; justify-content: center; align-items: center; }
    .empty-state { text-align: center; padding: 48px 24px; color: #9CA3AF; font-size: 14px; font-weight: 500; }
    .date-range-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .date-range-sep { font-size: 13px; color: #9CA3AF; font-weight: 800; }
    .range-summary { background: linear-gradient(135deg, #FFFBEB, #FEF3C7); border: 1.5px solid #FDE68A; border-radius: 14px; padding: 12px 18px; display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 16px; align-items: center; }
    .range-stat { font-size: 13px; color: #92400E; font-weight: 600; display: flex; align-items: center; gap: 4px; }
    .range-stat strong { color: #78350F; font-weight: 800; }
    .section-label { font-size: 11px; font-weight: 800; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
    .section-label::after { content: ''; flex: 1; height: 1px; background: #E5E7EB; }
    .pagination { display: flex; justify-content: center; gap: 6px; flex-wrap: wrap; padding: 16px 0; }
    .page-btn { min-width: 36px; height: 36px; border-radius: 10px; border: 1.5px solid #E5E7EB; background: white; color: #374151; font-family: inherit; font-size: 13px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
    .page-btn:hover:not(:disabled) { background: #F3F4F6; transform: translateY(-1px); }
    .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .page-btn.active { background: linear-gradient(135deg, #F59E0B, #D97706); color: white; border-color: transparent; box-shadow: 0 3px 10px rgba(245,158,11,0.3); }
    .adj-btn:hover:not(:disabled) { border-color: #F59E0B !important; color: #D97706 !important; background: #FFFBEB !important; }
    .prev-banner { background: linear-gradient(135deg, #EFF6FF, #DBEAFE); border: 1.5px solid #BFDBFE; border-radius: 14px; padding: 12px 18px; margin-bottom: 20px; display: flex; align-items: center; gap: 12px; font-size: 13px; color: #1E40AF; font-weight: 600; }
    @media (max-width: 1200px) { .two-col { grid-template-columns: 1fr; } }
    @media (max-width: 768px) {
      .sidebar { transform: translateX(-100%); width: ${SIDEBAR_W}px !important; }
      .sidebar.mobile-open { transform: translateX(0); box-shadow: 8px 0 50px rgba(0,0,0,0.4); }
      .main { margin-left: 0 !important; padding: 72px 14px 40px; }
      .mob-bar { display: flex; }
      .top-toolbar { display: none; }
      .page-header { flex-direction: column; align-items: flex-start; }
      .page-title { font-size: 22px; }
      .filter-bar { flex-direction: column; align-items: stretch; }
      .date-range-row { flex-direction: column; align-items: stretch; }
      input.filter-input { width: 100%; }
      .two-col { grid-template-columns: 1fr; }
      .price-strip { flex-direction: column; }
      .header-btns { flex-direction: column; align-items: stretch; }
    }
    @media (max-width: 480px) {
      .main { padding: 72px 10px 32px; }
      .stats-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
      .page-title { font-size: 20px; }
    }
  `;

  return (
    <>
      <style>{CSS}</style>
      <div className="layout">
        <div className={`overlay ${mobileOpen ? "show" : ""}`} onClick={() => setMobileOpen(false)} />

        <div className="mob-bar">
          <button className="mob-menu-btn" onClick={() => setMobileOpen(o => !o)}>
            {mobileOpen ? <X size={20} strokeWidth={2.5} /> : <Menu size={20} strokeWidth={2.5} />}
          </button>
          <span className="mob-bar-title">
            <span style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #F59E0B, #D97706)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "white" }}>
              <Coffee size={15} strokeWidth={2.5} />
            </span>
            Tea & Coffee
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="btn btn-sm" style={{ background: "linear-gradient(135deg, #EFF6FF,#DBEAFE)", color: "#1E40AF", border: "1.5px solid #BFDBFE", borderRadius: 10, fontFamily: "inherit", fontWeight: 700, fontSize: 11, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 10px" }}
              onClick={() => openAddPrev()}>
              <History size={13} strokeWidth={2.5} /> Prev
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => { setAddDate(today); setShowAdd(true); }}>
              <Plus size={14} strokeWidth={2.5} /> Add
            </button>
          </div>
        </div>

        <aside className={`sidebar ${collapsed && !isMobile ? "collapsed" : ""} ${isMobile ? (mobileOpen ? "mobile-open" : "") : ""}`}
          style={isMobile && !mobileOpen ? { transform: "translateX(-100%)" } : undefined}>
          <div className="sidebar-logo">
            <div className="logo-icon-wrap"><Coffee size={22} strokeWidth={2.3} /></div>
            <div className="logo-text">
              <h1>Tea & Coffee</h1>
              <span>Expense Tracker</span>
            </div>
            {!isMobile && (
              <button className="collapse-btn" onClick={() => setCollapsed(c => !c)} title={collapsed ? "Expand" : "Collapse"}>
                {collapsed ? <ChevronRight size={16} strokeWidth={2.5} /> : <ChevronLeft size={16} strokeWidth={2.5} />}
              </button>
            )}
            {isMobile && (
              <button className="collapse-btn" onClick={() => setMobileOpen(false)} title="Close">
                <X size={18} strokeWidth={2.5} />
              </button>
            )}
          </div>

          <nav className="nav">
            <div className="nav-sep">Navigation</div>
            {navItems.map(n => {
              const Icon = n.Icon;
              return (
                <button key={n.id} className={`nav-btn ${tab === n.id ? "active" : ""}`}
                  onClick={() => { setTab(n.id); setMobileOpen(false); setDetailPerson(null); }}
                  title={collapsed && !isMobile ? n.label : ""}>
                  <span className="nav-icon-wrap"><Icon size={18} strokeWidth={2.2} /></span>
                  <span className="nav-label">{n.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="sidebar-foot">
            <div className="sidebar-foot-date">
              <CalendarDays size={13} strokeWidth={2.5} />
              {fmtDate(today + "T00:00:00")}
            </div>
            <span>{entries.length} records · {allPeople.size} people</span>
          </div>
        </aside>

        <main className={`main ${collapsed && !isMobile ? "collapsed" : ""} ${isMobile ? "mobile" : ""}`}>

          {collapsed && !isMobile && (
            <div className="top-toolbar">
              <button className="expand-sidebar-btn" onClick={() => setCollapsed(false)} title="Expand sidebar">
                <Menu size={18} strokeWidth={2.3} />
              </button>
            </div>
          )}

          {/* ═══════ DASHBOARD ═══════ */}
          {tab === "dashboard" && (
            <>
              <div className="page-header">
                <div>
                  <div className="page-title">Dashboard</div>
                  <div className="page-sub">Overview for {fmtDate(today + "T00:00:00")} · All-time stats</div>
                </div>
                <div className="header-btns" style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <button className="btn btn-secondary" onClick={() => openAddPrev()}>
                    <History size={15} strokeWidth={2.5} /> Add Previous Entry
                  </button>
                  <button className="btn btn-primary" onClick={() => { setAddDate(today); setShowAdd(true); }}>
                    <Plus size={16} strokeWidth={2.5} /> Add People Entry
                  </button>
                </div>
              </div>

              <div className="price-strip">
                <div className="price-chip"><Coffee size={14} strokeWidth={2.5} color="#F59E0B" /> Tea — <strong>₹{TEA_PRICE}/cup</strong></div>
                <div className="price-chip"><Coffee size={14} strokeWidth={2.5} color="#78350F" /> Coffee — <strong>₹{COFFEE_PRICE}/cup</strong></div>
              </div>

              <div className="section-label">All-Time Overview</div>
              <div className="stats-grid">
                <StatCard icon={Coffee} label="Total Teas" value={allTea} accent="#F59E0B" />
                <StatCard icon={Coffee} label="Total Coffees" value={allCoffee} accent="#78350F" />
                <StatCard icon={Wallet} label="Total Expense" value={formatINR(allAmt)} accent="#059669" />
                <StatCard icon={CheckCircle2} label="Total Paid" value={formatINR(allPaid)} accent="#059669" />
                <StatCard icon={Clock} label="Pending" value={formatINR(allPending)} accent="#DC2626" />
                <StatCard icon={Users} label="People" value={allPeople.size} accent="#2563EB" />
              </div>

              <div className="section-label">Quick Stats</div>
              <div className="stats-grid">
                <StatCard icon={FileText} label="Total Records" value={entries.length} accent="#6366F1" />
                <StatCard icon={Calendar} label="Days Tracked" value={new Set(entries.map(e => (e.date || today).split("T")[0])).size} accent="#2563EB" />
                <StatCard icon={Trophy} label="Avg / Person" value={allPeople.size ? formatINR(Math.round(allAmt / allPeople.size)) : "₹0"} accent="#F59E0B" />
                <StatCard icon={Sun} label="Today Entries" value={todayEntries.length} sub={`${formatINR(todayAmt)} today`} accent="#10B981" />
              </div>

              <div className="section-label" style={{ marginTop: 8 }}>Today's Entries</div>
              <div className="card" style={{ marginBottom: 20 }}>
                <div className="card-head">
                  <span className="card-title" style={{ color: "#6B7280" }}>
                    <Sun size={13} strokeWidth={2.5} />
                    {fmtDate(today + "T00:00:00")}
                  </span>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    {todayEntries.length > 0 && (
                      <>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><Coffee size={12} color="#F59E0B" /> {todayTea}</span>
                          ·
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><Coffee size={12} color="#78350F" /> {todayCoffee}</span>
                        </span>
                        <span className="pill">{todayEntries.length} entries</span>
                      </>
                    )}
                  </div>
                </div>

                <TodayEntriesTable
                  entries={todayEntries}
                  allPersons={allPersons}
                  loading={loading}
                  busyId={busyId}
                  localAdjustments={localAdjustments}
                  onLocalAdjust={handleLocalAdjust}
                  onTogglePay={togglePay}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  emptyMsg="No people found. Add the first entry!"
                  onNameClick={handleNameClick}
                  onDirectAdd={handleDirectAdd}
                  onDirectSave={handleDirectSave}
                />
              </div>

              <div className="two-col">
                <div className="card" style={{ padding: "20px 24px" }}>
                  <div className="card-title" style={{ marginBottom: 16, color: "#6B7280" }}>
                    <TrendingUp size={13} strokeWidth={2.5} /> Spending Leaderboard
                  </div>
                  {allPersons.length === 0 ? <div className="empty-state">No data yet</div> : (
                    <>
                      {allPersons[0] && (
                        <div style={{ background: "linear-gradient(135deg, #FFFBEB, #FEF3C7)", border: "1.5px solid #FDE68A", borderRadius: 14, padding: "12px 16px", marginBottom: 18, display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)", color: "white", width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Trophy size={18} strokeWidth={2.3} />
                          </div>
                          <div>
                            <div style={{ fontSize: 10, color: "#92400E", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>Top Spender</div>
                            <div style={{ fontSize: 15, fontWeight: 900, color: "#78350F" }}>{allPersons[0].name} · {formatINR(allPersons[0].amount)}</div>
                          </div>
                        </div>
                      )}
                      {allPersons.slice(0, 7).map((p, i) => (
                        <div key={p.name} style={{ marginBottom: 12 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 13 }}>
                            <span style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ width: 20, height: 20, borderRadius: 6, background: i === 0 ? "#FEF3C7" : "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, color: i === 0 ? "#92400E" : "#6B7280" }}>{i + 1}</span>
                              {p.name}
                            </span>
                            <span style={{ color: "#D97706", fontWeight: 800 }}>{formatINR(p.amount)}</span>
                          </div>
                          <Bar pct={(p.amount / (allPersons[0]?.amount || 1)) * 100} color={i === 0 ? "#F59E0B" : i === 1 ? "#6366F1" : "#94A3B8"} />
                        </div>
                      ))}
                    </>
                  )}
                </div>

                <div className="card" style={{ padding: "20px 24px" }}>
                  <div className="card-title" style={{ marginBottom: 16, color: "#6B7280" }}>
                    <Users size={13} strokeWidth={2.5} /> Person Summary
                  </div>
                  {allPersons.length === 0 ? <div className="empty-state">No data yet</div> : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px,1fr))", gap: 10 }}>
                      {allPersons.map(p => (
                        <div key={p.name} onClick={() => { setDetailPerson(p.name); setTab("people"); }}
                          style={{ background: "#FAFAFA", border: "1.5px solid #F3F4F6", borderRadius: 14, padding: 14, cursor: "pointer", transition: "all 0.2s" }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = "#FDE68A"; e.currentTarget.style.background = "#FFFBEB"; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = "#F3F4F6"; e.currentTarget.style.background = "#FAFAFA"; }}>
                          <div style={{ fontWeight: 800, fontSize: 13, color: "#1F2937", marginBottom: 4 }}>{p.name}</div>
                          <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                            {p.tea > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: "#92400E", background: "#FEF3C7", padding: "2px 6px", borderRadius: 6, display: "inline-flex", alignItems: "center", gap: 3 }}><Coffee size={10} /> {p.tea}</span>}
                            {p.coffee > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: "#F59E0B", background: "#1C1917", padding: "2px 6px", borderRadius: 6, display: "inline-flex", alignItems: "center", gap: 3 }}><Coffee size={10} /> {p.coffee}</span>}
                          </div>
                          <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: 8 }}>
                            <div style={{ fontSize: 18, fontWeight: 900, color: "#D97706" }}>{formatINR(p.amount)}</div>
                            <div style={{ fontSize: 10.5, marginTop: 3, fontWeight: 700, color: p.paid < p.amount ? "#DC2626" : "#059669", display: "inline-flex", alignItems: "center", gap: 3 }}>
                              {p.paid < p.amount ? <><Clock size={10} /> {formatINR(p.amount - p.paid)} due</> : <><Check size={10} strokeWidth={3} /> Fully paid</>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ═══════ DATE ENTRIES ═══════ */}
          {tab === "entries" && (
            <>
              <div className="page-header">
                <div>
                  <div className="page-title">Date Entries</div>
                  <div className="page-sub">View entries by date range · Click any row to view person details</div>
                </div>
                <div className="header-btns" style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <button className="btn btn-secondary" onClick={() => openAddPrev(filterStartDate !== today ? "" : "")}>
                    <History size={15} strokeWidth={2.5} /> Add Previous Entry
                  </button>
                  <button className="btn btn-primary" onClick={() => { setAddDate(filterStartDate); setShowAdd(true); }}>
                    <Plus size={16} strokeWidth={2.5} /> Add People Entry
                  </button>
                </div>
              </div>

              <div className="filter-bar">
                <span className="filter-label"><CalendarDays size={12} strokeWidth={2.5} /> Date Range</span>
                <div className="date-range-row">
                  <DatePicker value={filterStartDate} onChange={d => { setFilterStartDate(d); if (d > filterEndDate) setFilterEndDate(d); setPage(1); }} />
                  <span className="date-range-sep">→</span>
                  <DatePicker value={filterEndDate} onChange={d => { setFilterEndDate(d); if (d < filterStartDate) setFilterStartDate(d); setPage(1); }} />
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
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

              <div className="filter-bar" style={{ marginTop: -6 }}>
                <span className="filter-label"><Search size={12} strokeWidth={2.5} /> Filters</span>
                <input className="filter-input" placeholder="Search name…" value={filterUser} onChange={e => { setFilterUser(e.target.value); setPage(1); }} />
                <Select value={filterDrink} onChange={v => { setFilterDrink(v); setPage(1); }} options={[
                  { value: "all", label: "All Drinks", Icon: Filter },
                  { value: "tea", label: "Tea", Icon: Coffee },
                  { value: "coffee", label: "Coffee", Icon: Coffee },
                ]} />
                <Select value={filterPaid} onChange={v => { setFilterPaid(v); setPage(1); }} options={[
                  { value: "all", label: "All Status", Icon: Filter },
                  { value: "paid", label: "Paid", Icon: CheckCircle2 },
                  { value: "unpaid", label: "Pending", Icon: Clock },
                ]} />
                <span className="pill">{filteredEntries.length} results</span>
                {(filterUser || filterDrink !== "all" || filterPaid !== "all") && (
                  <button className="btn btn-ghost btn-sm" onClick={() => { setFilterUser(""); setFilterDrink("all"); setFilterPaid("all"); setPage(1); }}>
                    <X size={12} strokeWidth={2.5} /> Clear
                  </button>
                )}
              </div>

              {filteredEntries.length > 0 && (
                <div className="range-summary">
                  <span className="range-stat"><Coffee size={13} /> Tea: <strong>{fTea}</strong></span>
                  <span className="range-stat"><Coffee size={13} /> Coffee: <strong>{fCoffee}</strong></span>
                  <span className="range-stat"><Wallet size={13} /> Total: <strong>{formatINR(fAmt)}</strong></span>
                  <span className="range-stat"><CheckCircle2 size={13} /> Paid: <strong>{formatINR(fPaid)}</strong></span>
                  <span className="range-stat"><Clock size={13} /> Pending: <strong>{formatINR(fAmt - fPaid)}</strong></span>
                </div>
              )}

              <div className="card" style={{ marginBottom: 16 }}>
                <ReadOnlyEntriesTable entries={pagedEntries} loading={loading} emptyMsg="No entries match your filters" onRowClick={handleNameClick} />
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft size={16} strokeWidth={2.5} /></button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                    .map((p, idx, arr) => (
                      <span key={p} style={{ display: "contents" }}>
                        {idx > 0 && arr[idx - 1] !== p - 1 && <span style={{ color: "#9CA3AF", alignSelf: "center", fontSize: 12 }}>…</span>}
                        <button className={`page-btn ${p === page ? "active" : ""}`} onClick={() => setPage(p)}>{p}</button>
                      </span>
                    ))}
                  <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight size={16} strokeWidth={2.5} /></button>
                </div>
              )}
            </>
          )}

          {/* ═══════ ALL ENTRIES ═══════ */}
          {tab === "allEntries" && (
            <>
              <div className="page-header">
                <div>
                  <div className="page-title">All Entries</div>
                  <div className="page-sub">Complete summary grouped by person</div>
                </div>
                <div className="header-btns" style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <button className="btn btn-secondary" onClick={() => openAddPrev()}>
                    <History size={15} strokeWidth={2.5} /> Add Previous Entry
                  </button>
                  <button className="btn btn-primary" onClick={() => { setAddDate(today); setShowAdd(true); }}>
                    <Plus size={16} strokeWidth={2.5} /> Add People Entry
                  </button>
                </div>
              </div>

              <div className="stats-grid" style={{ marginBottom: 20 }}>
                <StatCard icon={Users} label="People" value={groupedPersons.length} accent="#6366F1" />
                <StatCard icon={Coffee} label="Total Tea" value={aeTotalTea} accent="#F59E0B" />
                <StatCard icon={Coffee} label="Total Coffee" value={aeTotalCoffee} accent="#78350F" />
                <StatCard icon={Wallet} label="Grand Total" value={formatINR(aeGrandTotal)} accent="#059669" />
                <StatCard icon={CheckCircle2} label="Total Paid" value={formatINR(aeTotalPaid)} accent="#059669" />
                <StatCard icon={Clock} label="Total Pending" value={formatINR(aeGrandTotal - aeTotalPaid)} accent="#DC2626" />
              </div>

              <div className="filter-bar">
                <span className="filter-label"><Search size={12} strokeWidth={2.5} /> Filters</span>
                <input className="filter-input" placeholder="Search name…" value={allFilterUser} onChange={e => { setAllFilterUser(e.target.value); setAllPage(1); }} />
                <Select value={allFilterDrink} onChange={v => { setAllFilterDrink(v); setAllPage(1); }} options={[
                  { value: "all", label: "All Drinks", Icon: Filter },
                  { value: "tea", label: "Tea", Icon: Coffee },
                  { value: "coffee", label: "Coffee", Icon: Coffee },
                ]} />
                <Select value={allFilterPaid} onChange={v => { setAllFilterPaid(v); setAllPage(1); }} options={[
                  { value: "all", label: "All Status", Icon: Filter },
                  { value: "paid", label: "Paid", Icon: CheckCircle2 },
                  { value: "unpaid", label: "Pending", Icon: Clock },
                ]} />
                <span className="pill">{groupedPersons.length} people</span>
                {(allFilterUser || allFilterDrink !== "all" || allFilterPaid !== "all") && (
                  <button className="btn btn-ghost btn-sm" onClick={() => { setAllFilterUser(""); setAllFilterDrink("all"); setAllFilterPaid("all"); setAllPage(1); }}>
                    <X size={12} strokeWidth={2.5} /> Clear
                  </button>
                )}
              </div>

              {loading ? (
                <div className="center" style={{ padding: "3rem" }}><div className="spinner" /></div>
              ) : groupedPersons.length === 0 ? (
                <div className="card"><div className="empty-state">No entries found</div></div>
              ) : (
                <>
                  <div className="card" style={{ marginBottom: 16 }}>
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>#</th><th>Person</th><th>Tea</th><th>Coffee</th>
                            <th>Total Cups</th><th>Tea Amount</th><th>Coffee Amount</th>
                            <th>Total Amount</th><th>Paid</th><th>Pending</th><th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allPagedPersons.map((p, idx) => {
                            const pending = p.totalAmount - p.paidAmount;
                            const globalIdx = (allPage - 1) * allPersonsPageSize + idx + 1;
                            return (
                              <tr key={p.name} style={{ cursor: "pointer" }} onClick={() => handleNameClick(p.name)}>
                                <td style={{ fontWeight: 800, color: "#9CA3AF", fontSize: 12 }}>{globalIdx}</td>
                                <td>
                                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <Avatar name={p.name} size={34} />
                                    <div>
                                      <div style={{ fontWeight: 800, color: "#1F2937", fontSize: 14 }}>{p.name}</div>
                                      <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 500 }}>{p.entries.length} entries</div>
                                    </div>
                                  </div>
                                </td>
                                <td>{p.tea > 0 ? <span style={{ background: "#FEF3C7", color: "#92400E", padding: "4px 10px", borderRadius: 8, fontWeight: 800, fontSize: 13 }}>{p.tea}</span> : <span style={{ color: "#D1D5DB" }}>—</span>}</td>
                                <td>{p.coffee > 0 ? <span style={{ background: "#1C1917", color: "#FBBF24", padding: "4px 10px", borderRadius: 8, fontWeight: 800, fontSize: 13 }}>{p.coffee}</span> : <span style={{ color: "#D1D5DB" }}>—</span>}</td>
                                <td><span style={{ background: "#EDE9FE", color: "#5B21B6", padding: "4px 10px", borderRadius: 8, fontWeight: 800, fontSize: 13 }}>{p.tea + p.coffee}</span></td>
                                <td style={{ fontWeight: 700, color: "#92400E", fontSize: 13 }}>{p.teaAmount > 0 ? formatINR(p.teaAmount) : <span style={{ color: "#D1D5DB" }}>—</span>}</td>
                                <td style={{ fontWeight: 700, color: "#78350F", fontSize: 13 }}>{p.coffeeAmount > 0 ? formatINR(p.coffeeAmount) : <span style={{ color: "#D1D5DB" }}>—</span>}</td>
                                <td><span style={{ fontWeight: 900, color: "#D97706", fontSize: 16 }}>{formatINR(p.totalAmount)}</span></td>
                                <td><span style={{ fontWeight: 700, color: "#059669", fontSize: 13 }}>{formatINR(p.paidAmount)}</span></td>
                                <td><span style={{ fontWeight: 700, color: pending > 0 ? "#DC2626" : "#059669", fontSize: 13 }}>{pending > 0 ? formatINR(pending) : "₹0"}</span></td>
                                <td>
                                  <span style={{ fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 20, background: pending === 0 ? "linear-gradient(135deg, #D1FAE5, #A7F3D0)" : "linear-gradient(135deg, #FEF3C7, #FDE68A)", color: pending === 0 ? "#065F46" : "#92400E", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 4 }}>
                                    {pending === 0 ? <Check size={11} strokeWidth={3} /> : <Clock size={11} strokeWidth={2.5} />}
                                    {pending === 0 ? "Clear" : "Due"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div style={{ padding: "16px 20px", borderTop: "2px solid #F3F4F6", background: "linear-gradient(135deg, #FFFBEB, #FEF3C7)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "#92400E", display: "flex", alignItems: "center", gap: 6 }}>
                        <Wallet size={15} strokeWidth={2.5} /> Grand Total ({groupedPersons.length} people · {allEntriesFiltered.length} entries)
                      </span>
                      <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#059669", display: "inline-flex", alignItems: "center", gap: 4 }}><CheckCircle2 size={14} /> Paid: {formatINR(aeTotalPaid)}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#DC2626", display: "inline-flex", alignItems: "center", gap: 4 }}><Clock size={14} /> Pending: {formatINR(aeGrandTotal - aeTotalPaid)}</span>
                        <span style={{ fontSize: 22, fontWeight: 900, color: "#D97706" }}>{formatINR(aeGrandTotal)}</span>
                      </div>
                    </div>
                  </div>

                  {allTotalPages > 1 && (
                    <div className="pagination">
                      <button className="page-btn" onClick={() => setAllPage(p => Math.max(1, p - 1))} disabled={allPage === 1}><ChevronLeft size={16} strokeWidth={2.5} /></button>
                      {Array.from({ length: allTotalPages }, (_, i) => i + 1)
                        .filter(p => p === 1 || p === allTotalPages || Math.abs(p - allPage) <= 2)
                        .map((p, idx, arr) => (
                          <span key={p} style={{ display: "contents" }}>
                            {idx > 0 && arr[idx - 1] !== p - 1 && <span style={{ color: "#9CA3AF", alignSelf: "center", fontSize: 12 }}>…</span>}
                            <button className={`page-btn ${p === allPage ? "active" : ""}`} onClick={() => setAllPage(p)}>{p}</button>
                          </span>
                        ))}
                      <button className="page-btn" onClick={() => setAllPage(p => Math.min(allTotalPages, p + 1))} disabled={allPage === allTotalPages}><ChevronRight size={16} strokeWidth={2.5} /></button>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* ═══════ PEOPLE ═══════ */}
          {tab === "people" && (
            <>
              <div className="page-header">
                <div>
                  <div className="page-title">{detailPerson || "People"}</div>
                  <div className="page-sub">{detailPerson ? "Individual record & history" : "All-time per-person summary"}</div>
                </div>
                {detailPerson ? (
                  <div className="header-btns" style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <button className="btn btn-secondary" onClick={() => openAddPrev(detailPerson)}>
                      <History size={14} strokeWidth={2.5} /> Add Previous Entry
                    </button>
                    <button className="btn btn-ghost" onClick={() => setDetailPerson(null)}>
                      <ArrowLeft size={14} strokeWidth={2.5} /> All people
                    </button>
                  </div>
                ) : (
                  <div className="header-btns" style={{ display: "flex", gap: 10 }}>
                    <button className="btn btn-secondary" onClick={() => openAddPrev()}>
                      <History size={15} strokeWidth={2.5} /> Add Previous Entry
                    </button>
                    <button className="btn btn-primary" onClick={() => { setAddDate(today); setShowAdd(true); }}>
                      <Plus size={16} strokeWidth={2.5} /> Add People Entry
                    </button>
                  </div>
                )}
              </div>

              {!detailPerson ? (
                allPersons.length === 0 ? (
                  <div className="card"><div className="empty-state">No people yet. Add an entry to get started!</div></div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px,1fr))", gap: 14 }}>
                    {allPersons.map(p => (
                      <div key={p.name} className="person-mini" onClick={() => setDetailPerson(p.name)}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                          <Avatar name={p.name} size={40} />
                          <div>
                            <div style={{ fontWeight: 800, fontSize: 14, color: "#1F2937" }}>{p.name}</div>
                            <div style={{ fontSize: 11.5, color: "#9CA3AF", fontWeight: 500 }}>{p.tea + p.coffee} cups total</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                          {p.tea > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: "#92400E", background: "#FEF3C7", padding: "3px 8px", borderRadius: 8, display: "inline-flex", alignItems: "center", gap: 4 }}><Coffee size={11} /> {p.tea}</span>}
                          {p.coffee > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: "#F59E0B", background: "#1C1917", padding: "3px 8px", borderRadius: 8, display: "inline-flex", alignItems: "center", gap: 4 }}><Coffee size={11} /> {p.coffee}</span>}
                        </div>
                        <div style={{ borderTop: "1.5px solid #F3F4F6", paddingTop: 10 }}>
                          <div style={{ fontSize: 20, fontWeight: 900, color: "#D97706" }}>{formatINR(p.amount)}</div>
                          <div style={{ fontSize: 11, marginTop: 4, fontWeight: 700, color: p.paid < p.amount ? "#DC2626" : "#059669", display: "inline-flex", alignItems: "center", gap: 4 }}>
                            {p.paid < p.amount ? <><Clock size={11} /> {formatINR(p.amount - p.paid)} pending</> : <><Check size={11} strokeWidth={3} /> Fully paid</>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (() => {
                const pd = allPersonMap[normalizeName(detailPerson)];
                if (!pd) return <div className="empty-state">No data found for this person.</div>;
                const pending = pd.amount - pd.paid;
                return (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                      <Avatar name={pd.name} size={56} />
                      <div>
                        <div style={{ fontSize: 22, fontWeight: 900, color: "#1F2937" }}>{pd.name}</div>
                        <div style={{ fontSize: 13, color: "#6B7280", fontWeight: 500, marginTop: 2 }}>
                          {pd.entries.length} records · {pd.tea + pd.coffee} cups total
                        </div>
                      </div>
                    </div>

                    <div className="stats-grid" style={{ marginBottom: 20 }}>
                      <StatCard icon={Coffee} label="Tea Cups" value={pd.tea} accent="#F59E0B" />
                      <StatCard icon={Coffee} label="Coffee Cups" value={pd.coffee} accent="#78350F" />
                      <StatCard icon={Wallet} label="Total Spent" value={formatINR(pd.amount)} accent="#6366F1" />
                      <StatCard icon={CheckCircle2} label="Paid" value={formatINR(pd.paid)} accent="#059669" />
                      <StatCard icon={Clock} label="Pending" value={formatINR(pending)} accent="#DC2626" />
                    </div>

                    {pending > 0 && (
                      <div style={{ background: "linear-gradient(135deg, #FEF2F2, #FEE2E2)", border: "1.5px solid #FECACA", borderRadius: 16, padding: "14px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12, fontSize: 14, color: "#991B1B" }}>
                        <AlertCircle size={22} strokeWidth={2.3} />
                        <div><strong>{formatINR(pending)}</strong> pending from {pd.name}</div>
                      </div>
                    )}

                    <div className="card">
                      <div className="card-head">
                        <span className="card-title" style={{ color: "#6B7280" }}>
                          <FileText size={13} strokeWidth={2.5} /> All entries for {pd.name}
                        </span>
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
                                  <td style={{ color: "#6B7280", fontSize: 13, fontWeight: 600 }}>{fmtDate(e.date || today)}</td>
                                  <td><DrinkBadge type={e.drinkType || "tea"} /></td>
                                  <td><span className="pill">{e.teaCount}</span></td>
                                  <td style={{ fontWeight: 800, color: "#D97706", fontSize: 14 }}>{formatINR(amt)}</td>
                                  <td><PayBadge paid={e.paid} /></td>
                                  <td>
                                    <button onClick={() => togglePay(e)} disabled={busyId === e._id}
                                      style={{ padding: "6px 14px", borderRadius: 10, border: "none", fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: "pointer", background: e.paid ? "linear-gradient(135deg, #FEF3C7, #FDE68A)" : "linear-gradient(135deg, #D1FAE5, #A7F3D0)", color: e.paid ? "#92400E" : "#065F46", transition: "all 0.15s", opacity: busyId === e._id ? 0.5 : 1 }}>
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

      {/* ══ ADD PEOPLE ENTRY MODAL ══ */}
      {showAdd && (
        <Modal title={<><Plus size={16} strokeWidth={2.5} /> Add People Entry</>} onClose={() => setShowAdd(false)}>
          <Field label="Drink Type"><DrinkToggle value={addDrink} onChange={setAddDrink} /></Field>
          <Field label="Full Name">
            <Input type="text" placeholder="e.g. Rahul Shah" value={addName} onChange={e => setAddName(e.target.value)} />
          </Field>
          <Field label="Number of Cups">
            <Input type="number" min="1" placeholder="1" value={addCount} onChange={e => setAddCount(e.target.value)} />
          </Field>
          <Field label="Date">
            <DatePicker value={addDate} onChange={setAddDate} />
          </Field>
          {addName && addCount && Number(addCount) >= 1 && (
            <div style={{ fontSize: 13, background: "linear-gradient(135deg, #FFFBEB, #FEF3C7)", border: "1.5px solid #FDE68A", borderRadius: 12, padding: "12px 16px", marginBottom: 14, color: "#92400E", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Wallet size={14} /> Amount:</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: "#D97706" }}>{formatINR(Number(addCount) * getPrice(addDrink))}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>
            <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAdd} disabled={addSaving || !addName.trim() || Number(addCount) < 1}>
              {addSaving ? "Saving…" : <><Check size={14} strokeWidth={2.5} /> Save Entry</>}
            </button>
          </div>
        </Modal>
      )}

      {/* ══ ADD PREVIOUS ENTRY MODAL ══ */}
      {showPrev && (
        <Modal
          title={<><History size={16} strokeWidth={2.5} /> Add Previous Entry</>}
          onClose={() => setShowPrev(false)}
          accent={true}
        >
          {/* Info banner */}
          <div style={{
            background: "linear-gradient(135deg, #EFF6FF, #DBEAFE)",
            border: "1.5px solid #BFDBFE", borderRadius: 12,
            padding: "10px 14px", marginBottom: 18, fontSize: 12.5,
            color: "#1E40AF", fontWeight: 600, display: "flex", alignItems: "center", gap: 8,
          }}>
            <History size={14} strokeWidth={2.5} />
            Forgot to add entry? Pick any past date below — duplicate check applies per person per day.
          </div>

          <Field label="Date (must be before today)">
            <DatePicker value={prevDate} onChange={d => {
              if (d >= today) {
                notify("Choose a past date — use 'Add People Entry' for today", "error");
                return;
              }
              setPrevDate(d);
            }} />
            {prevDate >= today && (
              <div style={{ fontSize: 11.5, color: "#DC2626", marginTop: 5, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                <AlertCircle size={12} /> Must be a past date
              </div>
            )}
          </Field>

          <Field label="Drink Type"><DrinkToggle value={prevDrink} onChange={setPrevDrink} /></Field>

          <Field label="Full Name">
            <Input
              type="text"
              placeholder="e.g. Rahul Shah"
              value={prevName}
              onChange={e => setPrevName(e.target.value)}
              list="prev-name-suggestions"
            />
            {/* Suggest existing people */}
            <datalist id="prev-name-suggestions">
              {allPersons.map(p => <option key={p.name} value={p.name} />)}
            </datalist>
          </Field>

          <Field label="Number of Cups">
            <Input type="number" min="1" placeholder="1" value={prevCount} onChange={e => setPrevCount(e.target.value)} />
          </Field>

          {prevName && prevCount && Number(prevCount) >= 1 && (
            <div style={{ fontSize: 13, background: "linear-gradient(135deg, #EFF6FF, #DBEAFE)", border: "1.5px solid #BFDBFE", borderRadius: 12, padding: "12px 16px", marginBottom: 14, color: "#1E40AF", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Wallet size={14} /> Amount for {fmtDate(prevDate + "T00:00:00")}:
              </span>
              <span style={{ fontSize: 18, fontWeight: 900, color: "#2563EB" }}>{formatINR(Number(prevCount) * getPrice(prevDrink))}</span>
            </div>
          )}

          {/* Warn if duplicate already exists */}
          {prevName.trim() && prevDate < today && isDuplicate(prevName, prevDrink, prevDate) && (
            <div style={{ fontSize: 12.5, background: "#FEF2F2", border: "1.5px solid #FECACA", borderRadius: 10, padding: "10px 14px", marginBottom: 14, color: "#991B1B", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
              <AlertCircle size={14} /> {prevName.trim()} already has a {prevDrink} entry on {fmtDate(prevDate + "T00:00:00")}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>
            <button className="btn btn-ghost" onClick={() => setShowPrev(false)}>Cancel</button>
            <button
              className="btn btn-secondary"
              onClick={handleAddPrev}
              disabled={prevSaving || !prevName.trim() || Number(prevCount) < 1 || prevDate >= today || isDuplicate(prevName, prevDrink, prevDate)}
              style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)", color: "white", border: "none", boxShadow: "0 4px 14px rgba(37,99,235,0.3)" }}
            >
              {prevSaving ? "Saving…" : <><Check size={14} strokeWidth={2.5} /> Save Previous Entry</>}
            </button>
          </div>
        </Modal>
      )}

      {/* ══ EDIT MODAL ══ */}
      {showEdit && editEntry && (
        <Modal title={<><Edit3 size={16} strokeWidth={2.5} /> Edit Entry</>} onClose={() => { setShowEdit(false); setEditEntry(null); }}>
          <Field label="Drink Type"><DrinkToggle value={editDrink} onChange={setEditDrink} /></Field>
          <Field label="Name">
            <Input type="text" value={editName} onChange={e => setEditName(e.target.value)} />
          </Field>
          <Field label="Number of Cups">
            <Input type="number" min="1" value={editCount} onChange={e => setEditCount(e.target.value)} />
          </Field>
          <div style={{ fontSize: 11.5, color: "#6B7280", marginBottom: 8, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
            <CalendarDays size={12} /> Date: {fmtDate((editEntry.date || today) + "T00:00:00")}
          </div>
          {editName && editCount && Number(editCount) >= 1 && (
            <div style={{ fontSize: 13, background: "linear-gradient(135deg, #FFFBEB, #FEF3C7)", border: "1.5px solid #FDE68A", borderRadius: 12, padding: "12px 16px", marginBottom: 14, color: "#92400E", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Wallet size={14} /> Updated Amount:</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: "#D97706" }}>{formatINR(Number(editCount) * getPrice(editDrink))}</span>
            </div>
          )}
          {Number(editCount) !== editEntry.teaCount && (
            <div style={{ fontSize: 12, background: "#EFF6FF", border: "1.5px solid #BFDBFE", borderRadius: 10, padding: "8px 14px", marginBottom: 14, color: "#1E40AF", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
              <Info size={14} strokeWidth={2.3} /> Cups changed from {editEntry.teaCount} → {editCount}. Click "Update" to save.
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>
            <button className="btn btn-ghost" onClick={() => { setShowEdit(false); setEditEntry(null); }}>Cancel</button>
            <button className="btn btn-primary" onClick={handleEdit} disabled={editSaving || !editName.trim() || Number(editCount) < 1}>
              {editSaving ? "Saving…" : <><Check size={14} strokeWidth={2.5} /> Update Entry</>}
            </button>
          </div>
        </Modal>
      )}

      {toast && <Toast key={toast.key} msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </>
  );
}