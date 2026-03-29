const { Pool } = require('pg');

// 连接到默认的postgres数据库来创建新数据库
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

const DB_NAME = process.env.DB_NAME || 'ai_writing_review';

async function setupDatabase() {
  try {
    console.log('正在检查PostgreSQL连接...');
    
    // 测试连接
    await pool.connect();
    console.log('PostgreSQL连接成功！');
    
    // 检查数据库是否存在
    const checkDbResult = await pool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [DB_NAME]
    );
    
    if (checkDbResult.rows.length === 0) {
      console.log(`数据库 ${DB_NAME} 不存在，正在创建...`);
      
      // 创建数据库
      await pool.query(`CREATE DATABASE ${DB_NAME}`);
      console.log(`数据库 ${DB_NAME} 创建成功！`);
    } else {
      console.log(`数据库 ${DB_NAME} 已存在`);
    }
    
    // 关闭连接
    await pool.end();
    
    console.log('数据库配置完成！');
  } catch (error) {
    console.error('数据库配置错误:', error);
  }
}

setupDatabase();
