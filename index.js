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
const timesManagementList = document.querySelector('#times-management-list');

const modifyTimes = document.querySelector('#modify-times');
const addTime = document.querySelector('#add-time');
const saveTime = document.querySelector('#save-time');
const popup = document.getElementById('time-popup');
const timeInput = document.getElementById('time-input');
const popupDone = document.getElementById('popup-done');
const popupCancel = document.getElementById('popup-cancel');

let editIndex = null;


// Runner Positions //
const runnersPosition = document.querySelector('#runner-position');
const runnersID = document.querySelector('#runner-ID');
const recordRunner = document.querySelector('#record-runner');

const runnersList = document.querySelector('#runners-display');

// Overall Results //
const overallResults = document.querySelector('#results-table');

// Functions to handle navigation between sections //
function clearContent() {
  errorMessage.textContent = '';
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

// Nav Bar Functions //
signInBtn.addEventListener('click', () => {
  clearContent();

  showElement(document.querySelector('.volunteer-nav'));
  showElement(signOutBtn);

  hideElement(signInBtn);
});

signOutBtn.addEventListener('click', () => {
  clearContent();

  showElement(signInBtn);

  hideElement(signOutBtn);
  hideElement(document.querySelector('.volunteer-nav'));
});

timerBtn.addEventListener('click', () => {
  clearContent();
  showElement(document.querySelector('#timer-container'));
});

positionsBtn.addEventListener('click', () => {
  clearContent();
  showElement(document.querySelector('#runners-container'));
});

// Get Runners CSV File //
function getRunners() {
  return fetch('runners.csv')
    .then(response => response.text())
    .then(csvText => {
      const rows = csvText.trim().split('\n');
      runnersData = rows.map(row => row.split(','));
      return runnersData;
    })
    .catch(err => {
      errorMessage.textContent('Error loading CSV');
      console.error('Error loading CSV:', err);
      return [];
    });
}

//                                                                   Timer Functions                                                                    //

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
    showElement(modifyTimes);
  } catch (error) {
    console.error('Error:', error);
    errorMessage.textContent = 'Error submitting times, it is currently stored locally, please try again out of offline mode';
    localStorage.setItem('times', JSON.stringify(recordedTimes));
    showElement(modifyTimes);
  }
});

modifyTimes.addEventListener('click', () => {
  showElement(document.querySelector('.manage-times-container'));
  hideElement(modifyTimes);
  displayTimes();
});

// Modify the displayTimes function to ensure buttons are visible
function displayTimes() {
  timesManagementList.innerHTML = '';

  recordedTimes.forEach((time, index) => {
    const listItem = document.createElement('li');
    listItem.style.display = 'flex'; // Add flex display
    listItem.style.alignItems = 'center'; // Center items vertically
    listItem.style.gap = '10px'; // Add some spacing

    const timeSpan = document.createElement('span');
    timeSpan.textContent = time;
    listItem.appendChild(timeSpan);

    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.style.padding = '5px 10px'; // Add some padding
    editBtn.addEventListener('click', () => {
      editIndex = index;
      timeInput.value = time;
      popup.style.display = 'block';
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.style.padding = '5px 10px'; // Add some padding
    deleteBtn.addEventListener('click', () => {
      recordedTimes.splice(index, 1);
      displayTimes();
    });

    listItem.appendChild(editBtn);
    listItem.appendChild(deleteBtn);
    timesManagementList.appendChild(listItem);
  });
}

popupDone.addEventListener('click', () => {
  const newTime = timeInput.value.trim();
  if (!/^\d{2}:\d{2}:\d{2}:\d{3}$/.test(newTime)) {
    errorMessage.textContent = 'Invalid format. Please use hh:mm:ss:ms';
    return;
  }

  if (editIndex !== null) {
    recordedTimes[editIndex] = newTime;
    editIndex = null;
  } else {
    recordedTimes.push(newTime);
    recordedTimes.sort(); // You can replace this with custom time sort
  }

  popup.style.display = 'none';
  displayTimes();
});

popupCancel.addEventListener('click', () => {
  popup.style.display = 'none';
  editIndex = null;
});

addTime.addEventListener('click', () => {
  editIndex = null;
  timeInput.value = '';
  popup.style.display = 'block';
});

const saveTimesBtn = document.querySelector('#save-times');
saveTimesBtn.addEventListener('click', () => {
  submitTimeBtn.click();
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

//                                                 Overall Results Functions                                                                //
async function getResults() {
  try {
    const response = await fetch('/get-results');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching results:', error);
    throw error;
  }
}

function displayResults(data) {
  if (!data.status || !data.hasResults || data.hasResults.length === 0) {
    errorMessage.textContent = 'No results available yet';
    return;
  }

  const tbody = overallResults.querySelector('tbody');
  tbody.innerHTML = '';

  const sortedResults = data.hasResults.sort((a, b) => a.position - b.position);

  for (let i = 0; i < sortedResults.length; i++) {
    const result = sortedResults[i];
    const row = document.createElement('tr');

    const positionCell = document.createElement('td');
    positionCell.textContent = result.position;

    const nameCell = document.createElement('td');
    nameCell.textContent = result.name;

    const timeCell = document.createElement('td');
    timeCell.textContent = result.time;

    row.appendChild(positionCell);
    row.appendChild(nameCell);
    row.appendChild(timeCell);
    tbody.appendChild(row);
  }
}

overallResultsBtn.addEventListener('click', async () => {
  clearContent();
  errorMessage.textContent = '';
  try {
    const resultsData = await getResults();
    displayResults(resultsData);
  } catch (error) {
    errorMessage.textContent = 'Error loading results';
  }
});

// Service Worker Registration //
async function registerServiceWorker() {
  if (navigator.serviceWorker) {
    await navigator.serviceWorker.register('./sw.js');
  }
}

window.addEventListener('load', () => {
  registerServiceWorker();
});
