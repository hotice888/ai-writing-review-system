const fs = require('fs');
const path = require('path');
const pool = require('./database');

class Seeder {
  constructor() {
    this.seedsDir = path.join(__dirname, '../../scripts/seeds');
    this.seederTable = 'seed_history';
  }
  
  async init() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${this.seederTable} (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        version VARCHAR(50) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }
  
  async seed(seedName) {
    await this.init();
    
    const seedFile = path.join(this.seedsDir, `${seedName}.js`);
    if (!fs.existsSync(seedFile)) {
      console.error(`Seed file ${seedFile} does not exist`);
      return;
    }
    
    const seedData = require(seedFile);
    
    // 检查是否已执行
    try {
      const executed = await pool.query(
        `SELECT * FROM ${this.seederTable} WHERE name = $1`,
        [seedName]
      );
      
      if (executed.rows.length > 0) {
        console.log(`Seed ${seedName} already executed`);
        return;
      }
    } catch (error) {
      // 如果表不存在，继续执行
    }
    
    console.log(`Running seed: ${seedName}...`);
    
    try {
      // 根据种子数据类型执行不同的插入逻辑
      if (seedData.data && Array.isArray(seedData.data)) {
        for (const item of seedData.data) {
          if (seedName === '001_roles') {
            await pool.query(
              `INSERT INTO roles (name, code, description) VALUES ($1, $2, $3) ON CONFLICT (code) DO NOTHING`,
              [item.name, item.code, item.description]
            );
          } else if (seedName === '002_menus') {
            await pool.query(
              `INSERT INTO menus (name, path, component, icon, sort_order, client_type) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (path) DO NOTHING`,
              [item.name, item.path, item.component, item.icon, item.sort_order, item.client_type]
            );
          } else if (seedName === '003_model_providers') {
            await pool.query(
              `INSERT INTO model_providers (name, code, base_url, anthropic_base_url, common_links) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (code) DO NOTHING`,
              [item.name, item.code, item.base_url, item.anthropic_base_url, item.common_links]
            );
          } else if (seedName === '004_admin_user') {
            await pool.query(
              `INSERT INTO users (username, email, password, role_id) VALUES ($1, $2, $3, $4) ON CONFLICT (username) DO NOTHING`,
              [item.username, item.email, item.password, item.role_id]
            );
          }
        }
      }
      
      // 记录执行历史
      await pool.query(
        `INSERT INTO ${this.seederTable} (name, version) VALUES ($1, $2)`,
        [seedName, seedData.version]
      );
      
      console.log(`✓ Seed ${seedName} completed`);
    } catch (error) {
      console.error(`✗ Seed ${seedName} failed:`, error);
      throw error;
    }
  }
  
  async seedAll() {
    if (!fs.existsSync(this.seedsDir)) {
      fs.mkdirSync(this.seedsDir, { recursive: true });
      console.log('No seed files found');
      return;
    }
    
    const seedFiles = fs.readdirSync(this.seedsDir)
      .filter(f => f.endsWith('.js'))
      .sort();
    
    for (const file of seedFiles) {
      const seedName = file.replace('.js', '');
      await this.seed(seedName);
    }
  }
}

module.exports = Seeder;