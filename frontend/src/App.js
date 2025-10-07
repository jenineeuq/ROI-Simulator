import { useState, useEffect } from "react";

function App() {
  const [formData, setFormData] = useState({
    scenario_name: "",
    monthly_invoice_volume: "",
    num_ap_staff: "",
    avg_hours_per_invoice: "",
    hourly_wage: "",
    error_rate_manual: "",
    error_cost: "",
    time_horizon_months: "",
    one_time_implementation_cost: "",
  });

  const [results, setResults] = useState(null);
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState("");

  const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    // Live calculation
    if (Object.values(formData).every((v) => v !== "")) {
      fetch(`${API_BASE}/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
        .then((res) => res.json())
        .then(setResults)
        .catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  useEffect(() => {
    fetch(`${API_BASE}/scenarios`)
      .then((res) => res.json())
      .then(setScenarios)
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = () => {
    fetch(`${API_BASE}/scenarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    })
      .then((res) => res.json())
      .then(() => {
        fetch(`${API_BASE}/scenarios`)
          .then((res) => res.json())
          .then(setScenarios);
      })
      .catch(console.error);
  };

  const handleLoad = (id) => {
    fetch(`${API_BASE}/scenarios/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setFormData({
          scenario_name: data.scenario_name,
          monthly_invoice_volume: data.monthly_invoice_volume,
          num_ap_staff: data.num_ap_staff,
          avg_hours_per_invoice: data.avg_hours_per_invoice,
          hourly_wage: data.hourly_wage,
          error_rate_manual: data.error_rate_manual,
          error_cost: data.error_cost,
          time_horizon_months: data.time_horizon_months,
          one_time_implementation_cost: data.one_time_implementation_cost,
        });
        setSelectedScenario(id);
      })
      .catch(console.error);
  };

  const handleDelete = (id) => {
    fetch(`${API_BASE}/scenarios/${id}`, { method: "DELETE" })
      .then(() => {
        setScenarios((prev) => prev.filter((s) => s._id !== id));
        if (selectedScenario === id) setSelectedScenario(null);
      })
      .catch(console.error);
  };

  const handleDownload = () => {
    if (!email) return;
    fetch(`${API_BASE}/report/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, scenarioId: selectedScenario }),
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "report.pdf";
        a.click();
        window.URL.revokeObjectURL(url);
      })
      .catch(console.error);
    setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            ROI Calculator
          </h1>
          <p className="text-xl text-gray-600">Manual vs Automated Invoicing Analysis</p>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 mx-auto mt-4 rounded-full"></div>
        </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800 flex items-center">
            <div className="w-2 h-8 bg-blue-500 rounded-full mr-3"></div>
            Simulation Parameters
          </h2>
          <form className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Scenario Name</label>
              <input
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                name="scenario_name"
                placeholder="e.g., Q4 Pilot Program"
                value={formData.scenario_name}
                onChange={handleInputChange}
              />
            </div>
            <input
              className="w-full p-2 border"
              name="monthly_invoice_volume"
              placeholder="Monthly Invoice Volume"
              type="number"
              value={formData.monthly_invoice_volume}
              onChange={handleInputChange}
            />
            <input
              className="w-full p-2 border"
              name="num_ap_staff"
              placeholder="Number of AP Staff"
              type="number"
              value={formData.num_ap_staff}
              onChange={handleInputChange}
            />
            <input
              className="w-full p-2 border"
              name="avg_hours_per_invoice"
              placeholder="Avg Hours per Invoice (e.g., 0.17 for 10 mins)"
              type="number"
              step="0.01"
              value={formData.avg_hours_per_invoice}
              onChange={handleInputChange}
            />
            <input
              className="w-full p-2 border"
              name="hourly_wage"
              placeholder="Hourly Wage"
              type="number"
              step="0.01"
              value={formData.hourly_wage}
              onChange={handleInputChange}
            />
            <input
              className="w-full p-2 border"
              name="error_rate_manual"
              placeholder="Error Rate Manual (%)"
              type="number"
              step="0.01"
              value={formData.error_rate_manual}
              onChange={handleInputChange}
            />
            <input
              className="w-full p-2 border"
              name="error_cost"
              placeholder="Error Cost"
              type="number"
              step="0.01"
              value={formData.error_cost}
              onChange={handleInputChange}
            />
            <input
              className="w-full p-2 border"
              name="time_horizon_months"
              placeholder="Time Horizon (Months)"
              type="number"
              value={formData.time_horizon_months}
              onChange={handleInputChange}
            />
            <input
              className="w-full p-2 border"
              name="one_time_implementation_cost"
              placeholder="One-Time Implementation Cost"
              type="number"
              step="0.01"
              value={formData.one_time_implementation_cost}
              onChange={handleInputChange}
            />
          </form>
          <div className="mt-4 space-x-2">
            <button
              className="bg-blue-500 text-white p-2 rounded"
              onClick={handleSave}
            >
              Save Scenario
            </button>
            {selectedScenario && (
              <button
                className="bg-red-500 text-white p-2 rounded"
                onClick={() => handleDelete(selectedScenario)}
              >
                Delete Scenario
              </button>
            )}
            {selectedScenario && (
              <button
                className="bg-green-500 text-white p-2 rounded"
                onClick={() => setShowModal(true)}
              >
                Download Report
              </button>
            )}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800 flex items-center">
            <div className="w-2 h-8 bg-green-500 rounded-full mr-3"></div>
            ROI Analysis Results
          </h2>
          {results ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-400">
                  <div className="text-sm font-medium text-red-800">Monthly Labor Cost</div>
                  <div className="text-2xl font-bold text-red-600">${results.manualLaborCost?.toFixed(2)}</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                  <div className="text-sm font-medium text-blue-800">Automation Cost</div>
                  <div className="text-2xl font-bold text-blue-600">${results.automationCost?.toFixed(2)}</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
                  <div className="text-sm font-medium text-green-800">Error Savings</div>
                  <div className="text-2xl font-bold text-green-600">${results.errorSavings?.toFixed(2)}</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-400">
                  <div className="text-sm font-medium text-purple-800">Monthly Savings</div>
                  <div className="text-2xl font-bold text-purple-600">${results.monthlySavings?.toFixed(2)}</div>
                </div>
              </div>
              <div className="mt-6 space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">Cumulative Savings</span>
                  <span className="text-xl font-bold text-gray-800">${results.cumulativeSavings?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg">
                  <span className="font-medium text-indigo-700">ROI</span>
                  <span className="text-xl font-bold text-indigo-600">{results.roi?.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <span className="font-medium text-orange-700">Payback Period</span>
                  <span className="text-xl font-bold text-orange-600">{results.paybackMonths?.toFixed(2)} months</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">📊</div>
              <p>Fill out the form to see your ROI analysis</p>
            </div>
          )}
        </div>
      </div>
      <div className="mt-8">
        <h2 className="text-xl mb-2">Saved Scenarios</h2>
        <ul className="space-y-1">
          {scenarios.map((s) => (
            <li key={s._id} className="flex justify-between p-2 border rounded">
              <span>{s.scenario_name}</span>
              <div className="space-x-2">
                <button
                  className="text-blue-500"
                  onClick={() => handleLoad(s._id)}
                >
                  Load
                </button>
                <button
                  className="text-red-500"
                  onClick={() => handleDelete(s._id)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-4 rounded">
            <h3 className="text-lg mb-2">Enter Email for Report</h3>
            <input
              className="w-full p-2 border mb-2"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="space-x-2">
              <button
                className="bg-blue-500 text-white p-2 rounded"
                onClick={handleDownload}
              >
                Download
              </button>
              <button
                className="bg-gray-500 text-white p-2 rounded"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

export default App;
