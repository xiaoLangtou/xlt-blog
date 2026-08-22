# syntax=docker/dockerfile:1
#
# NestJS 服务端镜像（含 MikroORM 迁移能力）
# 前提：先在本地跑 `pnpm run build:server` 生成 apps/server/dist 和 packages/shared/dist
#（TS 编译产物是纯 JS，跨平台无影响；node_modules 涉及原生二进制，必须在容器内按
#  linux/amd64 平台安装，不能直接拷贝本地 macOS 装好的 node_modules）
#
# 构建上下文必须是仓库根目录：
#   pnpm run build:server
#   docker build -f deploy/server.Dockerfile -t xlt-blog-server .

# ---- 生产依赖（alpine，与运行时同平台）----
FROM node:24-alpine AS prod-deps
RUN corepack enable && corepack prepare pnpm@11.10.0 --activate
WORKDIR /repo
RUN pnpm config set registry https://mirrors.huaweicloud.com/repository/npm/
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.json uno.config.ts ./
COPY apps/server/package.json          apps/server/package.json
COPY apps/web/package.json             apps/web/package.json
COPY apps/art-design-pro/package.json  apps/art-design-pro/package.json
COPY packages/shared/package.json      packages/shared/package.json
RUN pnpm install --prod --frozen-lockfile --ignore-scripts --filter @xlt-blog/server...

# ---- 运行时 ----
FROM node:24-alpine
WORKDIR /repo

# 1) 生产 node_modules（容器内装的，linux/amd64 平台正确）
COPY --from=prod-deps /repo/node_modules               ./node_modules
COPY --from=prod-deps /repo/apps/server/node_modules    ./apps/server/node_modules
COPY --from=prod-deps /repo/packages/shared/node_modules ./packages/shared/node_modules

# 2) 本地编译好的构建产物（纯 JS，跨平台安全）
COPY apps/server/dist     ./apps/server/dist
COPY packages/shared/dist ./packages/shared/dist

# 3) package.json
#    - apps/server/package.json：mikro-orm CLI 读取 mikro-orm 配置块定位 config 文件
#    - packages/shared/package.json：node_modules/@xlt-blog/shared 是指向本目录的
#      符号链接，Node 解析该包时要读这个文件的 main/exports 字段才知道去哪找 dist，
#      漏拷会导致运行时报 "Cannot find module '@xlt-blog/shared'"
COPY apps/server/package.json     ./apps/server/package.json
COPY packages/shared/package.json ./packages/shared/package.json

# 4) entrypoint
COPY deploy/server-entrypoint.sh /server-entrypoint.sh
RUN chmod +x /server-entrypoint.sh

ENV NODE_ENV=production
ENV MIKRO_ORM_CLI_USE_TS_NODE=false
EXPOSE 3000
ENTRYPOINT ["/server-entrypoint.sh"]
