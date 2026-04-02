require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const initDatabase = require('./models/init');
const pool = require('./config/database');
const MigrationManager = require('./config/migration');
const Seeder = require('./config/seeder');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 添加请求日志中间件
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Request body:', req.body);
  next();
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/roles', require('./routes/roles'));
app.use('/api/menus', require('./routes/menus'));
app.use('/api/models', require('./routes/models'));
app.use('/api/user-models', require('./routes/userModels'));
app.use('/api/agents', require('./routes/agents'));
app.use('/api/user-agents', require('./routes/userAgents'));
app.use('/api/model-providers', require('./routes/modelProviders'));
app.use('/api/llm', require('./routes/llm'));

app.use('/api/token-logs', require('./routes/tokenLogs'));

app.get('/api/health', (req, res) => {
  res.json({
    code: 200,
    message: 'Server is running',
  });
});

const createAdminUser = async () => {
  try {
    const result = await pool.query('SELECT id FROM users WHERE username = $1', ['admin']);
    if (result.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('123456', 10);
      const userResult = await pool.query(
        'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id',
        ['admin', 'admin@example.com', hashedPassword]
      );
      const userId = userResult.rows[0].id;
      
      // 为admin用户分配管理员角色
      const adminRole = await pool.query("SELECT id FROM roles WHERE code = 'admin'");
      
      if (adminRole.rows.length > 0) {
        await pool.query(
          'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT (user_id, role_id) DO NOTHING',
          [userId, adminRole.rows[0].id]
        );
      }
      
      console.log('管理员账号创建成功');
    } else {
      console.log('管理员账号已存在');
    }
  } catch (error) {
    console.error('创建管理员账号失败:', error);
  }
};

const runMigrations = async () => {
  try {
    const manager = new MigrationManager();
    await manager.migrate();
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migrations failed:', error);
    throw error;
  }
};

const runSeeds = async () => {
  try {
    const seeder = new Seeder();
    await seeder.seedAll();
    console.log('Seeds completed successfully');
  } catch (error) {
    console.error('Seeds failed:', error);
    throw error;
  }
};

const startServer = async () => {
  try {
    await initDatabase();
    console.log('Database initialized successfully');
    
    // 运行数据库迁移
    await runMigrations();
    
    // 运行种子数据
    await runSeeds();
    
    // 确保管理员用户存在
    await createAdminUser();
  } catch (error) {
    console.error('Database initialization failed:', error);
    console.warn('Server will start without database connection');
  }
  
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();
