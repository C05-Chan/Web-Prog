// Global Variables //
let timerInterval;
let currentMilliseconds = 0;
let runnersData = [];
let recordedTimes = [];
const recordedRunners = [];
let updateList = [];
let editItem = null;
let selectedClientId = null;


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

  showElement(document.querySelector('.role-type'));
  showElement(el.sign_out);

  hideElement(el.sign_in);
});

el.sign_out.addEventListener('click', () => {
  clearContent();

  showElement(el.sign_in);

  hideElement(el.sign_out);
  hideElement(document.querySelector('.role-type'));
});

el.volunteer.addEventListener('click', () => {
  showElement(document.querySelector('.volunteer-nav'));
  hideElement(document.querySelector('.admin-nav'));
});

el.timer.addEventListener('click', () => {
  clearContent();
  showElement(el.timer_container);
});

el.positions.addEventListener('click', () => {
  clearContent();
  showElement(el.runners_container);
});


// Get Runners CSV File //
function getRunners() {
  return fetch('/runners.csv')
    .then(response => response.text())
    .then(csvText => {
      const rows = csvText.trim().split('\n');
      runnersData = [];
      for (let i = 0; i < rows.length; i++) {
        runnersData.push(rows[i].split(','));
      }
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
  // This is a one time thing. Disappears when browser/ tab closes. (Good for testing, but for a real app, it would be stored in local storage)
  try {
    let clientId = sessionStorage.getItem('clientId');
    if (!clientId) {
      clientId = 'client-' + Math.random().toString(36).slice(2, 11);
      sessionStorage.setItem('clientId', clientId);
    }
    return clientId;
  } catch (error) {
    return 'temp-' + Math.random().toString(36).slice(2, 11);
  }
}
// Admin View //

async function getSubmitData() {
  const response = await fetch('/allData');
  const result = await response.json();

  if (!response.ok || result.status !== 'success') {
    errorMessageDisplay(result.message || 'Failed to fetch data', 'error');
    return [];
  }

  return result.data || [];
}


el.admin.addEventListener('click', async () => {
  clearContent();
  showElement(el.admin_view);
  showElement(document.querySelector('.admin-nav'));
  hideElement(document.querySelector('.volunteer-nav'));

  const tbody = el.race_data_table.querySelector('tbody');
  tbody.innerHTML = '<tr><td colspan="4">No data available</td></tr>';

  const data = await getSubmitData();
  tbody.innerHTML = '';

  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4">No data available</td></tr>';
    return;
  }

  data.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.client_id}</td>
      <td>${item.data_type}</td>
      <td>${item.data_array?.length || 0}</td>
      <td>${new Date(item.time).toLocaleString()}</td>
    `;

    row.addEventListener('click', () => {
      if (item.data_type === 'times') {
        clearContent();
        showElement(el.time_management);

        updateList = [...item.data_array];
        selectedClientId = item.client_id;

        showElement(el.modify_times);
        editTimesList();
      } else if (item.data_type === 'runners') {
        clearContent();
        showElement(el.runner_management);
        updateList = [...item.data_array];
        selectedClientId = item.client_id;
        showElement(document.querySelector('.manage-runners-container'));
        editRunnersList();
      }
    });

    tbody.appendChild(row);
  });
});

el.create_results.addEventListener('click', async () => {
  clearContent();
  showElement(el.admin_view);

  // Add checkboxes to each row
  const tbody = el.race_data_table.querySelector('tbody');
  tbody.innerHTML = '';

  const data = await getSubmitData();
  if (data.length === 0) {
    errorMessageDisplay('No data available to create results', 'info');
    return;
  }

  data.forEach(item => {
    const row = document.createElement('tr');

    // Add checkbox cell
    const checkboxCell = document.createElement('td');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.dataset.type = item.data_type;
    checkbox.dataset.data = JSON.stringify(item.data_array);
    checkboxCell.appendChild(checkbox);
    row.appendChild(checkboxCell);

    // Add other cells
    row.innerHTML += `
      <td>${item.client_id}</td>
      <td>${item.data_type}</td>
      <td>${item.data_array?.length || 0}</td>
      <td>${new Date(item.time).toLocaleString()}</td>
    `;

    tbody.appendChild(row);
  });

  // Add submit button
  const submitRow = document.createElement('tr');
  const submitCell = document.createElement('td');
  submitCell.colSpan = 5;
  const submitButton = document.createElement('button');
  submitButton.textContent = 'Generate Results';
  submitButton.addEventListener('click', generateResults);
  submitCell.appendChild(submitButton);
  submitRow.appendChild(submitCell);
  tbody.appendChild(submitRow);
});

async function generateResults() {
  const checkboxes = document.querySelectorAll('#race-data-table tbody input[type="checkbox"]:checked');

  if (checkboxes.length === 0) {
    errorMessageDisplay('Please select at least one data set', 'error');
    return;
  }

  const timesArrays = [];
  const runnersArrays = [];

  // Collect all selected times and runners data
  for (let i = 0; i < checkboxes.length; i++) {
    const checkbox = checkboxes[i];
    const dataType = checkbox.dataset.type;
    const dataArray = JSON.parse(checkbox.dataset.data);

    if (dataType === 'times') {
      // Concatenate times arrays
      for (let j = 0; j < dataArray.length; j++) {
        timesArrays.push(dataArray[j]);
      }
    } else if (dataType === 'runners') {
      // Concatenate runners arrays
      for (let j = 0; j < dataArray.length; j++) {
        runnersArrays.push(dataArray[j]);
      }
    }
  }

  if (timesArrays.length === 0 || runnersArrays.length === 0) {
    errorMessageDisplay('You need both times and runners data to create results', 'error');
    return;
  }

  try {
    // Sort the arrays
    timesArrays.sort();
    runnersArrays.sort((a, b) => a.position - b.position);

    // Create results array by matching positions with times
    const results = [];
    const minLength = Math.min(timesArrays.length, runnersArrays.length);

    for (let i = 0; i < minLength; i++) {
      results.push({
        position: runnersArrays[i].position,
        name: runnersArrays[i].name,
        time: timesArrays[i],
        id: runnersArrays[i].id,
      });
    }

    // Send to server
    const response = await fetch('/create-results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ results }),
    });

    const result = await response.json();

    if (response.ok) {
      errorMessageDisplay('Results created successfully!', 'success');
      // Show the results
      el.runners_results.click();
    } else {
      errorMessageDisplay(result.message || 'Failed to create results', 'error');
    }
  } catch (error) {
    console.error('Error creating results:', error);
    errorMessageDisplay('Error creating results', 'error');
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
      body: JSON.stringify({ type: 'times', times: recordedTimes, id: getClientId() }),
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
  editTimesList();
});

async function displayTimesList() {
  try {
    // Clear the list first
    el.times_management_list.innerHTML = '';

    // Fetch the times data
    const response = await fetch('/getTimes');
    if (!response.ok) {
      errorMessageDisplay('Failed to get times', 'error');
      el.times_management_list.innerHTML = '<p>No times available.</p>';
      return;
    }

    const result = await response.json();

    if (!result.success || !Array.isArray(result.data) || result.data.length === 0) {
      el.times_management_list.innerHTML = '<p>No times available.</p>';
      return;
    }

    result.data.forEach(timeObj => {
      const times = timeObj.data_array;
      if (!Array.isArray(times)) return;

      times.forEach(time => {
        const listItem = document.createElement('li');
        listItem.textContent = time;
        el.times_management_list.appendChild(listItem);
      });
    });
  } catch (error) {
    console.error('Error fetching and displaying times:', error);
    errorMessageDisplay('Error loading times from server.', 'error');
    el.times_management_list.innerHTML = '<p>Error loading times.</p>';
  }
}

function editTimesList() {
  el.times_management_list.innerHTML = '';

  showElement(el.save_times);
  showElement(el.add_time);

  if (!updateList || updateList.length === 0) {
    el.times_management_list.innerHTML = '<p>No times available.</p>';
    return;
  }

  updateList.forEach((time, index) => {
    const wrapper = document.createElement('section');
    wrapper.className = 'time-entry';

    const span = document.createElement('span');
    span.textContent = time;

    const editTime = document.createElement('button');
    editTime.textContent = 'Edit';
    editTime.addEventListener('click', () => {
      editItem = index;
      el.time_input.value = time;
      showElement(document.querySelector('.popup'));
    });

    const deleteTime = document.createElement('button');
    deleteTime.textContent = 'Delete';
    deleteTime.addEventListener('click', () => {
      updateList.splice(index, 1);
      editTimesList(); // Refresh the list
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

  if (editItem !== null) {
    updateList[editItem] = newTime;
    errorMessageDisplay('Time updated successfully', 'success');
    editItem = null;
  } else {
    updateList.push(newTime);
    updateList.sort();
    errorMessageDisplay('Time added successfully', 'success');
  }

  hideElement(document.querySelector('.popup'));
  editTimesList();
});

el.popup_cancel.addEventListener('click', () => {
  hideElement(document.querySelector('.popup'));
  editItem = null;
});

el.add_time.addEventListener('click', () => {
  editItem = null;
  el.time_input.value = '';
  showElement(document.querySelector('.popup'));
});


el.save_times.addEventListener('click', async () => {
  try {
    const response = await fetch('/update-times', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: selectedClientId,
        times: updateList,
      }),
    });

    const result = await response.json();
    if (response.ok) {
      errorMessageDisplay('Times updated successfully', 'success');

      hideElement(document.querySelector('.manage-times-container'));
      showElement(el.modify_times);
      showElement(el.times_list);


      displayTimesList();
    } else {
      errorMessageDisplay(result.message || 'Failed to update times', 'error');
    }
  } catch (error) {
    console.error('Error updating times:', error);
    errorMessageDisplay('Error updating times.', 'error');
  }
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

  if (position <= 0 || idNumber <= 0) {
    errorMessageDisplay('Position and ID Number must be a positive number', 'error');
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

  updateRunnersList(recordedRunners);
});

function updateRunnersList(runners) {
  el.runners_list.innerHTML = '';

  runners.forEach(runner => {
    const listItem = document.createElement('li');
    listItem.textContent = `Position ${runner.position}: ${runner.name} (ID: ${runner.id})`;
    el.runners_list.prepend(listItem);
  });
}


el.submit_runners.addEventListener('click', async function () {
  if (recordedRunners.length === 0) {
    errorMessageDisplay('No runners recorded to submit', 'error');
    return;
  }

  try {
    const response = await fetch('/submit-runners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'runners', runners: recordedRunners, id: getClientId() }),
    });

    const result = await response.json();

    if (!response.ok) {
      errorMessageDisplay(result.message, 'error');
      localStorage.setItem('runners', JSON.stringify(recordedRunners));
      return;
    }

    console.log('Runners submitted successfully:', recordedRunners);
    errorMessageDisplay('Runners submitted successfully:', 'success');

    if (localStorage.getItem('runners')) {
      localStorage.removeItem('runners');
    }
  } catch (error) {
    console.error('Error:', error);
    errorMessageDisplay('Error submitting runner, it is currently stored locally, please try again out of offline mode', 'error');
    localStorage.setItem('runners', JSON.stringify(recordedRunners));
  }
});

el.modify_runners.addEventListener('click', () => {
  showElement(document.querySelector('.manage-runners-container'));
  hideElement(el.modify_runners);
  editRunnersList();
});

async function displayRunnersList() {
  try {
    el.runners_management_list.innerHTML = '';
    const response = await fetch('/getRunners');
    if (!response.ok) {
      errorMessageDisplay('Failed to get runners', 'error');
      el.runners_management_list.innerHTML = '<p>No runners available.</p>';
      return;
    }

    const result = await response.json();
    if (!result.success || !Array.isArray(result.data) || result.data.length === 0) {
      el.runners_management_list.innerHTML = '<p>No runners available.</p>';
      return;
    }

    result.data.forEach(runnerObj => {
      const runners = runnerObj.data_array;
      if (!Array.isArray(runners)) return;

      runners.forEach(runner => {
        const listItem = document.createElement('li');
        listItem.textContent = `Position ${runner.position}: ${runner.name} (ID: ${runner.id})`;
        el.runners_management_list.appendChild(listItem);
      });
    });
  } catch (error) {
    console.error('Error fetching and displaying runners:', error);
    errorMessageDisplay('Error loading runners from server.', 'error');
    el.runners_management_list.innerHTML = '<p>Error loading runners.</p>';
  }
}

function editRunnersList() {
  el.runners_management_list.innerHTML = '';

  showElement(el.save_runners);
  showElement(el.add_runner);

  if (!updateList || updateList.length === 0) {
    el.runners_management_list.innerHTML = '<p>No runners available.</p>';
    return;
  }

  updateList.forEach((runner, index) => {
    const wrapper = document.createElement('section');
    wrapper.className = 'runner-entry';

    const span = document.createElement('span');
    span.textContent = `Position ${runner.position}: ${runner.name} (ID: ${runner.id})`;

    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => {
      editItem = index;
      el.edit_runner_position.value = runner.position;
      el.edit_runner_id.value = runner.id;
      showElement(document.querySelector('.runner-popup'));
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => {
      updateList.splice(index, 1);
      editRunnersList();
    });

    wrapper.appendChild(span);
    wrapper.appendChild(editBtn);
    wrapper.appendChild(deleteBtn);
    el.runners_management_list.appendChild(wrapper);
  });
}


el.add_runner.addEventListener('click', () => {
  editItem = null;
  el.edit_runner_position.value = '';
  el.edit_runner_id.value = '';
  showElement(document.querySelector('.runner-popup'));
});


el.runner_popup_done.addEventListener('click', async () => {
  const position = el.edit_runner_position.value.trim();
  const id = el.edit_runner_id.value.trim();

  if (!position || !id) {
    errorMessageDisplay('Please enter both position and ID', 'error');
    return;
  }

  await getRunners();
  const runner = runnersData.find(r => r[0] === id);

  if (!runner) {
    errorMessageDisplay('Runner ID not found', 'error');
    return;
  }

  if (recordedRunners.some(runner => runner.id.toString() === id)) {
    errorMessageDisplay('ID already recorded', 'error');
    return;
  }

  if (recordedRunners.some(runner => runner.id.toString() === position)) {
    errorMessageDisplay('Position already recorded', 'error');
    return;
  }

  const runnerName = `${runner[1]} ${runner[2]}`;
  const runnerData = { id, name: runnerName, position };

  if (editItem !== null) {
    updateList[editItem] = runnerData;
    errorMessageDisplay('Runner updated successfully', 'success');
  } else {
    updateList.push(runnerData);
    updateList.sort((a, b) => a.position - b.position);
    errorMessageDisplay('Runner added successfully', 'success');
  }

  hideElement(document.querySelector('.runner-popup'));
  editRunnersList(); // Refresh the list
});

// Runner Popup Cancel Button
el.runner_popup_cancel.addEventListener('click', () => {
  hideElement(document.querySelector('.runner-popup'));
  editItem = null;
});

// Save Runners Button
el.save_runners.addEventListener('click', async () => {
  try {
    const response = await fetch('/update-runners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: selectedClientId,
        runners: updateList,
      }),
    });

    const result = await response.json();
    if (response.ok) {
      errorMessageDisplay('Runners updated successfully', 'success');
      hideElement(document.querySelector('.manage-runners-container'));
      showElement(el.modify_runners);
      displayRunnersList();
    } else {
      errorMessageDisplay(result.message || 'Failed to update runners', 'error');
    }
  } catch (error) {
    console.error('Error updating runners:', error);
    errorMessageDisplay('Error updating runners.', 'error');
  }
});


//    Overall Result Functions                                                     //
async function getResults() {
  try {
    const response = await fetch('/get-results');

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Server error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'success') {
      throw new Error(data.message || 'Invalid data format');
    }

    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw new Error('Could not load results: ' + error.message);
  }
}

function displayResults(data) {
  const tbody = el.results_table.querySelector('tbody');
  tbody.innerHTML = '';

  if (!data.hasResults || !Array.isArray(data.results)) {
    tbody.innerHTML = '<tr><td colspan="3">No results available</td></tr>';
    errorMessageDisplay('No results found', 'info');
    return;
  }

  // Sort and display results
  data.results
    .sort((a, b) => a.position - b.position)
    .forEach(result => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${result.position}</td>
        <td>${result.name}</td>
        <td>${result.time}</td>
      `;
      tbody.appendChild(row);
    });
}

