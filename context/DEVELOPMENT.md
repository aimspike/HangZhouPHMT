# 开发与维护

V13 增加可选 `src/decor-preset-a.js` 家装层与 9 张内嵌参考图。`references/interior/preset-a/manifest.json`记录原名、分类、尺寸与 SHA256；WebP 仅用于网页预览，JPG 原文件保持不变。[方案与实际截图](../assets/interior/preset-a/README.md)。

家装几何为独立显示层，不在 `bakeMeshes` 中。只有家具和表面材质改变，`houseBakeSource()` 与既有 `src/bake-source.json` 完全一致，不需重烘焙建筑数据。家具在每个房间、可见层内按材质合并；延迟首次启用时构造，室内显示壁画和顶面灯带，俯瞰/平面隐藏高位装饰以便观察。使用房间灯位的近似填光、程序纹理和接触阴影，不声称完整家具 GI 或真实反射。`houseViewer.decorDoorClearance()` 对 7 扇门各 25 个开合位置、全部可选门型检查家具；`walkClearance(x,z)`辅助检查安全观景位置。

`decor` 字段随原 schema1 设置保存，包含当前方案、切换前的材质和 A 的自定义材质。旧 JSON 缺省为原有方案。`?decor=a` 明确打开 A；普通网址遵循已保存设置。参考图 WebP 构建成 data URL，不增加外部请求。截图按钮输出当前 WebGL 画布，移动端提供长按预览。校验脚本保存于 `validation/verify-decor-preset.cjs`；需本地 Playwright 与 Chrome，默认 localhost:8879。

公开首页与小区资料见[项目 README](../README.md)。`src/appreciation.js`管理浏览满一分钟后的单次可关闭赞赏弹窗；构建脚本将`assets/wechat-appreciation.png`处理图内嵌为data URL，仍为自包含单HTML。GitHub外链只在用户点击时访问，不自动发出外部资源请求。

本页从原 README 迁入，保留构建方法、版本记录和验证范围。[返回项目首页](../README.md)。

杭州 89-A 户型浏览器：根据用户提供的户型照片复原正交平面图，并生成可离线打开的单文件 3D 网页。

