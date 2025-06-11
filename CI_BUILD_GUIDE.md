# GitLab CI 构建指南

## 概述

优化后的 CI 配置支持多种构建方式，可以根据需要单独构建前端或后端，提高构建效率。

## 构建触发方式

### 1. 自动触发构建

#### 基于文件变更的智能构建
- **后端自动构建**：当以下文件发生变更时自动触发
  - `src/backend/**/*`
  - `docker/backend.Dockerfile`
  - `docker/docker-compose.yml`

- **前端自动构建**：当以下文件发生变更时自动触发
  - `src/frontend/**/*`
  - `docker/frontend.Dockerfile`
  - `docker/docker-compose.yml`

#### 触发场景
- 推送到主分支时
- 创建 Merge Request 时
- 创建 Git Tag 时（完整构建）

### 2. 手动触发构建

在 GitLab 项目页面的 **CI/CD > Pipelines** 中点击 "Run pipeline"，可以设置以下变量：

#### 构建后端
```
BUILD_BACKEND = true
```

#### 构建前端
```
BUILD_FRONTEND = true
```

#### 仅构建后端（手动确认）
```
BUILD_BACKEND_ONLY = true
```

#### 仅构建前端（手动确认）
```
BUILD_FRONTEND_ONLY = true
```

#### 推送 latest 标签
```
PUSH_LATEST = true
```
> 注意：可以与其他构建变量组合使用

## 镜像标签规则

### Tag 构建
- 使用 Git Tag 作为镜像版本号
- 同时推送 `latest` 标签

### 非 Tag 构建
- 使用 Git Commit SHA 短码作为镜像版本号
- 默认不推送 `latest` 标签
- 可通过设置 `PUSH_LATEST = true` 强制推送 `latest` 标签

## 构建任务说明

| 任务名称 | 描述 | 触发条件 |
|---------|------|----------|
| `build-core` | 构建后端核心服务 | 自动/手动 |
| `build-core-only` | 仅构建后端（需手动确认） | 手动 |
| `build-frontend` | 构建前端管理界面 | 自动/手动 |
| `build-frontend-only` | 仅构建前端（需手动确认） | 手动 |
| `build-vectoring` | 兼容性任务，等同于 `build-frontend` | Tag 构建 |

## 使用示例

### 场景1：只修改了后端代码
1. 推送代码到主分支
2. CI 自动检测到后端文件变更
3. 只触发 `build-core` 任务

### 场景2：需要手动构建前端
1. 进入 GitLab 项目页面
2. 点击 **CI/CD > Pipelines > Run pipeline**
3. 添加变量：`BUILD_FRONTEND = true`
4. 点击 "Run pipeline"

### 场景3：紧急修复，只需要构建后端
1. 进入 GitLab 项目页面
2. 点击 **CI/CD > Pipelines > Run pipeline**
3. 添加变量：`BUILD_BACKEND_ONLY = true`
4. 点击 "Run pipeline"
5. 在 pipeline 页面手动点击 `build-core-only` 任务

### 场景4：手动构建并推送 latest 标签
1. 进入 GitLab 项目页面
2. 点击 **CI/CD > Pipelines > Run pipeline**
3. 添加变量：
   ```
   BUILD_FRONTEND = true
   PUSH_LATEST = true
   ```
4. 点击 "Run pipeline"
5. 构建完成后会同时推送版本标签和 `latest` 标签

## 优势

1. **节省时间**：只构建变更的部分
2. **节省资源**：减少不必要的构建
3. **灵活控制**：支持手动选择构建内容
4. **向后兼容**：保留原有的构建流程

## 注意事项

1. 手动构建时，镜像标签使用 commit SHA，默认不会更新 `latest` 标签
2. 如需在手动构建时推送 `latest` 标签，请设置 `PUSH_LATEST = true`
3. 只有 Tag 构建才会创建 GitLab Release
4. `*-only` 任务需要手动确认，防止误操作
5. `PUSH_LATEST` 变量可以与任何构建变量组合使用 