// Global Variables //
let timerInterval;
let currentMilliseconds = 0;
let runnersData = [];
let recordedTimes = [];
const recordedRunners = [];
let editIndex = null;

// Get all elements with #id //
const el = {};
const allElementsWithId = document.querySelectorAll('[id]');

allElementsWithId.forEach(element => {
  const key = element.id.replace(/-/g, '_');
  el[key] = element;
});

// Functions to handle navigation between sections //
function clearContent() {
  el.error_message.textContent = '';
  document.querySelectorAll('.section').forEach((content) => {
    // content.classList.add('hidden');
    content.style.display = 'none';
  });
}

function showElement(e) {
  // e.classList.remove('hidden');
  e.style.display = 'block';
}

function hideElement(e) {
  // e.classList.add('hidden');
  e.style.display = 'none';
}

function errorMessageDisplay(message, type) {
  const errorColours = [
    { type: 'error', colour: 'red' },
    { type: 'warning', colour: 'orange' },
    { type: 'success', colour: 'green' },
    { type: 'info', colour: 'blue' },
  ];

  el.error_message.textContent = message;

  const colour = errorColours.find(config => config.type === type);
  el.error_message.style.color = colour ? colour.colour : 'black';
}


// Nav Bar Functions //
el.sign_in.addEventListener('click', () => {
  clearContent();

  showElement(document.querySelector('.volunteer-nav'));
  showElement(el.sign_out);

  hideElement(el.sign_in);
});

el.sign_out.addEventListener('click', () => {
  clearContent();

  showElement(el.sign_in);

  hideElement(el.sign_out);
  hideElement(document.querySelector('.volunteer-nav'));
});

el.timer.addEventListener('click', () => {
  clearContent();
  showElement(document.querySelector('#timer-container'));
});

el.positions.addEventListener('click', () => {
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
      errorMessageDisplay('Error loading CSV', 'error');
      console.error('Error loading CSV:', err);
      return [];
    });
}

// Generate random ID //

function getClientId() {
  const storage = sessionStorage; // This is a one time thing. Disappears when browser/ tab closes. (Good for testing, but for a real app, it would be stored in local storage)
  try {
    let clientId = storage.getItem('clientId');
    if (!clientId) {
      clientId = 'client-' + Math.random().toString(36).slice(2, 11);
      storage.setItem('clientId', clientId);
    }
    return clientId;
  } catch (error) {
    return 'temp-' + Math.random().toString(36).slice(2, 11);
  }
}
//                                                                   Timer Functions                                                                    //

function updateTimer() {
  currentMilliseconds++;
  const hours = Math.floor(currentMilliseconds / 3600000);
  const minutes = Math.floor((currentMilliseconds % 3600000) / 60000);
  const seconds = Math.floor((currentMilliseconds % 60000) / 1000);
  const ms = currentMilliseconds % 1000;

  el.stopwatch_display.textContent = `${hours < 10 ? '0' + hours : hours}:${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds}:${ms < 10 ? '00' + ms : ms < 100 ? '0' + ms : ms}`;
}

el.start.addEventListener('click', () => {
  if (!timerInterval) {
    currentMilliseconds = 0;
    timerInterval = setInterval(updateTimer, 1);
  }
  hideElement(el.start);
  showElement(el.stop);
  showElement(el.record_time);
  showElement(el.submit_times);
});

el.stop.addEventListener('click', () => {
  clearInterval(timerInterval);
  timerInterval = null;

  hideElement(el.stop);
  hideElement(el.record_time);
  showElement(el.resume);
  showElement(el.reset);
});

el.resume.addEventListener('click', () => {
  if (!timerInterval) {
    timerInterval = setInterval(updateTimer, 1);
  }

  hideElement(el.resume);
  hideElement(el.reset);
  showElement(el.stop);
});

el.reset.addEventListener('click', () => {
  clearInterval(timerInterval);
  timerInterval = null;
  currentMilliseconds = 0;
  recordedTimes = [];

  el.stopwatch_display.textContent = '00:00:00:000';
  el.times_list.innerHTML = '';

  showElement(el.start);
  hideElement(el.stop);
  hideElement(el.resume);
  hideElement(el.reset);
  hideElement(el.record_time);
  hideElement(el.submit_times);
});

