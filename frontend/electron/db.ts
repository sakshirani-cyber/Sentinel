import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

const dbPath = path.join(app.getPath('userData'), 'sentinel.db');
let db: Database.Database;

export function initDB() {
    try {
        db = new Database(dbPath);
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
                FOREIGN KEY (pollLocalId) REFERENCES polls(localId),
                UNIQUE(pollLocalId, userId)
            );
        `);

        // Migration: Add missing columns for existing databases
        const tableInfo = db.prepare("PRAGMA table_info(polls)").all();
        const columns = (tableInfo as any[]).map(col => col.name);

        if (!columns.includes('cloudSignalId')) {
            console.log('Migrating database: Adding cloudSignalId to polls table');
            db.exec("ALTER TABLE polls ADD COLUMN cloudSignalId INTEGER");
        }

        if (!columns.includes('syncStatus')) {
            console.log('Migrating database: Adding syncStatus to polls table');
            db.exec("ALTER TABLE polls ADD COLUMN syncStatus TEXT DEFAULT 'pending'");
        }

        if (!columns.includes('isEdited')) {
            console.log('Migrating database: Adding isEdited to polls table');
            db.exec("ALTER TABLE polls ADD COLUMN isEdited INTEGER DEFAULT 0");
        }

        if (!columns.includes('updatedAt')) {
            console.log('Migrating database: Adding updatedAt to polls table');
            db.exec("ALTER TABLE polls ADD COLUMN updatedAt TEXT");
        }

    } catch (error) {
        console.error('Failed to initialize SQLite database:', error);
        throw error;
    }
}

// Types matching frontend interfaces (approx)
interface Poll {
    id: string; // This maps to localId
    publisherEmail: string;
    publisherName: string;
    question: string;
    options: { id: string; text: string }[];
    defaultResponse: string;
    showDefaultToConsumers: boolean;
    anonymityMode: 'anonymous' | 'record';
    deadline: string;
    isPersistentFinalAlert: boolean;
    consumers: string[];
    publishedAt: string;
    status: 'active' | 'completed';
    cloudSignalId?: number;
    syncStatus?: 'synced' | 'pending' | 'error';
    isEdited?: boolean;
    updatedAt?: string;
}

interface Response {
    pollId: string;
    consumerEmail: string;
    response: string;
    submittedAt: string;
    isDefault: boolean;
    skipReason?: string;
}

// Validations
function validatePoll(poll: Poll) {
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

function validateResponse(response: Response) {
    if (!response.consumerEmail || response.consumerEmail.trim() === '') {
        throw new Error('userId (consumerEmail) is required');
    }
    if (!response.response || response.response.trim() === '') {
        throw new Error('selectedOption is required');
    }
}

export function createPoll(poll: Poll) {
    validatePoll(poll);

    const stmt = db.prepare(`
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

export function getPolls(): Poll[] {
    const stmt = db.prepare('SELECT * FROM polls');
    const rows = stmt.all();

    return rows.map((row: any) => ({
        id: row.localId,
        question: row.question,
        options: JSON.parse(row.options),
        publisherEmail: row.publisherEmail,
        publisherName: row.publisherName,
        status: row.status as 'active' | 'completed',
        deadline: row.deadline,
        anonymityMode: row.anonymityMode as 'anonymous' | 'record',
        isPersistentFinalAlert: !!row.isPersistentFinalAlert,
        consumers: JSON.parse(row.consumers),
        defaultResponse: row.defaultResponse,
        showDefaultToConsumers: !!row.showDefaultToConsumers,
        publishedAt: row.publishedAt,
        cloudSignalId: row.cloudSignalId,
        syncStatus: (row.syncStatus as 'synced' | 'pending' | 'error') || 'pending',
        isEdited: !!row.isEdited,
        updatedAt: row.updatedAt
    }));
}

export function updatePoll(pollId: string, updates: Partial<Poll>, republish: boolean = false) {
    const sets: string[] = [];
    const values: any = { localId: pollId };

    // Always set isEdited to true on update
    updates.isEdited = true;
    // Set updatedAt to now
    updates.updatedAt = new Date().toISOString();

    const fields = [
        'question', 'options', 'publisherEmail', 'publisherName', 'status',
        'deadline', 'anonymityMode', 'isPersistentFinalAlert', 'consumers',
        'defaultResponse', 'showDefaultToConsumers', 'publishedAt', 'cloudSignalId', 'syncStatus', 'isEdited', 'updatedAt'
    ];

    fields.forEach(field => {
        if (updates[field as keyof Poll] !== undefined) {
            sets.push(`${field} = @${field}`);
            if (field === 'options' || field === 'consumers') {
                values[field] = JSON.stringify(updates[field as keyof Poll]);
            } else if (field === 'isPersistentFinalAlert' || field === 'showDefaultToConsumers' || field === 'isEdited') {
                values[field] = updates[field as keyof Poll] ? 1 : 0;
            } else {
                values[field] = updates[field as keyof Poll];
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

export function deletePoll(pollId: string) {
    const stmt = db.prepare('DELETE FROM polls WHERE localId = ?');
    return stmt.run(pollId);
}

export function submitResponse(response: Response) {
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

export function getResponses(): Response[] {
    const stmt = db.prepare('SELECT * FROM responses');
    const rows = stmt.all();

    return rows.map((row: any) => ({
        pollId: row.pollLocalId,
        consumerEmail: row.userId,
        response: row.selectedOption,
        submittedAt: row.timeOfSubmission,
        isDefault: !!row.isDefault,
        skipReason: row.skipReason
    }));
}
