---
name: "frontend-design"
description: "创建具有专业设计水准的前端界面，包括网页组件、页面、仪表盘等。当用户要求构建网页组件、页面、应用程序或美化任何Web UI时调用。"
---

# Frontend Design

## 功能

该技能用于创建具有专业设计水准的前端界面，包括：

- 网页组件和页面设计
- 仪表盘和管理界面
- 响应式布局
- 现代UI设计
- 高质量的HTML/CSS/JavaScript代码

## 使用方法

当用户需要以下功能时，可以调用此技能：

1. 构建网页组件或页面
2. 创建仪表盘或管理界面
3. 设计响应式布局
4. 美化Web UI
5. 生成前端代码

## 设计原则

- **视觉层次**：创建清晰的视觉层次结构，引导用户注意力
- **色彩方案**：使用协调的色彩方案，确保品牌一致性
- **排版**：选择合适的字体和排版，提高可读性
- **动画效果**：添加适当的动画效果，增强用户体验
- **响应式设计**：确保在不同设备上的良好显示

## 技术栈

- HTML5
- CSS3 (包括Flexbox和Grid)
- JavaScript
- 现代前端框架（如Vue、React等）
- CSS预处理器（如SCSS、Less等）
- 设计系统和组件库

## 输出格式

输出应包含：

1. 设计说明和思路
2. 完整的HTML/CSS/JavaScript代码
3. 响应式设计考虑
4. 性能优化建议

## 示例

