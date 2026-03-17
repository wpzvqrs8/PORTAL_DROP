const { pool } = require('./db');
(async () => {
    try {
        await pool.query('DELETE FROM portals');
        console.log('Cleared portals table for user testing!');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
