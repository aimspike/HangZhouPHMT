# 家装 A 材质与模型重建

日期：2026-11-25。分支：`feature/render-quality`。用户已否决 V15 的视觉效果并要求回退，随后确认沿用原家装 A 参考图，重建目标为工业级水平。

## 回退

通过新增提交 `2377c58` 撤销 V15 两个功能与报告提交，恢复 `7b53b23` 的 V14.2 源码和构建页面。PC、手机微信 UA、缺 HDR / depth 回退检查通过，公开测试页已确认 V14.2 且不含 V15 资源。保留 feature 预览部署，main / release 应用不变；不重写历史、不强推。

## 本轮资产重建

以仓库原 A 参考图为默认视觉基准，完成 16 类主要家具的可编辑 Blender 5.3 源模型和网页接入：沙发、茶几、电视柜、餐桌、曲木餐椅、多层吊灯、两张床、两组衣柜、餐边柜、冰箱、两组橱柜、书桌、浴室柜。新增墙线驱动的室内踢脚线与窗框收口层，不进入结构烘焙快照。

与旧几何相比，沙发有独立软包曲面、包边和弯管镀铬框架；餐椅有弯曲的厚木背和悬臂结构；床有床垫、枕头、包边和有厚度的被褥；柜体有板件、门缝、凹踢脚、把手与倒角，水槽保留真实开口。所有重建模型保持原布局及门洞，不通过改墙容纳家具。

资产主文件为 `assets/rebuild/reference-a-master.blend`，每类资产单独集合、米制局部坐标、已打包 PBR 图像，可继续编辑。`scripts/rebuild_scene_assets.py` 可重新生成；`models.json` 含 PC / 手机 LOD、量化位置和 UV、法线与离线局部 AO。全部索引为 16 位，无 WebGL2 必需能力。资产库单件三角形总和约 126,724 / 76,205，实际场景含三把餐椅及其他原有模型，不能把库总和当作整场景绘制数。

PBR 来源为 Poly Haven 四组 CC0 材质，源 URL、许可和 SHA256 见 `assets/rebuild/materials/sources.json`。运行时五套逻辑材质包含木材、条纹 / 素色织物、人字拼地板、石材；颜色 / OpenGL 法线 / 粗糙度分别处理。共 13 张去重后的驻留图，PC 1024px、手机 512px；底色可编辑。原始材质和导出衍生文件均保留，运行时不发外部请求。

与被撤销的 V15 不同，本轮保留原建筑烘焙、原画布分辨率、原光照方程与画质控制；没有重新启用运行时路径追踪。自包含 HTML 约 10.24 MB，体积比 V14.2 明显增加，需要实际网络与手机加载预算验收。

## 验证与证据

- `validation/rebuild-assets.json`：两套 LOD 的索引 / 属性 / 有限值检查、16 模型 / 13 PBR 图加载、四时段、建筑快照、门闭合 / 扫掠 / 家具净空；PC 和手机视口约 6 秒实际帧计数。
- `validation/rebuild-decor.json`：柜背 / 床头贴墙、床三侧净距、家具与所有门型、屋顶、9 个安全观景点、保存 / 导入 / 导出 / 旧设置迁移、四种手机横竖屏通过。重建曾发现沙发和北侧橱柜轻微入墙，已修正后全项通过。
- `validation/rebuild-render-quality.json`：PC 四时段、画质保存、反射更新、微信 UA 与 HDR / depth 扩展缺失回退通过。
- `validation/rebuild-mobile-compatibility.json`：Chromium 桌面 / Android Chrome / 微信 UA、Windows WebKit Safari / iPhone 微信 UA、横竖屏、检测入口和 localStorage 保护通过。
- `validation/rebuild-report-layout.json`：PC / 手机报告、12 对场景图与 4 张独立模型检查图加载、对比滑块和无横向溢出。
- 发布装配八项测试通过，feature 设置与 main / release 隔离。

PC / 手机视口实际网页均在 Windows + Chrome / RTX 5080 上采集；手机数据不代表物理手机性能。约 60 / 30 FPS 上限下，原版与重建的短时帧率接近，不宣称提速。报告提供同机位客厅昼夜、主卧、毛坯、餐厅、厨房各两种视口的 24 张实际网页画面。

独立沙发、餐椅、床和橱柜的四张棚拍由同一 Blender 主文件经离线 Cycles 渲染，用于表面与构造检查，和网页截图分区标明；不能冒充网页效果。原始截图 / 中间文件在 `work/rebuild/`，网页报告使用 WebP 编码，无重绘或后期补光。

## 工业级目标状态

当前完成的是主要资产重建与工程流程，**不把“工业级整体效果”标为已完成**。仍需逐房间参考图目视验收、全屋昼夜照明进一步标定，以及实际 iPhone / Android 微信的清晰度、加载、发热和连续 10 分钟性能。房门、窗框、储物架、洗烘和部分小物保留已有模型；全屋光照仍是原 219 张烘焙，尚未接入全屋 Cycles GI。

T01 保持进行中。该状态是对最终质量标准的明确记录，不以模型数量、自动测试或离线棚拍代替最终验收。

## 入口

- [重建测试页](https://aimspike.github.io/HangZhouPHMT/preview/render-quality/?decor=a)
- [PC 报告](https://aimspike.github.io/HangZhouPHMT/preview/render-quality/quality-report/#pc)
- [手机视口报告](https://aimspike.github.io/HangZhouPHMT/preview/render-quality/quality-report/#mobile)
- [实际设备显示检测](https://aimspike.github.io/HangZhouPHMT/preview/render-quality/?verify=mobile)
