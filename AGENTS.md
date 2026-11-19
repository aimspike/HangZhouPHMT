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
- 用桌面和移动视口验证启动、全部烘焙纹理加载、屋顶覆盖与控制交互；模拟微信不代表真机微信已验证。
- 楼栋轮廓来自示意图，当前户型位于左端，其他户型与总层数不应描述为测绘结果。
- `.local/` 是完整本地会话备份，不得提交 Git 或发布到网站。凭据不可写入源码、日志或仓库。
- 中间文件写入 `work/`。无需创建新会话或子代理。

- 两间卧室门仅允许贴墙平开；书房、厨房、卫生间、储藏间默认房外单侧推拉。改门位置需运行 `houseViewer.doorMotion()` 和 `doorClosure()` 检查墙、门扇与门框。

- 日光与天光各自有增益控件。`bake_sun.py`依次调用solar_bake.py和sky_bake.py；天空占用灯光贴图R通道，G/B是夜间灯具，必须保持。太阳反射和天光用sqrt编码，shader解码后参与线性照明。

- `src/plan-layout.json` 是图纸与网页墙线、门洞、门配置和原图实黑标记的共同来源；修改门洞必须同步重绘和重烘焙。承重标记仅根据原图实黑区域，不可自动把厚墙全部标为承重。

- `settings-storage.js`为本地/可选Supabase云同步；配置为空不得发云请求。公开配置在`cloud-config.json`，部署SQL/说明在`cloud/`。会话令牌不得导出或提交。
- `wall_junctions.py`为网页与矢量图共享的11处直角补片。当前烘焙快照134mesh/roof131/219图；变几何才重烘焙，纯渲染改动不需要。

- V12.1按用户要求移除运行时路径追踪、入口及CPU/GPU脚本，保留实时烘焙照明与V12其他改动。替代方案见`context/LIGHTING_OPTIONS.md`；未获新实施要求时仅作评估。
