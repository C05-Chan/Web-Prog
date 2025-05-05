const express = require('express');
const path = require('path');
const app = express();
const PORT = 8080;

let status = false;
const runnersRaceDetails = {
  timeSaved: [],
  runnersSaved: [],
  resultsSaved: [],
};


app.use(express.static(path.join(__dirname)));
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});


app.post('/submit-timings', (req, res) => {
  try {
    if (!req.body?.times) {
      return res.status(400).json({
        status: 'error',
        message: 'No time data provided',
      });
    }

    const times = req.body.times;
    runnersRaceDetails.timeSaved = [...times]; // The '...' operator is used to remove the outer array brackets

    console.log('Current times:', runnersRaceDetails.timeSaved);

    res.json({
      status: 'success',
      message: 'Times received successfully',
      times: runnersRaceDetails.timeSaved,
    });

    checkCompleteData();
  } catch (error) {
    console.error('Error:', error.message);
    res.status(400).json({
      status: 'error',
      message: 'Server error: ' + error.message,
    });
  }
});


app.post('/submit-runners', (req, res) => {
  try {
    if (!req.body?.runners) {
      return res.status(400).json({
        status: 'error',
        message: 'No runners data provided',
      });
    }

    const newRunner = req.body.runners;

    if (runnersRaceDetails.runnersSaved.some(runner => runner.id.toString() === newRunner[0].id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Runner ID already recorded, please use a different ID',
      });
    }

    if (runnersRaceDetails.runnersSaved.some(runner => runner.position.toString() === newRunner[0].position)) {
      return res.status(400).json({
        status: 'error',
        message: 'Position already taken, please use a different position',
      });
    }
    runnersRaceDetails.runnersSaved.push(...newRunner); // The '...' operator is used to remove the outer array brackets

    console.log('Current runners:', runnersRaceDetails.runnersSaved);
    checkCompleteData();

    res.json({
      status: 'success',
      message: 'Runners received successfully',
      runners: runnersRaceDetails.runnersSaved,
    });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
});

app.get('/get-runners', (req, res) => {
  res.json({
    status: 'success',
    runners: runnersRaceDetails.runnersSaved,
  });
});

function checkCompleteData() {
  if (runnersRaceDetails.runnersSaved.length > 0 &&
    runnersRaceDetails.timeSaved.length > 0 &&
    runnersRaceDetails.runnersSaved.length === runnersRaceDetails.timeSaved.length) {
    status = true;
    console.log('All data is complete');
    runnersRaceDetails.resultsSaved = [];

    for (let i = 0; i < runnersRaceDetails.runnersSaved.length; i++) {
      const runner = runnersRaceDetails.runnersSaved[i];
      const timeIndex = runner.position - 1;

      if (timeIndex >= 0 && timeIndex < runnersRaceDetails.timeSaved.length) {
        runnersRaceDetails.resultsSaved.push({
          id: runner.id,
          name: runner.name,
          position: runner.position,
          time: runnersRaceDetails.timeSaved[timeIndex],
        });
      }
    }
  }
}

app.get('/get-results', (req, res) => {
  res.json({
    status,
    hasResults: runnersRaceDetails.resultsSaved,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
