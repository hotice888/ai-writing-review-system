// 迁移：创建 user_model_configs 表
const pool = require('../../backend/src/config/database');

async function migrate() {
  console.log('开始迁移：创建 user_model_configs 表');
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 检查 user_model_configs 表是否已存在
    const checkTable = await client.query(`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'user_model_configs'
      )
    `);
    
    if (checkTable.rows[0].exists) {
      console.log('user_model_configs 表已存在，跳过创建');
    } else {
      // 创建 user_model_configs 表
      await client.query(`
        CREATE TABLE user_model_configs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_model_id UUID NOT NULL REFERENCES user_models(id) ON DELETE CASCADE,
          model_identifier VARCHAR(100) NOT NULL,
          status VARCHAR(20) DEFAULT 'untested',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_model_id, model_identifier)
        )
      `);
      console.log('user_model_configs 表创建成功');
      
      // 迁移现有数据：从 user_models 的 model 字段迁移到 user_model_configs
      const existingModels = await client.query(`
        SELECT id, model 
        FROM user_models 
        WHERE model IS NOT NULL AND model != ''
      `);
      
      for (const model of existingModels.rows) {
        await client.query(`
          INSERT INTO user_model_configs (user_model_id, model_identifier, status)
          VALUES ($1, $2, 'untested')
          ON CONFLICT (user_model_id, model_identifier) DO NOTHING
        `, [model.id, model.model]);
      }
      
      if (existingModels.rows.length > 0) {
        console.log(`已迁移 ${existingModels.rows.length} 条现有模型配置数据`);
      }
    }
    
    // 检查 user_models 表中的 model 列是否已移除
    const checkColumn = await client.query(`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_models' AND column_name = 'model'
      )
    `);
    
    if (checkColumn.rows[0].exists) {
      // 移除 user_models 表中的 model 列
      await client.query(`ALTER TABLE user_models DROP COLUMN model`);
      console.log('已从 user_models 表中移除 model 列');
    }
    
    await client.query('COMMIT');
    console.log('迁移完成！');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('迁移失败:', error);
    throw error;
  } finally {
    client.release();
  }
}

migrate().then(() => process.exit(0)).catch(() => process.exit(1));
