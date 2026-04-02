const pool = require('../config/database');

const getTokenLogs = async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      user_id,
      model_id,
      business_type,
      status,
      start_date,
      end_date,
      search
    } = req.query;
    
    const offset = (page - 1) * pageSize;
    const conditions = [];
    const params = [];
    let paramIndex = 1;
    
    if (user_id) {
      conditions.push(`lr.user_id = $${paramIndex}`);
      params.push(user_id);
      paramIndex++;
    }
    
    if (model_id) {
      conditions.push(`lr.model_id = $${paramIndex}`);
      params.push(model_id);
      paramIndex++;
    }
    
    if (business_type) {
      conditions.push(`lr.business_type = $${paramIndex}`);
      params.push(business_type);
      paramIndex++;
    }
    
    if (status) {
      if (status === 'success') {
        conditions.push(`lr.response_success = true`);
      } else if (status === 'failed') {
        conditions.push(`lr.response_success = false`);
      }
    }
    
    if (start_date) {
      conditions.push(`lr.created_at >= $${paramIndex}`);
      params.push(start_date);
      paramIndex++;
    }
    
    if (end_date) {
      conditions.push(`lr.created_at <= $${paramIndex}`);
      params.push(end_date);
      paramIndex++;
    }
    
    if (search) {
      conditions.push(`(
        u.username ILIKE $${paramIndex} OR 
        um.name ILIKE $${paramIndex} OR 
        um.model ILIKE $${paramIndex}
      )`);
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const countQuery = `
      SELECT COUNT(*) as total
      FROM llm_request_records lr
      LEFT JOIN users u ON lr.user_id = u.id
      LEFT JOIN user_models um ON lr.model_id = um.id
      ${whereClause}
    `;
    
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);
    
    const dataQuery = `
      SELECT 
        lr.id,
        lr.user_id,
        lr.model_id,
        lr.request_id,
        lr.business_type,
        lr.request_url,
        lr.request_method,
        lr.response_status_code,
        lr.response_success,
        lr.error_message,
        lr.prompt_tokens,
        lr.completion_tokens,
        lr.total_tokens,
        lr.duration_ms,
        lr.created_at,
        lr.completed_at,
        u.username,
        u.email,
        um.name as model_name,
        um.provider,
        um.model as model_identifier
      FROM llm_request_records lr
      LEFT JOIN users u ON lr.user_id = u.id
      LEFT JOIN user_models um ON lr.model_id = um.id
      ${whereClause}
      ORDER BY lr.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    params.push(pageSize, offset);
    
    const dataResult = await pool.query(dataQuery, params);
    
    res.json({
      code: 200,
      message: '获取成功',
      data: {
        list: dataResult.rows,
        total: total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
    
  } catch (error) {
    console.error('Error getting token logs:', error);
    res.status(500).json({
      code: 500,
      message: '获取Token日志失败',
      data: null
    });
  }
};

const getTokenLogStats = async (req, res) => {
  try {
    const {
      user_id,
      model_id,
      business_type,
      status,
      start_date,
      end_date
    } = req.query;
    
    const conditions = [];
    const params = [];
    let paramIndex = 1;
    
    if (user_id) {
      conditions.push(`user_id = $${paramIndex}`);
      params.push(user_id);
      paramIndex++;
    }
    
    if (model_id) {
      conditions.push(`model_id = $${paramIndex}`);
      params.push(model_id);
      paramIndex++;
    }
    
    if (business_type) {
      conditions.push(`business_type = $${paramIndex}`);
      params.push(business_type);
      paramIndex++;
    }
    
    if (status) {
      if (status === 'success') {
        conditions.push(`response_success = true`);
      } else if (status === 'failed') {
        conditions.push(`response_success = false`);
      }
    }
    
    if (start_date) {
      conditions.push(`created_at >= $${paramIndex}`);
      params.push(start_date);
      paramIndex++;
    }
    
    if (end_date) {
      conditions.push(`created_at <= $${paramIndex}`);
      params.push(end_date);
      paramIndex++;
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const statsQuery = `
      SELECT 
        COUNT(*) as total_requests,
        COUNT(CASE WHEN response_success = true THEN 1 END) as successful_requests,
        COUNT(CASE WHEN response_success = false THEN 1 END) as failed_requests,
        COALESCE(SUM(prompt_tokens), 0) as total_prompt_tokens,
        COALESCE(SUM(completion_tokens), 0) as total_completion_tokens,
        COALESCE(SUM(total_tokens), 0) as total_tokens,
        COALESCE(AVG(duration_ms), 0) as avg_duration_ms,
        COALESCE(MAX(duration_ms), 0) as max_duration_ms,
        COALESCE(MIN(duration_ms), 0) as min_duration_ms
      FROM llm_request_records
      ${whereClause}
    `;
    
    const statsResult = await pool.query(statsQuery, params);
    
    const businessTypeQuery = `
      SELECT 
        business_type,
        COUNT(*) as count,
        COALESCE(SUM(total_tokens), 0) as total_tokens
      FROM llm_request_records
      ${whereClause}
      GROUP BY business_type
      ORDER BY count DESC
    `;
    
    const businessTypeResult = await pool.query(businessTypeQuery, params);
    
    const dailyQuery = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        COALESCE(SUM(total_tokens), 0) as total_tokens
      FROM llm_request_records
      ${whereClause}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `;
    
    const dailyResult = await pool.query(dailyQuery, params);
    
    res.json({
      code: 200,
      message: '获取成功',
      data: {
        overview: statsResult.rows[0],
        byBusinessType: businessTypeResult.rows,
        dailyStats: dailyResult.rows
      }
    });
    
  } catch (error) {
    console.error('Error getting token log stats:', error);
    res.status(500).json({
      code: 500,
      message: '获取统计数据失败',
      data: null
    });
  }
};

const getTokenLogDetail = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT 
        lr.*,
        u.username,
        u.email,
        um.name as model_name,
        um.provider,
        um.model as model_identifier
      FROM llm_request_records lr
      LEFT JOIN users u ON lr.user_id = u.id
      LEFT JOIN user_models um ON lr.model_id = um.id
      WHERE lr.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '日志记录不存在',
        data: null
      });
    }
    
    res.json({
      code: 200,
      message: '获取成功',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error getting token log detail:', error);
    res.status(500).json({
      code: 500,
      message: '获取日志详情失败',
      data: null
    });
  }
};

const deleteTokenLogsBatch = async (req, res) => {
  try {
    const ids = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '请提供要删除的日志ID列表'
      });
    }
    
    const placeholders = ids.map((_, index) => `$${index + 1}`).join(', ');
    
    await pool.query(
      `DELETE FROM llm_request_records WHERE id IN (${placeholders})`,
      ids
    );
    
    res.json({
      code: 200,
      message: `成功删除 ${ids.length} 条日志`
    });
  } catch (error) {
    console.error('批量删除日志失败:', error);
    res.status(500).json({
      code: 500,
      message: '批量删除日志失败'
    });
  }
};

module.exports = {
  getTokenLogs,
  getTokenLogStats,
  getTokenLogDetail,
  deleteTokenLogsBatch
};
