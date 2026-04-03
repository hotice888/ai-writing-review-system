const pool = require('../config/database');

const getOverviewStats = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    if (!start_date || !end_date) {
      return res.status(400).json({ 
        code: 400, 
        message: '开始日期和结束日期为必填项', 
        data: null 
      });
    }

    const overviewQuery = `
      SELECT 
        COALESCE(SUM(total_tokens), 0) as total_tokens,
        COUNT(*) as total_requests,
        COUNT(CASE WHEN response_success = true THEN 1 END) as success_count,
        COUNT(CASE WHEN response_success = false THEN 1 END) as failure_count
      FROM llm_request_records
      WHERE created_at >= $1 AND created_at < ($2::date + interval '1 day')
    `;

    const result = await pool.query(overviewQuery, [start_date, end_date]);
    const stats = result.rows[0];
    
    const success_rate = stats.total_requests > 0 
      ? Math.round((stats.success_count / stats.total_requests) * 100) 
      : 0;

    res.json({
      code: 200,
      message: '获取概览统计成功',
      data: {
        total_tokens: parseInt(stats.total_tokens) || 0,
        total_requests: parseInt(stats.total_requests) || 0,
        success_count: parseInt(stats.success_count) || 0,
        failure_count: parseInt(stats.failure_count) || 0,
        success_rate: success_rate
      }
    });
  } catch (error) {
    console.error('获取概览统计失败:', error);
    res.status(500).json({ code: 500, message: '获取概览统计失败: ' + error.message, data: null });
  }
};

const getRankings = async (req, res) => {
  try {
    const { start_date, end_date, type = 'business_type' } = req.query;
    
    if (!start_date || !end_date) {
      return res.status(400).json({ 
        code: 400, 
        message: '开始日期和结束日期为必填项', 
        data: null 
      });
    }

    let query, params;
    
    switch(type) {
      case 'business_type':
        query = `
          SELECT 
            business_type as name,
            COALESCE(SUM(total_tokens), 0) as token_count
          FROM llm_request_records
          WHERE created_at >= $1 AND created_at < ($2::date + interval '1 day')
          GROUP BY business_type
          ORDER BY token_count DESC
          LIMIT 5
        `;
        params = [start_date, end_date];
        break;
        
      case 'user':
        query = `
          SELECT 
            u.username as name,
            COALESCE(SUM(lr.total_tokens), 0) as token_count
          FROM llm_request_records lr
          LEFT JOIN users u ON lr.user_id = u.id
          WHERE lr.created_at >= $1 AND lr.created_at < ($2::date + interval '1 day')
          GROUP BY u.username
          ORDER BY token_count DESC
          LIMIT 5
        `;
        params = [start_date, end_date];
        break;
        
      case 'model':
        query = `
          SELECT 
            um.model as name,
            COALESCE(SUM(lr.total_tokens), 0) as token_count
          FROM llm_request_records lr
          LEFT JOIN user_models um ON lr.model_id = um.id
          WHERE lr.created_at >= $1 AND lr.created_at < ($2::date + interval '1 day')
            AND um.model IS NOT NULL
          GROUP BY um.model
          ORDER BY token_count DESC
          LIMIT 5
        `;
        params = [start_date, end_date];
        break;
        
      case 'provider':
        query = `
          SELECT 
            mp.name as name,
            COALESCE(SUM(lr.total_tokens), 0) as token_count
          FROM llm_request_records lr
          LEFT JOIN user_models um ON lr.model_id = um.id
          LEFT JOIN model_providers mp ON um.provider_id = mp.id
          WHERE lr.created_at >= $1 AND lr.created_at < ($2::date + interval '1 day')
            AND mp.name IS NOT NULL
          GROUP BY mp.name
          ORDER BY token_count DESC
          LIMIT 5
        `;
        params = [start_date, end_date];
        break;
        
      default:
        return res.status(400).json({ 
          code: 400, 
          message: '无效的排名类型', 
          data: null 
        });
    }

    const result = await pool.query(query, params);
    
    res.json({
      code: 200,
      message: '获取排名成功',
      data: result.rows.map(row => ({
        name: row.name || '未分类',
        token_count: parseInt(row.token_count) || 0
      }))
    });
  } catch (error) {
    console.error('获取排名失败:', error);
    res.status(500).json({ code: 500, message: '获取排名失败: ' + error.message, data: null });
  }
};

