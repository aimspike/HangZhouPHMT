# 发布信息

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
