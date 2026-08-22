# syntax=docker/dockerfile:1
#
# Nuxt 前台 SSR 镜像
# 前提：先在本地跑 `pnpm run build:web` 生成 apps/web/.output
#
# 构建上下文必须是仓库根目录：
#   pnpm run build:web
#   docker build -f deploy/web.Dockerfile -t xlt-blog-web .

FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production
COPY apps/web/.output ./.output
EXPOSE 3001
CMD ["node", ".output/server/index.mjs"]
