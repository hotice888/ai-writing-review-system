# 文件管理工具

## 功能描述

提供项目文件的标准化管理功能，包括：

1. **文件分类管理** - 自动按类型将文件归类到合适的目录
2. **临时文件管理** - 识别和管理临时文件
3. **测试文件管理** - 规范测试文件的命名和存放
4. **数据库迁移文件管理** - 标准化迁移文件的命名和结构
5. **.gitignore 配置** - 自动更新 .gitignore 文件

## 目录结构

```
项目根目录/
├── scripts/                    # 所有脚本统一管理
│   ├── tests/                # 测试脚本
│   │   ├── api/              # API测试
│   │   ├── db/               # 数据库测试
│   │   └── common/           # 通用测试
│   ├── migrations/           # 数据库迁移脚本
│   │   └── {timestamp}-{description}.js
│   ├── seeds/               # 种子数据
│   ├── setup/              # 初始化脚本
│   ├── utils/              # 工具脚本
│   └── temp/               # 临时文件（可忽略）
├── docs/                     # 文档
│   ├── requirements/        # 需求文档
│   ├── design/              # 设计文档
│   ├── tests/               # 测试文档
│   ├── todo/                # 待办文档
│   ├── bugs/                # BUG处理文档
│   │   └── BUG-Handling-Guide.md
│   └── CHANGELOG.md         # 变更日志
├── .gitignore              # 忽略临时文件
└── README.md               # 项目说明
```

## 文件命名规范

### 测试文件
- `test-{module}-{feature}.js` - 测试脚本
- `spec-{module}-{feature}.js` - 规范测试

### 迁移文件
- `{timestamp}-{description}.js` - 迁移脚本
- 时间戳格式：YYYYMMDDHHmmss

### 工具脚本
- `tool-{name}.js` - 工具脚本
- `util-{name}.js` - 工具脚本

### 临时文件
- `temp-{name}.js` - 明确标记为临时
- `scratch-{name}.js` - 草稿文件

## 操作流程

### 创建文件时
1. 分析文件类型和用途
2. 根据文件类型选择合适的目录
3. 应用标准化的命名规则
4. 自动更新 .gitignore 文件

### 管理临时文件
1. 识别临时文件（temp-*、scratch-* 等）
2. 建议将临时文件移到 scripts/temp/ 目录
3. 提醒定期清理临时文件

### 管理测试文件
1. 根据测试类型（API、数据库、通用）分类
2. 应用标准化的测试文件命名
3. 确保测试文件不被误提交到版本控制

### 管理数据库迁移文件
1. 生成标准化的迁移文件名称
2. 确保迁移文件包含 up 和 down 方法
3. 追踪迁移执行状态

## .gitignore 配置

```gitignore
# 依赖
node_modules/
package-lock.json

# 环境变量
.env
.env.local
.env.*.local

# 日志
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# 临时文件
scripts/temp/
*.tmp
*.temp
*.bak
*~

# IDE
.vscode/
.idea/
*.swp
*.swo

# 构建产物
dist/
build/
*.tsbuildinfo

# 测试覆盖率
coverage/
.nyc_output/

# 操作系统
.DS_Store
Thumbs.db

# 特定项目的临时文件
test-*.js
migrate-*.js
add-*.js
check-*.js
rename-*.js
update-*.js
setup-*.js
create-*.js
```

## 使用示例

### 1. 创建测试文件
```javascript
// 自动创建到 scripts/tests/api/ 目录
const testFile = createTestFile({
  type: 'api',
  module: 'auth',
  feature: 'login',
  content: `// API 登录测试`
});
```

### 2. 创建迁移文件
```javascript
// 自动创建到 scripts/migrations/ 目录
const migrationFile = createMigrationFile({
  description: 'add-api-key-encryption',
  up: 'ALTER TABLE user_models ADD COLUMN api_key_encrypted TEXT',
  down: 'ALTER TABLE user_models DROP COLUMN api_key_encrypted'
});
```

### 3. 管理临时文件
```javascript
// 移动临时文件到 scripts/temp/ 目录
moveToTemp('temp-data.js');

// 清理临时文件
cleanupTempFiles();
```

### 4. 更新 .gitignore
```javascript
// 自动更新 .gitignore 文件
updateGitignore();
```

## 注意事项

1. **安全性** - 确保临时文件中不包含敏感信息
2. **性能** - 避免在临时文件中进行大量计算
3. **版本控制** - 确保临时文件不被提交到版本控制
4. **清理** - 定期清理不再需要的临时文件
5. **文档** - 为重要的脚本文件添加注释和文档

## 工具集成

- **编辑器插件** - 可集成到 VS Code 等编辑器
- **CI/CD** - 可用于 CI/CD 流程中的文件管理
- **开发工作流** - 可作为开发工作流的一部分

## 维护建议

1. **定期审计** - 定期检查临时文件和测试文件
2. **更新规范** - 根据项目需求更新命名规范
3. **文档更新** - 及时更新文档和示例
4. **工具更新** - 定期更新工具以适应新的需求

## 常见问题

### Q: 如何处理已经存在的临时文件？
**A:** 使用 `moveToTemp()` 函数将现有临时文件移动到统一的临时目录。

### Q: 如何确保测试文件不被提交到版本控制？
**A:** 确保 .gitignore 文件包含测试文件的模式，如 `test-*.js`。

### Q: 如何管理数据库迁移文件的版本？
**A:** 使用时间戳命名迁移文件，并在迁移管理器中追踪执行状态。

### Q: 如何处理不同类型的测试文件？
**A:** 根据测试类型（API、数据库、通用）将文件分类到不同的子目录。

## 最佳实践

1. **早期规划** - 在项目开始时就建立文件管理规范
2. **持续维护** - 定期检查和更新文件管理策略
3. **团队协作** - 确保团队成员了解和遵循文件管理规范
4. **自动化** - 使用工具自动化文件管理流程
5. **文档化** - 记录文件管理策略和最佳实践

## 总结

文件管理是项目开发中的重要环节，通过标准化的文件分类、命名和管理，可以提高代码质量、减少混乱，并使项目更加可维护。本工具提供了一套完整的文件管理方案，帮助开发者更好地组织和管理项目文件。