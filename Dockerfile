# 和拍 · 单镜像部署（前端 + 后端 + SQLite）
# 在 text/ 目录执行: docker compose up --build

FROM node:20-bookworm AS frontend-build
WORKDIR /frontend
COPY ["和拍---新人入职社交互助平台/package.json", "和拍---新人入职社交互助平台/package-lock.json", "./"]
RUN npm ci
COPY ["和拍---新人入职社交互助平台/", "./"]
# 云端构建不依赖 gitignore 的 .env.pilot，直接写入生产环境变量
RUN printf '%s\n' \
  'VITE_USE_MOCK_API=false' \
  'VITE_API_BASE_URL=/api/v1' \
  'VITE_DINGTALK_EMBED=true' \
  > .env.local \
  && npm run build

FROM node:20-bookworm AS app
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 build-essential \
  && rm -rf /var/lib/apt/lists/*
COPY hepai-server/package.json hepai-server/package-lock.json ./
RUN npm ci
COPY hepai-server/ ./
COPY --from=frontend-build /frontend/dist ./dist

ENV FRONTEND_DIST=/app/dist
ENV HOST=0.0.0.0
ENV PORT=8080
ENV SQLITE_PATH=/app/data/hepai.sqlite
ENV JWT_SECRET=hepai-docker-change-me

RUN mkdir -p /app/data && npm run db:sync

EXPOSE 8080
CMD ["npm", "run", "start"]