el.record_time.addEventListener('click', () => {
  const timesListItem = document.createElement('li');
  const time = el.stopwatch_display.textContent;

  timesListItem.textContent = time;
  el.times_list.prepend(timesListItem);

  recordedTimes.push(time);

  errorMessageDisplay('Time recorded successfully', 'success');
  console.log('Recorded times:', recordedTimes);
});

el.submit_times.addEventListener('click', async () => {
  el.error_message.textContent = '';

  if (recordedTimes.length === 0) {
    errorMessageDisplay('No times recorded to submit', 'error');
    return;
  }

  el.stop.click();

  try {
    const response = await fetch('/submit-timings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ times: recordedTimes }),
    });

    const result = await response.json();

    if (!response.ok) {
      errorMessageDisplay(result.message, 'error');
      localStorage.setItem('runners', JSON.stringify(recordedTimes));
      return;
    }

    console.log('Times submitted successfully:', result);
    errorMessageDisplay('Times submitted successfully:', 'success');

    if (localStorage.getItem('times')) {
      localStorage.removeItem('times');
    }

    hideElement(document.querySelector('.stopwatch'));
    showElement(el.modify_times);
  } catch (error) {
    console.error('Error:', error);
    errorMessageDisplay('Error submitting times, it is currently stored locally, please try again out of offline mode', 'error');
    localStorage.setItem('times', JSON.stringify(recordedTimes));
    showElement(el.modify_times);
  }
});

el.modify_times.addEventListener('click', () => {
  showElement(document.querySelector('.manage-times-container'));
  hideElement(el.modify_times);
  hideElement(el.times_list);
  displayTimes();
});

function displayTimes() {
  el.times_management_list.innerHTML = '';

  recordedTimes.forEach((time, index) => {
    const wrapper = document.createElement('section');

    const span = document.createElement('span');
    span.textContent = time;

    const editTime = document.createElement('button');
    editTime.textContent = 'Edit';

    editTime.addEventListener('click', () => {
      editIndex = index;
      el.time_input.value = time;
      el.el.popup.style.display = 'block';
    });


    const deleteTime = document.createElement('button');
    deleteTime.textContent = 'Delete';

    deleteTime.addEventListener('click', () => {
      recordedTimes.splice(index, 1);
      displayTimes();
    });

    wrapper.appendChild(span);
    wrapper.appendChild(editTime);
    wrapper.appendChild(deleteTime);
    el.times_management_list.appendChild(wrapper);
  });
}

el.popup_done.addEventListener('click', () => {
  const newTime = el.time_input.value.trim();
  if (!/^\d{1,2}:\d{2}:\d{2}:\d{3}$/.test(newTime)) {
    errorMessageDisplay('Invalid format. Please use hh:mm:ss:ms', 'error');
    return;
  }

  if (editIndex !== null) {
    recordedTimes[editIndex] = newTime;
    errorMessageDisplay('Time updated successfully', 'success');
    editIndex = null;
  } else {
    recordedTimes.push(newTime);
    recordedTimes.sort();
    errorMessageDisplay('Time added successfully', 'success');
  }

  el.el.popup.style.display = 'none';
  displayTimes();
});

el.popup_cancel.addEventListener('click', () => {
  el.popup.style.display = 'none';
  editIndex = null;
});

el.add_time.addEventListener('click', () => {
  editIndex = null;
  el.time_input.value = '';
  el.popup.style.display = 'block';
});

el.save_times.addEventListener('click', () => {
  // Update the displayed times list with the modified times
  el.times_list.innerHTML = '';
  recordedTimes.forEach(time => {
    const timesListItem = document.createElement('li');
    timesListItem.textContent = time;
    el.times_list.prepend(timesListItem);
  });


  hideElement(document.querySelector('.manage-times-container'));
  hideElement(el.add_time);
  hideElement(el.save_times);

  showElement(el.modify_times);
  showElement(el.times_list);

  el.submit_times.click();
});

//                                                 Runner Positions Functions                                                                //

