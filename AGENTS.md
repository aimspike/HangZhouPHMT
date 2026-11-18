# 项目工作指引

先阅读 `context/HANDOFF.md`、`context/REQUIREMENTS.md` 和 `README.md`。

- `src/house.template.html` 为主模板，`src/interior.js` 管理分房间材质、门与整栋透明结构；`src/environment.js` 管理室外环境。
- `python src/build_house.py` 生成 `docs/index.html`，最终页面必须保持单 HTML、自包含、无 CDN、无外部资源请求。
- 编辑源码后重新构建。不要只改生成的 HTML。
- 用户要求：每次修改完成后，进行对应验证，提交 Git 并推送到 GitHub；展示页变更需同步更新 `docs/index.html` 并检查 Pages 发布。
- 所有墙体必须横平竖直；照片的斜线是纸面褶皱。
- 保留微信和手机适配，设置面板默认收起、canvas 显式视口尺寸及 WebGL1 兼容。
- 修改几何或门洞后，通过浏览器 `houseBakeSource()` 导出 `src/bake-source.json`，再依次运行 `bake_lighting.py`、`bake_sun.py`、`build_house.py`。
- 保留材质 clone 的 onBeforeCompile/customProgramCacheKey，及光照 uv2。
- 用桌面和移动视口验证启动、146 张纹理加载、屋顶覆盖与控制交互；模拟微信不代表真机微信已验证。
- 楼栋轮廓来自示意图，当前户型位于左端，其他户型与总层数不应描述为测绘结果。
- `.local/` 是完整本地会话备份，不得提交 Git 或发布到网站。凭据不可写入源码、日志或仓库。
- 中间文件写入 `work/`。无需创建新会话或子代理。
