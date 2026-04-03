const pool = require('../../backend/src/config/database');

module.exports = {
  up: async (pool) => {
    await pool.query(`
      ALTER TABLE llm_request_records 
      ADD COLUMN IF NOT EXISTS session_id VARCHAR(100),
      ADD COLUMN IF NOT EXISTS response_id VARCHAR(100)
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_llm_records_session ON llm_request_records(session_id)
    `);
    
    console.log('✓ Migration 20260403000000_add_session_response_ids completed');
  },
  
  down: async (pool) => {
    await pool.query(`
      ALTER TABLE llm_request_records 
      DROP COLUMN IF EXISTS session_id,
      DROP COLUMN IF EXISTS response_id
    `);
    
    console.log('✓ Rollback 20260403000000_add_session_response_ids completed');
  }
};