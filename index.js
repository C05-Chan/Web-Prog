// Global Variables //
let timerInterval;
let currentMilliseconds = 0;
let runnersData = [];
let recordedTimes = [];
const recordedRunners = [];


// Navigation Buttons //
const signInBtn = document.querySelector('#sign-in');
const signOutBtn = document.querySelector('#sign-out');
const overallResultsBtn = document.querySelector('#runners-results');
const timerBtn = document.querySelector('#timer');
const positionsBtn = document.querySelector('#positions');

// Error Message //
const errorMessage = document.querySelector('#error-message');

// Timer  //
const stopwatchDisplay = document.querySelector('#stopwatch-display');
const startBtn = document.querySelector('#start');
const stopBtn = document.querySelector('#stop');
const resetBtn = document.querySelector('#reset');
const resumeBtn = document.querySelector('#resume');
const recordTimeBtn = document.querySelector('#record-time');
const submitTimeBtn = document.querySelector('#submit-times');

const timesList = document.querySelector('#times-display');

const editTimes = document.querySelector('#edit-times');
const deleteTime = document.querySelector('#delete-time');
const changeTime = document.querySelector('#change-time');
const addTime = document.querySelector('#add-time');
const saveTime = document.querySelector('#save-time');


// Runner Positions //
const runnersPosition = document.querySelector('#runner-position');
const runnersID = document.querySelector('#runner-ID');
const recordRunner = document.querySelector('#record-runner');

const runnersList = document.querySelector('#runners-display');

// Overall Results //
const overallResults = document.querySelector('#results-table');

// Functions to handle navigation between sections //
function clearContent() {
  document.querySelectorAll('.section').forEach((content) => {
    // content.classList.add('hidden');
    content.style.display = 'none';
  });
}

function showElement(e) {
  // e.classList.remove('hidden');
  e.style.display = 'block';
}

// Utility function to hide the specified element //
function hideElement(e) {
  // e.classList.add('hidden');
  e.style.display = 'none';
}

function getRunners() {
  return fetch('runners.csv')
    .then(response => response.text())
    .then(csvText => {
      const rows = csvText.trim().split('\n');
      runnersData = rows.map(row => row.split(','));
      return runnersData;
    })
    .catch(err => {
      console.error('Error loading CSV:', err);
      return [];
    });
}

//                                                                             Timer Functions                                                                    //

function updateTimer() {
  currentMilliseconds++;
  const hours = Math.floor(currentMilliseconds / 3600000);
  const minutes = Math.floor((currentMilliseconds % 3600000) / 60000);
  const seconds = Math.floor((currentMilliseconds % 60000) / 1000);
  const ms = currentMilliseconds % 1000;

  stopwatchDisplay.textContent = `${hours < 10 ? '0' + hours : hours}:${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds}:${ms < 10 ? '00' + ms : ms < 100 ? '0' + ms : ms}`;
}

startBtn.addEventListener('click', () => {
  if (!timerInterval) {
    currentMilliseconds = 0;
    timerInterval = setInterval(updateTimer, 1);
  }
  hideElement(startBtn);
  showElement(stopBtn);
  showElement(recordTimeBtn);
  showElement(submitTimeBtn);
});

stopBtn.addEventListener('click', () => {
  clearInterval(timerInterval);
  timerInterval = null;

  hideElement(stopBtn);
  hideElement(recordTimeBtn);
  showElement(resumeBtn);
  showElement(resetBtn);
});

resumeBtn.addEventListener('click', () => {
  if (!timerInterval) {
    timerInterval = setInterval(updateTimer, 1);
  }

  hideElement(resumeBtn);
  hideElement(resetBtn);
  showElement(stopBtn);
});

resetBtn.addEventListener('click', () => {
  clearInterval(timerInterval);
  timerInterval = null;
  currentMilliseconds = 0;
  recordedTimes = [];

  stopwatchDisplay.textContent = '00:00:00:000';
  timesList.innerHTML = '';

  showElement(startBtn);
  hideElement(stopBtn);
  hideElement(resumeBtn);
  hideElement(resetBtn);
  hideElement(recordTimeBtn);
  hideElement(submitTimeBtn);
});

