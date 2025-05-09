import express from 'express';
import * as db from './source-sqlite.js';
import { fileURLToPath } from 'url'; // For converting file URL to path
import path, { dirname } from 'path'; // For working with file paths

const app = express();
const PORT = 8080;

// For ES modules, simulate __dirname
const __filename = fileURLToPath(import.meta.url); // Convert file URL to path
const __dirname = dirname(__filename); // Get the directory path

app.use(express.json());
app.use(express.static(__dirname + '/client'));

app.get('/', (req, res) => {
  res.sendFile(`${__dirname}/client/index.html`);
});

app.get('/runners.csv', (req, res) => {
  res.sendFile(path.join(__dirname, 'runners.csv'));
});

async function addTime(req, res) {
  try {
    const { type, times, id } = req.body;

    if (!Array.isArray(times) || times.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No time data provided',
      });
    }

    const result = await db.addRaceData(type, times, id);

    if (!result.success) {
      return res.status(500).json({
        status: 'error',
        message: result.error || 'Failed to save timing data',
      });
    }

    return res.json({
      status: 'success',
      message: 'Timing data submitted successfully',
    });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
}

async function addRunners(req, res) {
  try {
    const { type, runners, id } = req.body;

    if (!Array.isArray(runners) || runners.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No runner data provided',
      });
    }

    const result = await db.addRaceData(type, runners, id);

    if (!result.success) {
      return res.status(500).json({
        status: 'error',
        message: result.error || 'Failed to save runner data',
      });
    }

    return res.json({
      status: 'success',
      message: 'Runner data submitted successfully',
    });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
}

async function createResults(req, res) {
  try {
    const { results } = req.body;

    if (!Array.isArray(results) || results.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No results data provided',
      });
    }

    const times = [];
    const runners = [];

    for (let i = 0; i < results.length; i++) {
      times.push(results[i].time);
      runners.push({
        id: results[i].id,
        name: results[i].name,
        position: results[i].position,
      });
    }

    const result = await db.addRaceResult(times, runners);

    if (result.success) {
      return res.json({
        status: 'success',
        message: 'Results saved successfully',
      });
    } else {
      return res.status(500).json({
        status: 'error',
        message: result.error || 'Failed to save results',
      });
    }
  } catch (error) {
    console.error('Error creating results:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
}

async function getAllData(req, res) {
  try {
    const result = await db.getAllRaceData();

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json({
      status: 'success',
      data: result.data,
    });
  } catch (error) {
    console.error('Error in route handler:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message,
    });
  }
}

async function getTimes(req, res) {
  try {
    const result = await db.getRaceData('times');
    res.json(result);
  } catch (error) {
    console.error('Error fetching times:', error);
    res.status(500).json({ status: 'error', message: 'Error fetching times' });
  }
}

async function getRunners(req, res) {
  try {
    const result = await db.getRaceData('runners');
    res.json(result);
  } catch (error) {
    console.error('Error fetching runners:', error);
    res.status(500).json({ status: 'error', message: 'Error fetching runners' });
  }
}

async function getResults(req, res) {
  try {
    const dbResult = await db.getCurrentResults();

    if (!dbResult.success) {
      return res.status(500).json({
        status: 'error',
        message: dbResult.error || 'Database error',
      });
    }

    const results = [];
    const minLength = Math.min(dbResult.times.length, dbResult.runners.length);

    for (let i = 0; i < minLength; i++) {
      results.push({
        position: dbResult.runners[i].position,
        name: dbResult.runners[i].name,
        time: dbResult.times[i],
      });
    }

    return res.json({
      status: 'success',
      hasResults: results.length > 0,
      results,
    });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
}
async function updateTimesData(req, res) {
  try {
    const { id, times } = req.body;

    // Use the new editRaceData function
    const result = await db.editRaceData('times', times, id);

    if (result.success) {
      res.json({ status: 'success', message: 'Times updated' });
    } else {
      res.status(400).json({ status: 'error', message: result.error });
    }
  } catch (error) {
    console.error('Update times error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
}

async function updateRunnersData(req, res) {
  try {
    const { id, runners } = req.body;

    // Use the new editRaceData function
    const result = await db.editRaceData('runners', runners, id);

    if (result.success) {
      res.json({ status: 'success', message: 'Runners updated' });
    } else {
      res.status(400).json({ status: 'error', message: result.error });
    }
  } catch (error) {
    console.error('Update runners error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
}

app.post('/submit-timings', addTime);
app.post('/submit-runners', addRunners);
app.post('/create-results', createResults);
app.post('/update-times', updateTimesData);
app.post('/update-runners', updateRunnersData);
app.get('/getTimes', getTimes);
app.get('/getRunners', getRunners);
app.get('/allData', getAllData);
app.get('/get-results', getResults);

async function testClear() {
  const result = await db.clearDBData('race_data');
  console.log('Clear result:', result);
}

testClear();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
