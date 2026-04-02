const pool = require('../config/database');

// 辅助函数：获取提供商的模型列表
const getProviderModels = async (providerId) => {
  const result = await pool.query(
    'SELECT * FROM model_provider_models WHERE provider_id = $1 ORDER BY created_at',
    [providerId]
  );
  return result.rows.map(row => ({
    brand: row.name,
    modelId: row.model_code,
    capability: row.memo
  }));
};

// 获取所有模型提供商
const getAllProviders = async (req, res) => {
  try {
    // 只获取模型提供商基本信息
    const result = await pool.query(`
      SELECT * FROM model_providers
      ORDER BY updated_at DESC
    `);
    
    res.json({
      code: 200,
      message: '获取成功',
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting model providers:', error);
    res.status(500).json({
      code: 500,
      message: '获取模型提供商列表失败',
      data: null
    });
  }
};

// 获取单个模型提供商
const getProviderById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM model_providers WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '模型提供商不存在',
        data: null
      });
    }
    
    const provider = result.rows[0];
    
    res.json({
      code: 200,
      message: '获取成功',
      data: provider
    });
  } catch (error) {
    console.error('Error getting model provider:', error);
    res.status(500).json({
      code: 500,
      message: '获取模型提供商失败',
      data: null
    });
  }
};

// 辅助函数：创建模型列表
const createProviderModels = async (providerId, models, client = pool) => {
  if (!models || models.length === 0) {
    return;
  }
  
  for (const model of models) {
    await client.query(
      `INSERT INTO model_provider_models (provider_id, name, model_code, memo) 
       VALUES ($1, $2, $3, $4)`,
      [providerId, model.brand, model.modelId, model.capability]
    );
  }
};

// 辅助函数：更新模型列表（先删除后创建）
const updateProviderModels = async (providerId, models, client = pool) => {
  await client.query('DELETE FROM model_provider_models WHERE provider_id = $1', [providerId]);
  await createProviderModels(providerId, models, client);
};

// 创建模型提供商
const createProvider = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { name, code, url, openai_base_url, anthropic_base_url, protocol_base_url, description, status, common_links, models } = req.body;
    
    // 检查code是否已存在
    const existingProvider = await client.query('SELECT * FROM model_providers WHERE code = $1', [code]);
    if (existingProvider.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        code: 400,
        message: '模型提供商编码已存在',
        data: null
      });
    }
    
    const result = await client.query(
      `INSERT INTO model_providers (name, code, url, openai_base_url, anthropic_base_url, protocol_base_url, description, status, common_links) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [name, code, url, openai_base_url, anthropic_base_url, protocol_base_url, description, status || 'enabled', common_links]
    );
    
    const newProvider = result.rows[0];
    
    // 创建模型列表
    await createProviderModels(newProvider.id, models, client);
    
    await client.query('COMMIT');
    
    res.status(201).json({
      code: 200,
      message: '模型提供商创建成功',
      data: newProvider
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating model provider:', error);
    res.status(500).json({
      code: 500,
      message: '创建模型提供商失败',
      data: null
    });
  } finally {
    client.release();
  }
};

// 更新模型提供商
const updateProvider = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { name, code, url, openai_base_url, anthropic_base_url, protocol_base_url, description, status, common_links, models } = req.body;
    
    // 检查模型提供商是否存在
    const existingProvider = await client.query('SELECT * FROM model_providers WHERE id = $1', [id]);
    if (existingProvider.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        code: 404,
        message: '模型提供商不存在',
        data: null
      });
    }
    
    // 检查code是否与其他模型提供商重复
    if (code) {
      const codeCheck = await client.query('SELECT * FROM model_providers WHERE code = $1 AND id != $2', [code, id]);
      if (codeCheck.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          code: 400,
          message: '模型提供商编码已存在',
          data: null
        });
      }
    }
    
    const result = await client.query(
      `UPDATE model_providers 
       SET name = $1, code = $2, url = $3, openai_base_url = $4, anthropic_base_url = $5, protocol_base_url = $6, description = $7, status = $8, common_links = $9, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $10 
       RETURNING *`,
      [name, code, url, openai_base_url, anthropic_base_url, protocol_base_url, description, status, common_links, id]
    );
    
    const updatedProvider = result.rows[0];
    
    // 更新模型列表（使用事务连接）
    await updateProviderModels(updatedProvider.id, models, client);
    
    await client.query('COMMIT');
    
    res.json({
      code: 200,
      message: '模型提供商更新成功',
      data: updatedProvider
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating model provider:', error);
    res.status(500).json({
      code: 500,
      message: '更新模型提供商失败',
      data: null
    });
  } finally {
    client.release();
  }
};

// 删除模型提供商
const deleteProvider = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查模型提供商是否存在
    const existingProvider = await pool.query('SELECT * FROM model_providers WHERE id = $1', [id]);
    if (existingProvider.rows.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '模型提供商不存在',
        data: null
      });
    }
    
    // 模型会通过ON DELETE CASCADE自动删除
    await pool.query('DELETE FROM model_providers WHERE id = $1', [id]);
    
    res.json({
      code: 200,
      message: '模型提供商删除成功',
      data: null
    });
  } catch (error) {
    console.error('Error deleting model provider:', error);
    res.status(500).json({
      code: 500,
      message: '删除模型提供商失败',
      data: null
    });
  }
};

// 获取所有模型提供商的可选模型
const getAllProviderModels = async (req, res) => {
  try {
    // 获取所有状态为enabled的模型提供商
    const providersResult = await pool.query(`
      SELECT * FROM model_providers
      WHERE status = 'enabled'
      ORDER BY updated_at DESC
    `);
    
    const providers = providersResult.rows;
    const models = [];
    
    // 为每个提供商获取模型
    for (const provider of providers) {
      const modelsResult = await pool.query(
        'SELECT * FROM model_provider_models WHERE provider_id = $1 ORDER BY created_at',
        [provider.id]
      );
      
      modelsResult.rows.forEach(model => {
        models.push({
          providerId: provider.id,
          providerName: provider.name,
          brand: model.name,
          modelId: model.model_code,
          capability: model.memo,
          openaiBaseUrl: provider.openai_base_url || '',
          anthropicBaseUrl: provider.anthropic_base_url || '',
          protocolBaseUrl: provider.protocol_base_url || ''
        });
      });
    }
    
    res.json({
      code: 200,
      message: '获取成功',
      data: models
    });
  } catch (error) {
    console.error('Error getting provider models:', error);
    res.status(500).json({
      code: 500,
      message: '获取模型提供商可选模型失败',
      data: null
    });
  }
};

module.exports = {
  getAllProviders,
  getProviderById,
  createProvider,
  updateProvider,
  deleteProvider,
  getAllProviderModels
};
