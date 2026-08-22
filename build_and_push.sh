#!/bin/bash
set -e

# =====================================================================
# 构建并推送 xlt-blog 三个服务镜像到华为云 SWR
#
# admin / web：本地 pnpm build 出 dist/.output，Dockerfile 只负责拷产物
# server     ：完全交给 Docker（容器内编译 + 装 linux/amd64 平台生产依赖），
#              避免本地 node_modules 里可能存在的原生二进制跨平台不兼容
#
# 用法:
#   ./build_and_push.sh                      # 交互输入版本号，构建并推送全部
#   ./build_and_push.sh 1.0.0                 # 指定版本，构建并推送全部
#   ./build_and_push.sh 1.0.0 server          # 只构建并推送 server
#   ./build_and_push.sh 1.0.0 web             # 只构建并推送 web
#   ./build_and_push.sh 1.0.0 admin           # 只构建并推送 admin
#   ./build_and_push.sh 1.0.0 all             # 构建并推送全部 (默认)
#
# 镜像命名规则:
#   swr.cn-north-4.myhuaweicloud.com/weipengcheng/xlt-blog-<service>:<version>
# =====================================================================

# 华为云 SWR 镜像仓库地址
REGISTRY="swr.cn-north-4.myhuaweicloud.com/weipengcheng"

# 服务 -> Dockerfile 映射（构建上下文统一为仓库根目录）
# 用 case 而非 declare -A，兼容 macOS 自带 bash 3.2
dockerfile_for() {
  case "$1" in
    server) echo "deploy/server.Dockerfile" ;;
    web)    echo "deploy/web.Dockerfile" ;;
    admin)  echo "deploy/admin.Dockerfile" ;;
    *)      return 1 ;;
  esac
}

# 只有 admin/web 需要本地编译；server 交给容器内 build，这里查不到就跳过本地编译
build_script_for() {
  case "$1" in
    web)    echo "build:web" ;;
    admin)  echo "build:admin" ;;
    *)      return 1 ;;
  esac
}

# 仓库根目录（脚本所在目录）
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

# ---- 解析参数 ----
if [ -n "$1" ]; then
  VERSION="$1"
else
  read -p "请输入版本号 (如: 1.0.0): " VERSION
fi

if [ -z "$VERSION" ]; then
  echo "❌ 请输入版本号，如: ./build_and_push.sh 1.0.0"
  exit 1
fi

# 目标服务：all / 单个服务名
TARGET="${2:-all}"
if [ "$TARGET" != "all" ] && ! dockerfile_for "$TARGET" >/dev/null; then
  echo "❌ 未知服务: $TARGET (可选: server | web | admin | all)"
  exit 1
fi

# 需要构建的服务列表
if [ "$TARGET" = "all" ]; then
  SERVICES=("server" "web" "admin")
else
  SERVICES=("$TARGET")
fi

echo "================================================================"
echo "  版本号 : $VERSION"
echo "  仓库   : $REGISTRY"
echo "  服务   : ${SERVICES[*]}"
echo "  架构   : linux/amd64"
echo "================================================================"

# ---- 构建并推送 ----
for svc in "${SERVICES[@]}"; do
  image_name="xlt-blog-${svc}"
  full_image="${REGISTRY}/${image_name}:${VERSION}"
  dockerfile="$(dockerfile_for "$svc")"

  echo ""
  if build_script="$(build_script_for "$svc")"; then
    echo "🔨 [${svc}] 本地编译 (pnpm run ${build_script}) ..."
    pnpm run "$build_script"
  else
    echo "🔨 [${svc}] 编译交给容器内构建 ..."
  fi

  echo "📦 [${svc}] 构建镜像 ..."
  docker build --platform=linux/amd64 -f "$dockerfile" -t "${image_name}:${VERSION}" .

  echo "🏷️  [${svc}] 标记镜像 -> ${full_image}"
  docker tag "${image_name}:${VERSION}" "${full_image}"

  echo "📤 [${svc}] 推送到华为云 ..."
  docker push "${full_image}"

  echo "✅ [${svc}] 完成: ${full_image}"
done

echo ""
echo "================================================================"
echo "✅ 全部完成! 版本: ${VERSION}"
echo "================================================================"
echo "镜像列表:"
for svc in "${SERVICES[@]}"; do
  echo "  - ${REGISTRY}/xlt-blog-${svc}:${VERSION}"
done
