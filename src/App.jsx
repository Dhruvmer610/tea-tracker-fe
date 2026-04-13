import { useEffect, useState, useCallback } from "react";
import axios from "axios";

const API = "http://localhost:5000/api";

/* ─── helpers ─────────────────────────────────────────────── */
function getInitials(name) {
  return name.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase();
}
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}
function isoToday() {
  return new Date().toISOString().split("T")[0];
}
function groupByDate(entries) {
  const map = {};
  entries.forEach((e) => {
    const d = (e.date || isoToday()).split("T")[0];
    if (!map[d]) map[d] = [];
    map[d].push(e);
  });
  return map;
}

/* ─── styles ──────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&family=Playfair+Display:wght@600;700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --tea:       #7C4A1E;
  --tea-light: #B5712F;
  --tea-pale:  #F9F1E7;
  --tea-mid:   #D4956A;
  --surface:   #FFFAF6;
  --card:      #FFFFFF;
  --border:    rgba(124,74,30,0.13);
  --text:      #1A120B;
  --muted:     #7B6B60;
  --tag-bg:    #F3E8DE;
  --green:     #2E7D5E;
  --green-bg:  #EBF6F1;
  --indigo:    #3D4FB5;
  --indigo-bg: #ECEFFE;
  --red:       #C0392B;
  --sidebar-w: 248px;
  --font:      'DM Sans', sans-serif;
  --serif:     'Playfair Display', serif;
}

html, body, #root { height: 100%; font-family: var(--font); background: var(--surface); color: var(--text); }

.layout { display: flex; min-height: 100vh; }

/* ── Sidebar ── */
.sidebar {
  width: var(--sidebar-w);
  background: var(--card);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0; left: 0; bottom: 0;
  z-index: 100;
  transition: transform 0.25s ease;
}
.sidebar-logo {
  padding: 1.4rem 1.25rem 1rem;
  border-bottom: 1px solid var(--border);
}
.sidebar-logo h2 { font-family: var(--serif); font-size: 18px; color: var(--tea); line-height: 1.1; }
.sidebar-logo span { font-size: 11px; color: var(--muted); font-weight: 400; display: block; margin-top: 3px; }
.nav { padding: 0.75rem; flex: 1; overflow-y: auto; }
.nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 12px; border-radius: 10px;
  cursor: pointer; font-size: 13.5px; font-weight: 500; color: var(--muted);
  transition: background 0.12s, color 0.12s;
  margin-bottom: 2px; border: none; background: none; width: 100%; text-align: left;
}
.nav-item:hover  { background: var(--tea-pale); color: var(--tea); }
.nav-item.active { background: var(--tea-pale); color: var(--tea); font-weight: 600; }
.nav-icon { font-size: 15px; flex-shrink: 0; }
.nav-sep { font-size: 10px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.7px; padding: 10px 12px 4px; }
.sidebar-footer { padding: 1rem 1.25rem; border-top: 1px solid var(--border); font-size: 11px; color: var(--muted); }
.today-chip { background: var(--tea-pale); color: var(--tea); font-size: 10.5px; font-weight: 600; padding: 4px 10px; border-radius: 20px; border: 1px solid rgba(124,74,30,0.18); display: inline-block; margin-bottom: 4px; }

/* ── Main ── */
.main { margin-left: var(--sidebar-w); flex: 1; min-height: 100vh; padding: 2rem 2rem 3rem; }

/* ── Page header ── */
.page-head { display: flex; align-items: flex-end; justify-content: space-between; border-bottom: 1px solid var(--border); padding-bottom: 1.25rem; margin-bottom: 1.75rem; }
.page-head h1 { font-family: var(--serif); font-size: 26px; color: var(--tea); line-height: 1.1; }
.page-head p  { font-size: 12.5px; color: var(--muted); margin-top: 3px; }

