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
let db;
let dbInitialized = false;
function getDb() {
    if (!dbInitialized || !db) {
        throw new Error('Database not initialized. Please call initDB() after app is ready.');
    }
    return db;
}
function initDB() {
    const dbPath = path_1.default.join(electron_1.app.getPath('userData'), 'sentinel.db');
    console.log('[SQLite DB] Initializing database at path:', dbPath);
    try {
        db = new better_sqlite3_1.default(dbPath);
        dbInitialized = true;
        console.log('[SQLite DB] Database file opened successfully.');
        // Create tables
        console.log("[SQLite DB] Creating tables if they don't exist...");
        try {
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
                    isEdited INTEGER DEFAULT 0, -- boolean 0/1
                    updatedAt TEXT,
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
                    syncStatus TEXT DEFAULT 'pending', -- 'synced', 'pending'
                    FOREIGN KEY (pollLocalId) REFERENCES polls(localId),
                    UNIQUE(pollLocalId, userId)
                );
            `);
            console.log('[SQLite DB] Tables created/verified successfully.');
        }
        catch (tableError) {
            console.error('[SQLite DB] Error during table creation:', tableError);
            throw tableError;
        }
        // Migration: Add missing columns for existing databases
        console.log('[SQLite DB] Checking for needed migrations...');
        try {
            const tableInfo = db.prepare("PRAGMA table_info(polls)").all();
            const columns = tableInfo.map(col => col.name);
            console.log('[SQLite DB] Current columns in polls table:', columns.join(', '));
            if (!columns.includes('cloudSignalId')) {
                console.log('[SQLite DB] Migrating: Adding cloudSignalId to polls table');
                db.exec("ALTER TABLE polls ADD COLUMN cloudSignalId INTEGER");
            }
            if (!columns.includes('syncStatus')) {
                console.log('[SQLite DB] Migrating: Adding syncStatus to polls table');
                db.exec("ALTER TABLE polls ADD COLUMN syncStatus TEXT DEFAULT 'pending'");
            }
            if (!columns.includes('isEdited')) {
                console.log('[SQLite DB] Migrating: Adding isEdited to polls table');
                db.exec("ALTER TABLE polls ADD COLUMN isEdited INTEGER DEFAULT 0");
            }
            if (!columns.includes('updatedAt')) {
                console.log('[SQLite DB] Migrating: Adding updatedAt to polls table');
                db.exec("ALTER TABLE polls ADD COLUMN updatedAt TEXT");
            }
            const respTableInfo = db.prepare("PRAGMA table_info(responses)").all();
            const respColumns = respTableInfo.map(col => col.name);
            if (!respColumns.includes('syncStatus')) {
                console.log('[SQLite DB] Migrating: Adding syncStatus to responses table');
                db.exec("ALTER TABLE responses ADD COLUMN syncStatus TEXT DEFAULT 'pending'");
            }
            console.log('[SQLite DB] Migrations check complete.');
        }
        catch (migrationError) {
            console.error('[SQLite DB] Error during migrations:', migrationError);
            // We don't necessarily want to throw here if the basic tables are ok, 
            // but for now we will to be safe.
            throw migrationError;
        }
        // Migration: Clean up duplicate polls with same cloudSignalId
        console.log('[SQLite DB] Checking for duplicate polls by cloudSignalId...');
        try {
            const duplicates = db.prepare(`
                SELECT cloudSignalId, COUNT(*) as count 
                FROM polls 
                WHERE cloudSignalId IS NOT NULL 
                GROUP BY cloudSignalId 
                HAVING count > 1
            `).all();
            if (duplicates.length > 0) {
                console.log(`[SQLite DB] Found ${duplicates.length} signals with duplicate local entries. Cleaning up...`);
                for (const dup of duplicates) {
                    const instances = db.prepare(`
                        SELECT localId, consumers 
                        FROM polls 
                        WHERE cloudSignalId = ?
                        ORDER BY length(consumers) DESC -- Prefer the one with more consumers
                    `).all(dup.cloudSignalId);
                    const primary = instances[0];
                    const toDelete = instances.slice(1);
                    for (const entry of toDelete) {
                        console.log(`[SQLite DB] Merging duplicate ${entry.localId} into ${primary.localId}`);
                        // Update responses to point to the primary localId
                        db.prepare('UPDATE OR IGNORE responses SET pollLocalId = ? WHERE pollLocalId = ?').run(primary.localId, entry.localId);
                        // Delete the orphaned responses (if UNIQUE constraint on responses(pollLocalId, userId) hit)
                        db.prepare('DELETE FROM responses WHERE pollLocalId = ?').run(entry.localId);
                        // Delete the duplicate poll
                        db.prepare('DELETE FROM polls WHERE localId = ?').run(entry.localId);
                    }
                }
                console.log('[SQLite DB] Duplicate cleanup complete.');
            }
            else {
                console.log('[SQLite DB] No duplicate polls found.');
            }
        }
        catch (cleanupError) {
            console.error('[SQLite DB] Error during duplicate cleanup:', cleanupError);
        }
        console.log('[SQLite DB] Initialization complete.');
    }
    catch (error) {
        console.error('[SQLite DB] FATAL ERROR during initialization:', error);
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
    const email = response.consumerEmail ? String(response.consumerEmail).trim() : '';
    if (!email) {
        throw new Error('userId (consumerEmail) is required');
    }
    const selectedOption = response.response ? String(response.response).trim() : '';
    if (!selectedOption) {
        throw new Error('selectedOption is required');
    }
}
function createPoll(poll) {
    validatePoll(poll);
    const database = getDb();
    try {
        // If it has a cloudSignalId, check if it already exists under a different localId
        if (poll.cloudSignalId) {
            const existing = database.prepare('SELECT localId FROM polls WHERE cloudSignalId = ?').get(poll.cloudSignalId);
            if (existing && existing.localId !== poll.id) {
                console.log(`[SQLite DB] Found existing poll with cloudSignalId ${poll.cloudSignalId} but different localId. Updating existing record ${existing.localId}`);
                // Use the existing localId to avoid creating a duplicate
                poll.id = existing.localId;
            }
        }
        const stmt = database.prepare(`
            INSERT INTO polls (
                localId, question, options, publisherEmail, publisherName, 
                status, deadline, anonymityMode, isPersistentFinalAlert, 
                consumers, defaultResponse, showDefaultToConsumers, publishedAt,
                cloudSignalId, syncStatus, isEdited, updatedAt
            ) VALUES (
                @localId, @question, @options, @publisherEmail, @publisherName, 
                @status, @deadline, @anonymityMode, @isPersistentFinalAlert, 
                @consumers, @defaultResponse, @showDefaultToConsumers, @publishedAt,
                @cloudSignalId, @syncStatus, @isEdited, @updatedAt
            )
            ON CONFLICT(localId) DO UPDATE SET
                question = excluded.question,
                options = excluded.options,
                publisherEmail = excluded.publisherEmail,
                publisherName = excluded.publisherName,
                status = excluded.status,
                deadline = excluded.deadline,
                anonymityMode = excluded.anonymityMode,
                isPersistentFinalAlert = excluded.isPersistentFinalAlert,
                consumers = excluded.consumers,
                defaultResponse = excluded.defaultResponse,
                showDefaultToConsumers = excluded.showDefaultToConsumers,
                publishedAt = excluded.publishedAt,
                cloudSignalId = excluded.cloudSignalId,
                syncStatus = excluded.syncStatus,
                isEdited = excluded.isEdited,
                updatedAt = excluded.updatedAt
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
            syncStatus: poll.syncStatus || 'pending',
            isEdited: poll.isEdited ? 1 : 0,
            updatedAt: poll.updatedAt || new Date().toISOString()
        });
        return info;
    }
    catch (error) {
        console.error('[SQLite DB] Error creating poll:', error);
        throw error;
    }
}
function getPolls() {
    console.log('[SQLite DB] Fetching all polls...');
    try {
        const stmt = getDb().prepare('SELECT * FROM polls');
        const rows = stmt.all();
        console.log(`[SQLite DB] Found ${rows.length} polls in local database.`);
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
            isEdited: !!row.isEdited,
            updatedAt: row.updatedAt
        }));
    }
    catch (error) {
        console.error('[SQLite DB] Error getting polls:', error);
        return [];
    }
}
function updatePoll(pollId, updates, republish = false) {
    try {
        const sets = [];
        const values = { localId: pollId };
        // Set updatedAt to now if not explicitly provided
        if (!updates.updatedAt) {
            updates.updatedAt = new Date().toISOString();
        }
        const fields = [
            'question', 'options', 'publisherEmail', 'publisherName', 'status',
            'deadline', 'anonymityMode', 'isPersistentFinalAlert', 'consumers',
            'defaultResponse', 'showDefaultToConsumers', 'publishedAt', 'cloudSignalId', 'syncStatus', 'isEdited', 'updatedAt'
        ];
        fields.forEach(field => {
            if (updates[field] !== undefined) {
                sets.push(`${field} = @${field}`);
                if (field === 'options' || field === 'consumers') {
                    values[field] = JSON.stringify(updates[field]);
                }
                else if (field === 'isPersistentFinalAlert' || field === 'showDefaultToConsumers' || field === 'isEdited') {
                    values[field] = updates[field] ? 1 : 0;
                }
                else {
                    values[field] = updates[field];
                }
            }
        });
        if (sets.length > 0) {
            const stmt = getDb().prepare(`UPDATE polls SET ${sets.join(', ')} WHERE localId = @localId`);
            stmt.run(values);
        }
        if (republish) {
            const deleteStmt = getDb().prepare('DELETE FROM responses WHERE pollLocalId = ?');
            deleteStmt.run(pollId);
        }
        return { changes: 1 };
    }
    catch (error) {
        console.error('[SQLite DB] Error updating poll:', error);
        throw error;
    }
}
function deletePoll(pollId) {
    try {
        const db = getDb();
        // Delete responses first to avoid foreign key constraint
        const deleteResponses = db.prepare('DELETE FROM responses WHERE pollLocalId = ?');
        deleteResponses.run(pollId);
        // Then delete the poll
        const deletePollStmt = db.prepare('DELETE FROM polls WHERE localId = ?');
        return deletePollStmt.run(pollId);
    }
    catch (error) {
        console.error('[SQLite DB] Error deleting poll:', error);
        throw error;
    }
}
function submitResponse(response) {
    validateResponse(response);
    try {
        const stmt = getDb().prepare(`
            INSERT OR REPLACE INTO responses (
                pollLocalId, userId, selectedOption, timeOfSubmission, isDefault, skipReason
            ) VALUES (
                @pollLocalId, @userId, @selectedOption, @timeOfSubmission, @isDefault, @skipReason
            )
        `);
        const info = stmt.run({
            pollLocalId: response.pollId,
            userId: String(response.consumerEmail || '').trim(),
            selectedOption: String(response.response || '').trim(),
            timeOfSubmission: response.submittedAt,
            isDefault: response.isDefault ? 1 : 0,
            skipReason: response.skipReason || null
        });
        return info;
    }
    catch (error) {
        console.error('[SQLite DB] Error submitting response:', error);
        throw error;
    }
}
function getResponses() {
    console.log('[SQLite DB] Fetching all responses...');
    try {
        const stmt = getDb().prepare('SELECT * FROM responses');
        const rows = stmt.all();
        console.log(`[SQLite DB] Found ${rows.length} responses in local database.`);
        return rows.map((row) => ({
            pollId: row.pollLocalId,
            consumerEmail: row.userId,
            response: row.selectedOption,
            submittedAt: row.timeOfSubmission,
            isDefault: !!row.isDefault,
            skipReason: row.skipReason
        }));
    }
    catch (error) {
        console.error('[SQLite DB] Error getting responses:', error);
        return [];
    }
}
//# sourceMappingURL=db.js.map