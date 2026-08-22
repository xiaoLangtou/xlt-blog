# syntax=docker/dockerfile:1
#
# 统一多 target Dockerfile —— admin / server / web 三个镜像共享公共层
#
# 构建上下文必须是仓库根目录：
#   docker build -f deploy/Dockerfile --target admin  -t xlt-blog-admin  .
#   docker build -f deploy/Dockerfile --target server -t xlt-blog-server .
#   docker build -f deploy/Dockerfile --target web    -t xlt-blog-web    .
#
# 用 buildx bake 一次性并行构建三者（共享 base/deps/shared-build 缓存）：
#   docker buildx bake -f deploy/docker-bake.hcl
#
# ============================================================
# 公共基础镜像
# ============================================================
FROM node:24-slim AS base
RUN corepack enable && corepack prepare pnpm@11.10.0 --activate
WORKDIR /repo

FROM node:24-alpine AS base-alpine
RUN corepack enable && corepack prepare pnpm@11.10.0 --activate
WORKDIR /repo

# ============================================================
# 依赖层：一次 install 覆盖全部 workspace，配合 pnpm store 缓存挂载
# 只有 package.json / lockfile 变化时才会失效，源码变化不会触发重装
# ============================================================
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.json uno.config.ts ./
COPY apps/art-design-pro/package.json apps/art-design-pro/package.json
COPY apps/web/package.json             apps/web/package.json
COPY apps/server/package.json          apps/server/package.json
COPY packages/shared/package.json      packages/shared/package.json
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# ============================================================
# shared 包只构建一次，三个 app 的 build 阶段都从这里 COPY 产物
# ============================================================
FROM deps AS shared-build
COPY packages/shared/ packages/shared/
RUN pnpm --filter @xlt-blog/shared build

# ============================================================
# admin (art-design-pro) —— 构建
# ============================================================
FROM shared-build AS build-admin
# 后台部署在 /admin/ 子路径
RUN echo "VITE_BASE_URL=/admin/" > apps/art-design-pro/.env.production.local
COPY apps/art-design-pro/ apps/art-design-pro/
RUN --mount=type=cache,id=vite-cache-admin,target=/repo/apps/art-design-pro/node_modules/.vite \
    NODE_OPTIONS=--max-old-space-size=4096 pnpm --filter art-design-pro build

FROM nginx:alpine AS admin
COPY deploy/nginx/admin.nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build-admin /repo/apps/art-design-pro/dist /usr/share/nginx/html/admin
EXPOSE 80

# ============================================================
# server (NestJS) —— 构建
# ============================================================
FROM shared-build AS build-server
COPY apps/server/ apps/server/
RUN pnpm --filter @xlt-blog/server build

# server 运行时生产依赖（alpine，与 runtime 同平台）
FROM base-alpine AS prod-deps-server
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.json uno.config.ts ./
COPY apps/server/package.json          apps/server/package.json
COPY apps/web/package.json             apps/web/package.json
COPY apps/art-design-pro/package.json  apps/art-design-pro/package.json
COPY packages/shared/package.json      packages/shared/package.json
RUN --mount=type=cache,id=pnpm-store-alpine,target=/root/.local/share/pnpm/store \
    pnpm install --prod --frozen-lockfile --ignore-scripts --filter @xlt-blog/server...

FROM node:24-alpine AS server
WORKDIR /repo

COPY --from=prod-deps-server /repo/node_modules                  ./node_modules
COPY --from=prod-deps-server /repo/apps/server/node_modules      ./apps/server/node_modules
COPY --from=prod-deps-server /repo/packages/shared/node_modules  ./packages/shared/node_modules

COPY --from=shared-build /repo/packages/shared/dist ./packages/shared/dist
COPY --from=build-server /repo/apps/server/dist     ./apps/server/dist

COPY apps/server/package.json ./apps/server/package.json

COPY deploy/server-entrypoint.sh /server-entrypoint.sh
RUN chmod +x /server-entrypoint.sh

ENV NODE_ENV=production
ENV MIKRO_ORM_CLI_USE_TS_NODE=false
EXPOSE 3000
ENTRYPOINT ["/server-entrypoint.sh"]

# ============================================================
# web (Nuxt SSR) —— 构建
# ============================================================
FROM shared-build AS build-web
COPY apps/web/ apps/web/
RUN --mount=type=cache,id=vite-cache-web,target=/repo/apps/web/node_modules/.vite \
    NODE_OPTIONS=--max-old-space-size=4096 pnpm --filter @xlt-blog/web build

FROM node:24-slim AS web
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build-web /repo/apps/web/.output ./.output
EXPOSE 3001
CMD ["node", ".output/server/index.mjs"]
