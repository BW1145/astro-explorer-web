# 观星之间 · Astro Explorer

通过七个互动宇宙场景探索天文学，包含原创双语讲解、参数实验和知识星图。

[打开网页](https://BW1145.github.io/astro-explorer-web/)

## 本地运行

需要 Node.js 22.12 或更新版本，推荐 Node.js 24。

```sh
npm ci
npm run dev
```

## 构建与部署

```sh
npm run build
npm run preview
```

构建产物位于 `dist/`。推送到 `main` 分支后，GitHub Actions 自动构建并部署到 GitHub Pages。仓库的 Pages 发布来源设为 GitHub Actions。

学习进度与创作数据由浏览器在本地保存；可使用网页提供的相应功能管理数据。
