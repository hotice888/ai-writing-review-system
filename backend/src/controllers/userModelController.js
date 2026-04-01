const pool = require('../config/database');

// 获取用户模型列表
const getUserModels = async (req, res) => {
  try {
    const { id: user_id } = req.user;
    const result = await pool.query('SELECT * FROM user_models WHERE user_id = $1 ORDER BY created_at DESC', [user_id]);
    res.json({
      code: 200,
      message: '获取成功',
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting user models:', error);
    res.status(500).json({
      code: 500,
      message: '获取用户模型列表失败',
      data: null
    });
  }
};

// 获取单个用户模型
const getUserModelById = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: user_id } = req.user;
    const result = await pool.query('SELECT * FROM user_models WHERE id = $1 AND user_id = $2', [id, user_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '用户模型不存在',
        data: null
      });
    }
    
    res.json({
      code: 200,
      message: '获取成功',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error getting user model:', error);
    res.status(500).json({
      code: 500,
      message: '获取用户模型失败',
      data: null
    });
  }
};

// 创建用户模型
const createUserModel = async (req, res) => {
  try {
    console.log('Request user:', req.user);
    const user_id = req.user?.id;
    console.log('User ID:', user_id);
    const { name, code, provider, model, api_url, api_key, openai_api_url, anthropic_api_url, description, status } = req.body;
    
    if (!user_id) {
      return res.status(401).json({
        code: 401,
        message: '用户未认证',
        data: null
      });
    }
    
    // 检查用户模型编码是否已存在
    const existingModel = await pool.query('SELECT * FROM user_models WHERE code = $1 AND user_id = $2', [code, user_id]);
    if (existingModel.rows.length > 0) {
      return res.status(400).json({
        code: 400,
        message: '模型编码已存在',
        data: null
      });
    }
    
    const result = await pool.query(
      `INSERT INTO user_models (user_id, name, code, provider, model, api_url, api_key, openai_api_url, anthropic_api_url, description, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
       RETURNING *`,
      [user_id, name, code, provider, model, api_url, api_key, openai_api_url, anthropic_api_url, description, status || 'enabled']
    );
    
    res.status(201).json({
      code: 200,
      message: '用户模型创建成功',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating user model:', error);
    res.status(500).json({
      code: 500,
      message: '创建用户模型失败',
      data: null
    });
  }
};

// 更新用户模型
const updateUserModel = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: user_id } = req.user;
    const { name, code, provider, model, api_url, api_key, openai_api_url, anthropic_api_url, description, status } = req.body;
    
    // 检查用户模型是否存在
    const existingModel = await pool.query('SELECT * FROM user_models WHERE id = $1 AND user_id = $2', [id, user_id]);
    if (existingModel.rows.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '用户模型不存在',
        data: null
      });
    }
    
    // 检查模型编码是否与其他用户模型重复
    if (code) {
      const codeCheck = await pool.query('SELECT * FROM user_models WHERE code = $1 AND user_id = $2 AND id != $3', [code, user_id, id]);
      if (codeCheck.rows.length > 0) {
        return res.status(400).json({
          code: 400,
          message: '模型编码已存在',
          data: null
        });
      }
    }
    
    const result = await pool.query(
      `UPDATE user_models 
       SET name = $1, code = $2, provider = $3, model = $4, api_url = $5, api_key = $6, openai_api_url = $7, anthropic_api_url = $8, description = $9, status = $10, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $11 AND user_id = $12 
       RETURNING *`,
      [name, code, provider, model, api_url, api_key, openai_api_url, anthropic_api_url, description, status, id, user_id]
    );
    
    res.json({
      code: 200,
      message: '用户模型更新成功',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating user model:', error);
    res.status(500).json({
      code: 500,
      message: '更新用户模型失败',
      data: null
    });
  }
};

// 删除用户模型
const deleteUserModel = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: user_id } = req.user;
    
    // 检查用户模型是否存在
    const existingModel = await pool.query('SELECT * FROM user_models WHERE id = $1 AND user_id = $2', [id, user_id]);
    if (existingModel.rows.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '用户模型不存在',
        data: null
      });
    }
    
    await pool.query('DELETE FROM user_models WHERE id = $1 AND user_id = $2', [id, user_id]);
    
    res.json({
      code: 200,
      message: '用户模型删除成功',
      data: null
    });
  } catch (error) {
    console.error('Error deleting user model:', error);
    res.status(500).json({
      code: 500,
      message: '删除用户模型失败',
      data: null
    });
  }
};

// 获取平台支持的模型列表
const getPlatformModels = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM models WHERE status = $1 ORDER BY created_at DESC', ['enabled']);
    res.json({
      code: 200,
      message: '获取成功',
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting platform models:', error);
    res.status(500).json({
      code: 500,
      message: '获取平台模型列表失败',
      data: null
    });
  }
};

module.exports = {
  getUserModels,
  getUserModelById,
  createUserModel,
  updateUserModel,
  deleteUserModel,
  getPlatformModels
};