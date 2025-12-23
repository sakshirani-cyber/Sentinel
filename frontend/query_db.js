const Database = require('better-sqlite3');
const path = require('path');

const dbPath = 'C:\\Users\\amandeep.singh\\AppData\\Roaming\\Sentinel\\sentinel.db';
console.log('Opening database at:', dbPath);

try {
    const db = new Database(dbPath, { readonly: true });

    const userEmail = 'consumer2@test.com';

    // 1. Check responses for this user
    console.log('\n--- Responses for', userEmail, '---');
    const responses = db.prepare('SELECT * FROM responses WHERE userId = ?').all(userEmail);
    if (responses.length > 0) {
        console.table(responses);
    } else {
        console.log('No responses found for this user.');
    }

    // 2. Check polls where this user is a consumer
    console.log('\n--- Polls where user is in consumers list ---');
    const allPolls = db.prepare('SELECT * FROM polls').all();
    const targetPolls = allPolls.filter(poll => {
        const consumers = JSON.parse(poll.consumers || '[]');
        return consumers.includes(userEmail);
    });

    if (targetPolls.length > 0) {
        console.table(targetPolls.map(p => ({
            localId: p.localId,
            question: p.question,
            status: p.status,
            deadline: p.deadline,
            publishedAt: p.publishedAt
        })));
    } else {
        console.log('User is not in the consumers list of any polls.');
    }

    // 3. Overall stats
    console.log('\n--- Database Stats ---');
    const pollCount = db.prepare('SELECT COUNT(*) as count FROM polls').get().count;
    const responseCount = db.prepare('SELECT COUNT(*) as count FROM responses').get().count;
    console.log('Total Polls:', pollCount);
    console.log('Total Responses:', responseCount);

    db.close();
} catch (error) {
    console.error('Error querying database:', error);
}
