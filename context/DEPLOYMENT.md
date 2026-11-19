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
