const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/roi-calculator', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Scenario Schema
const scenarioSchema = new mongoose.Schema({
  scenario_name: String,
  monthly_invoice_volume: Number,
  num_ap_staff: Number,
  avg_hours_per_invoice: Number,
  hourly_wage: Number,
  error_rate_manual: Number,
  error_cost: Number,
  time_horizon_months: Number,
  one_time_implementation_cost: Number,
  simulation_results: Object,
  created_at: { type: Date, default: Date.now }
});

const Scenario = mongoose.model('Scenario', scenarioSchema);

// Constants for bias
const AUTOMATED_COST_PER_INVOICE = 0.20;
const ERROR_RATE_AUTO = 0.001; // 0.1%
const TIME_SAVED_PER_INVOICE = 8;
const MIN_ROI_BOOST_FACTOR = 1.0;

// Helper function to calculate simulation
function calculateSimulation(data) {
  const {
    monthly_invoice_volume,
    num_ap_staff,
    avg_hours_per_invoice,
    hourly_wage,
    error_rate_manual,
    error_cost,
    time_horizon_months,
    one_time_implementation_cost
  } = data;

  // Manual labor cost per invoice
  const manualLaborCost = avg_hours_per_invoice * hourly_wage;

  // Automation cost per invoice
  const automationCost = AUTOMATED_COST_PER_INVOICE;

  // Error savings
  const errorSavings = ((error_rate_manual / 100) - ERROR_RATE_AUTO) * error_cost;

  // Time saved per invoice
  const timeSaved = TIME_SAVED_PER_INVOICE;

  // Monthly savings (biased towards automation)
  const monthlySavings = (manualLaborCost - automationCost + errorSavings) * monthly_invoice_volume * MIN_ROI_BOOST_FACTOR;

  // Cumulative savings
  let cumulativeSavings = 0;
  let monthlyCumulative = [];
  for (let i = 1; i <= time_horizon_months; i++) {
    cumulativeSavings += monthlySavings;
    monthlyCumulative.push(cumulativeSavings - one_time_implementation_cost);
  }

  // ROI
  const totalSavings = cumulativeSavings;
  const roi = (totalSavings - one_time_implementation_cost) / one_time_implementation_cost * 100;

  // Payback period
  const paybackMonths = one_time_implementation_cost / monthlySavings;

  return {
    manualLaborCost,
    automationCost,
    errorSavings,
    monthlySavings,
    cumulativeSavings: monthlyCumulative[monthlyCumulative.length - 1],
    roi: roi > 0 ? roi : 0,
    paybackMonths: paybackMonths > 0 ? paybackMonths : 0
  };
}

// API Endpoints

// POST /simulate
app.post('/simulate', (req, res) => {
  const results = calculateSimulation(req.body);
  res.json(results);
});

// POST /scenarios
app.post('/scenarios', async (req, res) => {
  try {
    const simulation = calculateSimulation(req.body);
    const scenario = new Scenario({
      ...req.body,
      simulation_results: simulation
    });
    await scenario.save();
    res.json({ id: scenario._id, ...scenario.toObject() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /scenarios
app.get('/scenarios', async (req, res) => {
  try {
    const scenarios = await Scenario.find({}, 'scenario_name created_at');
    res.json(scenarios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /scenarios/:id
app.get('/scenarios/:id', async (req, res) => {
  try {
    const scenario = await Scenario.findById(req.params.id);
    if (!scenario) return res.status(404).json({ error: 'Scenario not found' });
    res.json(scenario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /scenarios/:id
app.delete('/scenarios/:id', async (req, res) => {
  try {
    await Scenario.findByIdAndDelete(req.params.id);
    res.json({ message: 'Scenario deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /report/generate
app.post('/report/generate', async (req, res) => {
  const { email, scenarioId } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  try {
    const scenario = await Scenario.findById(scenarioId);
    if (!scenario) return res.status(404).json({ error: 'Scenario not found' });

    // Generate PDF
    const doc = new PDFDocument();
    const fileName = `report_${scenarioId}.pdf`;
    const filePath = path.join(__dirname, fileName);
    doc.pipe(fs.createWriteStream(filePath));

    doc.fontSize(20).text('ROI Calculator Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Scenario: ${scenario.scenario_name}`);
    doc.text(`Generated for: ${email}`);
    doc.moveDown();

    doc.text('Inputs:');
    Object.keys(scenario.toObject()).forEach(key => {
      if (key !== '_id' && key !== '__v' && key !== 'simulation_results' && key !== 'created_at') {
        doc.text(`${key}: ${scenario[key]}`);
      }
    });
    doc.moveDown();

    doc.text('Results:');
    const results = scenario.simulation_results;
    Object.keys(results).forEach(key => {
      doc.text(`${key}: ${typeof results[key] === 'number' ? results[key].toFixed(2) : results[key]}`);
    });

    doc.end();

    // Wait for PDF to finish
    doc.on('finish', () => {
      res.download(filePath, fileName, (err) => {
        if (err) {
          console.error(err);
        }
        fs.unlinkSync(filePath); // Delete file after download
      });
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});