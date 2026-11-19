# 发布信息

- 仓库：https://github.com/aimspike/hangzhou-89a-house-viewer
- 展示：https://aimspike.github.io/hangzhou-89a-house-viewer/
- GitHub Pages：main分支 /docs，HTTPS。
- 最终网页：docs/index.html，自包含单HTML。
- 本地目录：D:/hangzhou-89a-house-viewer
- Codex后端项目：杭州 89-A 户型浏览器，ID 01a1ee9e-8fab-7002-b448-acab7a96ec2a，root已更新为D盘。桌面侧栏需在“添加项目”选择此目录。
- 完整本地会话快照与旧工作区归档位于.local/，Git忽略。C盘仅保留位置说明。
- 最近公网验证记录：validation/public-deployment.json。V10已在桌面与手机模拟中检查，发布后再次检查。
- V11完成照片、矢量图和网页复核，承重墙标记、吊轨推拉门及窄边全包平开门框；本地验证见validation/v11-*.json。

## V10公网验证完成

功能提交`4e29b49`已由GitHub Pages成功构建。实际公开地址返回200，SVG/PDF平面图也返回200。手机390×844微信UA模拟中V10启动正常、219/219贴图，四时段切换、天光滑块正常，无脚本/Shader错误和外部资源依赖。真机微信尚未测试。记录见validation/public-deployment.json。

## V11公网验证完成

功能提交`33626d8`已成功发布。HTML、SVG、PDF均返回200；公网HTML的SHA256与本地构建一致。390×844 iPhone微信UA模拟启动正常，219/219贴图、23段承重标记、吊轨推拉与40 mm窄边全包门框均为新版本，默认设置关闭、无溢出及脚本错误。记录见validation/public-deployment.json，截图v11-public-mobile.png。仍未使用真机微信测试。
