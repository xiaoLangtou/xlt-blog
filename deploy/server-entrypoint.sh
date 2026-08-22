#!/bin/sh
set -e

# 容器内 MySQL 默认走 docker 网络的服务名
: "${DB_HOST:=mysql}"
: "${DB_PORT:=3306}"

echo "==> 等待 MySQL ${DB_HOST}:${DB_PORT} 可达 ..."
i=0
until node -e "const s=require('net').createConnection({host:'${DB_HOST}',port:${DB_PORT}});s.on('connect',()=>{process.exit(0)});s.on('error',()=>{process.exit(1)})" 2>/dev/null; do
  i=$((i+1))
  if [ "$i" -gt 60 ]; then
    echo "!! MySQL 等待超时，退出"; exit 1
  fi
  sleep 1
done
echo "==> MySQL 已就绪"

echo "==> 执行数据库迁移（mikro-orm migration:up）"
cd /repo/apps/server && node_modules/.bin/mikro-orm migration:up

echo "==> 启动 NestJS 服务"
exec node /repo/apps/server/dist/main.js
