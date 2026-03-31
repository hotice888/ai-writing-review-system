const pool = require('../config/database');

// 获取用户智能体列表
const getUserAgents = async (req, res) => {
  try {
    const { id: user_id } = req.user;
    const result = await pool.query('SELECT * FROM user_agents WHERE user_id = $1 ORDER BY created_at DESC', [user_id]);
    res.json({
      code: 200,
      message: '获取成功',
      data: result.rows
    });
  } catch (error) {
    console.error('获取用户智能体列表错误:', error);
    res.json({
      code: 500,
      message: '获取用户智能体列表失败',
    });
  }
};

// 获取单个用户智能体
const getUserAgentById = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: user_id } = req.user;
    const result = await pool.query('SELECT * FROM user_agents WHERE id = $1 AND user_id = $2', [id, user_id]);
    
    if (result.rows.length === 0) {
      return res.json({
        code: 404,
        message: '用户智能体不存在',
      });
    }
    
    res.json({
      code: 200,
      message: '获取成功',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('获取用户智能体详情错误:', error);
    res.json({
      code: 500,
      message: '获取用户智能体详情失败',
    });
  }
};

// 创建用户智能体
const createUserAgent = async (req, res) => {
  try {
    const { id: user_id } = req.user;
    const { name, description, role, instructions, model_id, status } = req.body;
    
    // 检查模型是否存在且属于该用户
    if (model_id) {
      const modelCheck = await pool.query('SELECT id FROM user_models WHERE id = $1 AND user_id = $2', [model_id, user_id]);
      if (modelCheck.rows.length === 0) {
        return res.json({
          code: 400,
          message: '模型不存在或不属于该用户',
        });
      }
    }
    
    const result = await pool.query(
      'INSERT INTO user_agents (user_id, name, description, role, instructions, model_id, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [user_id, name, description, role, instructions, model_id, status || 'enabled']
    );
    
    res.json({
      code: 200,
      message: '创建成功',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('创建用户智能体错误:', error);
    res.json({
      code: 500,
      message: '创建用户智能体失败',
    });
  }
};

// 更新用户智能体
const updateUserAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: user_id } = req.user;
    const { name, description, role, instructions, model_id, status } = req.body;
    
    // 检查用户智能体是否存在
    const existingAgent = await pool.query('SELECT id FROM user_agents WHERE id = $1 AND user_id = $2', [id, user_id]);
    if (existingAgent.rows.length === 0) {
      return res.json({
        code: 404,
        message: '用户智能体不存在',
      });
    }
    
    // 检查模型是否存在且属于该用户
    if (model_id) {
      const modelCheck = await pool.query('SELECT id FROM user_models WHERE id = $1 AND user_id = $2', [model_id, user_id]);
      if (modelCheck.rows.length === 0) {
        return res.json({
          code: 400,
          message: '模型不存在或不属于该用户',
        });
      }
    }
    
    const result = await pool.query(
      'UPDATE user_agents SET name = $1, description = $2, role = $3, instructions = $4, model_id = $5, status = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 AND user_id = $8 RETURNING *',
      [name, description, role, instructions, model_id, status, id, user_id]
    );
    
    res.json({
      code: 200,
      message: '更新成功',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('更新用户智能体错误:', error);
    res.json({
      code: 500,
      message: '更新用户智能体失败',
    });
  }
};

// 删除用户智能体
const deleteUserAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: user_id } = req.user;
    
    await pool.query('DELETE FROM user_agents WHERE id = $1 AND user_id = $2', [id, user_id]);
    
    res.json({
      code: 200,
      message: '删除成功',
    });
  } catch (error) {
    console.error('删除用户智能体错误:', error);
    res.json({
      code: 500,
      message: '删除用户智能体失败',
    });
  }
};

module.exports = {
  getUserAgents,
  getUserAgentById,
  createUserAgent,
  updateUserAgent,
  deleteUserAgent
};