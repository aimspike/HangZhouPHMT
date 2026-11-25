# 家装 A 材质与模型重建

日期：2026-11-25。分支：`feature/render-quality`。用户已否决 V15 的视觉效果并要求回退，随后确认沿用原家装 A 参考图，重建目标为工业级水平。


## V16.1 接缝与装配修复（最新）

用户认可重建方向，继续要求核查漏边、漏缝。本轮只在 `feature/render-quality` 更新，使用 `C:/PHMT/work/render-seam-fix` 隔离工作区，保留主工作区另行进行的阳台 / 灯光修改。

- 管件：Blender 曲线端口补盖后焊接端圈，兼顾 PC 与手机减面；旧程序管件也补外向端盖，直线使用 LineCurve3，避免两点 CatmullRom 起点翻转；沙发连续管架完成闭环。软包缝线投影到实际曲面，38组双LOD贴合抽样最大距离约1.98mm（含线材半径）。
- 旋转件：半径为零的环改为单轴点三角扇，吊灯截面闭合，保留灯罩与盆体应有的内部空间。
- 被褥：替换独立薄面与圆角底盒，生成顶 / 底 / 四边共用轮廓的闭合厚壳；底面嵌入床垫约 5.9mm，修复原先悬浮与错边。
- 厨房：水槽改为带连续盆沿、内外壁和盆底的封闭容器，覆盖台面开孔；移除穿入盆底的实心柜体，改为板件。两组橱柜侧板与背板延伸至台面下，采用约 2.5mm 隐藏搭接，保留门板安装缝。
- 收口与材质：踢脚线贴地并贴墙；窗帘使用独立双面材质，保留 shader hooks，不再把同房间亚麻家具材质一起变成双面。
- 导出：同一模型全部材质共用位置量化网格，保留 UV / 法线分裂；在资源中记录逐部件索引范围，便于对实际下载后的三角形单独核查。

`validation/verify-rebuild-topology.cjs` 对 **220 个实体部件 × 两档 LOD** 验证：开放边、非流形边、退化三角形、绕序和法线错误全部 0；逐件有正有向体积。只在完全相同的量化坐标处合并 UV / 法线重复点，不靠大容差焊接掩盖裂口。相邻独立板件不作为同一个实体误判。三种程序管件方向的端盖回归也通过。

水槽每档 4,386 条竖直覆盖射线，缺口由 592 降至 0，盆腔中心首先命中约 0.795m 的金属盆底，原版命中约 0.810m 的木柜体。额外验证柜侧 / 台面、被褥 / 床垫接触距离。最终本机 RTX 5080 / Chrome 六场景观测为 PC 约59.8–60.4 FPS、手机视口约29.9–30.0 FPS，受帧率上限约束，不作真机性能推断。此检查覆盖明确的网格和装配缺陷，不等同于所有家具自交或工业级最终验收。

资产库三角形：PC 126,724 → **128,064**（+1.06%），手机 76,205 → **76,672**（+0.61%）；库预算不等于整场景绘制数。单 HTML 约 **10.35MB**，PBR 驻留图仍为 13，建筑 219 张烘焙与几何快照保持。没有新增运行时后处理或光追。

效果报告新增 PC / 手机各 5 对 WebGL1 资产近检（软包、水槽、被褥、吊灯、管件），采用相同相机 / 灯光 / 正面剔除，左 V16、右 V16.1；与实际房间截图、离线 Cycles 棚拍分区标明。实际房间 12 对与 4 张离线棚拍也使用最新资产重新采集。Chromium / Windows WebKit / 微信 UA、HDR / depth 缺失回退、昼夜与设置、门和通行继续回归。物理手机和真实微信仍待人工验证。

可复现步骤：构建 Blender 资产 → `node validation/verify-rebuild-topology.cjs` → 构建 HTML → 浏览器回归与截图 → 生成报告。浏览器脚本支持 `HOUSE_URL` 选择隔离端口；测试输出可定向到 `work/`，避免覆盖历史截图。

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

## 公网交付

重建提交 `328b8ac` 已推送，工作流 [45542958275](https://github.com/aimspike/HangZhouPHMT/actions/runs/45542958275) 成功。三入口的 HTML 和 deployment.json 均与对应 Git 内容一致；feature HTML SHA256 为 `a5664f4f1133a52a86512771b7babe544b99cf3d8c80bb260385ac599c65d947`。PC Chrome、手机微信 UA、Windows WebKit iPhone 微信 UA 的启动、16 模型 / 13 张 PBR 图、219 烘焙、四项本机检测和设置隔离通过。磁盘单 HTML 离线也通过。

`validation/rebuild-public.json` 与报告里的 `public-validation.json` 保存记录，人工目视字段保持未确认；没有真机通过结论。公网检查时 release 已由其他操作推进到 `7b53b23`，正式应用 HTML 仍为原 V14.2，哈希 `5057ce9c7ddd0471b0f06fa52efa4ca20582bbc755d804a1fe8c5f2b6a7311a9`；本任务未推送 main / release。后续追加提交只保存验证文档，不改变已验证应用。
