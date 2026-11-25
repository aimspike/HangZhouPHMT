# V15 画质提升 Feature 评审

日期：2026-11-25。分支：`feature/render-quality`。基线：`38d6832` / V14.2。当前为首轮可交互评审版，视觉验收与实际手机检查待完成。

- [独立画质测试页](https://aimspike.github.io/HangZhouPHMT/preview/render-quality/?decor=a)
- [PC 效果报告](https://aimspike.github.io/HangZhouPHMT/preview/render-quality/quality-report/#pc)
- [手机视口效果报告](https://aimspike.github.io/HangZhouPHMT/preview/render-quality/quality-report/#mobile)
- [实际手机 / 浏览器检测](https://aimspike.github.io/HangZhouPHMT/preview/render-quality/?verify=mobile)
- [分支与部署提交](https://aimspike.github.io/HangZhouPHMT/preview/render-quality/deployment.json)

## 实现范围

`surface-maps.js` 为墙、地、顶及家具提供独立的颜色、凹凸、粗糙度数据；同一渲染器共享纹理缓存，PC 512px、手机 256px，保留线性 / sRGB 区分及材质 shader hooks。程序纹理仍不等同于真实扫描材质。

`prepare_quality_assets.py` 从现有建筑烘焙生成 9 房间、72 个位置、每点 192 条射线的低频受光数据，按房间内部位置及六个方向插值；静态家具构造时写入两组顶点属性，运行时保留灯光、天光、太阳增益及时间选择。它使用固定中性反射率与保守填光，不是 Cycles 多次反射；关门、改墙色和大幅移动家具后不会自动重算完整间接光。阳台保留室外受光回退。

手机采用半分辨率灯光 / 天光图、75% 尺寸的太阳直射图，太阳反射图保持原尺寸；仍加载 219 张纹理。原始 `baked-lighting.json`、G/B 灯具通道与建筑快照逐字节保持，衍生数据另存 `quality-assets.json`，构建检查源哈希。

手机像素比例在均衡档 0.85–1.25、精细档 1–1.75、轻量档 0.75–1 之间依据实际渲染提交时间与帧间隔调整，降档快于恢复；画质选择继续保存，自动比例不写入个人配置。手机房间反射缓存最多 2 个，PC 最多 6 个，移动结束后才更新；淘汰的目标显式释放。手机屏幕 AO 深度附件保持关闭，AO 缓冲缩到 1×1。

## 效果与性能结果

报告含 PC 1280×800、手机视口 390×844 各四组同机位前后画面：客厅白天、客厅夜晚、主卧白天、毛坯白天。FOV 85°、眼高 1.5m；截图来自实际 WebGL，只转 WebP 和等比缩小，无重绘或后期补光。

| 项目 | 基线 | V15 首轮 |
| --- | --- | --- |
| PC 四场景短时渲染帧率 | 约 59.9–60.4 FPS | 约 59.7–60.3 FPS |
| 手机视口四场景短时帧率 | 约 30.0–30.4 FPS | 约 29.9–30.0 FPS |
| 手机视口画布 | 780×1688 | 487×1055（自动均衡，采样时比例 1.25） |
| 烘焙纹理基础层 RGBA8 等效 | 81.47 MiB | 手机 35.49 MiB，减少 56.44% |
| 自包含 HTML 本地体积 | 约 3.04 MB | 约 3.71 MB，增加约 0.67 MB |
| 手机反射缓存 | 按访问保留所有房间 | 最多 2 房间 |

上述帧率来自同一 Windows PC、Chrome、NVIDIA GeForce RTX 5080。手机列为触控 / 微信 UA 模拟，受移动帧率限制；不能证明手机帧率提升。纹理数字依据实际图片尺寸计算，不包含材质、反射、CPU 解码副本及帧缓冲，不是实际显存测量。单次本机 HTTP 启动时间记录在 JSON，不用于宣称公网加载加速。

## 已验证

- `verify-render-quality.cjs`：PC 四时段、画质保存、房门修改反射刷新、手机微信 UA、缺 HDR / depth 扩展回退，219 图及无外部请求。
- `verify-mobile-compatibility.cjs`：Chromium 桌面 / Android Chrome / 微信 UA，Windows WebKit Safari / iPhone 微信 UA，横竖屏、三视图、high 设置刷新、检测流程及 localStorage 保护。五类场景通过，人工目视字段保持未确认。
- `verify-quality-feature.cjs`：连续八次房间访问，缓存不超过 2 且发生 6 次淘汰；合成 CPU 压力使像素比例从 1.25 降至 0.95，解除压力后恢复至 1.05；颜色 / 凹凸 / 粗糙度数据独立。
- 家具完整回归：建筑 133 mesh / roof130 快照一致、屋顶 0 缺口、门闭合 / 扫掠 / 家具净空、贴墙与床三侧通行、9 个安全观景点、材质 / 门 / 装修设置保存与导入导出、4 种手机尺寸和旋转通过。
- 发布装配 8 项单元测试通过，feature、main、release 的内容与存储隔离；报告 1366px / 390px 布局、8 对图片加载和对比滑块通过。

结果位于 `validation/v15-*.json` 和在线报告，原始 PNG 留在忽略目录 `work/render-quality/raw/`。此前 V14 的截图和验证记录保持。

## 剩余验收

实际 iPhone 与 Android 微信的画面、帧率、10 分钟发热与稳定性仍待测试。`?verify=mobile` 在设备当前浏览器采样约 2 秒的短时帧率，四场景的人工条纹结论、复制 / 下载报告功能保留；不自动上传、不覆盖保存设置、不连接云账号。

用户效果评审后，再确定离线高质量光照样板与模型细化范围。T01 因真机和视觉验收尚未完成，状态为待验证。画质功能不合入 main 或 release；main 的 `7b53b23` 仅包含独立预览基础设施。
