# 发布信息

## 主次卧枕头稳定黑斑 main 修复（2026-11-26）

功能提交[`4b9896c`](https://github.com/aimspike/HangZhouPHMT/commit/4b9896cd69800c140aa656923f2b164661de73f1)已部署[main家装A](https://aimspike.github.io/HangZhouPHMT/preview/main/?decor=a)。四个枕头改为连续闭合布面/细缝边，取消部分埋入枕面的独立细管，手机保留同一表面；完整重新导出并烘焙124张固定照明/AO/反射。曝光、光源能量、太阳方向/时刻、建筑/门和219张回退纹理保持；其余18类模型逐项一致。VIS-05原前沿/角部成串黑点和锯齿暗线在同机位实际网页复核消除。

公开应用规范化SHA256 `6c173020dc023f3d9f151185e03c909ebac77961e8a918225e5b55cce210680c`与本地Pages装配一致。公开PC、390宽手机均衡、Windows WebKit在正午关灯/夜晚开灯，两卧室原机位/近景、2秒重复帧共48张采集通过；独立深度遮罩对真实PBR枕面测量与本地一致。手机极暗像素占比主卧1.116%→0.019%、次卧1.005%→0；阈值为枕面中位亮度35%，含真实接触阴影，不是精确缺陷数或照度。桌面剩余接触暗部没有声称全部为0。

[枕头实际网页前后报告](https://aimspike.github.io/HangZhouPHMT/preview/main/quality-report/pillow-fix.html)99资源逐字节匹配，1280/390宽各48组切换、图片和链接通过。证据`validation/pillow-fix-public.json`、`pillow-surface-public.json`、`pillow-report-public.json`、`pillow-deployment.json`；本地64光照状态、850实体拓扑、家具门/通道、HDR/depth兼容、保存暂停与离线见对应pillow验证。手机/WebKit/微信UA为模拟，真机仍待验收。

本轮只推main。公开校验时release已由其他操作推进至`329dd4936346f0562dd56e68ef5e3d26cafbe48d`，正式HTML SHA256 `3e0c591f57b606c3a6b1fdf3f1a02bcc51bc4ca4181fe16c9b6c67a3ac114421`，本轮保留它，未将枕头修复合入release。历史feature预览保持。后续证据提交不改已验应用和画面。

## v1.1 新视频、六宫格与release发布（2026-11-26）

用户在第三轮审计后明确要求重新录制视频、拍六宫格并正式发布。候选版本来自main的d1c85ee及本轮素材/文档，应用V16.2保持，正式标签v1.1。60秒新片、字幕、封面、1800×2400新六宫格与新版仓库首页随release发布；当前保存暂停和VIS-04/05明确保留。发布范围、已知问题与验证见[发布说明](RELEASE_V1_1.md)，素材入口为`/promo/`，main预览仍为`/preview/main/`。

## 主界面灯开关与时段默认灯状态 main 验证（2026-11-26）

提交[`84a30f4`](https://github.com/aimspike/HangZhouPHMT/commit/84a30f47f6ade2322c705d6a47b3dd8b2c22b33e)已部署[main家装A](https://aimspike.github.io/HangZhouPHMT/preview/main/?decor=a)。室内灯开关由设置移至室内主画面右侧，显示已开/已关；设置保留亮度。选择清晨、正午、黄昏时默认关灯，选择夜晚时强制开灯；之后仍可手动开关，换房间/模式保留本次选择。既有明确灯状态只读恢复，后续选择时段按新规则；保存与账号同步继续暂停。

公开应用规范化SHA256 `9a15da7d5b1f4c090d5a1dacf928f9543af99fec34d6a6f465a48f60449e938e`与本地Pages装配一致。公开PC、390/320竖屏、740×360横屏、Windows WebKit与缺HDR/depth扩展均通过实际控件、四时段默认、手动覆盖/再次选择重置、键盘、跨房间/模式保持、无遮挡/无溢出检查；旧清晨开灯/夜晚关灯记录只读恢复，后续选择夜晚强制开灯，无外部请求或脚本/Shader错误。219图、建筑快照与屋顶保持。

证据`validation/main-light-control-public.json`、`main-light-deployment.json`；本地64种固定照明、画质兼容、曝光、实际鼠标松手、保存暂停和离线回归见`main-light-*.json`与`surface-offline.json`。手机和微信UA为模拟。未改变光源能量、四时段曝光、太阳方向/时刻或烘焙，未重烘焙。

正式release保持`7b53b23568d18550822fbf98fb5f42e5cda60487`，HTML SHA256仍`5057ce9c7ddd0471b0f06fa52efa4ca20582bbc755d804a1fe8c5f2b6a7311a9`，历史feature保留。后续证据提交不改应用。

## 电脑鼠标松开闪光 main 修复（2026-11-26）

提交[`10e1b1d`](https://github.com/aimspike/HangZhouPHMT/commit/10e1b1d99e1fbfde0a1a9923433cf2b66295efb2)已部署至[main家装A](https://aimspike.github.io/HangZhouPHMT/preview/main/?decor=a)。将全局click事件的时段匹配限定为真正按钮，避免canvas拖动结束的click匹配body[data-time]，使静态光照回退、反射重载。四时段曝光、光源能量、太阳方向、模型与烘焙保持；保存/账号同步仍暂停。

公开应用规范化SHA256 `5164fa35ed648c32b5c0163eb87c888fdc40f074f3c532e1c324fbb4f0de52cf`与本地Pages装配一致；公开Chrome实际鼠标按下/拖动/松开16组、758帧保持静态照明/合成次数/缓存版本/曝光/机位，真正的时段、灯与门更新正常。公开PC、390宽手机、旧游客/旧账号模拟记录和Windows WebKit的启动、219图/屋顶、只读恢复、无写入/云请求及隔离通过。

[逐帧前后报告](https://aimspike.github.io/HangZhouPHMT/preview/main/quality-report/mouse-release.html)34资源逐字节匹配，1280/390宽各4组状态切换和图片通过。证据`validation/mouse-release-public.json`、`mouse-release-storage-public.json`、`mouse-release-report-public.json`、`mouse-release-deployment.json`；本地80组3342帧详见`mouse-release-after.json`。浏览器/触屏/微信UA模拟不能称为真机验证。

正式release保持`7b53b23568d18550822fbf98fb5f42e5cda60487`，HTML SHA256仍`5057ce9c7ddd0471b0f06fa52efa4ca20582bbc755d804a1fe8c5f2b6a7311a9`，feature历史预览保留。后续证据提交不改变已验应用与画面。

## 白天天光、四时段曝光和漫游高度 main 验证（2026-11-26）

功能提交[`5f3c374`](https://github.com/aimspike/HangZhouPHMT/commit/5f3c374)和报告hash修正[`87c823b`](https://github.com/aimspike/HangZhouPHMT/commit/87c823b)已部署至[main家装A](https://aimspike.github.io/HangZhouPHMT/preview/main/?decor=a)。仅室内增强自然光：清晨日光/天光1.18/1.30、正午1.35/1.65、黄昏1.10/1.20；四时段固定曝光分别1.00/0.92/1.04/0.86，灯具能量基准50%。太阳方向/参考时刻/光斑位置按用户复核保持。镜头高度可调1.0–1.8米，默认1.5米；保存与账号同步继续暂停。

公开HTML规范化SHA256 `17e328adf3044d722fb5a2233a5e4a36febb1e4e2abaca49f2679d2e466fd59b`，与Pages装配后的本地应用一致。公开PC/手机光源独立控制、四时段固定曝光、旧烘焙回退及镜头高度端点/房间和模式保持通过；Chrome桌面、手机模拟、缺HDR/depth扩展与Windows WebKit的1152帧关灯/转向/跨房间检查无旧状态反射、灯能量或曝光跳变。证据`validation/daylight-controls-public.json`、`lighting-transitions-public.json`与`daylight-deployment.json`。

[实际网页对比报告](https://aimspike.github.io/HangZhouPHMT/preview/main/quality-report/daylight-strength.html)184个资源逐字节匹配；1280/390宽各80种前后组合、24种曝光对比和内部链接通过，无横向溢出，证据`validation/daylight-report-public.json`。报告含本轮前后、单独曝光校准及关灯逐帧曲线，图片没有后期调亮。手机/微信UA与Windows WebKit均为模拟。

release仍`7b53b23568d18550822fbf98fb5f42e5cda60487`，正式HTML SHA256 `5057ce9c7ddd0471b0f06fa52efa4ca20582bbc755d804a1fe8c5f2b6a7311a9`；feature历史预览保持。本次只推main，后续证据提交不改变已验应用、烘焙和画面。

## 室内灯光与曝光对比 main 验证（2026-11-26）

对比报告提交[`c3415f5`](https://github.com/aimspike/HangZhouPHMT/commit/c3415f50d757846cb59db4957a410135551c4ec1)已部署。[亮度对比页](https://aimspike.github.io/HangZhouPHMT/preview/main/quality-report/brightness-comparison.html)的70张实际WebGL原图与4张并排总览全部逐字节匹配本地；1280/390宽各56组比较、滑块、5档原图、总览/证据链接与无横向溢出检查通过。见brightness-public-assets.json、brightness-report-public.json。

本轮仅测试灯光70%/50%与相对曝光80%/65%，保留100%基线；建议优先灯光50%、原曝光，由用户看图选择，当前默认参数保持。主应用HTML/烘焙/模型未修改，公开应用规范化SHA256仍`b3483ec26903532a57c9ae453dd51fc3027138777a9aaafd56238a8ae5dcc76c`；release仍7b53b23、原HTML哈希保持。部署记录见brightness-deployment.json。后续证据提交不改变已测图像/应用。


## Cycles固定光照烘焙 main 验证（2026-11-25）

功能提交[`83f8ad1`](https://github.com/aimspike/HangZhouPHMT/commit/83f8ad1ae67e14466b419bc04abdecfc4e9a4d83)已部署至[main测试页](https://aimspike.github.io/HangZhouPHMT/preview/main/?decor=a)。实际公开HTML与本地/Git装配一致，规范化SHA256 `b3483ec26903532a57c9ae453dd51fc3027138777a9aaafd56238a8ae5dcc76c`。

公开Chrome桌面、手机微信UA、缺HDR/depth扩展、Windows WebKit四类环境各16种固定状态全部通过；新照明/反射实际启用、亮度响应、原219烘焙完整、快照和屋顶保持、改门/材质/天花板回退、设置保存、横竖屏通过，无脚本/shader错误或外部依赖请求。磁盘单HTML的带家具静态光照/反射也已通过。

[48对实际网页前后对比](https://aimspike.github.io/HangZhouPHMT/preview/main/quality-report/static-lighting.html)的96张图、桌面/手机布局、48种画面切换、滑块与8个内部链接在公开页通过。证据：`validation/static-public.json`、`static-report-public.json`、`static-deployment.json`；手机均为模拟，非物理手机微信验收。

正式release仍为7b53b23，原HTML SHA256 `5057ce9c7ddd0471b0f06fa52efa4ca20582bbc755d804a1fe8c5f2b6a7311a9`；历史feature保留。本次只推main，后续证据提交不改变已验证的应用、资产或画面。


## 家具装配与阳台洗漱角 main 验证（2026-11-25）

功能提交 [`78fc9f1`](https://github.com/aimspike/HangZhouPHMT/commit/78fc9f17eb4debe322d17092012ccf392af8b99e) 已部署至 [main 家装 A](https://aimspike.github.io/HangZhouPHMT/preview/main/?decor=a)。修复全库装配连接、按实际尺寸贴墙落地，重建小米造型参考的洗烘高柜并增加旁侧台盆/镜柜收纳；8块窗玻璃增加低强度环境反射。

公开HTML与Git装配结果一致，规范化SHA256 `62316cff0d579aedcc5f010e295f985341aefdb7889f981eaff7c443c5a2e2b8`。PC Chrome、Android微信UA与Windows WebKit iPhone微信UA的18模型 / 13PBR / 219烘焙、屋顶覆盖、设置隔离、四项本机检测和离线带家具单HTML通过；专项确认46项贴墙/支承、8组配件支承、两柜接缝/阳台通行、玻璃反射贡献及建筑快照一致。无脚本 / shader错误或外部依赖请求。

[家具 / 阳台 / 玻璃前后对比页](https://aimspike.github.io/HangZhouPHMT/preview/main/quality-report/compact.html) 的24对实际昼夜截图、48张图片、桌面/手机布局、滑块和9个内部链接均通过公开检查。证据：`validation/compact-public.json`、`compact-public-details.json`、`compact-report-public.json`、`compact-deployment.json`。手机均为模拟，未追加真机结论。

正式release仍为 `7b53b23`，HTML SHA256 `5057ce9c7ddd0471b0f06fa52efa4ca20582bbc755d804a1fe8c5f2b6a7311a9`；feature预览也保留。本轮只推送main；随后证据提交不改变已验证应用、模型和报告画面。


## 入户门与家装细节 main 验证（2026-11-25）

功能提交 [`2b88ec7`](https://github.com/aimspike/HangZhouPHMT/commit/2b88ec7606fe6eee0beea8d38c86a95273c7d717) 已部署至 [main 测试页](https://aimspike.github.io/HangZhouPHMT/preview/main/?decor=a)。修正入户门框装配、米白哑光冰箱、吊柜嵌入式油烟机和双层厚壳窗帘。公开 HTML 与 Git 装配结果逐字节一致，SHA256 `167f3aadca6ef0af3e63ded8ac27c28f38d2e3ac7bcce7498a1573cbdab237e7`。

公网 PC Chrome、Android 微信 UA 模拟、Windows WebKit iPhone 微信 UA：16模型 / 13PBR / 219烘焙、屋顶覆盖、设置隔离、本机检测和离线单 HTML 通过；专项复核门套 / 门扇25步无墙相交、完整原门洞闭合、全部门型 / 家具净空、米白材质反射限值、窗帘闭合网格 / 离地及门设置保存通过。零脚本 / shader 错误或外部依赖请求。证据：`validation/room-refinements-public.json`、`room-refinements-public-details.json`。

[四项修正前后对比报告](https://aimspike.github.io/HangZhouPHMT/preview/main/quality-report/room-refinements.html) 的24对真实网页昼夜截图、48张图片、桌面 / 手机排版和滑块在公网通过，见 `room-refinements-report-public.json`。手机均为模拟，没有追加真机结果。

正式 release `7b53b23` 的 HTML SHA256 仍为 `5057ce9c7ddd0471b0f06fa52efa4ca20582bbc755d804a1fe8c5f2b6a7311a9`；历史 feature 预览也与原提交匹配。本次只更新 main，后续证据提交不改变已测应用和报告内容。

## 阳台顶板与顶灯 main 测试（2026-11-25）

功能提交 [`79b8016`](https://github.com/aimspike/HangZhouPHMT/commit/79b8016b9f8aa0514884ddde1ed79a870a75d659) 已推送，公开 [main 预览](https://aimspike.github.io/HangZhouPHMT/preview/main/) 的提交号及 HTML 与本次构建一致，规范化 SHA256 为 `ae2439f11f2bf2668cf243496fe2e0b5cfdd24c20111cebbf61faffcd22db15f`。阳台连续顶板、吸顶灯、烘焙及天花板材质设置已更新。

公开 Windows Chrome 1280×900、微信 UA / 触屏模拟 390×844 和 740×360：219/219 贴图、屋顶无缺口、夜间开关 / 调光、天花板显示 / 材质保存、毛坯与 A 方案、门及家具净空、旋转通过；无脚本 / shader 错误或额外资源请求。独立 file 单 HTML 启动也通过。证据见 `validation/balcony-public-validation.json`、`balcony-deployment.json` 和 `balcony-offline.json`，手机结果均为模拟。

正式根入口仍使用 release `7b53b23`，HTML SHA256 保持 `5057ce9c7ddd0471b0f06fa52efa4ca20582bbc755d804a1fe8c5f2b6a7311a9`；独立家装重建 feature 预览仍保留。本次不推进 release。后续验证文档提交不改变已测应用 HTML。

## Feature 分支独立预览（2026-11-25）

`feature/render-quality` 的画质开发页使用 `/preview/render-quality/`，报告位于其下 `quality-report/`。工作流同时检出 release、main 和存在时的该 feature 分支，组合部署三个入口；正式根页面仍逐字节取自 release，main 预览仍取自 main。

画质功能无需合入 main 即可供评审。main 只先接入分支预览的部署脚本、工作流与隔离测试，后续任一入口更新时都保留 feature 预览。feature 使用 `house89a.preview.render-quality.settings.v1.` 命名空间与 noindex 标记，和 main、正式版设置分别保存。每个入口的 `deployment.json` 可核对分支及完整提交号。

`github-pages` environment 的部署分支规则需要允许精确的 `feature/render-quality`；不扩大为任意分支。若该 feature 分支尚不存在，则只部署原有两个入口。发布验证运行 `python -m unittest discover -s validation -p test_pages_assembly.py -v`，含 feature 隔离、非法路径与提交号拒绝检查。

- 仓库：https://github.com/aimspike/HangZhouPHMT
- 展示：https://aimspike.github.io/HangZhouPHMT/
- GitHub Pages：GitHub Actions 合并部署，根目录使用 `release:/docs`，开发测试使用 `main:/docs`，HTTPS。
- main 测试：https://aimspike.github.io/HangZhouPHMT/preview/main/
- 最终网页：docs/index.html，自包含单HTML。
- 本地目录：以当前工作区为准，当前为 C:/PHMT；下方 D 盘记录为历史迁移信息。
- Codex后端项目：HangZhouPHMT，ID 01a1ee9e-8fab-7002-b448-acab7a96ec2a，root已更新为D盘。桌面侧栏需在“添加项目”选择此目录。
- 完整本地会话快照与旧工作区归档位于.local/，Git忽略。C盘仅保留位置说明。
- 最近公网验证记录：validation/public-deployment.json。V10已在桌面与手机模拟中检查，发布后再次检查。
- V11完成照片、矢量图和网页复核，承重墙标记、吊轨推拉门及窄边全包平开门框；本地验证见validation/v11-*.json。

## 分支与发布流程

2026-11-24 起采用以下规则，覆盖下方历史记录中的 `main:/docs` 直接发布方式：

- `main`：默认开发分支，功能修改、验证后提交推送，自动更新 `/preview/main/`。
- `release`：正式发布分支，正式分享链接始终为站点根目录。初始化时使用当前已发布的 `main` 版本；后续仅在用户要求正式发布、测试完成后更新。
- `.github/workflows/pages.yml` 在任一分支 push 或手动运行时，分别检出最新 `release` 与 `main`，由 `scripts/assemble_pages.py` 合成同一个 Pages artifact。正式 HTML 和静态资源逐字节取自 `release/docs`，没有 release 构建时直接失败，不能退回发布 main。
- 测试 HTML 标题带 `[main 测试]`，添加搜索引擎 noindex 标记，并使用独立设置命名空间，避免同域 localStorage 覆盖正式版个人设置或复用正式版云登录。每个入口下的 `deployment.json` 记录对应分支与提交 SHA。
- Pages 的发布方式应设置为 **GitHub Actions**；`github-pages` environment 允许 `main` 与 `release` 部署。工作流串行部署，每次重新组合两条分支，防止更新一个入口时删除另一个入口。

开发：在干净的 `main` 上先 `git pull --ff-only`，修改源码并构建、验证、提交，然后 `git push origin main`，检查 Actions 和测试链接。正式网址的 viewer 保持 release 版本。

用户确认发布后，在干净工作区执行：

```sh
git fetch origin
git switch release
git pull --ff-only
git merge --ff-only origin/main
git push origin release
git switch main
```

首次在其他机器检出 release 可使用 `git switch --track origin/release`。若无法快进，先检查分叉与已有工作，不自动重写历史或强推。正式修复应先进入 main 并测试，再推进 release，避免两条分支产生独立提交。推送后须确认工作流成功、两个 `deployment.json` 与预期 SHA 相符，并检查正式页面实际内容。

### 双分支首次发布已验证（2026-11-24）

初始化提交 `102bb16` 已推送 main 与 release，Pages API 确认 `build_type=workflow`、正式来源 `release:/docs`，github-pages 环境允许两条分支部署。[首次手动部署](https://github.com/aimspike/HangZhouPHMT/actions/runs/45340147536)成功。

正式根入口与 main 测试入口均返回200，`deployment.json` 与分支 SHA 一致；正式 HTML 与 release 中的文件逐字节一致（SHA256 `5057ce9c7ddd0471b0f06fa52efa4ca20582bbc755d804a1fe8c5f2b6a7311a9`），测试 HTML 有独立标题和设置命名空间。两边 SVG/PDF 与30秒宣传视频均与对应分支逐字节一致。Chromium 390×844 手机尺寸下两个入口启动、219张贴图、无页面错误或额外资源请求；测试版设置操作不改变正式版 localStorage。此为浏览器模拟，不代表真机微信验证。证据见 `validation/branch-pages-public.json`。

## V10公网验证完成

功能提交`4e29b49`已由GitHub Pages成功构建。实际公开地址返回200，SVG/PDF平面图也返回200。手机390×844微信UA模拟中V10启动正常、219/219贴图，四时段切换、天光滑块正常，无脚本/Shader错误和外部资源依赖。真机微信尚未测试。记录见validation/public-deployment.json。

## V11公网验证完成

功能提交`33626d8`已成功发布。HTML、SVG、PDF均返回200；Git将本地CRLF换行为LF；统一换行后公网HTML的SHA256与本地构建一致。390×844 iPhone微信UA模拟启动正常，219/219贴图、23段承重标记、吊轨推拉与40 mm窄边全包门框均为新版本，默认设置关闭、无溢出及脚本错误。记录见validation/public-deployment.json，截图v11-public-mobile.png。仍未使用真机微信测试。


## V12公网验证完成

功能提交`864e998`已由GitHub Pages成功构建。HTML、SVG、PDF返回200；统一CRLF/LF后公网HTML与本地SHA256一致。390×844 Android微信UA模拟，219/219贴图、11处直角补角、设置面板默认收起，无溢出、JS/Shader错误或外部资源请求；GPU路径追踪240×519、64采样模式可切换。云配置仍为空，本地自动保存已启用。公网证据见`validation/public-deployment.json`和`v12-public-mobile.png`。路径追踪精细/CPU回退、全屋材质、模拟账号冲突等验证见`v12-browser-validation.json`。仍未真机微信测试。


## V12.1路径追踪回退已发布

用户要求移除路径追踪并评估替代方案。功能提交`e241113`已由Pages成功构建，公开HTML返回200且统一换行后与本地构建完全一致。390×844 Android微信UA模拟：版本12.1、219/219烘焙图、无路径追踪入口/设置/诊断、无溢出或脚本错误、设置面板默认收起。全屋材质、本地保存、云接入准备、11处直角补角均保留；相关源码和烘焙/几何数据及图纸哈希与回退前一致。旧设置中路径追踪键可忽略。记录见`validation/v12-1-rollback-validation.json`与`validation/public-deployment.json`，截图`v12-1-public-mobile.png`。替代方案仅完成评估，见`context/LIGHTING_OPTIONS.md`，本轮未启用新照明。真机微信尚未测试。


## 2026-11-19 重命名

本地目录改为`D:/HangZhouPHMT`，GitHub仓库改为`aimspike/HangZhouPHMT`，仓库ID仍为1462767122。origin使用`https://github.com/aimspike/HangZhouPHMT.git`；Pages仍从`main:/docs`发布，新展示地址为`https://aimspike.github.io/HangZhouPHMT/`。云服务部署说明的Site URL已更新。旧仓库链接可能由GitHub重定向，分享网页应使用新的Pages链接。

新Pages地址实测返回200，公开HTML与本地构建统一换行后SHA256一致。390×844微信UA模拟正常启动、219/219图、设置默认关闭、无溢出和脚本错误。完整重命名及校验记录见`validation/repository-rename.json`；历史页面内容和功能未变。

## 2026-11-19 项目首页与邻居支持

README改为“杭州·璞荟铭庭”，小区资料、来源与差异记录在`references/phmt/`，公开赞赏码为`assets/wechat-appreciation.png`处理图。原首页工程说明迁至`context/DEVELOPMENT.md`。

展示页增加GitHub项目入口和前台浏览一分钟后单次可关闭的赞赏/Star弹窗；PNG与脚本构建内嵌，仍只需`docs/index.html`。本地六尺寸、三模式和定时/后台/关闭交互验证通过，见`validation/public-home-browser.json`、`public-home-prompt-edges.json`和截图。仅Chromium模拟，微信真机及扫码未测试。按既有`main:/docs`流程提交推送，无需变更Pages配置。

## V13 家装预设 A 已发布

功能提交 `07396d9` 已由 GitHub Pages 成功构建。公开 `?decor=a` 返回 200；HTML 统一换行后的 SHA256 为 `7bc8be14a5e50635e33d8945fdd6db40a4cef7b6a832787fc56139094720a5e4`，与本地构建一致。

390×844 Android 微信 UA 模拟：V13、方案 A 自动启用、219/219 贴图、设置默认关闭、无溢出、JS/Shader 错误或外部依赖请求；可切回原有方案，参考图与截图预览正常。另直接打开磁盘上的单 HTML，方案 A 与全部烘焙图正常，云配置仍为空。记录为 `validation/decor-a-public.json`，截图为 `decor-a-public-mobile.png`。仍未测试微信真机。

9 张分类原图在 `references/interior/preset-a/`；8 张实际场景 PNG、总览和相机数据在 `assets/interior/preset-a/`，已随功能提交推送。建筑几何、平面图、原有日光数据未变；具体局部填光和房间定位限制见方案说明。

## V13.1 布局、毛坯与新默认已发布

功能提交 `3aaa4cb` 修正 A 客厅为北侧电视/南侧沙发、床头与衣柜贴墙、家具细节及毛坯方案，并将阳台西侧改为全高实墙后重烘焙。随后 `ae4d030` 将默认时段设为夜晚，7扇入户/房间门默认平开；四扇房门仍可选吊轨推拉，个人已保存的选择继续恢复。SVG/PDF/PNG门符号与网页默认同步。

GitHub Pages 已成功构建 `ae4d030`。2026-11-19 公网 `?decor=a` 返回200，规范化HTML SHA256为 `22f6698f17c6a53e4425dc918a0375bf3f9ca559fea1f532ec49ec97122fc9cd`，与本地一致；SVG/PDF也返回200且内容一致。390×844 Android微信UA模拟：V13.1、night、7门hinged、219/219贴图、默认设置收起，无溢出/JS/Shader错误或额外资源请求；A/bare切换、9图相册和截图预览通过。磁盘单HTML启动正常，阳台西墙2.96m全高且非guard，云配置仍为空。

本地完整检查见 `validation/decor-a-validation.json`：几何133mesh/roof130一致、屋顶0缺口、家具及全部可选门型无碰撞；毛坯无家具、独立材质保存/迁移、默认夜晚/平开和个人覆盖选择刷新通过；320×740、390×844、740×360、568×320及旋转模拟通过。9张更新场景截图在 `assets/interior/preset-a/`，9张用户JPG字节保持。公网记录为 `validation/decor-a-public.json`，截图为 `decor-a-public-mobile.png`。仍未测试手机微信真机。

### 后续布局与装修面板精简已发布

功能提交 `96e21b9` 已由Pages成功构建：主卧床头朝西贴西墙，床头柜/挂画/地毯同步；阳台东墙改为0.18m厚、2.96m高实墙，与原东墙端接齐，东西侧均不按guard压低。全量重算73张灯光与早中晚太阳/天光，建筑仍133mesh/roof130/219图。装修面板移除参考图、保存效果图快捷按钮与视角选择，相册及9张内嵌预览同步移除，单HTML约3.01MB。原图留在仓库，右上角通用相机、原有房间选择保留。

公网2026-11-19验证：HTML/SVG/PDF均200且内容与本地一致；HTML规范化SHA256为 `6b4326a0b87173ca8099b4845b860cdc50453d7f230a7a4948c21a4c404b35ab`。390×844微信UA下验证west床头/贴墙误差<1mm、东西三段全高实墙、移除控件无DOM/内嵌数据、A/bare切换与通用截图通过，night/7门hinged/219图默认保持，无JS/Shader错误或额外请求；磁盘单HTML通过。本地四尺寸横竖屏、门/家具/屋顶、材质保存/迁移及赞赏后台计时回归均通过。最新记录在 `validation/decor-a-public.json`、`decor-a-validation.json`、`public-home-prompt-edges.json`；未进行真机微信测试。

## V14 渲染品质、三面置物架与洗烘朝向已发布

功能提交 `b4f9d2d` 已由GitHub Pages成功构建。公网检查时间 `2026-11-19T13:54:03.733Z`，HTML/SVG/PDF均200；规范化HTML SHA256 `8d8962d6c0e6938c7f443e6d304db5fd407f7ca14494b664eeeae79e1195b876` 与本地一致。单HTML大小3,024,978字节，仍自包含、WebGL1，无新增外部请求。

新增按房间缓存的实际场景反射/PMREM、接触遮蔽与过滤、线性PBR材质校准和住宅环境细节；设置提供自动/精细/均衡/轻量，手机自动均衡。未恢复路径追踪。A储物间沿北、东、南三墙六层架，348架体部件并避门；洗烘柜背贴东墙、正面朝西。建筑133mesh/roof130/219图与原快照完全一致。

桌面4时段、画质/保存、房门反射更新、390微信UA、740横屏缺depth/half-float扩展回退测试通过，证据`validation/v14-render-quality.json`。完整家具回归含320×740/390×844/740×360/568×320、旋转、贴墙/通道/25步全门型净空/闭合/屋顶/材质保存与旧JSON迁移，均通过。9张原JPG字节/SHA不变，9张WebGL图与新细节图已更新。

公网390×844微信UA：V14/night/7门hinged/219图，反射采样成功、均衡档，无JS/Shader错误、额外请求或溢出；A/bare、精简装修UI和通用截图通过。磁盘file单HTML启动、SVG/PDF内容一致。公网证据为`validation/decor-a-public.json`。尚未进行微信真机测试，反射和屏幕遮蔽为实时近似，家具未纳入完整GI。

## V14.1 手机阴影条纹修复已发布

2026-11-23，功能提交 `c6efa6d` 已推送至 `main`。公开 `?release=14.1` 返回200，HTML规范化SHA256为 `82b54b659f05575a216c77a4bbc86ee604a895767b55452d2f34867359dce56f`，与本地构建完全一致。GitHub公开构建API返回403速率限制；发布确认以实际公网HTML逐字节规范化比对及浏览器启动为依据。

AO增加接收平面判定、16位深度误差偏置与更稳定的法线，消除平面自遮挡形成的条纹。页面标题和诊断版本同步为V14.1。建筑、门洞和219张烘焙图不变，无需重烘焙。

本地验证含18组平面、2组凸块接触阴影、390竖屏/740横屏毛坯、A方案、三视图、移动、屋顶开关、昼夜与画质保存、缺扩展回退、几何快照相等和屋顶0缺口。证据为 `contact-occlusion.json`、`mobile-shadow.json`、`mobile-shadow-render-quality.json` 及 `mobile-shadow-*.png`；公网和独立单HTML的手机微信UA验证见 `mobile-shadow-public.json`。均为Chromium模拟，未进行真机iPhone/微信核验。

## V14.2 手机兼容阴影与本机检测已发布

2026-11-24，功能提交 `18ddb4f` 已推送至main，含先行的项目指引提交 `01c8e79`。公开HTML返回200，规范化SHA256 `5057ce9c7ddd0471b0f06fa52efa4ca20582bbc755d804a1fe8c5f2b6a7311a9` 与本地完全一致。构建API仍返回403公开速率限制，以实际公开内容比对和浏览器结果确认已发布。

手机/触屏/微信在所有画质档使用兼容烘焙阴影与房间反射，不创建屏幕AO深度附件，不编译深度合成路径。桌面深度sampler显式highp。`?release=14.2&verify=mobile` 为实际浏览器本地检测入口；四项自动渲染检查和人工条纹判断分开记录，不上传、不覆盖个人设置、不连接云账号。

公开检测链接在Chromium和Windows WebKit的390×844 iPhone/微信UA环境中完成四项渲染：219图、无AO深度附件、几何快照一致、屋顶0缺口，无JS/Shader错误或额外请求，见 `validation/v142-public.json`。这些仍为模拟，报告人工字段为`unconfirmed`、总结果`awaiting-visual-check`。本地精度复现和画质/存储/缺扩展测试见 `v142-depth-sampling.json`、`v142-mobile-compatibility.json`、`v142-render-quality.json`。

未连接到可调试手机，电脑微信窗口授权超时。已提供检测链接和 `context/MOBILE_VERIFICATION.md` 的操作步骤，等待实际手机微信与系统浏览器返回目视报告；尚不能记录真机通过。


## 2026-11-25 · V16.1 接缝修复 feature 预览

`8d3f565` 推送 `feature/render-quality`，Pages 工作流 [45552682482](https://github.com/aimspike/HangZhouPHMT/actions/runs/45552682482) 成功。独立测试入口 [V16.1 家装 A](https://aimspike.github.io/HangZhouPHMT/preview/render-quality/?decor=a)，[PC报告](https://aimspike.github.io/HangZhouPHMT/preview/render-quality/quality-report/#pc) / [手机报告](https://aimspike.github.io/HangZhouPHMT/preview/render-quality/quality-report/#mobile)。

发布 HTML SHA256 `bc53f107648eb4080752f3d937b5d7659c1b8dfba828cce7e5b7a6c76d89d6b9`，与 Git 装配一致。PC/手机Chrome、Windows WebKit微信UA、13张PBR、219烘焙、设备检测、设置隔离及单HTML离线通过，报告10对接缝近检/12对房间画面/4张离线棚拍正常。证据见 `validation/rebuild-public.json`；后续仅证据提交保持同一应用内容。

本任务未推进 main/release。验收时独立 main 为 `a2a50d6`，release 为 `7b53b23`，各入口与对应Git一致；手机为自动化模拟，未声明真机微信通过。


## V16.2 主干合并（2026-11-25）

用户要求 `feature/render-quality` 合入main，后续在主干开发。以main `a2a50d6` 与feature `7bdea26` 建立真实merge提交，不改写历史。保留阳台顶板、顶灯和219张新烘焙，接入V16.1重建资产；主模板、生成HTML和文档冲突已组合解决。main新入口 /preview/main/?decor=a，PC/手机报告 /preview/main/quality-report/；feature历史预览与release独立保留。正式发布仍需用户另行要求。

本地验证见 validation/merge-source-integrity.json、merge-visual.json、merge-balcony-validation.json 与 rebuild-*.json，主干合并提交 `50dc9b1` 已推送，Pages工作流 [45561896113](https://github.com/aimspike/HangZhouPHMT/actions/runs/45561896113) 成功。公开main HTML SHA256 `ed37ce230e7b2a95d5fdfe0c8c2b64730ea81262486e20c58b304f44f926e661`，与Git装配一致。PC Chrome、手机微信UA、WebKit、219烘焙/13PBR、设备检测、设置隔离与磁盘单HTML通过；公网阳台开关/调光/材质保存/旋转及报告12对合并对比/10对接缝近检/4张阳台图通过。release `7b53b23` 和feature `7bdea26` 内容分别匹配其Git，未修改。后续证据提交不改变已验证应用。


## 2026-11-26 · 稳定墙顶与陶瓷曲面修复
修复提交 `ca184640cfedf10ebca26a2f8e0625a508aa0651` 已推送并部署。公开main HTML SHA256 `db9bd657259dc26d67523c768b1d98f10fcaad429005296b0dcf1289db8585cd` 与本地按Pages标题/设置命名空间转换后的内容一致。公开Chrome桌面/手机微信UA20机位、static 16位/反射加载及报告两宽度各20比较通过，43张图片逐字节一致，2份JSON按Git LF换行规范一致；无脚本/Shader错误或外部依赖请求。见 `validation/surface-public.json`、`surface-report-public.json`、`surface-public-assets.json`、`surface-deployment.json`。正式release仍7b53b23，HTML hash仍5057ce9c7ddd0471b0f06fa52efa4ca20582bbc755d804a1fe8c5f2b6a7311a9。后续证据提交不改变已验证应用与图片。


## 2026-11-26 · 过曝校正与共面接头修复
功能提交 `32a37de28fff38e2186aba28621386e8b461d613` 已部署main；公开HTML SHA256 `7dc5e1967b803f86318e2b15700e7bdf842117dc7fd9847e0595a11a4bb2fec1` 与本地Pages转换内容一致。公开桌面/手机48实际机位、灯光基准/曝光校正、180%保存刷新、关灯/顶面回退及报告两宽度各48正常比较/24诊断机位均通过，无脚本/Shader错误或外部依赖。147张图片逐字节一致，4份JSON按Git LF规则一致。首次公共CDN一文件503和大HTML30秒下载超时，降低并发/延长下载时限后检查完成；单HTML约40MB的加载成本仍存在。见`validation/exposure-overlap-public.json`、`exposure-calibration-public.json`、`exposure-report-public.json`、`exposure-public-assets.json`、`exposure-deployment.json`。release与feature保持，后续证据提交不改应用。

任务期间已有复审提交420dba8进入同一main历史，已完整保留。其VIS-01对应的默认过亮已在32a37de实际校正；VIS-04原自定义门状态回退按既有约定保持。VIS-05枕头前沿/角部黑斑在新版本正午关灯近景仍可复现：关闭反射后保留，暂时统一家具顶点照明后消失，说明应继续检查烘焙顶点照明/AO与近接缝采样，不能将其标为本轮Z-fighting修复完成。诊断原图在work/exposure-overlap/pillow-*.png，未处理最终截图。本轮未修改床品几何/材质，T01与真机整体验收继续保持进行中。

## 2026-11-26 · 家具贴墙与床头柜朝向

`40d146239431050a44bd3f3d3dfbed2f6b9231ce` 已推送并部署main。公开HTML SHA256 `0b40090f7d73567514799310289fb0f1a0d196b18ce07b7681226306d89a301f` 与Pages装配后的本地内容一致。公开桌面/手机三处昼夜画布、次卧两面实际柜板射线、书房平开/推拉的实际家具避让与刷新保存检查通过，报告全部资源按二进制或LF规范与本地一致。证据为validation/furniture-placement-public.json、furniture-placement-public-assets.json和furniture-placement-deployment.json。release仍7b53b23，内容哈希5057ce9c…，未正式发布。


## 2026-11-26 · 卫浴重做与厨房水槽齐平公开验证

功能提交 `db310ade97490b4c81dde927ca49dac5fe14ff97` 已部署main。公开HTML SHA256 `f9b540870066846bf9fb7e77c2b9dcf90a7a15c0718dc5ab80f45bda0555b89d` 与本地Pages装配内容一致；原始构建为42,106,390字节、SHA256 `4fe7490253a0b21b385cce8ef38b680ff89bf47ef125b835c2b6fd7bff2faaba`。

公开PC/手机共24实际机位检查通过：盆沿/北台面/右台面高度差均0，盆/出口中心误差小于0.1mm，淋浴底盘169个顶面位置与实际中心照明、玻璃透明/深度设置和门净空正常；电视柜贴墙、次卧衣柜两墙接触及主卧床头柜east朝向保留。报告1280/390宽各24组切换、图片和链接正常，50张图片逐字节一致，HTML/JSON按Git LF规范一致，共52资源。证据`validation/bathroom-public.json`、`bathroom-report-public.json`、`bathroom-rebuild-public-assets.json`与`bathroom-deployment.json`。后续证据提交不改变已验证应用和图像。

release仍`7b53b23568d18550822fbf98fb5f42e5cda60487`，正式HTML哈希仍5057ce9c7ddd0471b0f06fa52efa4ca20582bbc755d804a1fe8c5f2b6a7311a9，feature历史预览保持。没有正式发布；手机为浏览器/微信UA模拟，未真机验收。单HTML约42MB的首次加载成本仍存在，VIS-05枕头黑斑不在本次修复范围。


## 2026-11-26 · 保存与账号同步暂停公开验证

功能提交`f514f641a1fbbe2872422de0739065a5eaa35469`已部署main。公开HTML SHA256 `1872aaec31139b5e939ec039268e13e5d0d292b9c2a7c6c66840b692ccea8f32`与Pages转换后的本地内容一致；原始规范化HTML hash为4685302864d7ed6efe6caeb604d50f5f3f976107326b754b9cd023dbc0dc24ff，逻辑UTF-8构建42,104,622字节。

公开Chrome桌面、手机微信UA、旧游客/旧账号模拟记录与Windows WebKit均通过：入口完全移除，显示本次浏览说明；原记录只读恢复，新灯强/画质/时段修改和online/focus/pagehide事件不写入、不联网，刷新恢复原记录，三视图/屋顶/建筑快照/手机旋转及通用截图正常。无JS/Shader错误或外部资源请求。证据`validation/storage-suspended-public.json`、`storage-suspended-deployment.json`；只使用隔离的模拟缓存，未接触用户实际账号。后续证据提交不改应用。

T06为待开始，保存/账号同步重新设计与恢复需用户新要求。release仍7b53b23568d18550822fbf98fb5f42e5cda60487，正式HTML hash5057ce9c…，feature历史预览保持。未正式发布，手机为模拟。
