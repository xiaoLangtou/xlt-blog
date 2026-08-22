# syntax=docker/dockerfile:1
#
# 管理后台镜像（art-design-pro 静态产物）
# 前提：先在本地跑 `pnpm run build:admin` 生成 apps/art-design-pro/dist
#
# 构建上下文必须是仓库根目录：
#   pnpm run build:admin
#   docker build -f deploy/admin.Dockerfile -t xlt-blog-admin .

FROM nginx:alpine
COPY deploy/nginx/admin.nginx.conf /etc/nginx/conf.d/default.conf
COPY apps/art-design-pro/dist /usr/share/nginx/html/admin
EXPOSE 80
