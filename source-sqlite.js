import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Initialise the database
async function init() {
  try {
    const db = await open({
      filename: './database.sqlite',
      driver: sqlite3.Database,
      verbose: true,
    });

    await db.migrate({
      migrationsPath: './migrations-sqlite',
    });

    return db;
  } catch (error) {
    console.error('Database initialisation failed:', error);
    return null;
  }
}

const dbConn = init();

// Database Functions
export async function addRaceData(type, data, id) {
  if (!type || !data) {
    return { success: false, error: 'Missing required parameters' };
  }

  try {
    const db = await dbConn;
    if (!db) {
      return { success: false, error: 'Database connection failed' };
    }

    await db.run(
      'INSERT INTO race_data (data_type, data_array, client_id, time) VALUES (?, ?, ?, datetime("now"))',
      [type, JSON.stringify(data), id],
    );

    return { success: true };
  } catch (error) {
    console.error('Database error:', error);
    return {
      success: false,
      error: error.message.includes('UNIQUE') ? 'This client already submitted this type of data' : 'Database operation failed',
    };
  }
}


export async function getRaceData(type) {
  try {
    const db = await dbConn;
    if (!db) {
      return { success: false, error: 'Database connection failed', data: [] };
    }

    const result = await db.all(
      'SELECT * FROM race_data WHERE data_type = ? ORDER BY time DESC',
      [type],
    );

    return {
      success: true,
      data: result.map(row => ({
        ...row,
        data_array: JSON.parse(row.data_array),
      })),
    };
  } catch (error) {
    console.error('Database error:', error);
    return { success: false, error: 'Failed to fetch data', data: [] };
  }
}

export async function addRaceResult(timesArray, runnersArray) {
  if (!timesArray || !runnersArray) {
    return { success: false, error: 'Missing required parameters' };
  }

  try {
    const db = await dbConn;
    if (!db) {
      return { success: false, error: 'Database connection failed' };
    }

    await db.run(
      'INSERT OR REPLACE INTO race_results (id, times_array, runners_array) VALUES (1, ?, ?)',
      [JSON.stringify(timesArray), JSON.stringify(runnersArray)],
    );

    return { success: true };
  } catch (error) {
    console.error('Database error:', error);
    return {
      success: false,
      error: 'Failed to save race results',
    };
  }
}

export async function getCurrentResults() {
  try {
    const db = await dbConn;
    if (!db) {
      return { success: false, error: 'Database connection failed', times: [], runners: [] };
    }

    const results = await db.get('SELECT * FROM race_results WHERE id = 1');
    return {
      success: true,
      times: results ? JSON.parse(results.times_array) : [],
      runners: results ? JSON.parse(results.runners_array) : [],
    };
  } catch (error) {
    console.error('Database error:', error);
    return { success: false, error: 'Failed to fetch results', times: [], runners: [] };
  }
}

export async function clearDBData(table) {
  try {
    const db = await dbConn;
    if (!db) {
      return { success: false, error: 'Database connection failed' };
    }

    const validTables = ['race_data', 'race_results'];
    if (!validTables.includes(table)) {
      return { success: false, error: 'Invalid table name' };
    }

    await db.run(`DELETE FROM ${table}`);

    return { success: true };
  } catch (error) {
    console.error('Database error:', error);
    return {
      success: false,
      error: 'Failed to clear race data',
    };
  }
}
