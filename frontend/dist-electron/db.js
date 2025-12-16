"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDB = initDB;
exports.createPoll = createPoll;
exports.getPolls = getPolls;
exports.updatePoll = updatePoll;
exports.deletePoll = deletePoll;
exports.submitResponse = submitResponse;
exports.getResponses = getResponses;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const electron_1 = require("electron");
const dbPath = path_1.default.join(electron_1.app.getPath('userData'), 'sentinel.db');
let db;
function initDB() {
    try {
        db = new better_sqlite3_1.default(dbPath);
        console.log('SQLite Database initialized at:', dbPath);
        // Create tables
        db.exec(`
            CREATE TABLE IF NOT EXISTS polls (
                localId TEXT PRIMARY KEY,
                question TEXT NOT NULL,
                options TEXT NOT NULL, -- JSON array
                publisherEmail TEXT,
                publisherName TEXT,
                status TEXT,
                deadline TEXT,
                anonymityMode TEXT,
                isPersistentFinalAlert INTEGER, -- boolean 0/1
                consumers TEXT, -- JSON array
                defaultResponse TEXT,
                showDefaultToConsumers INTEGER, -- boolean 0/1
                publishedAt TEXT,
                cloudSignalId INTEGER, -- Backend signal ID
                syncStatus TEXT DEFAULT 'pending', -- 'synced', 'pending', 'error'
                createdAt TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS responses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pollLocalId TEXT NOT NULL,
                userId TEXT NOT NULL,
                selectedOption TEXT NOT NULL,
                timeOfSubmission TEXT NOT NULL,
                isDefault INTEGER DEFAULT 0, -- boolean 0/1
                skipReason TEXT,
                FOREIGN KEY (pollLocalId) REFERENCES polls(localId),
                UNIQUE(pollLocalId, userId)
            );
        `);
    }
    catch (error) {
        console.error('Failed to initialize SQLite database:', error);
        throw error;
    }
}
// Validations
function validatePoll(poll) {
    if (!poll.question || poll.question.trim() === '') {
        throw new Error('question cannot be blank');
    }
    if (!poll.options || poll.options.length < 2) {
        throw new Error('options must contain at least 2 values');
    }
    const optionTexts = poll.options.map(o => o.text.trim());
    if (optionTexts.some(t => !t)) {
        throw new Error('options cannot contain empty or blank values');
    }
    // Check duplicates (case-insensitive)
    const lowerOptions = optionTexts.map(t => t.toLowerCase());
    const uniqueOptions = new Set(lowerOptions);
    if (uniqueOptions.size !== lowerOptions.length) {
        throw new Error('options contain duplicate values (case-insensitive)');
    }
}
function validateResponse(response) {
    if (!response.consumerEmail || response.consumerEmail.trim() === '') {
        throw new Error('userId (consumerEmail) is required');
    }
    if (!response.response || response.response.trim() === '') {
        throw new Error('selectedOption is required');
    }
}
function createPoll(poll) {
    validatePoll(poll);
    const stmt = db.prepare(`
        INSERT INTO polls (
            localId, question, options, publisherEmail, publisherName, 
            status, deadline, anonymityMode, isPersistentFinalAlert, 
            consumers, defaultResponse, showDefaultToConsumers, publishedAt,
            cloudSignalId, syncStatus
        ) VALUES (
            @localId, @question, @options, @publisherEmail, @publisherName, 
            @status, @deadline, @anonymityMode, @isPersistentFinalAlert, 
            @consumers, @defaultResponse, @showDefaultToConsumers, @publishedAt,
            @cloudSignalId, @syncStatus
        )
    `);
    const info = stmt.run({
        localId: poll.id,
        question: poll.question.trim(),
        options: JSON.stringify(poll.options),
        publisherEmail: poll.publisherEmail,
        publisherName: poll.publisherName,
        status: poll.status,
        deadline: poll.deadline,
        anonymityMode: poll.anonymityMode,
        isPersistentFinalAlert: poll.isPersistentFinalAlert ? 1 : 0,
        consumers: JSON.stringify(poll.consumers),
        defaultResponse: poll.defaultResponse,
        showDefaultToConsumers: poll.showDefaultToConsumers ? 1 : 0,
        publishedAt: poll.publishedAt,
        cloudSignalId: poll.cloudSignalId || null,
        syncStatus: poll.syncStatus || 'pending'
    });
    return info;
}
function getPolls() {
    const stmt = db.prepare('SELECT * FROM polls');
    const rows = stmt.all();
    return rows.map((row) => ({
        id: row.localId,
        question: row.question,
        options: JSON.parse(row.options),
        publisherEmail: row.publisherEmail,
        publisherName: row.publisherName,
        status: row.status,
        deadline: row.deadline,
        anonymityMode: row.anonymityMode,
        isPersistentFinalAlert: !!row.isPersistentFinalAlert,
        consumers: JSON.parse(row.consumers),
        defaultResponse: row.defaultResponse,
        showDefaultToConsumers: !!row.showDefaultToConsumers,
        publishedAt: row.publishedAt,
        cloudSignalId: row.cloudSignalId,
        syncStatus: row.syncStatus || 'pending',
        isEdited: false // Default
    }));
}
function updatePoll(pollId, updates, republish = false) {
    const sets = [];
    const values = { localId: pollId };
    const fields = [
        'question', 'options', 'publisherEmail', 'publisherName', 'status',
        'deadline', 'anonymityMode', 'isPersistentFinalAlert', 'consumers',
        'defaultResponse', 'showDefaultToConsumers', 'publishedAt', 'cloudSignalId', 'syncStatus'
    ];
    fields.forEach(field => {
        if (updates[field] !== undefined) {
            sets.push(`${field} = @${field}`);
            if (field === 'options' || field === 'consumers') {
                values[field] = JSON.stringify(updates[field]);
            }
            else if (field === 'isPersistentFinalAlert' || field === 'showDefaultToConsumers') {
                values[field] = updates[field] ? 1 : 0;
            }
            else {
                values[field] = updates[field];
            }
        }
    });
    if (sets.length > 0) {
        const stmt = db.prepare(`UPDATE polls SET ${sets.join(', ')} WHERE localId = @localId`);
        stmt.run(values);
    }
    if (republish) {
        const deleteStmt = db.prepare('DELETE FROM responses WHERE pollLocalId = ?');
        deleteStmt.run(pollId);
    }
    return { changes: 1 }; // Return something to indicate success
}
function deletePoll(pollId) {
    const stmt = db.prepare('DELETE FROM polls WHERE localId = ?');
    return stmt.run(pollId);
}
function submitResponse(response) {
    validateResponse(response);
    const stmt = db.prepare(`
        INSERT INTO responses (
            pollLocalId, userId, selectedOption, timeOfSubmission, isDefault, skipReason
        ) VALUES (
            @pollLocalId, @userId, @selectedOption, @timeOfSubmission, @isDefault, @skipReason
        )
    `);
    const info = stmt.run({
        pollLocalId: response.pollId,
        userId: response.consumerEmail.trim(),
        selectedOption: response.response.trim(),
        timeOfSubmission: response.submittedAt,
        isDefault: response.isDefault ? 1 : 0,
        skipReason: response.skipReason || null
    });
    return info;
}
function getResponses() {
    const stmt = db.prepare('SELECT * FROM responses');
    const rows = stmt.all();
    return rows.map((row) => ({
        pollId: row.pollLocalId,
        consumerEmail: row.userId,
        response: row.selectedOption,
        submittedAt: row.timeOfSubmission,
        isDefault: !!row.isDefault,
        skipReason: row.skipReason
    }));
}
//# sourceMappingURL=db.js.map