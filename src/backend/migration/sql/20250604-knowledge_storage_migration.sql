-- =====================================================
-- 知识库对象存储配置功能 - 数据库迁移脚本
-- 执行日期: 2024年
-- 描述: 为knowledge表添加storage_type和storage_config字段
-- =====================================================

-- 开始事务
START TRANSACTION;

-- 添加存储类型字段
ALTER TABLE knowledge 
ADD COLUMN storage_type INT DEFAULT 0 COMMENT '对象存储类型: 0为默认的minio，1为CMS2.0，2为CMS3.0';

-- 添加存储配置字段
ALTER TABLE knowledge 
ADD COLUMN storage_config JSON DEFAULT NULL COMMENT '对象存储配置，仅针对CMS生效';

-- 验证字段添加是否成功
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE, 
    COLUMN_DEFAULT, 
    COLUMN_COMMENT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'knowledge' 
AND COLUMN_NAME IN ('storage_type', 'storage_config');

-- 提交事务
COMMIT;

-- =====================================================
-- 可选: 添加索引（根据查询需求决定是否执行）
-- =====================================================
-- CREATE INDEX idx_knowledge_storage_type ON knowledge(storage_type);

-- =====================================================
-- 验证脚本（可选执行）
-- =====================================================

-- 查看表结构
-- DESCRIBE knowledge;

-- 检查现有数据的默认值
-- SELECT id, name, storage_type, storage_config FROM knowledge LIMIT 5;

-- 测试JSON字段插入（测试用，生产环境请谨慎执行）
-- INSERT INTO knowledge (name, user_id, storage_type, storage_config) 
-- VALUES ('测试知识库_迁移验证', 1, 1, 
--         JSON_OBJECT(
--             'username', 'test_user',
--             'password', 'test_pass', 
--             'host', 'localhost',
--             'port', '8080',
--             'siteShortName', 'test_site',
--             'rootNodeRef', 'workspace://SpacesStore/test-node'
--         ));

-- 测试JSON字段查询
-- SELECT 
--     id, 
--     name, 
--     storage_type,
--     JSON_EXTRACT(storage_config, '$.username') as username,
--     JSON_EXTRACT(storage_config, '$.host') as host,
--     JSON_EXTRACT(storage_config, '$.siteShortName') as site_name
-- FROM knowledge 
-- WHERE storage_config IS NOT NULL;

-- 清理测试数据（如果执行了测试插入）
-- DELETE FROM knowledge WHERE name = '测试知识库_迁移验证';

-- =====================================================
-- 回滚脚本（紧急情况使用）
-- =====================================================

-- 如需回滚，请执行以下语句：
-- START TRANSACTION;
-- ALTER TABLE knowledge DROP COLUMN storage_config;
-- ALTER TABLE knowledge DROP COLUMN storage_type;
-- -- 如果创建了索引，需要删除
-- -- DROP INDEX idx_knowledge_storage_type ON knowledge;
-- COMMIT; 