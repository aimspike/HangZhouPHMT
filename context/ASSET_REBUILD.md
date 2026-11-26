# 家装 A 材质与模型重建

## 主干目视修正：门框、电器与窗帘（2026-11-25）

针对用户反馈，修正入户门套在厨房横墙处的装配；冰箱采用米白非金属哑光面板、简洁内凹拉手，移除外置饮水口；补回重建地柜替换时遗漏的独立吊柜，并按原 A 厨房图改为柜下薄型嵌入油烟机，附双滤网与工作灯。冰箱的可编辑 Blender 主文件和双 LOD 重新生成，其余15类 Blender 模型的数据逐项保持。

客厅/两卧室的窄薄片帘改为连续闭合厚壳褶皱、布帘加纱帘及顶部收口；细织物材质与几何褶皱分开，PC/手机使用不同网格预算。建筑墙线、门洞及219张烘焙保持。效果对比补充至 [四项修正报告](https://aimspike.github.io/HangZhouPHMT/preview/main/quality-report/room-refinements.html)，包含 PC/手机、正午/夜晚的24对实际画布图；原重建/接缝报告保留为历史比较。

本轮模型导出438个双LOD实体部件检查：开放边、非流形边、绕序、退化三角形、法线错误均0；专项检查帘壳闭合与离地、门框与门扇25步无墙相交、原门洞闭合和所有门型家具净空。材质反射限值是渲染配置，不能当作具体小米商品型号的测量参数。手机验证仍为模拟，整体工业级验收状态不变。

日期：2026-11-25。分支：`feature/render-quality`。用户已否决 V15 的视觉效果并要求回退，随后确认沿用原家装 A 参考图，重建目标为工业级水平。


## V16.2 合入主干（当前）

按用户要求，将 `feature/render-quality` 的 `7bdea26` 合入 `main` 的 `a2a50d6`，后续在 `C:/PHMT` 主干开发。四处冲突为主模板诊断入口、生成 HTML 和两份上下文文档；保留两边功能与历史，HTML 从源码重新构建。

保留主干阳台顶板、顶灯、屋顶 UV 范围、天花板设置和整套烘焙；与合并前 main 的 bake-source / baked-lighting / baker / 墙线逐字节规范化校验一致。同时模型、PBR数据与 Blender 主文件和 feature 完全一致。见 `validation/merge-source-integrity.json`。没有重新改建筑或重新烘焙，生成页面约10.46MB。

本地验证：220部件双LOD无开放边/退化/法线错误；16模型/13PBR/219烘焙加载、含阳台屋顶覆盖、门闭合/扫掠/家具净空、床三侧通行、设置恢复、默认夜晚及7扇平开门、Chromium/WebKit/微信UA、横竖屏、HDR/depth缺失回退通过。阳台顶灯开关/调光、天花板设置与保存另行回归。

效果报告迁移至 [main PC报告](https://aimspike.github.io/HangZhouPHMT/preview/main/quality-report/#pc) / [手机报告](https://aimspike.github.io/HangZhouPHMT/preview/main/quality-report/#mobile)。默认提供本机重新采集的12组 V16.1 feature → main 同机位对比，保留原 V14.2 基线、10组接缝近检与4张明确标注的离线模型图，新增阳台合并截图。相机/FOV/画布匹配；像素平均绝对差为0.0005–1.66/255，主要来自新阳台遮阳与反射，不能当作视觉评分。所选客厅/厨房/主卧/阳台实际画面目视检查通过。

本机 RTX5080/Chrome 6场景短时采样为PC约59.6–60.3FPS、手机模拟约29.8–30.0FPS；不是物理手机性能。工业级整体和真机微信仍待最终验收。feature 作为历史快照保留，release独立发布。

合并提交 `50dc9b1` 已部署并完成公网PC/手机Chrome/WebKit、阳台专项与报告检查，记录 `validation/rebuild-public.json` / `merge-balcony-public-validation.json`。效果报告已更新至main，正式release及历史feature入口分别保持其原内容。当前公网main HTML SHA256 `ed37ce230e7b2a95d5fdfe0c8c2b64730ea81262486e20c58b304f44f926e661`。后续证据提交不更改应用。

## V16.1 接缝与装配修复（历史）

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

### V16.1 公网交付

修复提交 `8d3f565` 已推送，[Pages 工作流 45552682482](https://github.com/aimspike/HangZhouPHMT/actions/runs/45552682482) 成功。feature 的实际发布 HTML SHA256 为 `bc53f107648eb4080752f3d937b5d7659c1b8dfba828cce7e5b7a6c76d89d6b9`，与 Git 的部署装配结果一致；PC Chrome、Android 微信 UA、Windows WebKit iPhone 微信 UA、四项本机检测、设置隔离和磁盘单 HTML 检查通过。10 对接缝近检、12 对房间画面、4 张离线棚拍的公网加载和滑块检查通过。

公网记录为 `validation/rebuild-public.json` 和报告的 `public-validation.json`。main 在另一任务中已推进至 `a2a50d6`（阳台与灯光），release 为 `7b53b23`；三个入口分别匹配其 Git 内容。本任务只推送 feature，未合入 main / release。后续证据提交不更改已验证应用 HTML；真机微信与最终工业级目视验收仍待完成。

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

## 陶瓷曲面与稳定照明修正（2026-11-26）

用户指出闭合检查通过后陶瓷仍有三角折痕和放射纹。本轮对阳台一体台盆规则细分盆沿/四角/盆底，手工控制平面及过渡法线；浴室盆体增加轮廓环和径向采样，两件手机档保留曲面。陶瓷使用独立porcelain材质、roughness .24/metalness 0，去除布料/石材凹凸来源；马桶改用该材质并增加球面细分。

诊断发现剩余放射纹来自低能光照的8位量化，增加面数并不能解决。新Cycles建筑/家具照明以16位高低字节保存并在网页解码后插值，建筑图集也保持16位组合；天光、灯光独立UV区域HDR降噪，陶瓷照明按位置/法线有限双边平滑。默认曝光、灯强度不变，家具位置、建筑快照与219张旧图保持；high/mobile各自重导出、重烘焙照明/AO/反射。

`quality-report/surface-fixes.html`包含20组/40张实际WebGL前后画布与3张并排近检；正午关灯覆盖客餐厅、主卧、卫生间与3件陶瓷，夜晚开灯检查3件陶瓷。`verify-ceramic-surfaces.cjs`验证实际导出材质/平面法线和手机曲面；`verify-surface-bake.py`量化典型平滑区域残差及16位精度。模型闭合与装配检查继续保留，但不以这些结果代替材质和高光目视验收。

## 入口

当前追加修复（2026-11-26）：`quality-report/exposure-overlap.html`记录过曝与共面穿插校正。衣柜顶底板、洗烘柜/台盆柜背板与板件、厨房柜板、餐椅连接座和书桌横撑改为按板厚或连接座收口；北侧厨房台面改为单一闭合开孔实体，右端缩短30mm后与东侧台面相接，原外露交叠消除。18类资产327个实体，high/mobile合计654份；闭合、连通及每档4284条水槽台面射线通过。合并后的网页保留实体范围，`export_surface_audit.cjs`可导出实际装配数据供法线射线检查；原26/27组重建家具近共面抽样候选降至0，不代表任意自交的数学证明。

独立诊断色的4处×3横移机位×PC/手机前后图用于检查深度争夺，不进入实际家装材质。实际灯光基准能量50%、室内曝光80%；144张正常/诊断源图和3张并排图均由WebGL画布采集。墙线、门洞与原建筑快照保持，新完整Cycles数据按新家具和门框重新导出/烘焙。真机微信与持续性能仍待实际验收，T01保持进行中。

- [重建测试页](https://aimspike.github.io/HangZhouPHMT/preview/main/?decor=a)
- [PC 报告](https://aimspike.github.io/HangZhouPHMT/preview/main/quality-report/#pc)
- [手机视口报告](https://aimspike.github.io/HangZhouPHMT/preview/main/quality-report/#mobile)
- [实际设备显示检测](https://aimspike.github.io/HangZhouPHMT/preview/main/?verify=mobile)

## 公网交付

重建提交 `328b8ac` 已推送，工作流 [45542958275](https://github.com/aimspike/HangZhouPHMT/actions/runs/45542958275) 成功。三入口的 HTML 和 deployment.json 均与对应 Git 内容一致；feature HTML SHA256 为 `a5664f4f1133a52a86512771b7babe544b99cf3d8c80bb260385ac599c65d947`。PC Chrome、手机微信 UA、Windows WebKit iPhone 微信 UA 的启动、16 模型 / 13 张 PBR 图、219 烘焙、四项本机检测和设置隔离通过。磁盘单 HTML 离线也通过。

`validation/rebuild-public.json` 与报告里的 `public-validation.json` 保存记录，人工目视字段保持未确认；没有真机通过结论。公网检查时 release 已由其他操作推进到 `7b53b23`，正式应用 HTML 仍为原 V14.2，哈希 `5057ce9c7ddd0471b0f06fa52efa4ca20582bbc755d804a1fe8c5f2b6a7311a9`；本任务未推送 main / release。后续追加提交只保存验证文档，不改变已验证应用。


## 家具装配、阳台洗漱角与轻微玻璃反射（2026-11-25）

修复茶几边条、餐桌支柱、餐椅座盘/横撑/扶手/曲背固定件、沙发横撑，以及电视柜、衣柜、餐边柜、厨柜、书桌、浴室柜与吊灯的连接。按实际导出包围盒落地及贴墙，配件随主件移动；茶几支承在地毯表面。电视柜北侧保留书房房外推拉门停车区，未强行贴墙。床头/柜背及其他可贴墙家具间距均小于1mm；床三侧和所有门型检查继续通过。

阳台洗烘改为独立 Blender 模型，按小米官方照片方向制作白色箱体、深色门圈/玻璃和简洁控制区；烘干机官方参考为银色，场景颜色统一为米白。旁侧新增连续闭合陶瓷台盆、地柜、龙头、镜面、上柜和工作灯饰条；两柜沿东墙接齐、正面朝西。参考与配色说明见 references/interior/laundry-corner.md。台盆与镜柜共用墙面支承，不移动建筑墙/门。

8块建筑窗玻璃在不可变烘焙快照捕获后分配独立材质，opacity .21、roughness .12、metalness 0、房间反射强度 .30；保留深度写入关闭与通透感。沿用分房间 PMREM、线性 HDR/降级和现有轻量档策略，无额外外部资源。建筑133 mesh/roof130、219烘焙、墙线、门洞、uv2及快照保持，无建筑重烘焙。

18类资产、330实体部件的high/mobile导出（合计660份）逐件闭合，开放边/非流形边/退化/绕序/反向法线均0。新增 verify-furniture-assembly.py 对实际导出两档做BVH交叠、实体包含与采样最近距离检查，18类各自一个装配连通组、未见脱离部件；0.7mm容差，有限采样不代表任意自交和施工验收。verify-compact-scene.cjs检查46项贴墙/支承记录、柜间接缝、阳台通行、玻璃参数与反射实际像素贡献，并采集PC/手机视口昼夜24对网页对比。

验证：compact-after.json、furniture-assembly.json、rebuild-topology.json、compact-decor.json、compact-render-quality.json、compact-mobile-compatibility.json。Chrome/WebGL1、Windows WebKit、手机横竖屏/微信UA、HDR/depth缺失回退、保存设置、219贴图、屋顶、7门闭合/扫掠及家具净空均通过；未代表物理手机微信。模型库18类、驻留PBR仍13张，家装条目40（包含配件分组）。HTML约11.54MB。实际效果与证据页为quality-report/compact.html。仅推送main，release保持独立正式发布。


## Cycles 固定状态光照、AO、反射烘焙（2026-11-25）

按用户要求实施离线外部工具烘焙。`scripts/export_static_bake_scene.cjs`从真实网页导出完整建筑、默认门与毛坯/high/mobile家装；`scripts/bake_static_cycles.py`用Blender5.3 / Cycles OptiX生成256采样、4次漫反射反弹的照明。4时段×灯开/关×bare/A共16状态，以天光、三向太阳、灯具线性分量因式化保存。建筑1024²图集、家具high/mobile独立顶点照明与AO，2布局各10个房间的5分量256×128反射图，共124张数据PNG。照明sqrt(linear/8)，AO线性；反射合成后转RGBE仅作为输入，再由现有PMREM生成线性目标，没有透明混合写入RGBE。

新增`src/static-lighting.js`，固定状态下替换旧漫反射，不重复叠加；全场景AO轻量用于环境高光/家具填充，静态生效时屏幕AO不再合成。天空、太阳、灯强度控件继续分别缩放，黑夜关灯只有弱夜空。旧219建筑烘焙、墙线/门洞、几何快照和uv2原样保留，作为固定状态之外的回退。没有恢复运行时路径追踪。

参考固定门状态：入户关闭、6房门平开且打开；按毛坯/A原定墙顶地底色烘焙。改变门状态/门型/透明、墙顶地材质或隐藏天花板时禁用固定数据，恢复旧照明/动态反射，个人设置不被覆盖。反射只对应房间固定点及基础材质，不精确覆盖任意视角、外部城市全细节和任意材质变化。首次解析/解码会暂用旧照明，缓存后状态切换约几十毫秒（本机模拟短时观测，非真机承诺）。Float32影像缓存限制48MiB；单HTML约23.93MB，加载体积显著增大，真机持续性能仍待验收。

124张PNG、每布局6个图集基、10×5反射图、134488 high/93926 mobile独立家具采样；实际附着high124mesh/709416顶点、mobile124mesh/466044顶点。`validation/verify-static-bake-data.cjs`核对影像及全部采样下标/脚本哈希；构建另校验烘焙脚本及墙线、原快照、家具源码/模型和太阳输入哈希，拒绝过期资源。`assets/static-bake/`保留导出、可编辑blend、原数据PNG和内嵌包。

`verify-static-lighting.cjs`覆盖Chrome桌面/手机/缺HDR-depth/WebKit的全部16状态、开关灯与昼夜像素变化、48张新实际画布、改门/材质/天花板回退、刷新保存与横竖屏。`static-lighting.json`、`static-bake-data.json`、`static-render-quality.json`、`static-decor.json`保存结果。48对/96张实际网页对比见quality-report/static-lighting.html，包含PC/手机、客厅/主卧/厨房/阳台6组代表状态；前后相同相机/曝光/材质，无AI重绘。仅main开发，release不推进。
