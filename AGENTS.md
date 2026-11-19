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
- `src/decor-preset-a.js` 是独立可选家装层；原图与分类在 `references/interior/preset-a/`，实际场景截图在 `assets/interior/preset-a/`。仅调整此层家具不改变建筑烘焙快照；应验证 `houseBakeSource()` 一致、`decorDoorClearance()` 无碰撞及观景位置可移动。建筑墙线/门洞更改仍须全量重烘焙。
- 中间文件写入 `work/`。无需创建新会话或子代理。

- 当前默认夜晚；7扇入户/房间门全部默认平开。两间卧室门仅允许贴墙平开；书房、厨房、卫生间、储藏间仍可选房外单侧推拉。保留用户已有保存设置。改门位置需运行 `houseViewer.doorMotion()` 和 `doorClosure()` 检查墙、门扇与门框。

- 日光与天光各自有增益控件。`bake_sun.py`依次调用solar_bake.py和sky_bake.py；天空占用灯光贴图R通道，G/B是夜间灯具，必须保持。太阳反射和天光用sqrt编码，shader解码后参与线性照明。

- `src/plan-layout.json` 是图纸与网页墙线、门洞、门配置和原图实黑标记的共同来源；修改门洞必须同步重绘和重烘焙。承重标记仅根据原图实黑区域，不可自动把厚墙全部标为承重。

- `settings-storage.js`为本地/可选Supabase云同步；配置为空不得发云请求。公开配置在`cloud-config.json`，部署SQL/说明在`cloud/`。会话令牌不得导出或提交。
- `wall_junctions.py`为网页与矢量图共享的11处直角补片。当前烘焙快照133mesh/roof130/219图；变几何才重烘焙，纯渲染改动不需要。

- V12.1按用户要求移除运行时路径追踪、入口及CPU/GPU脚本，保留实时烘焙照明与V12其他改动。替代方案见`context/LIGHTING_OPTIONS.md`；未获新实施要求时仅作评估。

- 正式项目目录现为`D:/HangZhouPHMT`，GitHub为`aimspike/HangZhouPHMT`，展示地址`https://aimspike.github.io/HangZhouPHMT/`。本会话默认cwd可能仍是C盘旧目录，命令需显式使用新D盘路径。

- 装修方案仅有毛坯（无家具、水泥基底）和A；客厅电视在北侧、沙发在南侧，保留书房推拉门停车空间。主卧床头朝西贴墙，次卧床头贴东墙。阳台东西两侧均为全高实墙，西侧与邻居相连，不能按围栏剖切。衣柜背面与床头应贴墙，卧室门扫掠与床其余三边通行必须验证。
- 装修方案面板仅保留切换与说明；已移除参考图相册、保存效果图快捷按钮与观景位置选择，不再内嵌参考预览。仓库原图保留，通用相机和原有房间选择保留；`captureView`仅用于自动检查/导出截图。