el.runners_results.addEventListener('click', async () => {
  clearContent();
  el.error_message.textContent = '';
  showElement(document.querySelector('#result-container'));

  try {
    const resultsData = await getResults();
    displayResults(resultsData);
  } catch (error) {
    console.error('Display error:', error);
    const tbody = el.results_table.querySelector('tbody');
    tbody.innerHTML = '<tr><td colspan="3">Failed to load results</td></tr>';
    errorMessageDisplay(error.message, 'error');
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


async function syncLocalStorageToServer() {
  if (!navigator.onLine) return;

  try {
    // Sync times if they exist
    if (localStorage.getItem('times')) {
      const times = JSON.parse(localStorage.getItem('times'));

      const response = await fetch('/submit-timings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'times',
          data_array: times,
          id: getClientId(),
        }),
      });

      const result = await response.json();

      if (response.ok && result.status === 'success') {
        localStorage.removeItem('times');
        console.log('Successfully synced times to server');
      } else {
        throw new Error(result.message || 'Failed to sync times');
      }
    }

    // Sync runners if they exist
    if (localStorage.getItem('runners')) {
      const runners = JSON.parse(localStorage.getItem('runners'));

      const response = await fetch('/submit-runners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'runners',
          data_array: runners,
          id: getClientId(),
        }),
      });

      const result = await response.json();

      if (response.ok && result.status === 'success') {
        localStorage.removeItem('runners');
        console.log('Successfully synced runners to server');
      } else {
        throw new Error(result.message || 'Failed to sync runners');
      }
    }

    // Refresh results if results view is active
    if (document.querySelector('#result-container').style.display === 'block') {
      const resultsData = await getResults();
      displayResults(resultsData);
    }
  } catch (error) {
    console.error('Sync error:', error);
    errorMessageDisplay('Failed to sync local data: ' + error.message, 'error');
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

// Service Worker Registration //
async function registerServiceWorker() {
  if (navigator.serviceWorker) {
    await navigator.serviceWorker.register('./sw.js');
  }
}
