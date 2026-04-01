const pool = require('./src/config/database');

const migrateJsonToTable = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    console.log('=== 开始迁移数据 ===\n');
    
    // 获取所有模型提供商
    const providersResult = await client.query('SELECT id, name, code, models FROM model_providers');
    
    for (const provider of providersResult.rows) {
      console.log(`处理提供商: ${provider.name} (${provider.code})`);
      
      // 检查是否有models数据
      if (!provider.models || provider.models.length === 0) {
        console.log('  没有模型数据，跳过\n');
        continue;
      }
      
      console.log(`  找到 ${provider.models.length} 个模型`);
      
      // 删除该提供商已有的模型（避免重复）
      await client.query('DELETE FROM model_provider_models WHERE provider_id = $1', [provider.id]);
      
      // 插入模型数据到新表
      for (const model of provider.models) {
        const name = model.brand || model.name || '';
        const modelCode = model.modelId || model.model_id || model.model_code || '';
        const memo = model.capability || model.memo || '';
        
        if (!name || !modelCode) {
          console.warn(`  模型数据不完整，跳过:`, model);
          continue;
        }
        
        await client.query(
          `INSERT INTO model_provider_models (provider_id, name, model_code, memo) 
           VALUES ($1, $2, $3, $4)`,
          [provider.id, name, modelCode, memo]
        );
        
        console.log(`  ✓ 插入: ${name} - ${modelCode}`);
      }
      
      console.log('');
    }
    
    // 验证迁移结果
    console.log('=== 验证迁移结果 ===');
    const modelsResult = await client.query('SELECT * FROM model_provider_models');
    console.log(`成功迁移 ${modelsResult.rows.length} 条模型记录\n`);
    
    await client.query('COMMIT');
    
    console.log('=== 迁移完成 ===');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('迁移失败:', error);
    throw error;
  } finally {
    client.release();
    process.exit(0);
  }
};

migrateJsonToTable();