el.record_runner.addEventListener('click', async () => {
  el.error_message.textContent = '';
  const idNumber = el.runner_ID.value;
  const position = el.runner_position.value;

  if (!position || !idNumber) {
    errorMessageDisplay('Please enter both position and ID number', 'error');
    return;
  }

  if (isNaN(position) || position <= 0) {
    errorMessageDisplay('Position must be a positive number', 'error');
    return;
  }

  if (isNaN(idNumber)) {
    errorMessageDisplay('ID must be a number', 'error');
    return;
  }

  await getRunners();
  const targetedRunner = runnersData.find(runner => runner[0] === idNumber);

  if (!targetedRunner) {
    errorMessageDisplay('Runner ID not found', 'error');
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
      errorMessageDisplay(result.message, 'error');
      localStorage.setItem('runners', JSON.stringify(recordedRunners));
      return;
    }

    console.log('Runners submitted successfully:', runnersInfo);
    errorMessageDisplay('Runners submitted successfully:', 'success');

    el.runner_ID.value = '';
    el.runner_position.value = '';

    updateRunnersList(result.runners);

    if (localStorage.getItem('runners')) {
      localStorage.removeItem('runners');
    }
  } catch (error) {
    console.error('Error:', error);
    errorMessageDisplay('Error submitting runner, it is currently stored locally, please try again out of offline mode', 'error');
    localStorage.setItem('runners', JSON.stringify(recordedRunners));
  }
});

function updateRunnersList(runners) {
  el.runners_list.innerHTML = '';

  runners.forEach(runner => {
    const listItem = document.createElement('li');
    listItem.textContent = `Position ${runner.position}: ${runner.name} (ID: ${runner.id})`;
    el.runners_list.prepend(listItem);
  });
}

//   Overall Result Functions                                                     //
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
    errorMessageDisplay('No results available yet', 'info');
    return;
  }

  const tbody = el.results_table.querySelector('tbody');
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

el.runners_results.addEventListener('click', async () => {
  clearContent();
  el.error_message.textContent = '';
  showElement(document.querySelector('#result-container'));
  try {
    const resultsData = await getResults();
    displayResults(resultsData);
  } catch (error) {
    errorMessageDisplay('Error loading results', 'error');
  }
});

// Load Local Storage //
function getLocalStorageData() {
  try {
    const savedTimes = localStorage.getItem('times');
    const savedRunners = localStorage.getItem('runners');

    if (savedTimes) {
      recordedTimes = JSON.parse(savedTimes);
      recordedTimes.forEach(time => {
        const timesListItem = document.createElement('li');
        timesListItem.textContent = time;
        el.times_list.prepend(timesListItem);
      });

      if (recordedTimes.length > 0) {
        showElement(el.modify_times);
        errorMessageDisplay('Loaded locally saved times', 'info');
      }
    }

    if (savedRunners) {
      recordedRunners.length = 0;
      JSON.parse(savedRunners).forEach(runner => {
        recordedRunners.push(runner);
        const listItem = document.createElement('li');
        listItem.textContent = `Position ${runner.position}: ${runner.name} (ID: ${runner.id})`;
        el.runners_list.prepend(listItem);
      });

      if (recordedRunners.length > 0) {
        errorMessageDisplay('Loaded locally saved runners', 'info');
      }
    }
  } catch (error) {
    console.error('Error loading localStorage data:', error);
    errorMessageDisplay('Error loading localStorage data:', 'error');
  }
}

// Replace your current syncLocalStorageToServer function with this:
async function syncLocalStorageToServer() {
  if (!navigator.onLine) return;

  try {
    // Sync times if they exist
    if (localStorage.getItem('times')) {
      const times = JSON.parse(localStorage.getItem('times'));

      await fetch('/submit-timings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ times }),
      });

      localStorage.removeItem('times');
    }

    // Sync runners if they exist
    if (localStorage.getItem('runners')) {
      const runners = JSON.parse(localStorage.getItem('runners'));
      await fetch('/submit-runners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runners }),
      });
      localStorage.removeItem('runners');
    }

    if (document.querySelector('#result-container').style.display === 'block') {
      const resultsData = await getResults();
      displayResults(resultsData);
    }
  } catch (error) {
    console.error('Sync error:', error);
  }
}


// Service Worker Registration //
async function registerServiceWorker() {
  if (navigator.serviceWorker) {
    await navigator.serviceWorker.register('./sw.js');
  }
}

// Update your load event listener to this:
window.addEventListener('load', () => {
  registerServiceWorker();
  getLocalStorageData();

  if (navigator.onLine) {
    syncLocalStorageToServer().then(() => {
      // After sync completes, show results if we have data
      if (recordedTimes.length > 0 || recordedRunners.length > 0) {
        el.runners_results.click();
      }
    });
  }
});
