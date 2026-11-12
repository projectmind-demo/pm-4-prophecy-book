# pm-4-prophecy-book

## 预言薄

一个无需账号、后端或数据库的单页预言记录应用。所有数据只保存在访问者当前浏览器的 `localStorage` 中。

### 启动

需要 Node.js 18 或更高版本：

```bash
npm run build
python3 -m http.server 4173 --directory public
```

然后打开 <http://localhost:4173>。应用支持添加、筛选、排序、更新状态和删除预言，刷新页面后记录仍会保留在本机。预览结束后可按 `Ctrl+C` 停止静态文件服务器。
