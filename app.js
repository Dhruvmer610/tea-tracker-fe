import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:5000";

export default function App() {
  const [entries, setEntries] = useState([]);
  const [name, setName] = useState("");
  const [count, setCount] = useState("");

  const fetchData = async () => {
    const res = await axios.get(`${API}/all`);
    setEntries(res.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addEntry = async () => {
    const newEntry = {
      name,
      teaCount: count,
      amount: count * 10,
      date: new Date().toISOString(),
    };

    await axios.post(`${API}/add`, newEntry);
    fetchData();
  };

  // summary
  const totals = {};
  entries.forEach((e) => {
    totals[e.name] = (totals[e.name] || 0) + e.amount;
  });

  return (
    <div>
      <h1>Tea Tracker</h1>

      <input placeholder="Name" onChange={(e) => setName(e.target.value)} />
      <input placeholder="Tea Count" onChange={(e) => setCount(e.target.value)} />

      <button onClick={addEntry}>Add</button>

      <h2>Summary</h2>
      {Object.entries(totals).map(([name, total]) => (
        <p key={name}>
          {name} → ₹{total}
        </p>
      ))}
    </div>
  );
}