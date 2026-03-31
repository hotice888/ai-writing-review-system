# AI 创作评审系统

一个基于 AI 的长篇小说创作评审管理系统，支持用户管理、AI 模型配置、智能体管理等功能。

## 技术栈

### 前端
- **用户端 (homeFrontend)**: Vue 3 + Vue Router + Pinia + Element Plus + TypeScript
- **管理端 (adminFrontend)**: Vue 3 + Vue Router + Pinia + Element Plus + TypeScript

### 后端
- Node.js + Express
- PostgreSQL 数据库
- JWT 认证

## 项目结构

```
ai-writing-review-system/
├── adminFrontend/          # 管理端前端
│   └── src/
│       ├── api/            # API 接口
│       ├── components/     # 公共组件
│       ├── router/         # 路由配置
│       ├── stores/         # Pinia 状态管理
│       ├── types/           # TypeScript 类型
│       ├── utils/          # 工具函数
│       └── views/          # 页面组件
├── homeFrontend/           # 用户端前端
│   └── src/
│       ├── api/
│       ├── components/
│       ├── router/
│       ├── stores/
│       ├── types/
│       ├── utils/
│       └── views/
├── backend/                # 后端服务
│   └── src/
│       ├── config/         # 数据库配置
│       ├── controllers/    # 控制器
│       ├── middleware/     # 中间件
│       ├── models/         # 数据模型
│       └── routes/         # 路由
└── docs/                   # 项目文档
```

## 功能特性

### 用户端
- 用户注册/登录
- 个人资料管理
- 我的模型管理
- 我的智能体管理
- 跳转到管理端

### 管理端
- 仪表盘
- 用户管理
- 评审管理
- 角色管理
- 菜单管理
- 模型管理
- 模型提供商管理
- 智能体管理
- 用户模型管理
- 用户智能体管理

### RBAC 权限系统
- 基于角色的访问控制
- 角色继承
- 菜单权限分配

## 快速开始

### 环境要求
- Node.js 18+
- PostgreSQL 14+

### 安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装管理端依赖
cd ../adminFrontend
npm install

# 安装用户端依赖
cd ../homeFrontend
npm install
```

### 配置环境变量

创建 `.env` 文件：

```env
# 后端 (.env)
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_writing_review
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret

# 管理端 (.env)
VITE_API_BASE_URL=http://localhost:3000/api
VITE_ADMIN_BASE_URL=http://localhost:5174

# 用户端 (.env)
VITE_API_BASE_URL=http://localhost:3000/api
```

### 初始化数据库

```bash
cd backend
npm run setup-db
```

### 启动服务

```bash
# 启动后端 (端口 3000)
cd backend
npm start

# 启动管理端 (端口 5174)
cd adminFrontend
npm run dev

# 启动用户端 (端口 5173)
cd homeFrontend
npm run dev
```

### 默认账号

- 管理員: `admin` / `123456`
- 普通用户: 通过注册页面注册

## API 文档

### 认证接口
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/user` - 获取用户信息
- `POST /api/auth/logout` - 退出登录

### 角色接口
- `GET /api/roles` - 获取角色列表
- `GET /api/roles/menus/user` - 获取用户菜单
- `POST /api/roles` - 创建角色
- `PUT /api/roles/:id` - 更新角色
- `DELETE /api/roles/:id` - 删除角色

### 菜单接口
- `GET /api/menus` - 获取菜单列表
- `POST /api/menus` - 创建菜单
- `PUT /api/menus/:id` - 更新菜单
- `DELETE /api/menus/:id` - 删除菜单

## 开发指南

### 添加新菜单
1. 在 `backend/src/models/init.js` 中添加菜单配置
2. 设置菜单的 `client_type`、`position`、`target` 等属性
3. 重启后端服务自动同步菜单到数据库

### 添加新页面
1. 在对应的前端目录创建 Vue 组件
2. 配置路由
3. 添加菜单并分配权限

## License

MIT