/* ── Stats ── */
.stats { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 12px; margin-bottom: 1.5rem; }
.stat-card { background: var(--card); border: 1px solid var(--border); border-radius: 13px; padding: 1rem 1.2rem; }
.stat-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 9px; font-size: 15px; }
.stat-icon.tea   { background: var(--tea-pale);  color: var(--tea); }
.stat-icon.money { background: var(--green-bg);  color: var(--green); }
.stat-icon.ppl   { background: var(--indigo-bg); color: var(--indigo); }
.stat-label { font-size: 10.5px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.6px; font-weight: 500; margin-bottom: 3px; }
.stat-value { font-size: 24px; font-weight: 600; color: var(--text); line-height: 1; }

/* ── Card base ── */
.card { background: var(--card); border: 1px solid var(--border); border-radius: 13px; }
.card-head { padding: 0.9rem 1.4rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
.card-title { font-size: 11px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.7px; }
.pill { font-size: 10.5px; background: var(--tag-bg); color: var(--tea); padding: 3px 10px; border-radius: 20px; font-weight: 500; }

/* ── Add Entry ── */
.add-card { padding: 1.2rem 1.4rem; margin-bottom: 1.4rem; }
.add-row { display: flex; gap: 10px; flex-wrap: wrap; }
.add-row input {
  flex: 1; min-width: 130px;
  background: var(--surface); border: 1px solid var(--border); border-radius: 9px;
  padding: 9px 13px; font-family: var(--font); font-size: 13.5px; color: var(--text);
  outline: none; transition: border-color 0.14s, box-shadow 0.14s;
}
.add-row input:focus { border-color: var(--tea-mid); box-shadow: 0 0 0 3px rgba(181,113,47,0.1); }
.add-row input::placeholder { color: #b9a89a; }
.add-row input:disabled { opacity: 0.5; cursor: not-allowed; }
.add-btn {
  background: var(--tea); color: #fff; border: none; padding: 9px 18px;
  border-radius: 9px; font-family: var(--font); font-size: 13.5px; font-weight: 500;
  cursor: pointer; transition: background 0.14s, transform 0.1s, opacity 0.14s;
  white-space: nowrap; display: flex; align-items: center; gap: 5px;
}
.add-btn:hover:not(:disabled)  { background: var(--tea-light); }
.add-btn:active:not(:disabled) { transform: scale(0.97); }
.add-btn:disabled { opacity: 0.55; cursor: not-allowed; }
.warn-msg { font-size: 12px; color: var(--red); margin-top: 8px; display: flex; align-items: center; gap: 5px; }

/* ── Table ── */
.table-card { margin-bottom: 1.4rem; overflow: hidden; }
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
thead tr { background: #FDFAF7; }
th { padding: 9px 14px; text-align: left; font-size: 10.5px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.6px; border-bottom: 1px solid var(--border); }
td { padding: 11px 14px; border-bottom: 1px solid rgba(124,74,30,0.06); }
tbody tr:last-child td { border-bottom: none; }
tbody tr { transition: background 0.1s; }
tbody tr:hover td { background: #FDFAF7; }
.name-row { display: flex; align-items: center; gap: 8px; }
.avatar { width: 26px; height: 26px; border-radius: 50%; background: var(--tea-pale); color: var(--tea); font-size: 9.5px; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; letter-spacing: 0.3px; }
.cups-badge { background: var(--tag-bg); color: var(--tea); font-size: 11.5px; padding: 2px 8px; border-radius: 20px; font-weight: 500; }
.amount-cell { font-weight: 600; color: var(--tea); }
.del-btn { background: none; border: 1px solid transparent; color: var(--muted); font-size: 11.5px; padding: 3px 9px; border-radius: 7px; cursor: pointer; font-family: var(--font); transition: all 0.13s; }
.del-btn:hover { background: #FDECEA; color: var(--red); border-color: rgba(192,57,43,0.2); }
.empty-state td { text-align: center; padding: 2.2rem; color: var(--muted); font-size: 13.5px; }

/* ── Two-col ── */
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

/* ── Trends ── */
.top-badge { background: var(--tea-pale); border: 1px solid rgba(124,74,30,0.15); border-radius: 9px; padding: 9px 12px; margin-bottom: 12px; display: flex; align-items: center; gap: 10px; }
.top-badge-label { font-size: 10.5px; color: var(--muted); font-weight: 500; }
.top-badge-name  { font-size: 13.5px; font-weight: 600; color: var(--tea); }
.trend-item { margin-bottom: 13px; }
.trend-item:last-child { margin-bottom: 0; }
.trend-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
.trend-name { font-size: 12.5px; font-weight: 500; color: var(--text); }
.trend-val  { font-size: 11.5px; color: var(--muted); }
.bar-track { width: 100%; background: #F3E8DE; border-radius: 6px; height: 5px; overflow: hidden; }
.bar-fill  { height: 5px; border-radius: 6px; background: linear-gradient(90deg, var(--tea-mid), var(--tea)); transition: width 0.55s cubic-bezier(0.4,0,0.2,1); }

/* ── Summary cards ── */
.summary-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px,1fr)); gap: 9px; }
.person-card { background: var(--tea-pale); border: 1px solid rgba(124,74,30,0.1); border-radius: 11px; padding: 0.85rem 0.95rem; }
.person-name   { font-size: 13.5px; font-weight: 600; color: var(--text); }
.person-cups   { font-size: 11.5px; color: var(--muted); margin-top: 2px; }
.person-amount { font-size: 18px; font-weight: 700; color: var(--tea); margin-top: 7px; border-top: 1px solid rgba(124,74,30,0.12); padding-top: 7px; }
.person-amount-label { font-size: 10.5px; color: var(--muted); font-weight: 400; }

/* ── Spinner ── */
.spinner-wrap { display: flex; justify-content: center; align-items: center; padding: 2.5rem; }
.spinner { width: 26px; height: 26px; border: 2px solid var(--border); border-top-color: var(--tea); border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.no-data { text-align: center; padding: 1.5rem; color: var(--muted); font-size: 13px; }

/* ════ LIST PAGE ════ */
.list-page { padding-bottom: 1rem; }
.date-group { margin-bottom: 1.75rem; }
.date-group-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.date-label { font-size: 11px; font-weight: 600; color: var(--tea); text-transform: uppercase; letter-spacing: 0.7px; background: var(--tea-pale); border: 1px solid rgba(124,74,30,0.15); padding: 4px 12px; border-radius: 20px; white-space: nowrap; }
.date-label.today { background: var(--tea); color: #fff; border-color: var(--tea); }
.date-meta { font-size: 11px; color: var(--muted); }
.date-divider { flex: 1; height: 1px; background: var(--border); }
.date-summary-row { display: flex; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
.ds-chip { font-size: 11.5px; font-weight: 500; padding: 3px 10px; border-radius: 20px; }
.ds-chip.teas   { background: var(--tea-pale);  color: var(--tea); }
.ds-chip.spend  { background: var(--green-bg);  color: var(--green); }
.ds-chip.people { background: var(--indigo-bg); color: var(--indigo); }
.list-card { background: var(--card); border: 1px solid var(--border); border-radius: 13px; overflow: hidden; }

/* ── Responsive ── */
@media (max-width: 860px) { :root { --sidebar-w: 210px; } }
@media (max-width: 680px) {
  .sidebar { transform: translateX(-100%); }
  .sidebar.open { transform: translateX(0); box-shadow: 4px 0 24px rgba(0,0,0,0.08); }
  .main { margin-left: 0; padding: 1.25rem 1rem 3rem; }
  .stats { grid-template-columns: 1fr 1fr; }
  .stats .stat-card:last-child { grid-column: span 2; }
  .two-col { grid-template-columns: 1fr; }
  .mob-menu-btn { display: flex !important; }
}
.mob-menu-btn { display: none; align-items: center; gap: 6px; background: none; border: 1px solid var(--border); padding: 6px 12px; border-radius: 8px; font-size: 13px; color: var(--tea); cursor: pointer; font-family: var(--font); margin-bottom: 1.25rem; }
.overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.25); z-index: 99; }
.overlay.show { display: block; }
`;

/* ══════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════ */
export default function App() {
  const [entries, setEntries]     = useState([]);
  const [name, setName]           = useState("");
  const [count, setCount]         = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding]   = useState(false);
  const [tab, setTab]             = useState("home");
  const [sidebarOpen, setSidebar] = useState(false);
  const [dupWarn, setDupWarn]     = useState(false);

  const today = isoToday();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API}/tea`);
      setEntries(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Entries for today only
  const todayEntries = entries.filter(
    (e) => (e.date || today).split("T")[0] === today
  );

  // Names already added today (for duplicate guard)
  const todayNames = new Set(
    todayEntries.map((e) => e.name.trim().toLowerCase())
  );

  const handleNameChange = (val) => {
    setName(val);
    setDupWarn(
      val.trim() !== "" && todayNames.has(val.trim().toLowerCase())
    );
  };

  const addEntry = async () => {
    if (!name.trim() || !count) return alert("Please fill all fields");
    if (Number(count) <= 0) return alert("Tea count must be greater than 0");
    if (todayNames.has(name.trim().toLowerCase())) {
      setDupWarn(true);
      return;
    }
    setIsAdding(true);
    try {
      await axios.post(`${API}/tea`, {
        name: name.trim(),
        teaCount: Number(count),
        date: today,
      });
      setName("");
      setCount("");
      setDupWarn(false);
      await fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to add entry");
    } finally {
      setIsAdding(false);
    }
  };

  const deleteEntry = async (id) => {
    if (!window.confirm("Remove this entry?")) return;
    try {
      await axios.delete(`${API}/tea/${id}`);
      await fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to delete entry");
    }
  };

  /* ── Today aggregation ── */
  const personTotals = {};
  let totalTeas = 0, totalExpense = 0;
  todayEntries.forEach(({ name, teaCount, amount }) => {
    if (!personTotals[name]) personTotals[name] = { teaCount: 0, amount: 0 };
    personTotals[name].teaCount += teaCount;
    personTotals[name].amount   += amount;
    totalTeas    += teaCount;
    totalExpense += amount;
  });
  const sortedPeople = Object.entries(personTotals)
    .map(([n, d]) => ({ name: n, ...d }))
    .sort((a, b) => b.amount - a.amount);
  const topSpender = sortedPeople[0] || null;
  const maxAmount  = sortedPeople.length ? sortedPeople[0].amount : 1;

  /* ── Date-grouped (all entries, newest first) ── */
  const grouped  = groupByDate(entries);
  const dateKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const closeSidebar = () => setSidebar(false);
  const navigate = (t) => { setTab(t); closeSidebar(); };

  /* ═══════════════════════ RENDER ═══════════════════════ */
  return (
    <>
      <style>{CSS}</style>

      <div className="layout">
        <div
          className={`overlay ${sidebarOpen ? "show" : ""}`}
          onClick={closeSidebar}
        />

        {/* ── Sidebar ── */}
        <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="sidebar-logo">
            <h2>☕ Tea Tracker</h2>
            <span>Expense management</span>
          </div>

          <nav className="nav">
            <div className="nav-sep">Menu</div>
            <button
              className={`nav-item ${tab === "home" ? "active" : ""}`}
              onClick={() => navigate("home")}
            >
              <span className="nav-icon">🏠</span> Dashboard
            </button>
            <button
              className={`nav-item ${tab === "list" ? "active" : ""}`}
              onClick={() => navigate("list")}
            >
              <span className="nav-icon">📋</span> Entry List
            </button>
          </nav>

          <div className="sidebar-footer">
            <div className="today-chip">{fmtDate(today)}</div>
            <div>Today's session</div>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="main">
          <button className="mob-menu-btn" onClick={() => setSidebar(true)}>
            ☰ Menu
          </button>

          {/* ════════ HOME / DASHBOARD ════════ */}
          {tab === "home" && (
            <>
              <div className="page-head">
                <div>
                  <h1>Dashboard</h1>
                  <p>Today — {fmtDate(today)}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="stats">
                <div className="stat-card">
                  <div className="stat-icon tea">☕</div>
                  <div className="stat-label">Today's Teas</div>
                  <div className="stat-value">{totalTeas}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon money">💰</div>
                  <div className="stat-label">Today's Expense</div>
                  <div className="stat-value">₹{totalExpense}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon ppl">👥</div>
                  <div className="stat-label">Contributors</div>
                  <div className="stat-value">{Object.keys(personTotals).length}</div>
                </div>
              </div>

              {/* Add Entry */}
              <div className="card add-card">
                <div className="card-title" style={{ marginBottom: "1rem" }}>
                  Add new entry
                </div>
                <div className="add-row">
                  <input
                    placeholder="Person's name"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      document.getElementById("cntInput").focus()
                    }
                    style={dupWarn ? { borderColor: "var(--red)" } : {}}
                  />
                  <input
                    id="cntInput"
                    type="number"
                    placeholder="Tea count"
                    min="1"
                    value={count}
                    onChange={(e) => setCount(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addEntry()}
                    disabled={dupWarn}
                  />
                  <button
                    className="add-btn"
                    onClick={addEntry}
                    disabled={isAdding || dupWarn}
                  >
                    {isAdding ? "Adding…" : "+ Add Entry"}
                  </button>
                </div>
                {dupWarn && (
                  <div className="warn-msg">
                    ⚠ <strong>{name.trim()}</strong> has already been added
                    today. Only one entry per person per day is allowed.
                  </div>
                )}
              </div>

              {/* Today's Entries Table */}
              <div className="card table-card">
                <div className="card-head">
                  <span className="card-title">Today's Entries</span>
                  <span className="pill">
                    {todayEntries.length}{" "}
                    {todayEntries.length === 1 ? "record" : "records"}
                  </span>
                </div>
                <div className="table-wrap">
                  {isLoading ? (
                    <div className="spinner-wrap">
                      <div className="spinner" />
                    </div>
                  ) : (
                    <table>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Cups</th>
                          <th>Amount</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {todayEntries.length === 0 ? (
                          <tr className="empty-state">
                            <td colSpan="4">
                              No entries yet — add your first tea above
                            </td>
                          </tr>
                        ) : (
                          [...todayEntries].reverse().map((e) => (
                            <tr key={e._id}>
                              <td>
                                <div className="name-row">
                                  <span className="avatar">
                                    {getInitials(e.name)}
                                  </span>
                                  <span style={{ fontWeight: 500 }}>
                                    {e.name}
                                  </span>
                                </div>
                              </td>
                              <td>
                                <span className="cups-badge">
                                  {e.teaCount} cups
                                </span>
                              </td>
                              <td className="amount-cell">₹{e.amount}</td>
                              <td>
                                <button
                                  className="del-btn"
                                  onClick={() => deleteEntry(e._id)}
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Trends + Summary */}
              <div className="two-col">
                <div className="card" style={{ padding: "1.2rem 1.4rem" }}>
                  <div className="card-title" style={{ marginBottom: "1rem" }}>
                    Spending trends
                  </div>
                  {topSpender && (
                    <div className="top-badge">
                      <span style={{ fontSize: 16 }}>🏆</span>
                      <div>
                        <div className="top-badge-label">Top spender</div>
                        <div className="top-badge-name">
                          {topSpender.name} · ₹{topSpender.amount}
                        </div>
                      </div>
                    </div>
                  )}
                  {sortedPeople.length === 0 ? (
                    <div className="no-data">Add entries to see trends</div>
                  ) : (
                    sortedPeople.map((p) => (
                      <div className="trend-item" key={p.name}>
                        <div className="trend-row">
                          <span className="trend-name">{p.name}</span>
                          <span className="trend-val">
                            ₹{p.amount} · {p.teaCount} cups
                          </span>
                        </div>
                        <div className="bar-track">
                          <div
                            className="bar-fill"
                            style={{
                              width: `${Math.round(
                                (p.amount / maxAmount) * 100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="card" style={{ padding: "1.2rem 1.4rem" }}>
                  <div className="card-title" style={{ marginBottom: "1rem" }}>
                    Individual summary
                  </div>
                  {sortedPeople.length === 0 ? (
                    <div className="no-data">No data yet</div>
                  ) : (
                    <div className="summary-grid">
                      {sortedPeople.map((p) => (
                        <div className="person-card" key={p.name}>
                          <div className="person-name">{p.name}</div>
                          <div className="person-cups">
                            {p.teaCount} cups total
                          </div>
                          <div className="person-amount">
                            ₹{p.amount}
                            <span className="person-amount-label"> spent</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ════════ LIST TAB ════════ */}
          {tab === "list" && (
            <>
              <div className="page-head">
                <div>
                  <h1>Entry List</h1>
                  <p>Date-wise history of all tea entries</p>
                </div>
                <span className="pill" style={{ alignSelf: "center" }}>
                  {dateKeys.length} {dateKeys.length === 1 ? "day" : "days"}
                </span>
              </div>

              {isLoading ? (
                <div className="spinner-wrap">
                  <div className="spinner" />
                </div>
              ) : dateKeys.length === 0 ? (
                <div
                  className="card"
                  style={{ padding: "2.5rem", textAlign: "center" }}
                >
                  <div className="no-data">
                    No entries yet. Go to Dashboard to add entries.
                  </div>
                </div>
              ) : (
                <div className="list-page">
                  {dateKeys.map((dateKey) => {
                    const dayEntries = grouped[dateKey];
                    const isToday   = dateKey === today;

                    let dayTeas = 0, dayExpense = 0;
                    const dayPersons = {};
                    dayEntries.forEach(({ name, teaCount, amount }) => {
                      dayTeas    += teaCount;
                      dayExpense += amount;
                      if (!dayPersons[name])
                        dayPersons[name] = { teaCount: 0, amount: 0 };
                      dayPersons[name].teaCount += teaCount;
                      dayPersons[name].amount   += amount;
                    });
                    const dayPeople = Object.keys(dayPersons).length;

                    return (
                      <div className="date-group" key={dateKey}>
                        <div className="date-group-header">
                          <span
                            className={`date-label ${isToday ? "today" : ""}`}
                          >
                            {isToday ? "Today" : fmtDate(dateKey)}
                          </span>
                          {isToday && (
                            <span className="date-meta">
                              {fmtDate(dateKey)}
                            </span>
                          )}
                          <div className="date-divider" />
                        </div>

                        <div className="date-summary-row">
                          <span className="ds-chip teas">
                            ☕ {dayTeas} cups
                          </span>
                          <span className="ds-chip spend">
                            ₹{dayExpense} spent
                          </span>
                          <span className="ds-chip people">
                            👥 {dayPeople}{" "}
                            {dayPeople === 1 ? "person" : "people"}
                          </span>
                        </div>

                        <div className="list-card">
                          <div className="table-wrap">
                            <table>
                              <thead>
                                <tr>
                                  <th>Name</th>
                                  <th>Cups</th>
                                  <th>Amount</th>
                                  {isToday && <th>Action</th>}
                                </tr>
                              </thead>
                              <tbody>
                                {dayEntries.map((e) => (
                                  <tr key={e._id}>
                                    <td>
                                      <div className="name-row">
                                        <span className="avatar">
                                          {getInitials(e.name)}
                                        </span>
                                        <span style={{ fontWeight: 500 }}>
                                          {e.name}
                                        </span>
                                      </div>
                                    </td>
                                    <td>
                                      <span className="cups-badge">
                                        {e.teaCount} cups
                                      </span>
                                    </td>
                                    <td className="amount-cell">
                                      ₹{e.amount}
                                    </td>
                                    {isToday && (
                                      <td>
                                        <button
                                          className="del-btn"
                                          onClick={() => deleteEntry(e._id)}
                                        >
                                          Remove
                                        </button>
                                      </td>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </>
  );
}