const getTrendStats = async (req, res) => {
  try {
    const { start_date, end_date, period = 'day', type = 'total' } = req.query;
    
    if (!start_date || !end_date) {
      return res.status(400).json({ 
        code: 400, 
        message: '开始日期和结束日期为必填项', 
        data: null 
      });
    }

    let dateFormat, groupBy, groupByWithAlias;
    switch(period) {
      case 'day':
        dateFormat = 'YYYY-MM-DD';
        groupBy = 'TO_CHAR(created_at, \'YYYY-MM-DD\')';
        groupByWithAlias = 'TO_CHAR(lr.created_at, \'YYYY-MM-DD\')';
        break;
      case 'week':
        dateFormat = 'IYYY-"W"IW';
        groupBy = 'TO_CHAR(created_at, \'IYYY-"W"IW\')';
        groupByWithAlias = 'TO_CHAR(lr.created_at, \'IYYY-"W"IW\')';
        break;
      case 'month':
        dateFormat = 'YYYY-MM';
        groupBy = 'TO_CHAR(created_at, \'YYYY-MM\')';
        groupByWithAlias = 'TO_CHAR(lr.created_at, \'YYYY-MM\')';
        break;
      case 'year':
        dateFormat = 'YYYY';
        groupBy = 'TO_CHAR(created_at, \'YYYY\')';
        groupByWithAlias = 'TO_CHAR(lr.created_at, \'YYYY\')';
        break;
      default:
        return res.status(400).json({ 
          code: 400, 
          message: '无效的周期类型', 
          data: null 
        });
    }

    let query, params;
    
    switch(type) {
      case 'total':
        query = `
          SELECT 
            ${groupBy} as period,
            COALESCE(SUM(total_tokens), 0) as token_count
          FROM llm_request_records
          WHERE created_at >= $1 AND created_at < ($2::date + interval '1 day')
          GROUP BY ${groupBy}
          ORDER BY period
        `;
        params = [start_date, end_date];
        break;
        
      case 'business_type':
        query = `
          SELECT 
            ${groupBy} as period,
            business_type as category,
            COALESCE(SUM(total_tokens), 0) as token_count
          FROM llm_request_records
          WHERE created_at >= $1 AND created_at < ($2::date + interval '1 day')
          GROUP BY ${groupBy}, business_type
          ORDER BY period, token_count DESC
        `;
        params = [start_date, end_date];
        break;
        
      case 'model':
        query = `
          SELECT 
            ${groupByWithAlias} as period,
            um.model as category,
            COALESCE(SUM(lr.total_tokens), 0) as token_count
          FROM llm_request_records lr
          LEFT JOIN user_models um ON lr.model_id = um.id
          WHERE lr.created_at >= $1 AND lr.created_at < ($2::date + interval '1 day')
            AND um.model IS NOT NULL
          GROUP BY ${groupByWithAlias}, um.model
          ORDER BY period, token_count DESC
        `;
        params = [start_date, end_date];
        break;
        
      case 'provider':
        query = `
          SELECT 
            ${groupByWithAlias} as period,
            mp.name as category,
            COALESCE(SUM(lr.total_tokens), 0) as token_count
          FROM llm_request_records lr
          LEFT JOIN user_models um ON lr.model_id = um.id
          LEFT JOIN model_providers mp ON um.provider_id = mp.id
          WHERE lr.created_at >= $1 AND lr.created_at < ($2::date + interval '1 day')
            AND mp.name IS NOT NULL
          GROUP BY ${groupByWithAlias}, mp.name
          ORDER BY period, token_count DESC
        `;
        params = [start_date, end_date];
        break;
        
      default:
        return res.status(400).json({ 
          code: 400, 
          message: '无效的趋势类型', 
          data: null 
        });
    }

    const result = await pool.query(query, params);
    
    res.json({
      code: 200,
      message: '获取趋势统计成功',
      data: result.rows
    });
  } catch (error) {
    console.error('获取趋势统计失败:', error);
    res.status(500).json({ code: 500, message: '获取趋势统计失败: ' + error.message, data: null });
  }
};

module.exports = {
  getOverviewStats,
  getRankings,
  getTrendStats
};