[在线浏览](https://aimspike.github.io/HangZhouPHMT/) · [矢量 SVG](../plans/restored-floor-plan.svg) · [矢量 PDF](../plans/restored-floor-plan.pdf)

## 使用

下载 `docs/index.html`，直接在支持 WebGL 的浏览器打开。手机微信建议点击在线浏览链接。可切换三维、平面、室内；拖动转向、双指缩放，室内使用方向按钮或电脑 WASD / 方向键移动。右上角设置可修改各房间三类表面的颜色和材质、门的开关、FOV、眼高、灯光和楼层。

清晨、正午、黄昏、夜晚采用杭州和阳台南偏西 10° 的太阳方向。默认所在楼层 18 层、层高 3m；透明楼栋默认 26 层，可调整。“整栋建筑”查看整体，“重置视角”返回户型。

## 文件

| 路径 | 内容 |
| --- | --- |
| `docs/index.html` | 最终自包含 HTML，GitHub Pages 入口 |
| `plans/` | 复原平面图 SVG、PDF、PNG |
| `references/` | 用户提供的两张参考图片 |
| `src/` | 模板、脚本、内嵌依赖和烘焙数据 |
| `context/` | 会话需求、实现说明和续接上下文 |
| `validation/` | 浏览器验证记录与截图 |
| `.local/` | 完整会话记录本地快照，已被 Git 忽略 |

## 构建与维护

Python 3.10+ 构建无需额外依赖：

```sh
python src/build_house.py
python -m http.server 8879 --directory docs
```

访问 `http://localhost:8879/`。重新计算光照或生成平面图先安装 `pip install -r requirements.txt`。平面图字体默认使用 Windows 微软雅黑；其他系统需将 `HOUSE_FONT` 设置为支持中文的 TTF/TTC 文件。

几何变化时，在已启动网页的开发者工具导出 `JSON.stringify(houseBakeSource())` 至 `src/bake-source.json`，依次运行：

```sh
python src/bake_lighting.py
python src/bake_sun.py
python src/build_house.py
```

更改太阳参考日期或朝向时先修改并运行 `src/make_solar.py`，再重算太阳光照。

## 发布

GitHub Pages 从 `main` 分支的 `/docs` 目录发布。修改后构建、提交并推送即可更新。运行时没有 CDN、在线字体、远程贴图或打包服务依赖。云同步未配置时不产生云请求；用户启用账号同步后通过 HTTPS 连接自己的 Supabase 项目。第三方库授权见 `licenses/THIRD_PARTY.md`。

## 精度和验证范围

室内几何来自照片复原；墙高、家具及未标注尺寸为估算，不能用于施工。整栋轮廓参照用户整层示意图，左端是本户型；楼栋总层数和邻户内部是示意。日照是 2026-11-18 的近似太阳位置，云、城市、小区均为程序化示意环境。

已进行 Chromium 桌面、Android / iPhone 微信 UA、横竖屏和 WebGL1 模拟验证；尚未进行手机微信真机测试。材质与显示设置即时生效，并自动保存在当前浏览器；可导出 / 导入 JSON。

V9：两间卧室固定贴墙平开；书房、厨房、卫生间、储藏间默认房外单侧推拉，双扇同向移出洞口并叠合停放，保留门洞净宽。所有门支持透明显示；门框搭接密合，木纹统一为自然浅木色。

本地项目目录：`D:/HangZhouPHMT`。历史工作区与旧版本已归档在 `.local/legacy-workspace/`，不会上传GitHub。

V11：对照原照片重新复核 SVG/PDF/PNG 与网页。修正厨房门洞、储藏间入口位置、卧室入口及阳台玻璃门；图纸和网页共用 `src/plan-layout.json` 的墙线与门洞。三维和平面默认以赭红色标记原图实黑墙段，可关闭，结构性质以正式结构图为准。推拉门采用上悬吊轨、独立薄门套和带端盖的双轨罩壳，无地轨与门槛；平开门采用40 mm窄边全包门框，完整覆盖门洞内衬和两侧墙口。平面模式显示随门型与开关变化的门扇符号。详见 [复核记录](PLAN_AUDIT.md)。

V10：清晨07:09、正午11:45、黄昏16:38分别烘焙太阳直射与漫反射；另用64方向天空采样和反射计算室内天光。设置面板可分别调整日照与天光强度，关闭室内灯能查看自然采光。新增数据均内嵌在单HTML内，共219张贴图。天光与太阳反射采用弱光编码，避免暗部色阶。


## V12.1 实时光照与保存

用户反馈路径追踪效果未达预期，现已移除其入口、设置和CPU/GPU运行代码，恢复原有实时浏览和219张内嵌烘焙光照图。其他V12功能保留；旧设置中的路径追踪选项会被忽略，不影响材质、门和光照恢复。

颜色与材质可选择“当前房间 / 全屋更换”；三类表面分别修改，室外没有天花板。墙端11处缺失外角按同一数据补成直角，同步SVG/PDF，并全量重烘焙太阳、天空与顶灯。

“保存与账号同步”提供浏览器自动保存和JSON备份。邮箱验证码登录、跨设备同步、离线待同步与版本冲突流程已接入，**当前尚未配置云服务**。按 [云同步部署步骤](../cloud/README.md) 创建Supabase项目、执行SQL并填入公开URL/key后启用。模拟REST测试通过，真实邮件和RLS权限仍需部署后验收。导出文件不包含账号令牌或云密钥。

进一步提升光照的方案评估见 [光照品质方案](LIGHTING_OPTIONS.md)。当前尚未替换实时照明或引入新的渲染模式。

## V13.1 家装与毛坯

`src/decor-preset-a.js`管理可选家具层：默认无家具的毛坯方案，A使用用户9张参考图适配布局与材质。客厅电视北、沙发南，电视柜避让书房外挂推拉门；床头和衣柜背面贴墙，床另外三侧通行净距均大于0.5m。家具增加包边、床品、柜门、椅架及厨卫细部，使用微凹凸与程序化环境反射。当前390部件合并为108 mesh，按房间近似填光，不含家具完整GI。

阳台西侧按用户确认改为全高实墙，图纸与模型同步后全量重烘焙。当前建筑快照133 mesh、屋顶id130、219张光照图；仅调整家具不需要重烘焙建筑。毛坯和A分别保存自定义材质；旧original/无decor设置自动迁移到无家具水泥毛坯。

浏览器回归脚本为`validation/verify-decor-preset.cjs`（设置`PLAYWRIGHT_MODULE`和可选`CHROME_PATH`，本地8879端口需以项目根目录提供服务）。它核对几何、屋顶、贴墙净距、全部门型开合、保存迁移、观景点及手机/微信UA模拟，并重新导出`assets/interior/preset-a/`的9张实际WebGL截图。截图不是AI生成或离线写实渲染。结果见`validation/decor-a-validation.json`。
