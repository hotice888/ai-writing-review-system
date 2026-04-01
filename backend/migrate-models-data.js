const pool = require('./src/config/database');

const migrateModelsData = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    console.log('开始迁移模型数据...');
    
    // 检查是否有需要迁移的数据
    const providersResult = await client.query(`
      SELECT id, models 
      FROM model_providers 
      WHERE models IS NOT NULL AND models != '[]'
    `);
    
    console.log(`找到 ${providersResult.rows.length} 个需要迁移数据的模型提供商`);
    
    for (const provider of providersResult.rows) {
      const providerId = provider.id;
      let modelsData;
      
      try {
        if (typeof provider.models === 'string') {
          modelsData = JSON.parse(provider.models);
        } else {
          modelsData = provider.models;
        }
      } catch (error) {
        console.warn(`解析提供商 ${providerId} 的模型数据失败，跳过:`, error.message);
        continue;
      }
      
      if (!Array.isArray(modelsData) || modelsData.length === 0) {
        continue;
      }
      
      console.log(`迁移提供商 ${providerId} 的 ${modelsData.length} 个模型...`);
      
      for (const model of modelsData) {
        const name = model.name || model.brand || '';
        const modelCode = model.modelCode || model.model_id || model.modelId || '';
        const memo = model.memo || model.capability || '';
        
        if (!name || !modelCode) {
          console.warn(`模型数据不完整，跳过:`, model);
          continue;
        }
        
        await client.query(
          `INSERT INTO model_provider_models (provider_id, name, model_code, memo) 
           VALUES ($1, $2, $3, $4)`,
          [providerId, name, modelCode, memo]
        );
      }
    }
    
    // 可选：清除原models字段的数据（保留字段以防万一）
    // await client.query('UPDATE model_providers SET models = NULL');
    
    await client.query('COMMIT');
    
    console.log('模型数据迁移完成！');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('迁移数据失败:', error);
    throw error;
  } finally {
    client.release();
  }
};

migrateModelsData()
  .then(() => {
    console.log('迁移脚本执行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('迁移脚本执行失败:', error);
    process.exit(1);
  });
