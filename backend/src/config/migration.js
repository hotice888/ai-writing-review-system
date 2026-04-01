const fs = require('fs');
const path = require('path');
const pool = require('./database');

class MigrationManager {
  constructor() {
    this.migrationsDir = path.join(__dirname, '../../scripts/migrations');
    this.migrationTable = 'schema_migrations';
  }
  
  async init() {
    // 创建迁移记录表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${this.migrationTable} (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }
  
  async getMigrations() {
    if (!fs.existsSync(this.migrationsDir)) {
      fs.mkdirSync(this.migrationsDir, { recursive: true });
      return [];
    }
    
    const files = fs.readdirSync(this.migrationsDir)
      .filter(f => f.endsWith('.js'))
      .sort();
    
    return files.map(f => ({
      name: f.replace('.js', ''),
      path: path.join(this.migrationsDir, f)
    }));
  }
  
  async getExecutedMigrations() {
    try {
      const result = await pool.query(
        `SELECT name FROM ${this.migrationTable} ORDER BY name`
      );
      return result.rows.map(r => r.name);
    } catch (error) {
      // 如果表不存在，返回空数组
      return [];
    }
  }
  
  async migrate() {
    await this.init();
    
    const allMigrations = await this.getMigrations();
    const executedMigrations = await this.getExecutedMigrations();
    const pendingMigrations = allMigrations.filter(
      m => !executedMigrations.includes(m.name)
    );
    
    if (pendingMigrations.length === 0) {
      console.log('No pending migrations');
      return;
    }
    
    console.log(`Running ${pendingMigrations.length} migrations...`);
    
    for (const migration of pendingMigrations) {
      const migrationModule = require(migration.path);
      
      console.log(`Running migration: ${migration.name}`);
      
      try {
        if (migrationModule.up) {
          await migrationModule.up(pool);
        }
        
        await pool.query(
          `INSERT INTO ${this.migrationTable} (name) VALUES ($1)`,
          [migration.name]
        );
        
        console.log(`✓ Migration ${migration.name} completed`);
      } catch (error) {
        console.error(`✗ Migration ${migration.name} failed:`, error);
        throw error;
      }
    }
    
    console.log('All migrations completed');
  }
  
  async rollback(targetMigration) {
    await this.init();
    
    const allMigrations = await this.getMigrations();
    const executedMigrations = await this.getExecutedMigrations();
    
    const migrationsToRollback = executedMigrations
      .filter(m => m > targetMigration)
      .reverse();
    
    for (const migrationName of migrationsToRollback) {
      const migration = allMigrations.find(m => m.name === migrationName);
      if (!migration) continue;
      
      const migrationModule = require(migration.path);
      
      console.log(`Rolling back migration: ${migrationName}`);
      
      try {
        if (migrationModule.down) {
          await migrationModule.down(pool);
        }
        
        await pool.query(
          `DELETE FROM ${this.migrationTable} WHERE name = $1`,
          [migrationName]
        );
        
        console.log(`✓ Rollback ${migrationName} completed`);
      } catch (error) {
        console.error(`✗ Rollback ${migrationName} failed:`, error);
        throw error;
      }
    }
  }
}

module.exports = MigrationManager;