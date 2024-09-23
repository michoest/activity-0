const loki = require('lokijs');
const { v4: uuid } = require('uuid');

const dbPath = process.env.DB_PATH || './db/db.db';

let db;

async function initDatabase(callback) {
    const dbFile = dbPath;
    db = new loki(dbFile, {
        autoload: true,
        autoloadCallback: databaseInitialized,
        autosave: true, 
        autosaveInterval: 4000 // save every 4 seconds
    });

    async function databaseInitialized() {
        let activities = db.getCollection('activities');
        
        if (activities === null) {
            activities = db.addCollection('activities', { indices: ['id'] });
        }
        
        // If the collections are empty, load and process initial data
        if (activities.count() === 0) {
            const initialData = require('./db.init.js');
            await loadInitialData(initialData);
        }
        
        console.log("Database initialized.");
        if (callback) callback();
    }
}

async function loadInitialData(data) {
    const activities = db.getCollection('activities');
    
    // Process and insert activities
    const activityIds = data.activities.map(activity => {
        const activityObj = {
            id: uuid(),
            ...activity
        };
        activities.insert(activityObj);
        return activityObj.id;
    });
    
    console.log("Initial data loaded.");
}

function getDb() {
    return db;
}

function getDbCollections() {
    const collections = {
        'Activities': 'activities'
    }
    
    return Object.fromEntries(Object.entries(collections).map(([key, value]) => [key, db.getCollection(value)]));
}

module.exports = { initDatabase, getDb, getDbCollections };