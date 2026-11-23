# 发布信息

- 仓库：https://github.com/aimspike/HangZhouPHMT
- 展示：https://aimspike.github.io/HangZhouPHMT/
- GitHub Pages：main分支 /docs，HTTPS。
- 最终网页：docs/index.html，自包含单HTML。
- 本地目录：D:/HangZhouPHMT
- Codex后端项目：HangZhouPHMT，ID 01a1ee9e-8fab-7002-b448-acab7a96ec2a，root已更新为D盘。桌面侧栏需在“添加项目”选择此目录。
- 完整本地会话快照与旧工作区归档位于.local/，Git忽略。C盘仅保留位置说明。
- 最近公网验证记录：validation/public-deployment.json。V10已在桌面与手机模拟中检查，发布后再次检查。
- V11完成照片、矢量图和网页复核，承重墙标记、吊轨推拉门及窄边全包平开门框；本地验证见validation/v11-*.json。

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
