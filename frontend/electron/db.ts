import Database from 'better-sqlite3';
console.log('>>> [SQLite DB] MODULE LOADED <<<');
import path from 'path';
import { app } from 'electron';

let db: Database.Database | undefined;
let dbInitialized = false;

function getDb() {
    if (!dbInitialized || !db) {
        if (app.isReady()) {
            console.log('[SQLite DB] getDb() called before manual initDB(), but app is ready. Initializing now...');
            initDB();
            return db!;
        }
        throw new Error('Database not initialized. Please call initDB() after app is ready.');
    }
    return db;
}

export function initDB() {
    const dbPath = path.join(app.getPath('userData'), 'sentinel.db');
    console.log('[SQLite DB] Initializing database at path:', dbPath);
    try {
        db = new Database(dbPath);
        dbInitialized = true;
        console.log('[SQLite DB] Database file opened successfully.');

        // Create tables
        console.log("[SQLite DB] Creating tables if they don't exist...");
        try {
            db.exec(`
                CREATE TABLE IF NOT EXISTS polls (
                    localId TEXT PRIMARY KEY,
                    title TEXT, -- Optional title for the poll
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
                    showIndividualResponses INTEGER DEFAULT 1, -- boolean 0/1
                    publishedAt TEXT,
                    cloudSignalId INTEGER, -- Backend signal ID
                    syncStatus TEXT DEFAULT 'pending', -- 'synced', 'pending', 'error'
                    isEdited INTEGER DEFAULT 0, -- boolean 0/1
                    updatedAt TEXT,
                    scheduledFor TEXT,
                    anonymousReasons TEXT, -- JSON array of strings
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

                CREATE TABLE IF NOT EXISTS labels (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL UNIQUE,
                    description TEXT,
                    syncStatus TEXT DEFAULT 'pending', -- 'synced', 'pending'
                    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
                    cloudId INTEGER, -- Backend ID
                    editedAt TEXT -- ISO 8601 Timestamp
                );
            `);
            console.log('[SQLite DB] Tables created/verified successfully.');
        } catch (tableError) {
            console.error('[SQLite DB] Error during table creation:', tableError);
            throw tableError;
        }

        // Migration: Add missing columns for existing databases
        console.log('[SQLite DB] Checking for needed migrations...');
        try {
            const tableInfo = db.prepare("PRAGMA table_info(polls)").all();
            const columns = (tableInfo as any[]).map(col => col.name);
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

            if (!columns.includes('scheduledFor')) {
                console.log('[SQLite DB] Migrating: Adding scheduledFor to polls table');
                db.exec("ALTER TABLE polls ADD COLUMN scheduledFor TEXT");
            }

            if (!columns.includes('labels')) {
                console.log('[SQLite DB] Migrating: Adding labels to polls table');
                db.exec("ALTER TABLE polls ADD COLUMN labels TEXT");
            }

            if (!columns.includes('anonymousReasons')) {
                console.log('[SQLite DB] Migrating: Adding anonymousReasons to polls table');
                db.exec("ALTER TABLE polls ADD COLUMN anonymousReasons TEXT");
            }

            if (!columns.includes('showIndividualResponses')) {
                console.log('[SQLite DB] Migrating: Adding showIndividualResponses to polls table');
                db.exec("ALTER TABLE polls ADD COLUMN showIndividualResponses INTEGER DEFAULT 1");
                // Set default to true (1) for existing polls
                db.exec("UPDATE polls SET showIndividualResponses = 1 WHERE showIndividualResponses IS NULL");
                console.log('[SQLite DB] Set default showIndividualResponses = true for existing polls');
            }

            // Migration: Add title column to polls table
            if (!columns.includes('title')) {
                console.log('[SQLite DB] Migrating: Adding title column to polls table');
                db.exec("ALTER TABLE polls ADD COLUMN title TEXT");
                // Populate existing polls with question as title (for backward compatibility)
                db.exec("UPDATE polls SET title = question WHERE title IS NULL OR title = ''");
                console.log('[SQLite DB] Populated existing polls with question as title');
            }

            const respTableInfo = db.prepare("PRAGMA table_info(responses)").all();
            const respColumns = (respTableInfo as any[]).map(col => col.name);
            if (!respColumns.includes('syncStatus')) {
                console.log('[SQLite DB] Migrating: Adding syncStatus to responses table');
                db.exec("ALTER TABLE responses ADD COLUMN syncStatus TEXT DEFAULT 'pending'");
            }

            const labelTableInfo = db.prepare("PRAGMA table_info(labels)").all();
            const labelColumns = (labelTableInfo as any[]).map(col => col.name);
            if (!labelColumns.includes('syncStatus')) {
                console.log('[SQLite DB] Migrating: Adding syncStatus to labels table');
                db.exec("ALTER TABLE labels ADD COLUMN syncStatus TEXT DEFAULT 'pending'");
            }
            if (!labelColumns.includes('cloudId')) {
                console.log('[SQLite DB] Migrating: Adding cloudId to labels table');
                db.exec("ALTER TABLE labels ADD COLUMN cloudId INTEGER");
            }
            if (!labelColumns.includes('editedAt')) {
                console.log('[SQLite DB] Migrating: Adding editedAt to labels table');
                db.exec("ALTER TABLE labels ADD COLUMN editedAt TEXT");
            }

            // Migration: Remove color column from labels table (SQLite doesn't support DROP COLUMN)
            if (labelColumns.includes('color')) {
                console.log('[SQLite DB] Migrating: Removing color column from labels table');
                try {
                    db.exec(`
                        BEGIN TRANSACTION;
                        
                        CREATE TABLE labels_new (
                            id TEXT PRIMARY KEY,
                            name TEXT NOT NULL UNIQUE,
                            description TEXT,
                            syncStatus TEXT DEFAULT 'pending',
                            createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
                            cloudId INTEGER,
                            editedAt TEXT
                        );
                        
                        INSERT INTO labels_new (id, name, description, syncStatus, createdAt, cloudId, editedAt)
                        SELECT id, name, description, syncStatus, createdAt, cloudId, editedAt
                        FROM labels;
                        
                        DROP TABLE labels;
                        
                        ALTER TABLE labels_new RENAME TO labels;
                        
                        COMMIT;
                    `);
                    console.log('[SQLite DB] Successfully removed color column from labels table');
                } catch (migrationErr) {
                    console.error('[SQLite DB] Error removing color column:', migrationErr);
                    db.exec('ROLLBACK;');
                    // Continue execution - this is not critical for app startup
                }
            }

            console.log('[SQLite DB] Migrations check complete.');
        } catch (migrationError) {
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
            `).all() as any[];

            if (duplicates.length > 0) {
                console.log(`[SQLite DB] Found ${duplicates.length} signals with duplicate local entries. Cleaning up...`);
                for (const dup of duplicates) {
                    const instances = db.prepare(`
                        SELECT localId, consumers 
                        FROM polls 
                        WHERE cloudSignalId = ?
                        ORDER BY length(consumers) DESC -- Prefer the one with more consumers
                    `).all(dup.cloudSignalId) as any[];

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
            } else {
                console.log('[SQLite DB] No duplicate polls found.');
            }
        } catch (cleanupError) {
            console.error('[SQLite DB] Error during duplicate cleanup:', cleanupError);
        }

        console.log('[SQLite DB] Initialization complete.');
    } catch (error) {
        console.error('[SQLite DB] FATAL ERROR during initialization:', error);
        throw error;
    }
}

// Types matching frontend interfaces (approx)
interface Poll {
    id: string; // This maps to localId
    publisherEmail: string;
    publisherName: string;
    title?: string; // Optional for backward compatibility, but required for new polls
    question: string;
    options: { id: string; text: string }[];
    defaultResponse: string;
    showDefaultToConsumers: boolean;
    showIndividualResponses?: boolean;
    anonymityMode: 'anonymous' | 'record';
    deadline: string;
    isPersistentFinalAlert: boolean;
    consumers: string[];
    publishedAt: string;
    status: 'active' | 'completed' | 'scheduled';
    scheduledFor?: string;
    cloudSignalId?: number;
    syncStatus?: 'synced' | 'pending' | 'error';
    isEdited?: boolean;
    updatedAt?: string;
    labels?: string[];
    anonymousReasons?: string[];
}

interface Response {
    pollId: string;
    consumerEmail: string;
    response: string;
    submittedAt: string;
    isDefault: boolean;
    skipReason?: string;
    syncStatus?: 'synced' | 'pending';
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
    const email = response.consumerEmail ? String(response.consumerEmail).trim() : '';
    if (!email) {
        throw new Error('userId (consumerEmail) is required');
    }
    const selectedOption = response.response ? String(response.response).trim() : '';
    if (!selectedOption) {
        throw new Error('selectedOption is required');
    }
}

export function createPoll(poll: Poll) {
    validatePoll(poll);
    const database = getDb();
    try {
        // If it has a cloudSignalId, check if it already exists under a different localId
        if (poll.cloudSignalId) {
            const existing = database.prepare('SELECT localId FROM polls WHERE cloudSignalId = ?').get(poll.cloudSignalId) as { localId: string } | undefined;
            if (existing && existing.localId !== poll.id) {
                console.log(`[SQLite DB] Found existing poll with cloudSignalId ${poll.cloudSignalId} but different localId. Updating existing record ${existing.localId}`);
                poll.id = existing.localId;
            } else if (!existing) {
                // FALLBACK: If signalId is not in DB yet, try matching by question and publisher (helpful for publisher race condition)
                const pendingMatch = database.prepare(`
                SELECT localId FROM polls 
                WHERE publisherEmail = ? AND question = ? AND syncStatus = 'pending'
            `).get(poll.publisherEmail, poll.question.trim()) as { localId: string } | undefined;

                if (pendingMatch) {
                    console.log(`[SQLite DB] Found pending local poll matching incoming sync. Updating ${pendingMatch.localId}`);
                    poll.id = pendingMatch.localId;
                }
            }
        }

        const stmt = database.prepare(`
            INSERT INTO polls (
                localId, title, question, options, publisherEmail, publisherName, 
                status, deadline, anonymityMode, isPersistentFinalAlert, 
                consumers, defaultResponse, showDefaultToConsumers, showIndividualResponses, publishedAt,
                cloudSignalId, syncStatus, isEdited, updatedAt, scheduledFor, labels, anonymousReasons
            ) VALUES (
                @localId, @title, @question, @options, @publisherEmail, @publisherName, 
                @status, @deadline, @anonymityMode, @isPersistentFinalAlert, 
                @consumers, @defaultResponse, @showDefaultToConsumers, @showIndividualResponses, @publishedAt,
                @cloudSignalId, @syncStatus, @isEdited, @updatedAt, @scheduledFor, @labels, @anonymousReasons
            )
            ON CONFLICT(localId) DO UPDATE SET
                title = excluded.title,
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
                showIndividualResponses = excluded.showIndividualResponses,
                publishedAt = excluded.publishedAt,
                cloudSignalId = excluded.cloudSignalId,
                syncStatus = excluded.syncStatus,
                isEdited = excluded.isEdited,
                updatedAt = excluded.updatedAt,
                scheduledFor = excluded.scheduledFor,
                anonymousReasons = excluded.anonymousReasons
            `);

        const info = stmt.run({
            localId: poll.id,
            title: poll.title || poll.question.trim(), // Use title if provided, otherwise fallback to question
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
            showIndividualResponses: (poll.showIndividualResponses ?? true) ? 1 : 0,
            publishedAt: poll.publishedAt,
            cloudSignalId: poll.cloudSignalId || null,
            syncStatus: poll.syncStatus || 'pending',
            isEdited: poll.isEdited ? 1 : 0,
            updatedAt: poll.updatedAt || new Date().toISOString(),
            scheduledFor: poll.scheduledFor || null,
            labels: JSON.stringify(poll.labels || []),
            anonymousReasons: JSON.stringify(poll.anonymousReasons || [])
        });

        return info;
    } catch (error) {
        console.error('[SQLite DB] Error creating poll:', error);
        throw error;
    }
}

export function getPolls(): Poll[] {
    console.log('[SQLite DB] Fetching all polls...');
    try {
        const stmt = getDb().prepare('SELECT * FROM polls');
        const rows = stmt.all();
        console.log(`[SQLite DB] Found ${rows.length} polls in local database.`);

        return rows.map((row: any) => ({
            id: row.localId,
            title: row.title || row.question, // Use title if available, otherwise fallback to question
            question: row.question,
            options: JSON.parse(row.options),
            publisherEmail: row.publisherEmail,
            publisherName: row.publisherName,
            status: row.status as 'active' | 'completed' | 'scheduled',
            deadline: row.deadline,
            anonymityMode: row.anonymityMode as 'anonymous' | 'record',
            isPersistentFinalAlert: !!row.isPersistentFinalAlert,
            consumers: JSON.parse(row.consumers),
            defaultResponse: row.defaultResponse,
            showDefaultToConsumers: !!row.showDefaultToConsumers,
            showIndividualResponses: row.showIndividualResponses === 1 || row.showIndividualResponses === null || row.showIndividualResponses === undefined,
            publishedAt: row.publishedAt,
            cloudSignalId: row.cloudSignalId,
            syncStatus: (row.syncStatus as 'synced' | 'pending' | 'error') || 'pending',
            isEdited: !!row.isEdited,
            updatedAt: row.updatedAt,
            scheduledFor: row.scheduledFor,
            labels: JSON.parse(row.labels || '[]'),
            anonymousReasons: JSON.parse(row.anonymousReasons || '[]')
        }));
    } catch (error) {
        console.error('[SQLite DB] Error getting polls:', error);
        return [];
    }
}

export function updatePoll(pollId: string, updates: Partial<Poll>, republish: boolean = false) {
    try {
        const sets: string[] = [];
        const values: any = { localId: pollId };

        // Set updatedAt to now if not explicitly provided
        if (!updates.updatedAt) {
            updates.updatedAt = new Date().toISOString();
        }

        const fields = [
            'question', 'options', 'publisherEmail', 'publisherName', 'status',
            'deadline', 'anonymityMode', 'isPersistentFinalAlert', 'consumers',
            'defaultResponse', 'showDefaultToConsumers', 'showIndividualResponses', 'publishedAt', 'cloudSignalId', 'syncStatus', 'isEdited', 'updatedAt', 'scheduledFor', 'labels', 'anonymousReasons'
        ];

        fields.forEach(field => {
            if (updates[field as keyof Poll] !== undefined) {
                sets.push(`${field} = @${field}`);
                if (field === 'options' || field === 'consumers' || field === 'labels' || field === 'anonymousReasons') {
                    values[field] = JSON.stringify(updates[field as keyof Poll]);
                } else if (field === 'isPersistentFinalAlert' || field === 'showDefaultToConsumers' || field === 'showIndividualResponses' || field === 'isEdited') {
                    values[field] = updates[field as keyof Poll] ? 1 : 0;
                } else {
                    values[field] = updates[field as keyof Poll];
                }
            }
        });

        // Check for re-added consumers BEFORE applying updates if we are not republishing
        // This handles the case where a user was removed (edit 1) and then re-added (edit 2)
        // We want to wipe their old response so they see "Incoming" again.
        let reAddedConsumers: string[] = [];
        if (!republish && updates.consumers) {
            try {
                const currentPollStmt = getDb().prepare('SELECT consumers FROM polls WHERE localId = ?');
                const currentPollRow = currentPollStmt.get(pollId) as { consumers: string } | undefined;

                if (currentPollRow) {
                    const currentConsumers: string[] = JSON.parse(currentPollRow.consumers);
                    const newConsumers: string[] = updates.consumers; // already parsed array from frontend

                    // Identify consumers present in NEW list but NOT in OLD list
                    reAddedConsumers = newConsumers.filter(nc => !currentConsumers.includes(nc));

                    if (reAddedConsumers.length > 0) {
                        console.log(`[SQLite DB] Found re-added consumers for poll ${pollId}:`, reAddedConsumers);
                    }
                }
            } catch (e) {
                console.warn('[SQLite DB] Error checking for re-added consumers:', e);
            }
        }

        if (sets.length > 0) {
            const stmt = getDb().prepare(`UPDATE polls SET ${sets.join(', ')} WHERE localId = @localId`);
            stmt.run(values);
        }

        if (republish) {
            const deleteStmt = getDb().prepare('DELETE FROM responses WHERE pollLocalId = ?');
            deleteStmt.run(pollId);
        } else if (reAddedConsumers.length > 0) {
            // Delete responses only for the specific consumers who were re-added
            // Note: The column name in 'responses' table is 'userId', not 'consumerEmail'
            const placeholders = reAddedConsumers.map(() => '?').join(',');
            const deleteReAddedStmt = getDb().prepare(`DELETE FROM responses WHERE pollLocalId = ? AND userId IN (${placeholders})`);
            deleteReAddedStmt.run(pollId, ...reAddedConsumers);
            console.log(`[SQLite DB] Cleared old responses for ${reAddedConsumers.length} re-added consumers.`);
        }

        return { changes: 1 };
    } catch (error) {
        console.error('[SQLite DB] Error updating poll:', error);
        throw error;
    }
}

export function deletePoll(pollId: string) {
    console.log(`[SQLite DB] Deleting poll ${pollId} and its responses...`);
    try {
        const db = getDb();

        // Delete responses first to avoid foreign key constraint
        const deleteResponses = db.prepare('DELETE FROM responses WHERE pollLocalId = ?');
        const respResult = deleteResponses.run(pollId);
        console.log(`[SQLite DB] Deleted ${respResult.changes} responses for poll ${pollId}`);

        // Then delete the poll
        const deletePollStmt = db.prepare('DELETE FROM polls WHERE localId = ?');
        const pollResult = deletePollStmt.run(pollId);
        console.log(`[SQLite DB] Poll ${pollId} deletion result: ${pollResult.changes} row(s) affected`);

        return pollResult;
    } catch (error) {
        console.error('[SQLite DB] Error deleting poll:', error);
        throw error;
    }
}

export function deletePollByCloudId(cloudSignalId: number) {
    console.log(`[SQLite DB] Deleting poll by cloudSignalId: ${cloudSignalId}`);
    try {
        const db = getDb();

        // Find localId first
        const stmt = db.prepare('SELECT localId FROM polls WHERE cloudSignalId = ?');
        const row = stmt.get(cloudSignalId) as { localId: string } | undefined;

        if (row) {
            return deletePoll(row.localId);
        } else {
            console.log(`[SQLite DB] No local poll found with cloudSignalId ${cloudSignalId}`);
            return { changes: 0 };
        }
    } catch (error) {
        console.error('[SQLite DB] Error deleting poll by cloudId:', error);
        throw error;
    }
}

export function deleteResponsesForPoll(pollId: string) {
    console.log(`[SQLite DB] Deleting all responses for poll: ${pollId}`);
    try {
        const db = getDb();
        const deleteStmt = db.prepare('DELETE FROM responses WHERE pollLocalId = ?');
        const result = deleteStmt.run(pollId);
        console.log(`[SQLite DB] Deleted ${result.changes} responses for poll ${pollId}`);
        return result;
    } catch (error) {
        console.error('[SQLite DB] Error deleting responses for poll:', error);
        throw error;
    }
}

export function submitResponse(response: Response) {
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
            skipReason: response.skipReason || null,
            syncStatus: response.syncStatus || 'pending'
        });

        return info;
    } catch (error) {
        console.error('[SQLite DB] Error submitting response:', error);
        throw error;
    }
}

export function getResponses(): Response[] {
    console.log('[SQLite DB] Fetching all responses...');
    try {
        const stmt = getDb().prepare('SELECT * FROM responses');
        const rows = stmt.all();
        console.log(`[SQLite DB] Found ${rows.length} responses in local database.`);

        return rows.map((row: any) => ({
            pollId: row.pollLocalId,
            consumerEmail: row.userId,
            response: row.selectedOption,
            submittedAt: row.timeOfSubmission,
            isDefault: !!row.isDefault,
            skipReason: row.skipReason,
            syncStatus: row.syncStatus || 'pending'
        }));
    } catch (error) {
        console.error('[SQLite DB] Error getting responses:', error);
        return [];
    }
}

export function updateResponseSyncStatus(pollLocalId: string, userId: string, status: 'synced' | 'pending') {
    try {
        const db = getDb();
        const stmt = db.prepare('UPDATE responses SET syncStatus = ? WHERE pollLocalId = ? AND userId = ?');
        return stmt.run(status, pollLocalId, userId);
    } catch (error) {
        console.error('[SQLite DB] Error updating response sync status:', error);
        throw error;
    }
}

// Labels
export function createLabel(label: { id: string, name: string, description?: string, syncStatus?: string, createdAt: string, cloudId?: number, editedAt?: string }) {
    try {
        const stmt = getDb().prepare(`
            INSERT INTO labels (id, name, description, syncStatus, createdAt, cloudId, editedAt)
            VALUES (@id, @name, @description, @syncStatus, @createdAt, @cloudId, @editedAt)
        `);
        return stmt.run({
            ...label,
            syncStatus: label.syncStatus || 'pending',
            cloudId: label.cloudId || null,
            editedAt: label.editedAt || null
        });
    } catch (error) {
        console.error('[SQLite DB] Error creating label:', error);
        throw error;
    }
}

export function getLabels() {
    try {
        const stmt = getDb().prepare('SELECT * FROM labels ORDER BY createdAt DESC');
        return stmt.all();
    } catch (error) {
        console.error('[SQLite DB] Error getting labels:', error);
        return [];
    }
}

export function deleteLabel(id: string) {
    try {
        const stmt = getDb().prepare('DELETE FROM labels WHERE id = ?');
        return stmt.run(id);
    } catch (error) {
        console.error('[SQLite DB] Error deleting label:', error);
        throw error;
    }
}

export function updateLabel(id: string, updates: { name?: string, description?: string, cloudId?: number, syncStatus?: string, editedAt?: string }) {
    try {
        const fields: string[] = [];
        const values: any[] = [];

        if (updates.name !== undefined) {
            fields.push('name = ?');
            values.push(updates.name);
        }
        if (updates.description !== undefined) {
            fields.push('description = ?');
            values.push(updates.description);
        }
        if (updates.cloudId !== undefined) {
            fields.push('cloudId = ?');
            values.push(updates.cloudId);
        }
        if (updates.syncStatus !== undefined) {
            fields.push('syncStatus = ?');
            values.push(updates.syncStatus);
        }
        if (updates.editedAt !== undefined) {
            fields.push('editedAt = ?');
            values.push(updates.editedAt);
        }

        if (fields.length === 0) {
            throw new Error('No valid fields to update');
        }

        values.push(id); // Add id for WHERE clause

        const query = `UPDATE labels SET ${fields.join(', ')} WHERE id = ?`;
        const stmt = getDb().prepare(query);
        return stmt.run(...values);
    } catch (error) {
        console.error('[SQLite DB] Error updating label:', error);
        throw error;
    }
}

export function updateLabelSyncStatus(id: string, status: 'synced' | 'pending') {
    try {
        const db = getDb();
        const stmt = db.prepare('UPDATE labels SET syncStatus = ? WHERE id = ?');
        return stmt.run(status, id);
    } catch (error) {
        console.error('[SQLite DB] Error updating label sync status:', error);
        throw error;
    }
}