### 登录页面设计

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>登录页面</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .login-container {
            background: white;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            padding: 40px;
            width: 100%;
            max-width: 400px;
        }
        
        .login-header {
            text-align: center;
            margin-bottom: 30px;
        }
        
        .login-header h2 {
            color: #333;
            margin-bottom: 10px;
        }
        
        .login-header p {
            color: #666;
            font-size: 14px;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 8px;
            color: #555;
            font-weight: 500;
        }
        
        .form-group input {
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 16px;
            transition: border-color 0.3s;
        }
        
        .form-group input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
        }
        
        .login-button {
            width: 100%;
            padding: 12px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.3s;
        }
        
        .login-button:hover {
            background: linear-gradient(135deg, #5a6fd8 0%, #6a409e 100%);
        }
        
        .login-footer {
            margin-top: 20px;
            text-align: center;
            font-size: 14px;
        }
        
        .login-footer a {
            color: #667eea;
            text-decoration: none;
        }
        
        .login-footer a:hover {
            text-decoration: underline;
        }
        
        @media (max-width: 480px) {
            .login-container {
                padding: 30px;
                margin: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="login-header">
            <h2>欢迎回来</h2>
            <p>请登录您的账号</p>
        </div>
        <form class="login-form">
            <div class="form-group">
                <label for="username">用户名</label>
                <input type="text" id="username" placeholder="请输入用户名">
            </div>
            <div class="form-group">
                <label for="password">密码</label>
                <input type="password" id="password" placeholder="请输入密码">
            </div>
            <button type="button" class="login-button">登录</button>
            <div class="login-footer">
                <a href="#">忘记密码？</a> | <a href="#">注册新账号</a>
            </div>
        </form>
    </div>
    <script>
        document.querySelector('.login-button').addEventListener('click', function() {
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            if (!username || !password) {
                alert('请输入用户名和密码');
                return;
            }
            
            // 这里可以添加登录逻辑
            console.log('登录信息:', { username, password });
            alert('登录成功！');
        });
    </script>
</body>
</html>
```

### 仪表盘设计

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>管理仪表盘</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f7fa;
            color: #333;
        }
        
        .dashboard {
            display: flex;
            min-height: 100vh;
        }
        
        .sidebar {
            width: 250px;
            background: white;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
            padding: 20px 0;
        }
        
        .sidebar-header {
            padding: 0 20px 20px;
            border-bottom: 1px solid #eee;
        }
        
        .sidebar-header h2 {
            font-size: 18px;
            font-weight: 600;
            color: #667eea;
        }
        
        .sidebar-menu {
            list-style: none;
        }
        
        .sidebar-menu li {
            margin: 5px 0;
        }
        
        .sidebar-menu a {
            display: block;
            padding: 12px 20px;
            color: #666;
            text-decoration: none;
            transition: all 0.3s;
            border-left: 3px solid transparent;
        }
        
        .sidebar-menu a:hover {
            background: #f5f7fa;
            color: #667eea;
            border-left-color: #667eea;
        }
        
        .sidebar-menu a.active {
            background: #f0f2ff;
            color: #667eea;
            border-left-color: #667eea;
        }
        
        .main-content {
            flex: 1;
            padding: 20px;
        }
        
        .main-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
        }
        
        .main-header h1 {
            font-size: 24px;
            font-weight: 600;
        }
        
        .user-profile {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .user-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: #667eea;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }
        
        .stat-card h3 {
            font-size: 14px;
            color: #666;
            margin-bottom: 10px;
        }
        
        .stat-card .stat-value {
            font-size: 24px;
            font-weight: 600;
            color: #333;
        }
        
        .stat-card .stat-change {
            font-size: 12px;
            margin-top: 5px;
        }
        
        .stat-card .stat-change.positive {
            color: #4caf50;
        }
        
        .stat-card .stat-change.negative {
            color: #f44336;
        }
        
        .charts-section {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 20px;
        }
        
        .chart-card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }
        
        .chart-card h3 {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 20px;
        }
        
        @media (max-width: 768px) {
            .dashboard {
                flex-direction: column;
            }
            
            .sidebar {
                width: 100%;
                padding: 10px 0;
            }
            
            .sidebar-menu {
                display: flex;
                overflow-x: auto;
            }
            
            .sidebar-menu li {
                margin: 0;
            }
            
            .sidebar-menu a {
                white-space: nowrap;
                border-left: none;
                border-bottom: 3px solid transparent;
            }
            
            .sidebar-menu a:hover,
            .sidebar-menu a.active {
                border-left: none;
                border-bottom-color: #667eea;
            }
            
            .charts-section {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="dashboard">
        <div class="sidebar">
            <div class="sidebar-header">
                <h2>管理控制台</h2>
            </div>
            <ul class="sidebar-menu">
                <li><a href="#" class="active">仪表盘</a></li>
                <li><a href="#">用户管理</a></li>
                <li><a href="#">订单管理</a></li>
                <li><a href="#">产品管理</a></li>
                <li><a href="#">数据分析</a></li>
                <li><a href="#">设置</a></li>
            </ul>
        </div>
        <div class="main-content">
            <div class="main-header">
                <h1>仪表盘</h1>
                <div class="user-profile">
                    <span>管理员</span>
                    <div class="user-avatar">A</div>
                </div>
            </div>
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>总用户</h3>
                    <div class="stat-value">12,345</div>
                    <div class="stat-change positive">+5.2% 较上月</div>
                </div>
                <div class="stat-card">
                    <h3>总订单</h3>
                    <div class="stat-value">8,765</div>
                    <div class="stat-change positive">+3.8% 较上月</div>
                </div>
                <div class="stat-card">
                    <h3>总收入</h3>
                    <div class="stat-value">¥1,234,567</div>
                    <div class="stat-change positive">+12.5% 较上月</div>
                </div>
                <div class="stat-card">
                    <h3>转化率</h3>
                    <div class="stat-value">23.4%</div>
                    <div class="stat-change negative">-1.2% 较上月</div>
                </div>
            </div>
            <div class="charts-section">
                <div class="chart-card">
                    <h3>销售趋势</h3>
                    <div style="height: 300px; background: #f5f7fa; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #999;">
                        [销售趋势图表]
                    </div>
                </div>
                <div class="chart-card">
                    <h3>用户分布</h3>
                    <div style="height: 300px; background: #f5f7fa; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #999;">
                        [用户分布图表]
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
```

## 最佳实践

1. **模块化设计**：将界面拆分为可重用的组件
2. **性能优化**：优化CSS和JavaScript代码，减少加载时间
3. **可访问性**：确保界面对所有用户都可访问
4. **跨浏览器兼容性**：确保在不同浏览器中正常显示
5. **代码组织**：保持代码结构清晰，易于维护

## 应用场景

- 网站和应用程序设计
- 仪表盘和管理界面
- 登录和注册页面
- 电子商务网站
- 企业网站和 landing pages
- 响应式移动应用界面