recordTimeBtn.addEventListener('click', () => {
  const timesListItem = document.createElement('li');
  const time = stopwatchDisplay.textContent;

  timesListItem.textContent = time;
  timesList.prepend(timesListItem);

  recordedTimes.push(time);
  console.log('Recorded times:', recordedTimes);
});

submitTimeBtn.addEventListener('click', async () => {
  errorMessage.textContent = '';
  stopBtn.click();

  try {
    const response = await fetch('/submit-timings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ times: recordedTimes }),
    });

    const result = await response.json();
    if (!response.ok) {
      errorMessage.textContent = result.message;
      localStorage.setItem('runners', JSON.stringify(recordedTimes));
      return;
    }
    console.log('Times submitted successfully:', result);

    hideElement(document.querySelector('.stopwatch'));
    showElement(editTimes);
  } catch (error) {
    console.error('Error:', error);
    errorMessage.textContent = 'Error submitting times, try again';
    localStorage.setItem('times', JSON.stringify(recordedTimes));
  }
});


//                                                 Runner Positions Functions                                                                //

recordRunner.addEventListener('click', async () => {
  errorMessage.textContent = '';
  const idNumber = runnersID.value;
  const position = runnersPosition.value;

  if (!position || !idNumber) {
    errorMessage.textContent = 'Please enter both position and ID number';
    return;
  }

  await getRunners();
  const targetedRunner = runnersData.find(runner => runner[0] === idNumber);

  if (!targetedRunner) {
    errorMessage.textContent = 'Runner ID not found';
    return;
  }

  const runnerName = `${targetedRunner[1]} ${targetedRunner[2]}`;
  const runnersInfo = { id: idNumber, name: runnerName, position };
  recordedRunners.push(runnersInfo);

  try {
    const response = await fetch('/submit-runners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ runners: [runnersInfo] }),
    });
    const result = await response.json();

    if (!response.ok) {
      errorMessage.textContent = result.message;
      localStorage.setItem('runners', JSON.stringify(recordedRunners));
      return;
    }
    console.log('Runners submitted successfully:', runnersInfo);
    runnersID.value = '';
    runnersPosition.value = '';
    updateRunnersList(result.runners);
  } catch (error) {
    console.error('Error:', error);
    errorMessage.textContent = 'Error submitting runner, try again';
    localStorage.setItem('runners', JSON.stringify(recordedRunners));
  }
});

function updateRunnersList(runners) {
  runnersList.innerHTML = '';

  runners.forEach(runner => {
    const listItem = document.createElement('li');
    listItem.textContent = `Position ${runner.position}: ${runner.name} (ID: ${runner.id})`;
    runnersList.prepend(listItem);
  });
}

// async function getResults() {
//   try {
//     const response = await fetch('/get-results');
//     const data = await response.json();

//     if (!data.hasResults || data.hasResults.length === 0) {
//       errorMessage.textContent = 'No results available yet';
//       return;
//     }

//     if (data.status && data.hasResults.length > 0) {
//       const tbody = overallResults.querySelector('tbody');
//       tbody.innerHTML = ''; // Clear existing rows

//       // Sort results by position
//       const sortedResults = [...data.hasResults].sort((a, b) => a.position - b.position);

//       sortedResults.forEach(result => {
//         const row = document.createElement('tr');

//         const positionCell = document.createElement('td');
//         positionCell.textContent = result.position;

//         const nameCell = document.createElement('td');
//         nameCell.textContent = result.name;

//         const timeCell = document.createElement('td');
//         timeCell.textContent = result.time;

//         row.appendChild(positionCell);
//         row.appendChild(nameCell);
//         row.appendChild(timeCell);
//         tbody.appendChild(row);
//       });
//     }
//   } catch (error) {
//     console.error('Error fetching results:', error);
//     errorMessage.textContent = 'Error loading results';
//   }
// }

// Service Worker Registration //
async function registerServiceWorker() {
  if (navigator.serviceWorker) {
    await navigator.serviceWorker.register('./sw.js');
  }
}

window.addEventListener('load', () => {
  registerServiceWorker();
});
