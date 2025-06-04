# 数据库迁移记录

## 知识库对象存储配置功能 - 2024年数据库变更

### 变更概述
为知识库表添加对象存储类型和配置字段，支持MINIO、CMS2.0、CMS3.0三种存储类型。

### 变更详情

#### 1. 新增字段
- `storage_type`: 对象存储类型（整型，默认值0）
- `storage_config`: 对象存储配置（JSON格式，可为空）

#### 2. 存储类型说明
- `0`: 默认的MINIO存储
- `1`: CMS2.0存储
- `2`: CMS3.0存储

#### 3. 配置字段说明
- MINIO: 不需要额外配置（storage_config为NULL）
- CMS2.0: 需要username、password、host、port、siteShortName、rootNodeRef字段
- CMS3.0: 需要username、password、host、port、siteShortName字段

### SQL变更语句

```sql
-- 添加存储类型字段
ALTER TABLE knowledge 
ADD COLUMN storage_type INT DEFAULT 0 COMMENT '对象存储类型: 0为默认的minio，1为CMS2.0，2为CMS3.0';

-- 添加存储配置字段
ALTER TABLE knowledge 
ADD COLUMN storage_config JSON DEFAULT NULL COMMENT '对象存储配置，仅针对CMS生效';

-- 为storage_type字段添加索引（可选，根据查询需求决定）
-- CREATE INDEX idx_knowledge_storage_type ON knowledge(storage_type);
```

### 回滚语句

```sql
-- 删除新增的字段（如需回滚）
ALTER TABLE knowledge DROP COLUMN storage_config;
ALTER TABLE knowledge DROP COLUMN storage_type;

-- 如果创建了索引，需要删除索引
-- DROP INDEX idx_knowledge_storage_type ON knowledge;
```

### 数据验证

```sql
-- 验证字段是否添加成功
DESCRIBE knowledge;

-- 检查默认值是否正确
SELECT storage_type, storage_config FROM knowledge LIMIT 5;

-- 验证JSON字段功能
INSERT INTO knowledge (name, user_id, storage_type, storage_config) 
VALUES ('测试知识库', 1, 1, '{"username": "test", "password": "test", "host": "localhost", "port": "8080", "siteShortName": "test", "rootNodeRef": "test-ref"}');

-- 查询JSON字段内容
SELECT id, name, storage_type, 
       JSON_EXTRACT(storage_config, '$.username') as username,
       JSON_EXTRACT(storage_config, '$.host') as host
FROM knowledge 
WHERE storage_config IS NOT NULL;
```

### 注意事项

1. **备份数据**: 执行变更前请务必备份数据库
2. **测试环境**: 建议先在测试环境执行并验证
3. **应用重启**: 变更完成后需要重启应用服务
4. **兼容性**: 现有数据的storage_type将自动设置为0（MINIO），保持向后兼容
5. **JSON字段**: MySQL 5.7.8+才支持JSON数据类型，请确认数据库版本

### 执行时间
- 预计执行时间: < 1分钟（取决于表数据量）
- 建议执行时间: 业务低峰期

### 执行人员
- 数据库管理员
- 后端开发人员

### 相关文件
- `bisheng/database/models/knowledge.py`: 模型定义文件
- 相关API接口需要同步更新以支持新字段

---

**执行状态**: ✅ 已执行  
**执行日期**: 2025年6月4日  
**验证结果**: ✅ 已验证 