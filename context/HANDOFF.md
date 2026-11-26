# Codex 续接上下文

## VIS-05主次卧枕头缝边黑斑修复（2026-11-26）

本轮同步干净main到`d1c85ee`后，用户明确要求修复家装A正午关灯、手机均衡最明显的枕头前沿/角部黑点和锯齿暗线。实际逐项隔离：关闭床品法线纹理仍有黑斑；仅隐藏pillow flange独立几何后，枕面仍留已烘焙的暗影；临时均匀顶点照明去除黑影，但旧细管轮廓仍不连续。旧`seam`把细管中心投到布面再仅外偏半径20%，包含埋入布面的采样；手机又对这层单独减面，稳定暗样本/接头在前沿和角部形成黑点。不是静态照明尚未加载或瞬态反射。

`scripts/rebuild_scene_assets.py`新增`sewn_pillow`，每个枕头一层连续闭合布面，17个高度截面、15个64点周向环及上下单极点，单枕1920三角形；侧面细缝边由连续环表达，不叠加相交管件。设置preserve_surface使手机不再减塌细缝边。两间床的枕头/缝边共减少4个独立实体；保留其他18类模型数据逐项相同，床头/床框/床垫/被褥和所有家具位置不改。桌面每床18188→13228三角形，手机9132→8752。`reference-a-master.blend`和双LOD导出更新。

先用本地导出专用预览仅替换原HTML的模型数据，未改构建器的过期检查；通过`export_static_bake_scene.cjs`重导实际组装场景，再完整执行`bake_static_cycles.py`（约243秒），生成124张固定照明/AO/反射、high149842/mobile112847家具样本。构建器校验新模型/场景/烘焙哈希通过，单HTML41,599,752字节，规范化SHA256 `c4872f39981452d8c39d9cb354658b7768a34b71f6a8dbbdb424a0758eded0bc`。原建筑快照、墙线、门、太阳方向/时刻、219图、曝光及灯具能量保持；无运行时截图修补、抬黑或恢复路径追踪。

`verify-pillow-geometry.cjs`检验8份枕头壳体（4枕×2档）的环/三角形分层、同档轮廓<0.1mm、无独立flange、预算降低和18类资产不变；`verify-rebuild-topology.cjs`850实体312414三角形闭合/绕序/退化/法线均0异常。`verify-static-bake-data.cjs`124图/16位精度/顶点引用与场景快照通过。`capture-pillow-fix.cjs`记录PC、390手机均衡和Windows WebKit，正午关灯/夜晚开灯×两卧室×原房间/近景×间隔2秒重复，共48组前后96张真实WebGL；近景沿用基线同一机位/方向/FOV，曝光分别.92/.86。报告生成器`compose_pillow_fix_report.py`会核对所有相机和灯参数一致，不后期调亮。

`measure-pillow-surface.cjs`用独立深度遮罩选择实际PBR画布可见枕面，并内缩2像素；遮罩不用于产品画面。极暗像素阈值为当前枕面中位亮度35%，不是精确缺陷计数，含真实接触阴影。手机/Windows WebKit主卧1.116%→0.019%，次卧1.005%→0；PC主卧0.064%→0.084%（剩余接触边，不能以该全表面指标宣称每像素下降），PC次卧0.345%→0。结合近景与重复帧检查确认原成串黑点/锯齿暗线消除；不宣称所有织物或任意视角无瑕疵。报告`quality-report/pillow-fix.html`，99资源，验证/原始图都保留。历史审计3不覆盖；VIS-04仍独立待修，真机微信待验收，保存/账号同步继续暂停。

本地`pillow-static-lighting.json`64种固定状态、`pillow-decor.json`门/家具净空/安全观景点/四移动视口、`pillow-render-quality.json`画质与HDR/depth缺失回退、`pillow-storage.json`既有设置只读恢复与无写入/云请求、`surface-offline.json`单HTML离线、Pages8项装配全部通过。`pillow-report.json`验证99资源逐字节hash，1280/390宽各48组图片切换/链接与无横向溢出。正式release保持，仅main开发测试。

功能提交`4b9896c`已部署main；公开HTML规范化SHA256 `6c173020dc023f3d9f151185e03c909ebac77961e8a918225e5b55cce210680c`与Pages装配后本地一致。公开PC/手机均衡/Windows WebKit的48张昼夜/原机位/近景/2秒重复帧通过，独立枕面像素测量逐项与本地一致；99报告资源逐字节、1280/390宽各48组切换和链接通过。证据`pillow-fix-public.json`、`pillow-surface-public.json`、`pillow-report-public.json`与`pillow-deployment.json`，实际公开截图在`work/pillow-fix/public`。本轮未推release；公开校验时release已由其他操作推进至`329dd49`（其HTML hash为此前灯控版`3e0c591f…`），本轮保留该版本，枕头修复仅在main。后续证据提交不改变已验应用/模型/烘焙/截图。

## 第三轮效果审计：仍暂不发布（2026-11-26）

按用户要求再次审计，先同步干净main到`a2cca0e`。完整渲染检查绑定该不可变HTML快照（规范化SHA256 `26dd729cad15724c0f9a1a546898e7e6d4213144fcbd4e54470abb31c1397f41`）；审计期间另一任务提交灯控`84a30f4`，另对其做桌面/手机×5房间×昼夜20对同机位/方向/FOV/灯状态补查，平均RGB绝对差异最大0.0138/255。1440/390/320/740横屏四视口新灯控无重叠或横向溢出。混入不同开发中版本的初次后半段证据留在`work/main-audit3-mixed-20261126/`，不用于报告验收。

VIS-01原过亮在审计机位复核通过：手机卫生间夜晚接近白色49.18%→0%，厨房正午开灯三通道≥250比例10.69%→0%；墙砖/台盆/柜体层次恢复。当前灯具能量基准50%、四时段曝光1/.92/1.04/.86实际生效；卫浴模型亦变化，像素比例不是照度或单参数实验。VIS-02墙顶斑驳与VIS-03陶瓷折面继续通过。仍有两项P2：VIS-04改变书房门使主卧整体退出固定照明并改变明暗；VIS-05主次卧枕头前沿/角部黑点和锯齿暗线，正午关灯时在Chrome/Windows WebKit原页面稳定重复，84a30f4亦可见。本轮未确认新的独立缺陷，未重新证明黑斑根因。

完整快照74张房间/细节图、四环境64照明状态通过；Chrome真实鼠标拖动松开16组753帧无静态/反射/曝光/机位跳变。858实体323094三角形拓扑通过；219贴图、建筑快照、屋顶0缺口、门闭合/扫掠/家具净空与无页面/Shader错误及外部依赖请求通过。手机/微信UA/WebKit均为模拟，非真机验收；保存/账号同步继续暂停。

报告`VISUAL_AUDIT3_2026-11-26.md`；独立图文证据`docs/quality-report/audit3-20261126/`（main公开同名路径）含31张本轮关键图、5张历史对比和39资源清单，1440/390/320布局与图片通过。原始中间文件`work/main-audit3-20261126/`仅本地。保留历史报告；本轮只提交审计报告，不修改应用，不重拍宣传素材，不推进release。

## 主界面灯开关与时段默认灯状态（2026-11-26）

用户要求开灯功能独立放到主界面，切换白天默认关灯、切换夜晚强制开灯。`showLights`原生checkbox由设置移至室内主画面右侧，带“室内灯”和“已开/已关”，不复制控件；桌面右上独立区域、手机与家装按钮同高，横屏避开时间栏。三维/平面不显示室内灯控件，进入室内无需打开设置；设置只保留灯光亮度。

`setDaylight(id,{resetLights=true})`在选择任何时段时设灯状态为`id==='night'`，包括再次点击当前时段；不是每帧强制，之后可以手动开关。切换房间/模式不调用该重置，保持手动选择。恢复旧设置时只有明确boolean `controls.showLights`会跳过时段重置，以只读保留用户既有状态；没有该字段的旧记录使用对应时段新默认。保存功能继续暂停，不新增写入或云请求。

主控件已在sidebar外，`render-quality.js`/`static-lighting.js`的input/change监听显式包含`#showLights`，保证反射和静态照明同步重算。settings-storage启用分支同步识别，暂停分支仍早返回。保留`button[data-time]`精准匹配，未恢复canvas松手误触发。手机诊断固定样片先选时段再显式开灯，避免新默认改变诊断样片；static-lighting/exposure/render-quality检查的设置顺序和主控件位置同步更新。

无几何、材质、灯具能量、四时段曝光、太阳方向/时刻或烘焙修改，无需重烘焙。`verify-main-light-control.cjs`覆盖桌面1280、微信触屏模拟390/320、740×360横屏、Windows WebKit和缺HDR/depth扩展；通过真实时间按钮/checkbox点击和键盘验证时段默认、手动覆盖、再次选择时段重置、跨房间/模式保持、控件无遮挡/无溢出/40px以上触点。另验证旧清晨开灯/夜晚关灯记录只读恢复、之后选择夜晚强制开灯。219图/屋顶/建筑快照与保存暂停保持；64种静态照明（4环境×16组合）回归通过。证据`main-light-control.json`和`main-light-static.json`，截图在`work/main-light-control/captures`，手机仅模拟。

最终构建42,107,618字节，规范化HTML SHA256 `3e0c591f57b606c3a6b1fdf3f1a02bcc51bc4ca4181fe16c9b6c67a3ac114421`。`main-light-render-quality.json`的桌面/手机/缺扩展画质切换通过；`main-light-mouse.json`的16组实际鼠标松手检查通过；`main-light-exposure.json`四曝光/显式灯强与旧照明回退通过；`main-light-storage.json`旧游客/账号只读恢复、无新增写入/云请求、手机横竖屏及截图通过；`surface-offline.json`带家具单HTML离线通过，Pages8项装配通过。只推main，正式release保持。

功能提交`84a30f4`已部署main；公开HTML SHA256 `9a15da7d5b1f4c090d5a1dacf928f9543af99fec34d6a6f465a48f60449e938e`与Pages装配后的本地内容一致。公开桌面、390/320宽手机模拟、740×360横屏、WebKit、缺HDR/depth扩展的主开关/键盘/时段默认/手动覆盖/跨房间与模式/旧记录恢复检查全部通过，219图/建筑快照/屋顶保持，无脚本或Shader错误、外部资源请求。记录`main-light-control-public.json`与`main-light-deployment.json`，公开截图在`work/main-light-control/public`；手机为模拟。release仍`7b53b23`、正式HTML hash `5057ce9c…`；后续证据提交不改应用和截图。

## 电脑鼠标松开瞬间闪光（2026-11-26）

用户进一步定位到电脑拖动转动视角、鼠标松开一瞬间闪光。同步干净main到`c57fff0`后，用Playwright真实鼠标按下/移动/按住/松开复现：pointerup之后的普通canvas click使静态照明disabled、合成updates增加、反射revision变化，出现短暂旧照明回退后恢复；正午/夜晚、开/关灯均可见。此前直接改相机参数的转向检查没有产生浏览器click，未覆盖此问题。

根因为`body.dataset.time`用于场景状态与CSS，而`render-quality.js`和`static-lighting.js`的全局click事件用`closest('[data-time],…')`匹配祖先，任意普通点击都能匹配body。现在限定为`button[data-time]`；`settings-storage.js`启用分支同类事件也同步限定，暂停分支仍enabled:false、只读恢复、不写入/不联网。没有屏蔽canvas click、阻止正常事件传播或改变鼠标转向逻辑。

四时段曝光1.00/.92/1.04/.86、自然光增益、灯具能量、太阳方向/时刻、建筑/模型与所有烘焙保持。无需重烘焙，只重建单HTML（42,106,041字节，规范化SHA256 `26dd729cad15724c0f9a1a546898e7e6d4213144fcbd4e54470abb31c1397f41`）。

`validation/verify-mouse-release.cjs`用真实鼠标拖动和松开，记录每个最终WebGL帧，按住停止后再松手，逐项检查static/updates/reflection revision/captures/exposure/camera。旧版4种客厅状态均复现，夜晚开灯最大均值跳变56.6094（0–255，非照度）；修复后Chrome桌面精细/轻量、缺HDR/depth扩展、Windows WebKit桌面、触屏微信UA共80组（四时段×开关灯×毛坯/A）3342帧通过。触屏原生touchend会阻止合成click，按pointerup验收；触屏与桌面分批验证，合并时检查每项断言、引擎和源码hash相同。测试只在采集页抑制一次性赞赏弹窗，应用弹窗未改动。

真正的时段按钮、灯开关、门状态回退/恢复均通过；`verify-storage-suspended.cjs`验证PC、390宽手机与WebKit、旧设置只读恢复、无写入/云请求；单HTML离线与8项Pages装配通过。80组每环境219贴图/屋顶/保存暂停保持。证据`mouse-release-before.json`、`mouse-release-after.json`、`mouse-release-storage.json`及`surface-offline.json`；报告`quality-report/mouse-release.html`含同机位/曝光的真实小画布，仅放大排版，不做亮度修补。报告34资源hash和1280/390宽4种状态切换通过。正式release不推进，真机验收仍待完成。

功能提交`10e1b1d`已部署main，公开HTML SHA256 `5164fa35ed648c32b5c0163eb87c888fdc40f074f3c532e1c324fbb4f0de52cf`与Pages装配后的本地内容一致。公开Chrome16组四时段/灯/装修、758帧实际鼠标事件全部通过，无静态回退、缓存版本/合成次数/曝光/机位变化；公开PC、390宽手机旧游客/旧账号与WebKit保存暂停/启动/屋顶/设置隔离通过。公开报告34资源hash、1280/390宽各4组切换通过，见`mouse-release-public.json`、`mouse-release-storage-public.json`、`mouse-release-report-public.json`、`mouse-release-deployment.json`。release仍`7b53b23`、正式HTML hash `5057ce9c…`；后续证据提交不改应用和已验图片。

## 白天天光、四时段固定曝光与关灯瞬态（2026-11-26）

用户要求提高白天特别正午的日光和天光，修复关灯后移动视角短暂高亮，并为各时段按画面分别校准固定曝光；漫游镜头高度扩为1.0–1.8米。用户已撤回太阳位置问题，明确现有早中晚位置正确，不修改太阳方向、时刻、光斑位置或烘焙。保存/账号同步仍暂停（T06）。

`house.template.html`新增仅室内应用的线性分量校准：清晨sun1.18/sky1.30、正午1.35/1.65、黄昏1.10/1.20、夜晚1/1。原日光170%、天光140%滑块与既有只读恢复保留，控件独立作用于对应实时和烘焙分量；Cycles漫反射/反射及原219图回退共享有效增益。灯具基准仍50%，室内曝光改为清晨1.00、正午0.92、黄昏1.04、夜晚0.86，替代此前统一80%的规则；同一时段不随开关灯/房间/视角变化，总览和平面原曝光保持。只读诊断`naturalLightCalibration`及`lightingCalibration.exposurePresets`。

实际逐帧复现高亮原因为：新静态照明生效到新房间反射安装之间，旧状态反射曾被`prepare()`重新启用。`render-quality.js`现在invalidate立即将反射强度归零，注册材质先置零，仅启用与当前revision一致的缓存。保留同状态房间缓存，未恢复路径追踪。修改不涉及几何/材质/烘焙资产，无需重烘焙。

`eyeHeight`范围由1.1–1.8扩为1.0–1.8米，标签明确范围，默认1.5米、步进5厘米；原即时升降、换房间和模式返回仍沿用本次高度。原设置只读恢复继续按新范围限制，新调整仍不保存。

`capture-daylight-strength.cjs`采集本轮修改前40张、增强光源且原曝光40张、最终64张桌面/手机真实画布；同机位/FOV/滑块，不做后期调亮。`capture-exposure-presets.cjs`在7房间×4时段×开关灯比较3档曝光，形成168项记录；报告曝光专项提供其中24张原曝光图和最终图。正午最终关灯PC客厅画布均值94.1→113.2、餐厅58.4→74.5，单位为0–255画面亮度，非照度；所有正午关灯房间三通道≥250像素采样为0，不能据此宣称任何视角均无高光。

`verify-lighting-transitions.cjs`检查桌面、手机模拟、缺HDR/depth扩展、Windows WebKit，夜晚/正午各144帧，共1152帧；关灯、转向、跨客餐厅边界和返回期间无旧revision反射，曝光保持。`verify-daylight-controls.cjs`验证四时段增益、两滑块独立响应、回退使用相同增益、太阳与建筑/烘焙文件hash保持、可见镜头高度键盘端点及跨房间/模式保持。`verify-exposure-calibration.cjs`按四固定值更新；报告生成器为`scripts/compose_daylight_strength_report.py`，入口`docs/quality-report/daylight-strength.html`。

模型和219图保留；后续继续处理既有VIS-05枕边黑斑与真机目视验收，不能将自动化通过等同全场视觉无瑕疵。仅main开发测试，不推进release。

最终构建42,105,946字节，规范化HTML SHA256 `d4a81450946f8a3bee7aa8649a673ce9ea4c202c68f749f56f1181817261cb86`，与最终截图及验证一致。64种固定照明状态、四档画质/HDR/depth回退、旧设置只读恢复和无云请求、单HTML离线、8项Pages装配通过。报告184个资源hash及1280/390宽两套界面，各80种主对比和24种曝光对比通过，无横向溢出。证据`daylight-static-lighting.json`、`daylight-render-quality.json`、`daylight-storage-suspended.json`、`daylight-report.json`与`surface-offline.json`。

功能提交`5f3c374`及报告换行hash修正`87c823b`已部署main；公开HTML规范化SHA256 `17e328adf3044d722fb5a2233a5e4a36febb1e4e2abaca49f2679d2e466fd59b`与Pages标题/设置键转换后的本地内容一致。公开PC/手机独立光源控制、四时段开关灯固定曝光、1.0/1.8米键盘端点和换房间/模式高度保持通过，公网1152帧关灯/转向/跨房间检查也全部通过。报告184个资源逐字节匹配，1280/390宽各80个主对比与24个曝光对比及链接通过。证据`daylight-controls-public.json`、`lighting-transitions-public.json`、`daylight-report-public.json`、`daylight-deployment.json`。正式release仍`7b53b23`、HTML hash `5057ce9c…`，历史feature保留；后续证据提交不改已验应用与画面。

## 修复后独立复审（2026-11-26，第二轮）

用户表示除VIS-04外均已修复，要求再次审计。本轮同步后检查 `1ac446d`：VIS-02墙顶云团暗块、VIS-03陶瓷三角折痕/放射纹在原机位复核通过；VIS-01默认100%灯强的过亮仍可复现，记录显示此前只提供降低灯强/曝光对比，尚未选择/修改默认。手机卫生间夜晚接近白像素49.2%（原49.6%），厨房正午三通道≥250像素10.7%（原10.8%），统计仅为同图像区域比较，不是照度。VIS-04保留为已知未修复。

新增VIS-05：主次卧枕头前沿/角部局部黑斑与锯齿暗线，在正午关灯、静态与房间反射均完成后稳定复现；Chrome/Windows WebKit及间隔2秒重复帧确认，不声称是本次修复引入，根因待排查。74张新房间/细节截图与64种照明状态、219图、建筑快照、屋顶0缺口、门闭合/扫掠/家具净空及660实体拓扑复核通过，无脚本/Shader错误。手机均为模拟。

报告 `VISUAL_REAUDIT_2026-11-26.md`；图文证据 `/preview/main/quality-report/reaudit-20261126/`，临时原始采集 `work/main-reaudit-20261126/`。保留上轮报告作为历史证据。本轮仅提交审计记录和证据，不修改应用、参数、模型、烘焙和宣传素材，不推进release。

## main 显示效果检查，暂不发布（2026-11-26）

用户要求先检查 main 的显示错误与瑕疵，检查通过才重拍宣传素材并正式发布；随后指出室内过亮，并明确“问题先记录不急着修改，有问题也先不发布”。本轮仅记录，应用源码、模型、烘焙、默认参数和宣传素材均未修复或替换，release 不推进。

被检查提交 `10fd147`。重新采集桌面/手机74张房间与细节图、64种照明状态及WebKit验证。记录4项：VIS-01 默认开灯过亮、VIS-02 白天关灯墙顶斑驳、VIS-03 陶瓷盆体/马桶圈折面阴影、VIS-04 门状态改变使其他房间全局光照回退产生观感跳变。明暗统计用于同机位比较，不是照度测量；推测根因尚未确证。功能、219图、几何快照、屋顶0缺口、门闭合/扫掠/家具净空和660份实体拓扑检查通过，不等于视觉通过。

问题与复现见 `VISUAL_AUDIT_2026-11-26.md`，在线证据入口 `/preview/main/quality-report/audit-20261126/`，临时原始采集 `work/main-audit-20261126/`。手机/微信UA及Windows WebKit均为模拟，未进行真机验收。后续仅在用户另行要求时实施修复，不能因检查脚本通过自动推进正式发布。

## 仓库首页改为用户看房引导（2026-11-25）

用户要求首页从访客视角引导操作，保留大部分功能链接，去掉刻板项目/功能介绍及制作细节。`.github/README.md`改为“先在手机里，逛一遍自己的家”，首屏直达正式看房与家装A；按三维→平面→室内给出简短操作，再引导阳台昼夜、毛坯/A、材质/门/楼层与相机保存。保留视频/字幕、六宫格、平面SVG/PDF、房间截图、装修灵感、小区资料、检测和新版预览等入口，保留靠前的自愿赞赏支持。

删除首页功能表格、“关于这个项目”与录制/配音/验证等制作过程文字；维护内容保留在根README和资料文档，不变更图片或视频。预览入口保留明确标签与设置隔离说明，正式看房仍指向release根网址。仅文档变更，不构建应用、不改模型/烘焙、不推进release。

检查保留原有17类链接目的地、14处本地相对路径有效；GitHub GFM渲染在1280×900、390×844及320×740三视口无横向溢出，三张图片全部加载。独立浏览器上下文在正式看房页按文案核对三维放大/重置、平面/室内、阳台/四时段/关灯、装修切换、设置分组和相机预览，均与指引一致。证据`validation/repository-home-guide.json`；本地预览与截图在`work/home-guide/`。模拟操作不作为物理手机验证。

实际远程默认分支经`git ls-remote --symref origin HEAD`及GitHub API核对为`release`，所以仓库根首页仍显示release中的旧首页；main文案提交为`fff0376`。用户明确选择“先保留在main，等正式发布时同步”，本轮不得为更新根首页单独推送release或更改默认分支。查看新文案使用`https://github.com/aimspike/HangZhouPHMT/tree/main`；根README同步注明此区别。

main分支实际GitHub页面的桌面/390移动视口已确认新开头、三步指引、无功能表格及制作细节，3图正常、正文无横向溢出，公开Markdown与本地一致，测试部署SHA为`fff0376`，release仍`7b53b23`。记录`validation/repository-home-guide-public.json`，实际页面截图在`work/home-guide/github-guide-*.png`。

## 入户门框、冰箱、油烟机与窗帘复核（2026-11-25）

主干修正四项用户目视反馈。入户门原始门洞从 z=2.90m 开始，但厨房横墙延续至约 2.98m，门框合页侧被吞入墙中；现在从实际墙体求露明边并留 2mm 装配余量，门套与门扇按可用开口装配，偏置合页避免开门擦墙。原始墙线和门洞未改，`doorClosure()` 仍扫描完整原始开口，入户门将横墙实心返回作为合法封闭面；不是跳过被遮住的采样区。

冰箱 Blender 主文件及双 LOD 改为专用 `applianceIvory` 米白非金属面板，粗糙度 .78、房间反射系数 .16，简化面板并移除夸张饮水口。`shadeDecorMaterial()` 保留材质已指定的反射强度；其他家具继续原值。厨房地柜被 Blender 替换后原 fallback 中的吊柜未执行，本轮新增独立吊柜/防溅板与柜下嵌入式油烟机（滤网、控制条、工作灯），对齐原灶台。

客厅和两卧室采用闭合厚壳波浪褶布帘与轻透纱帘，顶盒/轨道补齐，下摆离地约25–31mm；单独细织物材质保留 shader hooks，避免复用大块烘焙褶皱纹理。PC/手机分别使用64×18及32×10格，双面材质诊断增加三组独立纱帘。`src/bake-source.json`、`baked-lighting.json`、`plan-layout.json` 均保持原值；不重算建筑烘焙。

专项脚本为 `validation/verify-room-refinements.cjs`，检查实际门框/门扇25步与墙的相交、完整门洞覆盖、所有可选门型/家具净空、窗帘闭合网格/离地、材质和保存。前后同机位/同FOV/同时段真实画布对比位于 `docs/quality-report/room-refinements.html`（PC/手机×6处×昼夜共24对）；生成脚本 `scripts/build_room_refinement_report.py`，不依赖离线棚拍。手机均为浏览器模拟，最终目视验收仍待用户确认。

`2b88ec7` 已部署 main。公开应用、PC/手机Chrome、WebKit、设置隔离、单HTML、专项几何/材质/保存和24对报告通过，记录 `validation/room-refinements-public*.json` / `room-refinements-report-public.json`。公开main SHA256 `167f3aad…`；release 和历史feature内容匹配各自Git。后续证据提交不改应用。

## V16.2 合入 main（当前工作方式）

用户要求画质分支合入 main，后续全部在主干开发。当前工作目录为 C:/PHMT，分支 main；feature/render-quality 保留为历史评审快照。合并保留主干阳台连续顶板、顶灯、天花板设置与已验证的219张新烘焙，接入V16.1家具/PBR/接缝修复。冲突按功能组合解决，生成HTML由源码重建；未改变建筑快照或重新烘焙。版本16.2。主干效果报告在 /preview/main/quality-report/，release正式站保持独立发布。


主干合并提交 `50dc9b1` 已推送，[Pages工作流45561896113](https://github.com/aimspike/HangZhouPHMT/actions/runs/45561896113) 成功。公开main与Git匹配，PC/手机Chrome/WebKit、设备检测、单HTML离线、阳台专项和效果报告验证通过。证据见 `validation/rebuild-public.json`、`merge-balcony-public-validation.json`。main页面SHA256为 `ed37ce230e7b2a95d5fdfe0c8c2b64730ea81262486e20c58b304f44f926e661`；后续证据提交保持应用不变。

## 阳台加顶与顶灯（2026-11-25）

在 `main` 为阳台补连续顶板，沿用室内 0.38m 厚度与 2.80m 下表面高度，覆盖阳台至南侧外沿；增加一盏中心暖色吸顶灯，接入现有顶灯开关、亮度及家具局部照明。阳台天花板可单独更换材质，也参与全屋天花板设置。设备平台仍不提供天花板设置。墙线、门洞和家具布置不变。

浏览器 `houseBakeSource()` 导出仍为 133 mesh / roof 130；屋顶形状改变，必须使用本次完整灯光、太阳与天光烘焙。新增 `src/roof_geometry.py` 从导出轮廓统一生成烘焙遮挡与贴图范围，避免阳台顶板只显示而不遮阳。屋顶 atlas 扩为 640×1286；其余贴图数量仍为 219。验证入口为 `validation/verify-balcony.cjs`，结果见 `validation/balcony-*.json`。

本地 Chrome 1280×900、微信 UA / 触屏模拟 390×844 与 740×360：219/219 贴图、包含阳台的屋顶 0 缺口、灯光开关与调光、天花板显示与材质保存、旋转及门 / 家具净空通过。`verify-render-quality.cjs` 的昼夜、画质保存、HDR / depth 缺扩展回退通过，8 项发布隔离测试通过。灯光图 G/B 在天光重算前后逐像素一致。实际画布截图以 WebP 保存，未进行真机微信验证。

功能提交 `79b8016` 已推送 main 并在公开预览完成同组桌面 / 手机模拟回归。公开 HTML 与构建一致，独立 file 单 HTML 启动通过；release 正式 HTML 和 feature 预览保持。公网记录见 `validation/balcony-public-validation.json` 与 `balcony-deployment.json`。

## V16 A 材质 / 模型重建（2026-11-25）

用户确认继续原家装 A 风格。V15 已用 `2377c58` 完整回退并确认公网；随后在同一 feature 分支建立 Blender 5.3 可编辑米制资产、PBR 图与 high/mobile LOD，完成 16 类主要家具及踢脚 / 窗框收口层。`assets/rebuild/reference-a-master.blend` 为源文件，`scripts/rebuild_scene_assets.py` 与 `prepare_rebuild_materials.py` 生成数据，`build_house.py` 校验源脚本哈希后内嵌，当前 HTML 约 10.24MB。

13 张去重 PBR 图全部加载；原始建筑快照 / 门洞 / 219 图不变，画布清晰度与光照恢复原方案，未恢复运行时路径追踪。PC / 手机 LOD、家具 / 门 / 通行 / 保存、HDR / depth 回退、Chromium / Windows WebKit 及报告检查通过，见 `validation/rebuild-*.json`。报告有 PC / 手机各 6 组真实网页前后对比；另有 4 张明确标注的离线 Cycles 独立模型棚拍，不可用后者冒充网页效果。

详细内容和质量边界见 [ASSET_REBUILD.md](ASSET_REBUILD.md)。T01 保持进行中：本轮完成主要资产重建，不宣称整体达到工业级；全屋照明、参考图目视验收和物理手机微信持续性能仍待完成。正式 release 与 main 应用保持原版，feature 仅供评审。

功能提交 `328b8ac` 已部署；公网三入口逐字节对 Git、PC / 手机 Chrome / WebKit、16 模型与 13 PBR / 219 烘焙加载、检测及设置隔离、单 HTML 离线通过，记录 `validation/rebuild-public.json`。本任务未推送 main / release；公网核对时 release 已由其他操作推进到 `7b53b23`，正式应用 HTML 哈希仍是 V14.2 的 `5057ce9c…`。后续验证文档提交不改已测应用。

## 画质回退与重建（2026-11-25，覆盖 V15）

用户目视评审认为 V15 不如优化前，要求先回退，再细致重建材质和模型，目标工业级。已撤销 V15 两个功能 / 报告提交，恢复 `7b53b23` 的应用源码、材质、烘焙纹理与原分辨率；保留独立 feature 预览部署。后续质量必须以参考图、近景模型 / UV / PBR 资源、真实网页效果及手机预算验收，不再以短时模拟帧率代替视觉验收。重建沿用原 A 风格，继续 feature 分支，正式 release 不变。

## 当前分支规则（2026-11-24）

`main` 为开发分支，`release` 为正式发布分支。正式展示根网址始终取 `release/docs`；main 测试链接为 `https://aimspike.github.io/HangZhouPHMT/preview/main/`。修改完成后验证并推送 main、检查测试部署；只有用户要求正式发布时，才将已验证 main 快进合入 release。此规则覆盖下方历史条目中“推送 main 即发布正式版”的流程。

GitHub Actions 同时检出两条分支，由 `scripts/assemble_pages.py` 合并静态站点；根 HTML 不作修改，main 测试 HTML 增加标题标记、noindex 和独立 localStorage 命名空间，避免污染正式版设置。六项发布隔离单元测试位于 `validation/test_pages_assembly.py`。当前实施说明和发布步骤见 `DEPLOYMENT.md#分支与发布流程`。

更新时间：2026-11-24。当前版本 V14.2。先阅读本文件及 REQUIREMENTS.md；完整会话快照位于本地 `.local/`，不在 GitHub 中。历史版本条目保留当时状态；当前变化见文末。

## 模型与环境

- 户型外包络约 6.2 × 12.5m；全部墙体正交。用户的整层参考左端阴影为此户型，整栋不是简单复制本户型。
- 杭州 30.2741N / 120.1551E，UTC+8。阳台方位角190°，图纸上方10°。
- 太阳参考日期2026-11-18；清晨07:09、正午11:45、黄昏16:38、夜晚21:00。NOAA近似方向，详见solar-presets.json。
- 默认18层、3m层高，室内地坪相对地面51m；眼高1.5m，FOV105°。总楼层默认26层为示意，可1–70调整且不低于所在楼层。

## 源码入口

- `src/house.template.html`：建模、UI、主循环、烘焙shader和诊断接口。
- `src/interior.js`：按房间裁切可见墙面、地面和屋顶下表面生成独立材质；7扇门及开关/碰撞；整栋透明结构。
- `src/environment.js`：程序化云、城市、小区以及地面随楼层偏移。
- `src/build_house.py`：将Three r128、OrbitControls、FXAA、Lucide子集、环境代码及219张内嵌PNG纹理写进一个HTML。
- `src/redraw_plan.py`：重建SVG、PDF和PNG；`src/make_solar.py`计算四种天空时间。
- `src/bake-source.json`：当前133个mesh、屋顶id130。`houseBakeSource()`可重新导出原始几何；材质拆分前已捕获快照。
- `src/bake_lighting.py`烘焙73张灯光贴图；`src/bake_sun.py`为3个太阳方向生成RGB贴图，最终`baked-lighting.json`含219张图（73灯光/天光 + 73三时段太阳直射 + 73三时段太阳反射）。

## 关键修复

1. 夜间异常光斑：旧baker的direction是表面指向灯，却对downward用了负y，导致地板与下墙缺少直射，1.15m虚拟点反射光的硬遮挡和半径裁切形成奇怪形状。现改正正y，顶灯使用5个面积采样，反射改为房间内连续平滑场，客餐厅连通；室内模式即使隐藏天花板仍使用烘焙。
2. 房顶厚0.38m，包络跨过墙顶约0.16m，覆盖凹角，顶灯二次反射照亮顶面。射线扫描当前覆盖无缺口。
3. 材质按房间边界裁切墙两侧及屋顶下表面，保留uv2和shader钩子，uv改为世界尺寸重复纹理，group按material合并以控制draw call。隐藏重复floorFill，裁去卧室交叠地板。tiny墙补uv2并使用平滑室内shader。
4. 7扇门：入户、书房、厨房、卫生间、储藏间、主卧、次卧；原阳台玻璃滑门保留。入户默认关，其余默认开约86.4°。门线段为太阳烘焙提供动态遮挡；关门时室内移动有碰撞。
5. 整栋轮廓来自references/whole-building-reference.png，户型在左端，包含中廊及两处凸出公共区。楼栋只在三维显示；所在层金色，其他层透明，当前层留空避免遮挡。整栋按钮fit全栋，重置返回户型；远景隐藏重叠房间标签。
6. 微信适配：visualViewport/WeixinJSBridgeReady重算尺寸、canvas显式设置、面板默认收起，手机限制DPR和帧率，MSAA+FXAA。无WebGL时内嵌SVG降级。contextLost事件前也用gl.isContextLost()保护frame/renderView，避免shader null trim错误。

## 验证

桌面WebGL1启动正常，无JS/shader错误；219/219图完成；roofCoverage()为0缺口；7扇门全关/全开；厨房修改不改变书房；夜间墙面和屋顶平滑，FOV105°、眼高1.5m。手机模拟含320×740、390×844、740×360、568×320，UA包含MicroMessenger，模型覆盖视口，面板正确开关。详见validation/。仅模拟微信UA与屏幕，尚未真机测试。

只读诊断：`houseViewer.diagnostics`、`.roofCoverage()`、`.bakedMaps`、`.finishes`、`.doors`、`.building`。场景数据通过`houseBakeSource()`导出。修改后必须构建，并检查公开部署。

## 迁移与发布

源工作区和旧版V3–V6保留。新项目采用`src`、`plans`、`references`、`context`、`validation`及`docs`布局。GitHub仓库和Pages目标为`aimspike/HangZhouPHMT`，Pages入口`docs/index.html`。实际发布状态记录在`context/DEPLOYMENT.md`。

## V8 门与木纹更新

- 两间卧室平开门的合页分别放在中间隔墙两侧，向各自卧室开90°；合页侧门框加宽，预留把手和门挡空间。
- 入户门采用深木色面板、古铜细条、双面智能锁与竖把手。
- 其余6扇房门支持平开／双扇推拉，推拉采用洞口内双轨叠合，开启净宽约半个门洞；每扇门可独立透明，也可全部透明，透明仅改变显示，保留碰撞和太阳遮挡。
- 门洞按真实墙面内沿对齐；门扇与框重叠22mm，加门槛和顶框。平开与推拉闭合时，每扇1426条覆盖射线均无缺口。门遮挡数组扩大到16段。
- 木纹改为同一灰度值控制RGB，去除彩色噪声，降低色差、拼缝和凹凸；墙面竖向木纹，地板横向木纹，默认色改成低饱和浅橡木。
- 用户明确要求：每次修改完成、验证后提交并推送GitHub，更新Pages。已写入AGENTS.md。
- Codex app-server已创建项目并将本会话projectId关联到它；当前桌面侧栏未成功登记，本轮运行目录仍为原工作区；需在应用“添加项目”选择独立目录。新项目完整文件在独立目录，下一次在新目录继续可直接读取上下文。

## V9 门型与安装位置（覆盖V8选择规则）

用户确认：两间卧室不能推拉，只能贴墙开合。master/second不再显示门型下拉框，维持原门洞。entry仍平开。study/kitchen/bath/storage默认sliding，可切回平开；推拉双扇向同一侧移出洞口叠合，安装在房间外墙面，书房向左、厨房向右、卫生间向左、储藏间向右。外侧双轨避开门框，把手采用薄型内嵌造型。

诊断houseViewer.doorMotion()对每扇推拉门25步、其他门型及开合5625种状态进行包络检查；墙体、门框与其他门无相交，四扇均在房间外。另检查完整移动扫掠包围盒，也无相交。houseViewer.doorClosure()每扇1426条射线，默认门型均无缺口。记录见validation/v9-motion-validation.json。

## D盘迁移

项目现位于 `D:/HangZhouPHMT`，原位置为 `C:/Users/Admin/Documents/Codex/hangzhou-89a-house-viewer`。全部源码、图纸、Git历史及完整本地会话备份已迁移；早期工作区work/outputs归档在 `.local/legacy-workspace/`。183个项目文件及1086个历史文件复制后逐一SHA256核对一致，再在D盘重新构建和验证。

后续命令与编辑明确使用D盘项目，切勿继续改历史C盘目录。桌面本轮cwd不会自动切换；后续从D盘目录打开项目。

## V10 日光与天光

用户要求增强白天阳光入室，并计入天空亮度对室内的辐射。早中晚继续按杭州/朝向计算07:09、11:45、16:38三组太阳方向。

- `daylight_transport.py`共享117个含细窗框的遮挡体、完整屋顶、射线可见性和房间体积插值。
- `solar_bake.py`：每texel采样太阳盘5个方向；按照到墙地面的能量计算40个重要性采样的漫反射面元，生成每房间的方向辐照度体积，再三线性插值到贴图。太阳直射与反射各RGB三时段独立存储。
- `sky_bake.py`：64个上半球方向按天顶亮度加权采样，计算窗口可见天空的漫射，并用48个面元样本计算反射。天光体积只在单房间内平滑，避免稀疏采样斑块，不跨墙滤波。客餐厅视为连通房间。
- 灯图R重用为天光+反射，G/B灯具数据逐字节保持；新加太阳反射图，总计219张内嵌PNG。天光和太阳反射使用sqrt辐照度编码，弱光精度提高，shader解码；天光加微量抖动减少色阶。
- UI分别调整室内日照强度（默认170%）和天光强度（默认140%）。室内白天曝光校准为preset×1.42，夜间仍×1.08。夜间太阳权重全零；灯具G/B校验完全一致。
- 219/219加载、屋顶直接太阳max0且反射和天光为正；手机360×780、390×844、740×360模拟无溢出/脚本错误；天光低/高实际像素亮度有明显变化。截图含关闭顶灯的自然采光以及夜间回归。
- 运行`python src/bake_sun.py`全量重烘焙；`--bounce-only`重算太阳反射与天光但保留已有直射贴图。几何改变必须全量。`bake_lighting.py`之后始终再运行`bake_sun.py`，再构建。
- 漫反射为静态近似，按默认门洞和固定中性色反射率烘焙；动态门提供太阳直射遮挡，不能实时重烘焙间接光。周边建筑为示意，不用于太阳遮挡计算。

## V11 图纸复核、承重标记和门框

- `src/plan-layout.json` 统一25条墙线、13个洞口、7扇门和23段照片实黑区域。`redraw_plan.py` 与模板均从此读取，不再分别维护门洞。详细对照见 `context/PLAN_AUDIT.md`。
- 储藏间门洞根据照片从偏下位置改为约 z=6.50–7.30 m，门、框和门楣同步移动；其他门位置保持，卧室仍只贴墙平开。厨房和阳台门洞不再被矢量图的连续墙盖住。
- `createBearingMarkers` 为独立显示层，按实际墙体裁切并跟随剖切高度；三维墙帽带、平面红色墙段，室内隐藏，不进入烘焙或碰撞，也不覆盖房间材质。
- 平开框与推拉框分组切换；推拉为薄包边、双轨罩壳/端盖、齐平收口，取消平开门挡及高门槛。平面另有门符号，随门型/开关更新。
- 门验证会检查完整可见祖先链与当前门框。新增 `houseViewer.bearing` 与 `.planLayout`。标记颜色不随曝光洗白；平面视域避开顶部控件。
- 阳台右侧实黑短墙端独立于低矮围护，按原图保留墙端。烘焙快照123个mesh，屋顶id120。按新几何重算灯光与早中晚太阳/天光；储藏间门洞旁短墙段采用平滑填光。
- 用户补充推拉门为吊轨式；上方每叶两个吊轮，轨罩内承重，无地轨和门槛。平开框用户确认“既要窄，又要包住整个门洞”：可见包边40 mm，内衬32 mm覆盖墙厚。卧室偏置隐藏轴保持旧轴位，门扇搭接22 mm。
- 手机平面视图竖屏为顶部按钮和底部图例留空，横屏将户型移到右侧并扩大，避免遮挡。标记和门符号采用线性化颜色，保证与图例一致。
- `createPlanGlazing` 在平面模式补充7处窗线和阳台玻璃门符号，覆盖低窗台的剖切面；不参与烘焙。吊轨下有离散小型防摆导向件，没有通长地轨；门体测试包含它们，均无相交。
- V11最终检查：25条墙、13个洞口、7扇门、23段实黑标记/24个显示片段；123个烘焙mesh、219张图；源几何与网页导出完全一致，屋顶0缺口。默认和全平开闭合均0缺口，4扇推拉无碰撞。桌面WebGL1及360×780/390×844/740×360模拟通过。


## V12 直角、全屋材质、保存与路径追踪

- `wall_junctions.py`从正交墙端生成11个缺失外角补片，避免L接头外侧凹槽，低围墙剖切不重新打开全高补角。网页和SVG/PDF共享补角数据。门洞和中心线未改；全量灯光、太阳及天光烘焙已完成。当前`bake-source.json`为134 mesh、roof id131，219张图。网页导出与源完全一致。
- `interior.js`全屋范围按surface分别更新，室外天花板排除。支持合法材质/颜色及门设置restore；保留uv2和shader。
- `settings-storage.js`：游客和每账号分别缓存、150ms本地保存、900ms云同步防抖、JSON导入导出；Supabase REST邮箱OTP/refresh/个人设置RPC，revision冲突需选版本，offline/online/focus重试。HTML默认公开云配置为空，无额外云请求；`cloud/README.md`与`supabase.sql`为部署入口。严禁加入service_role。客户端模拟测试通过；真实云权限和邮箱未测。
- `path-tracer.js`提取当前可见场景（含InstancedMesh矩阵）、CPU Worker三角BVH、路径追踪管理和动态重算；`path-tracer-gpu.js`为WebGL2 GLSL路径追踪，浮点ping-pong累积、每个BVH叶至多6个三角形、面积灯/有限太阳/天光NEE与多次反弹、法线深度引导降噪。独立WebGL2 canvas拷贝到2D overlay，保留主渲染器WebGL1。单HTML内嵌，无额外库。不是RTX扩展。
- 默认实时启动；桌面quality默认high（GPU800宽/256spp/6bounce），mobile默认preview（240宽/64spp/4bounce），手机high420宽；CPU降分辨率128–240宽/32或128spp。质量与降噪保存，模式不保存。350ms停止移动后重新采样，主相机及投影签名自动检测，门/材质/显示/云恢复invalidate；旧Worker消息按serial拒绝。隐藏页面取消累积。截图选择当前路径追踪canvas。
- 近似限制：透明为概率透射，无真实折射/焦散，金属和粗糙度简化；降噪会平滑细纹。天空和城市示意，不用测绘精度描述。CPU缺少GPU降噪且速度较慢。
- 验证：219/219图、roof0 gaps、7门各1426闭合射线无缺口、4推拉路径/扫掠无碰撞，几何导出一致；全屋/分房间隔离、刷新恢复、离线/双设备模拟冲突/账号隔离/密钥拒绝/令牌刷新/JSON不含凭据通过。GPU精细800×600约20.6秒；CPU移动预览首采样约4.9秒；这些为本机，不代表手机真机。
- 手机360×780、390×844、740×360模拟：无溢出、模式可切、面板默认关闭；旋转后必须等待resize更新后检查。仍没有真机微信结果。截图和JSON见`validation/v12-*`。


## V12.1 移除路径追踪（覆盖V12相关条目）

用户反馈路径追踪效果完全不符合预期，已撤除路径追踪入口、质量/降噪UI、frame调用、截图分支、保存键与两个路径追踪源文件及构建内嵌。继续使用原实时烘焙照明，219张贴图、134mesh、屋顶id131和几何完全未变。墙角补齐、全屋材质、本地保存与Supabase接入准备保留，旧settings schema1中的多余渲染键可安全忽略。替代方案和实现瓶颈见`LIGHTING_OPTIONS.md`；本轮不实施新光照方案。


## 2026-11-19 项目及仓库重命名

正式目录为`D:/HangZhouPHMT`，GitHub为`https://github.com/aimspike/HangZhouPHMT`，展示页为`https://aimspike.github.io/HangZhouPHMT/`。由原D盘目录原地重命名，2532个文件、334906255字节逐一SHA256核对一致，含`.local/`会话备份和旧工作区。Git历史与远程GitHub仓库ID均保持；origin已更新为新clone URL。Codex后端项目名称和root已更新，项目ID不变。旧迁移记录及历史验证中的旧URL/路径是当时的事实，后续操作使用新路径。发布辅助脚本现为本地`work/github_publish.py`。网页功能未修改，路径追踪仍处于撤除状态。

## 2026-11-19 公开首页与小区资料

README改为“杭州·璞荟铭庭”，包括在线体验、项目介绍、平面图预览与赞赏支持；原首页工程细节迁入`context/DEVELOPMENT.md`，相对链接随之调整。`references/phmt/`存放概况、历史节点、六个已读来源的摘记和JSON索引。

来源含杭州市民政局地名公告、国立公证处摇号公告、住在杭州网两页、房天下和杭州购房通。重点核对368套、65/89㎡、开发建设单位；平台楼栋层数和指标标明证据性质。地名公告“所在政区”原文为拱墅区，与配售项目资料指向滨江区不符；道路边界、建筑面积和预售证照日期亦存在来源差异，资料页明确保留冲突，首页不采用有冲突的面积或证照日期。当前销售、学区和交付状态未作为事实断言。

`assets/wechat-appreciation.png`为581×581处理图，只保留白底赞赏码，移除黑边、姓名与口号，中央头像局部Gaussian模糊；编码图案保留原像素。仅处理图公开，原图和研究缓存均未提交。已视觉检查；未宣称通过微信扫码实测。

用户追加要求在展示页加入GitHub项目链接。主模板页脚增加`#githubProject`标准外链，在新窗口打开项目仓库，手机与矮屏隐藏原状态文案为按钮留空间，保留42px触控高度、焦点样式和安全区。已重新构建生成HTML；只增加导航，无几何、材质或光照变更，不需重烘焙。

用户再追加一分钟后赞赏弹窗：`src/appreciation.js`计累计前台可见60000ms，同一页面仅一次；后台暂停，在设置面板、截图或操作中延后，避免打断输入。弹窗含面向邻居的支持文案、Star链接与已模糊赞赏码；可点关闭、继续看房、遮罩或Escape退出，Tab留在弹窗并返回原焦点；打开时清空移动，弹窗期间不响应漫游按键。构建把PNG以data URL及模块脚本内嵌，保持单HTML离线，无自动外部请求。横屏页脚给移动按键和承重图例留出位置。扫码仍未用微信实测。

本轮验证：GitHub GFM渲染四份Markdown及本地链接；赞赏码头像外编码像素与裁剪原图完全相同、无EXIF；桌面与320/360/390竖屏、740/568横屏共六尺寸三模式，219/219贴图、外链真实弹出、无自动外部请求和脚本错误。虚拟时钟检查一分钟边界、设置延后、关闭不再提示、焦点循环及Escape不影响漫游模式；另模拟visibility事件检查后台暂停和恢复，320×568弹窗可滚动关闭。记录与截图为`validation/public-home-*`，均属Chromium模拟，不表示微信真机或扫码验证。

用户随后要求README最上方突出赞赏支持与3D在线体验。当前顺序为主标题→3D在线体验链接与简短功能→赞赏支持/赞赏码→项目介绍→小区概况及其余内容。此调整仅移动README内容，展示网页功能未变。

## V13 家装预设 A

用户提供 `C:/Users/Admin/Downloads/1/` 的 9 张装修参考效果图，确认采用“现有 3D 网页增加可切换装修方案，并保存效果截图”。本轮不调用 AI 生成图片。

- `references/interior/preset-a/`：9 张 JPG 按空间与视角改名，原文件内容 SHA256 一致；分类为客餐厅 5、厨房 1、卧室 2、卫浴干区 1。manifest 含原名、尺寸、校验值和判断依据；两间卧室暂按阳台关系对应次卧/主卧，干区位置待核实。
- `src/decor-preset-a.js`：可选家具层，首次启用才构造，181 个部件合并为 78 个 mesh。暖木/米白/深蓝、橙色餐灯、芥末床头；含客餐厅、L 形橱柜、床/衣柜、卫浴、洗烘、书房与储藏家具。壁画、电视画面、顶面灯带只在室内显示；俯瞰/平面隐藏高位装饰。保持原墙线、门洞和两卧室平开规则。
- 新增家具不进入建筑 `bakeMeshes`，`houseBakeSource()` 与既有 134 mesh 快照逐项一致，保留 219 张烘焙贴图。家具使用对应房间灯位的近似填光与地面接触阴影，不声称已重新烘焙家具 GI 或真实镜面反射。
- UI 有“家装预设 A”快捷按钮、设置中的方案切换、分房间安全观景位置、9 张内嵌 WebP 参考图相册及当前效果图保存。相册支持键盘切图、焦点循环、Escape 关闭并保持当前漫游模式；赞赏提示在相册打开时延后。
- 设置 schema1 增加 `decor`，保留切换前方案与 A 的独立材质。切换不丢自定义材质；本地刷新与 JSON 导入导出通过，旧 JSON 缺省原有方案。云配置仍为空，配置后沿既有 payload 同步；未测试真实云。
- `?decor=a` 可直接启用方案；普通网址使用已有设置。截图通过 `captureImage()` 同步重绘再读取 WebGL 画布，避免缓冲已清空时得到黑图。手机/微信使用可长按保存的预览。
- `assets/interior/preset-a/`：8 张实际 WebGL PNG（日间 6 房间、夜间客厅、全屋）及总览 WebP；captures.json 记录相机、FOV85°、眼高1.5m、时段。网页默认 FOV105° 不变。
- 验证：原图字节保持；家具与全高墙不相交；7 门各 25 步、全部可选门型与家具无碰撞；两卧室仅平开，次卧床与床头柜已避开扫掠范围。门闭合 0 缺口、推拉原测试通过、屋顶 0 缺口。桌面 WebGL1、320×740/390×844/740×360/568×320 微信 UA 模拟与旋转，219/219 图、三模式、快捷按钮、相册和截图正常，无自动外部请求或 JS/Shader 错误。真机微信仍未验证。
- 记录：`validation/decor-a-validation.json`、`verify-decor-preset.cjs` 和移动端截图。发布仍为 `main:/docs`，最终 HTML 约 3.48 MB，全部图与模块内嵌。
- 功能提交 `07396d9` 已发布，公开 HTML 与本地规范化 SHA256 一致。390×844 微信 UA 模拟和磁盘单 HTML 均启动正常；公开方案切换、相册、截图预览通过。公网证据为 `validation/decor-a-public.json` 与 `decor-a-public-mobile.png`。详细发布记录见 `DEPLOYMENT.md`。

## V13.1 布局修正、家具细节与毛坯方案

- 用户确认阳台西侧为邻居一体实墙：`platform-divider` 改为0.17m厚、2.96m高且不带guard；矢量图移除该段玻璃线。室内全高，三维跟随普通墙剖切（默认1.1m），不会被阳台围栏额外压低到0.38m。未新增未经确认的承重属性。
- 建筑几何变化后重新导出并全量烘焙灯光、太阳与天光：133 mesh、roof130，73×3共219张图。网页几何导出逐项一致、屋顶0缺口。
- 客厅按参考图与厨房/书房入口、西侧大窗核对：电视在北侧、沙发在南侧。电视柜位于x2.44/z3.43，宽1.45m，前移避开书房外挂推拉停车空间；新增livingTV观景位置与第9张截图。
- 主卧床头按后续用户要求朝西、贴西墙内沿x0.09，次卧床头贴东墙内沿x6.11；两衣柜分别贴bath-south和storage-south北侧墙内沿。由实际模型包围盒测量贴墙误差小于0.001m；主卧床三侧净距约1.005/0.533/0.717m，次卧约0.885/0.734/0.575m（足端/北侧衣柜前/南侧）。这是模型排布净距，不是施工尺寸。
- 家具390个部件合并为108 mesh，31个独立碰撞检查条目、23个漫游阻挡对象。新增软枕/床品褶皱与包边、柜门缝/把手、管状椅架、厨卫五金/植物/书本与洗烘面板。512px灰度木纹/织物/石材凹凸、材质粗糙度与自包含程序化反射环境改善表面；反射环境按昼夜和开灯降低强度，不反射真实房间，不是完整GI或路径追踪。
- 删除旧原有方案家具构造，默认bare毛坯：无家具、墙顶地水泥基底。showFurniture在bare强制关闭/禁用，A仍可独立隐藏家具。schema1的decor为preset/bareFinishes/aFinishes，两套自定义材质分别保存；旧original或缺少decor的设置迁移为无家具水泥毛坯，不重新载入旧装饰材质。
- `validation/verify-decor-preset.cjs` 与 `decor-a-validation.json`：7门全部可选门型25步家具间距无碰撞，闭合无缺口，4扇推拉原扫掠测试通过；床/衣柜贴墙及三侧净距、9个观景位置、全高墙间距检查通过。bare默认/旧JSON迁移、A/bare材质保存刷新与导入导出、9图相册焦点/键盘、桌面下载及移动长按预览通过。
- 320×740、390×844、740×360、568×320微信UA模拟及旋转均通过，设置默认关闭、画布满视口、三模式无溢出；219/219贴图、无JS/Shader错误或自动外部请求。仍未真机微信测试。
- 已更新SVG/PDF/PNG及9张实际场景导出、captures.json与preview.webp。9张用户JPG字节及SHA256仍与原文件一致。最终HTML约3.48MB，WebGL1、自包含、云配置仍为空。

用户随后要求默认夜晚、所有门默认平开，覆盖前述默认推拉：初始daylight为night，7扇可设置的入户/房间门均hinged；四扇仍可手动切换推拉。`plan-layout.json.defaultDoorType`为图纸与网页默认门型共同入口，平面图门符号同步。阳台原建筑玻璃滑门保持原图构造。个人已保存的时间/门型继续恢复。此默认值变更不改建筑烘焙几何，不需要再次烘焙；浏览器仍逐项核对快照。

功能提交 `3aaa4cb` 与默认值提交 `ae4d030` 已推送，Pages成功构建后公开HTML与本地规范化SHA256一致。390×844微信UA公网检查：V13.1/night/7门hinged/219图、设置收起、无溢出/错误/额外资源请求；切换/相册/截图通过。磁盘单HTML与公开SVG/PDF亦通过。证据在 `validation/decor-a-public.json` 和发布文档中。本地完整检查还验证个人选择dusk/sliding可刷新恢复。后续仍需真机微信核验。

### 后续：主卧床头朝西与阳台东墙

主卧床中心改为x1.10/z10.20、旋转+π/2，床头朝西贴x0.09墙内沿，床尾向东；床头柜/台灯/书本改到x0.43/z11.31，挂画移到西墙，地毯和master观景点同步。次卧布局保持。`decor.placements`由实际包围盒记录headDirection及贴墙间距；检查脚本明确断言master为west，三侧通行与门扫掠继续核对。

阳台东侧 `balcony-east` 用户确认也是全高实墙，厚0.18m、高2.96m且不带guard，与原 `balcony-east-post` 接齐。西侧0.17m邻居墙保持全高，南侧仍为原阳台围护；不自动添加承重标记。图纸同步，几何重新导出并全量重烘焙。诊断 `houseViewer.balconyWalls`返回东西侧3段，分别在三维/平面/室内验证普通剖切与全高。当前几何仍133mesh/roof130/219图。

截图额外核对 `validation/balcony-east-solid-day.png`，展示阳台东侧与洗烘柜上方的实墙；主卧朝西实际图更新到 `assets/interior/preset-a/04-master-day.png`。

用户再要求装修方案去掉参考图、保存效果图、进入各种视角：已移除相应按钮/选择框、相册DOM/CSS/事件与构建的9张内嵌预览，面板仅切换和说明。仓库9张原图与预览保留，通用相机按钮和原有房间选择保留；内部安全相机仍供房间移动与自动截图使用，诊断入口改名`captureView`，没有新的界面入口。清除键盘/赞赏isBusy中的相册引用，防止空节点错误。单HTML约3.01MB。测试改为检查已删控件缺省、精简手机设置面板、通用截图及赞赏计时回归。

移除相册后的赞赏回归（虚拟时钟和visibility事件模拟）：后台两分钟暂停计时、恢复前台按剩余时长弹出、320×568可滚动/关闭均通过，无空节点错误。记录更新到`validation/public-home-prompt-edges.json`。

最新功能提交 `96e21b9` 已推送且Pages成功构建。公开HTML/SVG/PDF与本地一致，390×844微信UA再次检查主卧west、东西实墙、装修控件移除、A/bare及通用截图、默认night/7门hinged/219图通过；磁盘单HTML正常，无额外请求或JS/Shader错误。最新证据见`validation/decor-a-public.json`与`DEPLOYMENT.md`。

## V14 渲染与储物间（2026-11-19）

本轮实现覆盖之前“替代渲染仅调研”的状态。建筑仍133 mesh、roof130、219图；`houseBakeSource()`需与源JSON相等，家具与渲染没有修改墙/门或建筑烘焙。

`render-quality.js`为实时增强：WebGL1 depth texture的20样本/12样本屏幕接触遮蔽，按深度双边滤波、与FXAA合成；分房间64/128px六面场景采样，经Three r128 PMREM预滤波，按房间边界盒修正反射方向。只在停下交互/修改场景后更新当前房间缓存，不逐帧重拍。各房间按访问渐进缓存；没有探针的房间先保留原材质。反射只补高光，避免与既有烘焙漫反射叠加。半浮点可用时线性HDR；缺扩展用线性RGBA8，不在RGBE目标做透明混合。天空420m，反射相机far1000m；清背景并恢复渲染状态，防止RGBE指数污染导致黑/白材质。

墙/顶/地与门输入色显式sRGB转线性，数据凹凸/粗糙度使用linear纹理，保留uv2与shader hooks。家具恢复带阴影太阳的直接光，室内无阴影fill关掉，屋顶隐藏时仍有仅投影代理。软包圆角提高分段并平滑法线。窗外住宅按约54–69m示意高度，立面22层窗、阳台/窗框/空调与夜间零散亮窗；云层和雾优化，周边仍非测绘数据。

设置→渲染品质：自动/精细/均衡/轻量；桌面自动精细、触屏/微信自动均衡。保留JSON schema1并新增renderQuality控制项；旧配置兼容。缺depth扩展只停AO，缺half-float则反射LDR；轻量关闭增强。context restore使反射失效重拍。未恢复路径追踪，未加入外部资源。

阳台洗烘柜实际背面贴东内沿x6.11，宽深各0.68m、中心x5.77/z11.95，绕Y+π/2，前法向[-1,0,0]朝西；两台独立洗烘机含金属门圈、玻璃、显示/旋钮与脚垫。

储物间三墙U形架：北架x5.37–6.11/z6.4425–6.6725；东架x5.85–6.11/z6.6725–7.3275；南架x4.65–6.11/z7.3275–7.5575。高2.46m、18mm层板、24mm柱，六层中心高0.22/0.66/1.10/1.54/1.98/2.42m。348个架体零件，含支撑梁、调节孔/螺栓、脚垫、连接片和贴墙固定件。北侧缩短避开门；中央净宽约0.655m，3个独立凸包不封住中央通道。A合计766部件、109合并mesh、33检查条目。诊断placements的轴索引与图纸坐标不同，需要将包围盒z轴2转换成wallFace轴1；gap必须finite再判断，不能让NaN序列化null误通过。

验证：`validation/verify-decor-preset.cjs`为家具/门/屋顶/源快照/材质保存与4种手机视口回归；`verify-render-quality.cjs`为4时段、画质与刷新、房门反射更新、桌面/微信UA/缺扩展降级。运行时间超过1分钟时，测试通过正常关闭赞赏弹窗继续操作。新细节图在validation/v14-*；9张原图保持SHA和字节不变。仍须真机微信核验，屏幕AO只覆盖画面内接触关系，房间反射是缓存的近似，不是真实平面镜，也没有完整家具GI/实时全局路径求解。

V14功能提交 `b4f9d2d` 已发布，公网HTML规范化SHA256 `8d8962d6c0e6938c7f443e6d304db5fd407f7ca14494b664eeeae79e1195b876` 与本地一致；390微信UA、磁盘离线和公开图纸通过。最新结果见`validation/decor-a-public.json`与`v14-render-quality.json`。

## V14.1 手机阴影条纹（2026-11-23）

用户提供 iPhone 微信截图，墙面和天花板出现重复斜向阴影。在 Chromium 手机尺寸下复现 AO 条纹，关闭 AO 后消失。`render-quality.js` 原算法只比较视空间 z，倾斜平面的相邻深度会被误作遮挡；低精度深度与单像素法线放大问题。现在增加接收平面的半球判定、按距离和保守16位深度步长计算偏置，法线基线扩大到3像素，并跳过相机后方采样。保留接触阴影、房间反射、画质设置和全部烘焙数据。

`verify-contact-occlusion.cjs` 以真实 WebGL1 渲染18组平面（16位/默认深度，1.5/4/8m，三种倾角）及两组凸块接触阴影；旧代码平面测试失败，新代码平面无误暗像素且接触阴影保留。`verify-render-quality.cjs` 桌面/微信UA/缺扩展、昼夜、画质保存、反射更新通过，结果另存 `mobile-shadow-render-quality.json`，V14历史证据保留。`verify-mobile-shadows.cjs` 核对毛坯、219贴图、屋顶、几何快照、横竖屏、三模式、屋顶开关与移动。新图为 `mobile-shadow-*.png`。这是 Chromium 模拟，仍未进行真机 iPhone/微信验证。

当前执行环境只挂载 `C:/PHMT`，没有 `D:/HangZhouPHMT`，本次在现有干净 Git 仓库修复；origin与main均核对为正式GitHub项目。未迁移目录、未修改建筑或重新烘焙。

功能提交 `c6efa6d` 已发布，公开HTML规范化SHA256 `82b54b659f05575a216c77a4bbc86ee604a895767b55452d2f34867359dce56f` 与本地一致。公网及磁盘单HTML的390×844 iPhone/微信UA模拟：V14.1、219图、night默认、7门平开、面板收起、屋顶0缺口、正午AO与反射均通过，无额外请求或JS/Shader错误；见 `validation/mobile-shadow-public.json`。GitHub构建API遇到公开速率限制，使用实际发布内容与浏览器结果确认部署。

## V14.2 低精度采样与手机内检测（2026-11-24）

用户反馈手机尤其微信仍有条纹。按新指引执行同步Skill，唯一未提交的AGENTS.md在用户明确选择后独立提交 `01c8e79`，再`git pull --ff-only`成功，随后才修改源码。

V14.1的16位深度缓冲测试未覆盖纹理读取精度。`verify-depth-sampling.cjs`将深度采样值量化到10位小数，在V14.1复现整片墙顶条纹；对天花板固定区域比较正常/量化图，平均像素差约25/255，受影响比例100%。V14.2同样限制时该区域差为0。此为可重现的故障模型，未据此断言用户实际GPU内部精度。

`render-quality.js`显式使用highp深度sampler；手机/触屏/微信在所有画质档均使用兼容烘焙阴影，不创建AO深度附件，也不向FXAA注入深度合成shader。保留材质、家具接触贴片、房间反射；用户的quality选择仍保存。桌面仅具备highp和depth扩展时启用AO。diagnostics新增aoPolicy/screenAOAllowed/depthTextureAttached/shaderPrecision。建筑133mesh/roof130、219图、uv2及几何快照保持，未重烘焙。

新增 `mobile-check.js`，仅`?verify=mobile`显示本机检测面板，四项为毛坯/A的正午/夜晚。自动检查帧、贴图、画布输出和反射错误，人工逐项记录有无条纹；未经人工点击保持`awaiting-visual-check`。报告只在页面内存生成、可复制/下载，无自动上报和账号内容。`settings-storage.js`增加preview模式：检测不写localStorage、不配置云账号、不发云请求，退出后恢复原设置；检测时不启动赞赏提示。正常浏览的存储行为不变。

验证：`v142-depth-sampling.json`记录旧版复现与新版消除；`v142-mobile-compatibility.json`含Chromium Android Chrome/微信UA、桌面，及Windows WebKit Safari/微信UA，已存high刷新、横竖屏与三模式、4项检测、localStorage逐字节一致；自动测试不填写人工视觉结论。`v142-render-quality.json`为4时段、画质保存、反射更新、HDR/depth扩展缺失降级。桌面20组平面/凸块AO检查通过；建筑快照一致、屋顶0缺口，219图。手机检测流程详见`MOBILE_VERIFICATION.md`，README提供入口。

实机状态：未发现可用USB调试手机或云真机配置；访问电脑微信窗口时应用授权超时，没有完成电脑微信UI验证。Windows WebKit和手机UA仍不是实际iPhone或手机微信，须实际手机打开检测链接返回报告及目视结论后才可补记真机通过。

功能提交 `18ddb4f` 已发布，公开HTML规范化SHA256 `5057ce9c7ddd0471b0f06fa52efa4ca20582bbc755d804a1fe8c5f2b6a7311a9` 与本地一致。公开检测入口在Chromium及Windows WebKit手机微信UA下四项自动检查通过、几何一致、屋顶0缺口、无额外请求/错误；见`validation/v142-public.json`。人工字段保持未确认，已请用户在微信及系统浏览器分别返回本机报告。

## 手机功能宣传素材（2026-11-24）

用户要求20秒手机版主要功能视频和六宫格功能介绍图。`assets/promo/mobile-v14.2/`保存最终MP4、1800×2400六宫格PNG、封面与media-info；网页发布副本在`docs/promo/`，直接访问，不增加主应用启动请求。视频为1080×1920/30fps/H.264/yuv420p、600帧、20.00秒、无声中文功能字幕，六段依次三维总览、平面户型、室内漫游、昼夜采光、毛坯/A、材质/门/楼层设置。海报2列×3行，真实页面截图，含入口二维码。

录制为Chromium手机视口及微信UA的实际UI操作，非物理手机；以独立上下文保护个人设置。外框与字幕后期排版，原始录屏与制作脚本在work/mobile-promo及work/*mobile-promo*。无AI重绘或源码、建筑、烘焙变动；六宫格及视频完整解码/播放检查通过。详情见素材README。

### 宣传素材第二版

按用户要求在9.5–19.5秒插入10秒毛坯无家具室内漫游，总时长30.00秒，1080×1920/30fps/900帧；原功能片段保留。新文件`mobile-feature-tour-30s.mp4`、`mobile-video-cover-30s.jpg`、`media-info-30s.json`，记录为`revision-2-validation.json`。漫游采样确认bare/0家具/通行无碰撞/219图，包含实际前进与转向。六宫格第四格改为同一阳台朝窗外的正午/夜晚分屏，全部关闭室内灯，文案为“关闭室内灯，面向窗外看昼夜”，输出`app-features-six-grid-v2.png`。旧素材保留，新成品复制至docs/promo。素材源码和原始录屏在work/mobile-promo-r2及work/*promo-revision*；应用与烘焙未变。

素材提交`5081e74`已发布。公开30秒MP4与新版PNG均返回200，类型分别video/mp4和image/png，逐字节与本地一致；见`assets/promo/mobile-v14.2/revision-2-public.json`。MP4约6.0MB，验证900帧完整解码、时长30秒、浏览器播放及多点跳转；海报1800×2400，6格文案无溢出。

### 宣传素材第三版：近景与60秒配音（2026-11-24）

用户反馈六宫格“三维总览”模型太小、视频片段过短，并明确选择约60秒、中文配音、字幕和音乐。本次重新录制7个章节，按1倍速播放：三维8秒、平面6秒、家装漫游8秒、毛坯漫游11秒、四时段9秒、装修对比7秒、设置11秒。输出`mobile-feature-tour-60s.mp4`（1080×1920、30fps、1800帧、H.264/AAC、fast start），`mobile-feature-tour-60s.srt`与封面。Windows Huihui Desktop合成普通话14句，按实际语音长度同步字幕；原创96 BPM振荡器钢琴琶音/低音配乐，无第三方采样，解说时音乐降低。

`app-features-six-grid-v3.png`在实际网页中再拉近三维相机，旋转后截图，保留完整户型。像素比较确认只改变第一格手机截图，其余五格、全部文案与第二版一致，阳台关灯同视角昼夜分屏保留。原始录屏与制作/验证脚本在未提交的`work/mobile-promo-r3/`和`work/*promo-r3*`；应用源码、`docs/index.html`、个人设置与烘焙均不变。媒体规格和本地证据为`assets/promo/mobile-v14.2/media-info-60s.json`及`revision-3-validation.json`。

新版仅提交推送`main`，公开测试素材路径为`/preview/main/promo/mobile-feature-tour-60s.mp4`及`/preview/main/promo/app-features-six-grid-v3.png`。正式根目录仍由`release`提供；未获正式发布要求不推进release。仍是Chromium手机视口录制，不代表物理手机或微信真机验证。

素材提交`b6d4729`已推送，测试链接MP4/PNG/SRT均200且与Git提交逐字节一致；390×844手机视口公开测试页219/219贴图，60秒MP4有声解码/播放及54秒跳转通过，PNG1800×2400，无页面错误。见`revision-3-public.json`。音频测量约-17.5 LUFS、真峰值-2.9 dBFS；本地1800帧完整解码、14处跳转、字幕无重叠和海报差异范围检查通过。正式release仍为`102bb16`。

## 后续 TodoList 跟踪（2026-11-24）

用户要求将五项后续目标整理为可追踪文档。新增 [TODO.md](TODO.md)，固定编号 T01 效果提升 / 专业展示、T02 其他户型适配、T03 小区效果展示、T04 家具可配置、T05 墙可拆可增。总览统一维护状态和下一步，各项列出现有基础、可勾选子任务、验收标准和依赖；通过进展记录关联后续提交与验证证据。五项初始状态均为“待开始”，优先级、负责人和排期待定。

README 增加入口，REQUIREMENTS 第43项记录原始需求。本轮为文档变更，应用源码、生成页面、图纸和烘焙数据未变；后续继续任务时同步更新 TODO 状态与记录。

## 仓库展示首页与维护说明分离（2026-11-24）

按用户确认新增 `.github/README.md`，GitHub 仓库页优先展示此文件。面向访客提供“开始看房”、家装A、平面图、赞赏支持、60秒视频封面/链接、近景六宫格、功能与资料入口；相对资源路径按 `.github` 目录使用 `../`。最新视频/字幕/六宫格下载链接使用现有 `/preview/main/promo/` 地址，明确为新版素材预览；看房入口仍为正式根网址。

根 `README.md` 改为项目说明与制作规范，集中维护源码职责、构建、建筑/家具/渲染/媒体规则、重烘焙顺序、按范围验证、main/release发布及隐私资料边界；保留 TodoList 与各文档入口。`context/DEVELOPMENT.md` 更新首页引用、当前目录和发布说明，明确其他版本内容的历史性质。仅变更 Markdown，不修改应用或媒体成品、不构建或重烘焙、不推进release。

本地验证：GitHub官方Markdown API的GFM输出在1280×900和390×844视口显示，两个README均无页面横向溢出，首页3张图片全部加载，视频/看房链接保留；65个相对链接目标存在。记录为`validation/repository-readme-layout.json`，临时渲染HTML与截图在`work/readme-home/`。本地CSS近似GitHub排版，实际仓库展示在推送后另行核对。

文档提交`f1aaef1`推送后，实际GitHub仓库桌面/移动页均显示宣传首页标题与六个内容分区，3张图片全部加载、正文无横向溢出，视频封面及根README链接正确；根README可单独打开维护标题。main部署元数据为该提交，release仍为`102bb16`。结果见`validation/repository-readme-public.json`；实际页面截图保留在`work/readme-home/github-home-*.png`。

## 宣传素材第四版：自然亲切配音（2026-11-24）

用户反馈第三版Huihui Desktop语音生硬，要求柔和亲切的女声或男声。本轮选择Microsoft在线神经普通话女声`zh-CN-XiaoxiaoNeural`，目录人格标签Warm，rate -6%、pitch -1Hz；解说改为口语化整章合成，保留句间韵律，不使用语音变速。通过`edge-tts`客户端生成，只有公开宣传稿发送至在线语音服务；依赖安装在未提交`work/neural-speech-runtime/`。

新成品`mobile-feature-tour-60s-soft-voice.mp4`及同名SRT保留60秒原画面/7章/22–33秒毛坯漫游；从第三版无字幕画面重新烧录14条词语边界对齐字幕，原原创音乐在说话时平滑降低。规格仍1080×1920/30fps/1800帧/H.264/AAC/fast start。旧视频、封面、六宫格和应用均保持，`.github/README.md`视频及字幕链接改为新文件。中间文件在`work/mobile-promo-r4/`和`work/*promo-r4*`。

元数据为`assets/promo/mobile-v14.2/media-info-60s-soft-voice.json`，本地结果`revision-4-validation.json`：全帧解码、桌面/手机视口播放与音频解码、每视口14处跳转通过，无字幕重叠，各章语音原速完整容纳；原混音约-15.2 LUFS，真峰值-3.4 dBFS，解说与降低后的音乐整体RMS差约25.5dB。仅推送main、检查测试素材，不推进release。

第四版素材提交`12ca9ac`上线，视频和字幕200且与提交一致；实际GitHub首页已指向自然女声版，桌面/手机视口均有声解码、播放和多点跳转正常，见`revision-4-public.json`。随后用户指出画面闪跳，以下第五版为当前最新。

## 宣传素材第五版：修复录制闪跳（2026-11-24）

用户指出19–20秒跳变。逐帧定位到旧片19.367–19.600秒界面与场景同时瞬间放大，1800帧上方UI时间中位数检查另发现35.467–35.567秒同类问题。与录制中的`page.screenshot()`采样对应，录屏期间截图造成临时像素/视口缩放，原始录制已有，不是配音或视频拼接的章节切换。

重新采集全部7章，录屏大小390×844匹配CSS视口，deviceScaleFactor仍2，期间不截图，只读取诊断；采样均390×844/画布780×1688/219贴图，毛坯无家具且可通行、关灯阳台固定相机。新文件`mobile-feature-tour-60s-v5.mp4`及同名SRT；保留60秒原章节、自然神经女声、音乐和14条同步字幕。媒体规格`media-info-60s-v5.json`，本地检查`revision-5-validation.json`；中间文件`work/mobile-promo-r5/`与`work/*promo-r5*`。`.github/README.md`入口更新至v5；应用源码、建筑、烘焙和六宫格保持。

新片1800帧全部解码，上方UI 15帧中位数差异最大约1.043/255（旧异常峰值45.177），整张手机画面最大约2.82/255；两个阈值检查均无瞬时闪跳候选。全片自动扫描、各章及19.5/35.5秒附近目视复核、桌面/手机播放与22处跳转验证；仅推送main并检查公开测试素材，不推进release。

第五版提交`d2c4b47`已上线，MP4/SRT均200且与提交逐字节一致；实际GitHub首页两个视频入口已指向v5，桌面及390×844手机视口公开播放、音频解码与多点跳转通过，无页面错误，见`revision-5-public.json`。v5与第四版解码音频SHA256相同，女声/音乐/时序完整保留。release保持`102bb16`。


## V16.1 画质分支模型接缝（2026-11-25）

`feature/render-quality` 在 V16 家装 A 重建基础上修复管件开放端、旋转件轴心退化、灯罩内壁缺口、被褥错边 / 悬浮，以及水槽与橱柜收口。16 类 / 220 个实体部件的 high 与 mobile 导出逐件闭合，无开放边 / 非流形边 / 退化面 / 绕序和法线错误；台面每档4386覆盖射线无缺口。量化采用模型共用网格；窗帘双面材质与实体家具隔离。详见 ASSET_REBUILD.md 最新节和 validation/rebuild-topology.json。

建筑快照、219张烘焙、原家具布局保持。报告新增10对WebGL资产近检，刷新12对实际房间截图和4张明确标注的离线棚拍。版本16.1，PC/手机库三角形128064/76672。使用隔离工作区，未改动主工作区的阳台任务；仅推送feature测试页，不合main/release。工业级整体与真机微信仍待验收。


## 家具装配、阳台洗漱角与轻微玻璃反射（2026-11-25）

修复茶几边条、餐桌支柱、餐椅座盘/横撑/扶手/曲背固定件、沙发横撑，以及电视柜、衣柜、餐边柜、厨柜、书桌、浴室柜与吊灯的连接。按实际导出包围盒落地及贴墙，配件随主件移动；茶几支承在地毯表面。电视柜北侧保留书房房外推拉门停车区，未强行贴墙。床头/柜背及其他可贴墙家具间距均小于1mm；床三侧和所有门型检查继续通过。

阳台洗烘改为独立 Blender 模型，按小米官方照片方向制作白色箱体、深色门圈/玻璃和简洁控制区；烘干机官方参考为银色，场景颜色统一为米白。旁侧新增连续闭合陶瓷台盆、地柜、龙头、镜面、上柜和工作灯饰条；两柜沿东墙接齐、正面朝西。参考与配色说明见 references/interior/laundry-corner.md。台盆与镜柜共用墙面支承，不移动建筑墙/门。

8块建筑窗玻璃在不可变烘焙快照捕获后分配独立材质，opacity .21、roughness .12、metalness 0、房间反射强度 .30；保留深度写入关闭与通透感。沿用分房间 PMREM、线性 HDR/降级和现有轻量档策略，无额外外部资源。建筑133 mesh/roof130、219烘焙、墙线、门洞、uv2及快照保持，无建筑重烘焙。

18类资产、330实体部件的high/mobile导出（合计660份）逐件闭合，开放边/非流形边/退化/绕序/反向法线均0。新增 verify-furniture-assembly.py 对实际导出两档做BVH交叠、实体包含与采样最近距离检查，18类各自一个装配连通组、未见脱离部件；0.7mm容差，有限采样不代表任意自交和施工验收。verify-compact-scene.cjs检查46项贴墙/支承记录、柜间接缝、阳台通行、玻璃参数与反射实际像素贡献，并采集PC/手机视口昼夜24对网页对比。

验证：compact-after.json、furniture-assembly.json、rebuild-topology.json、compact-decor.json、compact-render-quality.json、compact-mobile-compatibility.json。Chrome/WebGL1、Windows WebKit、手机横竖屏/微信UA、HDR/depth缺失回退、保存设置、219贴图、屋顶、7门闭合/扫掠及家具净空均通过；未代表物理手机微信。模型库18类、驻留PBR仍13张，家装条目40（包含配件分组）。HTML约11.54MB。实际效果与证据页为quality-report/compact.html。仅推送main，release保持独立正式发布。

功能提交`78fc9f1`已上线main。公开HTML规范化SHA256 `62316cff0d579aedcc5f010e295f985341aefdb7889f981eaff7c443c5a2e2b8`与Git装配一致；18模型/13PBR/219烘焙、PC/手机模拟/WebKit、离线带家具、设置隔离及本轮细节、24对报告通过。见compact-public*.json、compact-report-public.json与compact-deployment.json。正式release保持7b53b23，本轮未推进；随后证据提交不改应用内容。


## Cycles 固定状态光照、AO、反射烘焙（2026-11-25）

按用户要求实施离线外部工具烘焙。`scripts/export_static_bake_scene.cjs`从真实网页导出完整建筑、默认门与毛坯/high/mobile家装；`scripts/bake_static_cycles.py`用Blender5.3 / Cycles OptiX生成256采样、4次漫反射反弹的照明。4时段×灯开/关×bare/A共16状态，以天光、三向太阳、灯具线性分量因式化保存。建筑1024²图集、家具high/mobile独立顶点照明与AO，2布局各10个房间的5分量256×128反射图，共124张数据PNG。照明sqrt(linear/8)，AO线性；反射合成后转RGBE仅作为输入，再由现有PMREM生成线性目标，没有透明混合写入RGBE。

新增`src/static-lighting.js`，固定状态下替换旧漫反射，不重复叠加；全场景AO轻量用于环境高光/家具填充，静态生效时屏幕AO不再合成。天空、太阳、灯强度控件继续分别缩放，黑夜关灯只有弱夜空。旧219建筑烘焙、墙线/门洞、几何快照和uv2原样保留，作为固定状态之外的回退。没有恢复运行时路径追踪。

参考固定门状态：入户关闭、6房门平开且打开；按毛坯/A原定墙顶地底色烘焙。改变门状态/门型/透明、墙顶地材质或隐藏天花板时禁用固定数据，恢复旧照明/动态反射，个人设置不被覆盖。反射只对应房间固定点及基础材质，不精确覆盖任意视角、外部城市全细节和任意材质变化。首次解析/解码会暂用旧照明，缓存后状态切换约几十毫秒（本机模拟短时观测，非真机承诺）。Float32影像缓存限制48MiB；单HTML约23.93MB，加载体积显著增大，真机持续性能仍待验收。

124张PNG、每布局6个图集基、10×5反射图、134488 high/93926 mobile独立家具采样；实际附着high124mesh/709416顶点、mobile124mesh/466044顶点。`validation/verify-static-bake-data.cjs`核对影像及全部采样下标/脚本哈希；构建另校验烘焙脚本及墙线、原快照、家具源码/模型和太阳输入哈希，拒绝过期资源。`assets/static-bake/`保留导出、可编辑blend、原数据PNG和内嵌包。

`verify-static-lighting.cjs`覆盖Chrome桌面/手机/缺HDR-depth/WebKit的全部16状态、开关灯与昼夜像素变化、48张新实际画布、改门/材质/天花板回退、刷新保存与横竖屏。`static-lighting.json`、`static-bake-data.json`、`static-render-quality.json`、`static-decor.json`保存结果。48对/96张实际网页对比见quality-report/static-lighting.html，包含PC/手机、客厅/主卧/厨房/阳台6组代表状态；前后相同相机/曝光/材质，无AI重绘。仅main开发，release不推进。

静态光照功能`83f8ad1`已上线main。公开HTML规范化SHA256 `b3483ec26903532a57c9ae453dd51fc3027138777a9aaafd56238a8ae5dcc76c`与Git装配一致；4类引擎/扩展环境各16状态、新光照/反射、回退、设置与横竖屏及96图报告均通过。见static-public.json、static-report-public.json和static-deployment.json；正式release仍7b53b23，后续证据提交不改已测应用。


## 室内过亮：灯光与曝光对比（2026-11-26）

用户要求两种方式都测试并给效果对比图。本轮保持应用默认参数及个人保存设置，独立测试灯光70%/50%与相对曝光80%/65%，保留100%基线。曝光通过采集脚本路由注入的临时诊断钩子调整renderer，灯光使用原有lightPower控件；未增加运行时入口、未改应用HTML、烘焙、材质、模型或墙线。报告/截图变化无需重构应用或重烘焙。

`validation/capture-brightness-comparison.cjs`用同机位/时间/家装A/材质，在Cycles光照重组和对应房间PMREM更新后采集。PC1280×900、手机390×844/微信UA模拟；客厅/主卧/厨房正午与夜晚开灯，加客厅正午关灯对照，每组5档，合计70张真实WebGL画布。`scripts/compose_brightness_comparisons.py`仅统一缩放和排版，生成4张2448px宽并排JPG，未后期改亮度或补光。影像、相机、实际灯光/曝光和像素均值见brightness-comparison.json；原图和合成图在docs/quality-report/brightness/。

观察建议优先灯光50%、曝光不变：压低室内墙顶/白柜而保留自然光与窗外；70%为更温和方案。曝光65%也能压暗，但室内/窗外/暗部一起降低，正午关灯时继续影响自然光。夜晚客厅画面加权像素均值约180.4→149.8（灯50%）/161.3（曝光65%），只是显示像素统计，不是照度。正午关灯时降低灯光滑块的画面均值不变。该建议用于用户挑选，未擅自改默认。

`quality-report/brightness-comparison.html`提供桌面/手机、昼夜/关灯、三房间、四调整方案对比滑块、5档原图及4张下载总览；`verify-brightness-report.cjs`在1280/390宽各56种对比，70图/4总览、交互及链接/无溢出检查通过。219原烘焙/13PBR、固定照明与反射均有效、快照一致/屋顶0缺口、零JS/Shader错误和外部依赖请求。手机均为模拟。仅推main报告，不推进release。

亮度对比报告`c3415f5`已上线main。70原图/4总览逐字节匹配本地，公开PC/手机宽度各56组对比、滑块/原图/链接和无溢出通过；见brightness-public-assets.json、brightness-report-public.json和brightness-deployment.json。应用默认/HTML及烘焙保持，release未推进。


## 稳定墙顶斑驳与陶瓷曲面修复（2026-11-26）

用户报告静态照明已加载后的正午关灯云团暗块，以及陶瓷盆沿/四角/马桶的三角折痕和放射纹。本轮诊断关闭反射/凹凸后仍可复现；原256采样天光噪声、稀疏曲面/法线与低能8位顶点照明量化共同造成异常。先提高面数和采样后，暗处仍出现多边形色带，最终将建筑和家具数据以及运行时建筑组合全程保持16位，真实网页中平顺过渡恢复。

建筑2048采样，关闭自适应提前终止；独立UV区域内对天光/灯光线性HDR数据进行OIDN RT HDR降噪，太阳独立保留。家具1024、AO256采样；陶瓷照明按35mm邻域和法线点积>.86有限平滑，不改几何/反射法线。16位sqrt线性辐射以相邻像素高/低字节PNG保存，Canvas先解码再组合；建筑GPU图集为1024×2048双字节平面RGBA8，highp采样重组，无浮点纹理扩展依赖。解码缓存仍48MiB，未恢复运行时路径追踪。

阳台台盆盆沿/四角/盆底规则细分并控制平面法线；浴室盆体128径向段及更多轮廓环，两件手机档保留曲面。陶瓷独立porcelain材质，无织物/石材凹凸；马桶采用该材质并提高球面细分。新模型18类/330部件，每档逐件闭合和装配检查保持通过，实际平面盆沿采样法线倾角0°。不改变建筑墙线、门洞、家具位置和原bake-source快照；旧219建筑图保留，重新导出新的Cycles完整场景并生成124张照明/AO/反射图。

实际效果 `quality-report/surface-fixes.html`：20组/40张WebGL前后画布、3张并排图，PC1280×900和手机390×844，同机位/曝光/灯强度；正午关灯覆盖客餐厅/主卧/卫生间与3件陶瓷，夜晚原灯强度检查3件陶瓷高光。先等static enabled及probe ready，再等3帧截图，无后期阴影或亮度处理。灯光/曝光对比页保持，用户尚未选择新默认，本轮默认值不变。

本地验证：surface-before/after、surface-bake、ceramic-surfaces、surface-static-lighting、surface-render-quality、surface-decor、surface-offline、surface-report-layout及rebuild-assets/topology/furniture-assembly。Chrome桌面/手机/缺HDR-depth/Windows WebKit共64固定状态、改门/材质/顶面回退、保存与横竖屏、219图/13PBR、屋顶0缺口、门扫掠/闭合/家具通道和单HTML离线均通过。未变屋顶内部典型高频残差中位数降低约73–80%，平均天光能量变化<0.2%；全区RMS受真实阴影边界影响仅降低约5–8%，该指标不等于视觉评分。真机微信仍待实际检查。

自包含HTML约40.0MB（39,950,766字节），比前版约24MB增加；高精度数据带来首次加载和解析成本，模拟通过不代表物理手机持续性能。应用规范化SHA256为 `d73e873ce48d82723de78bc707d6d2891a9f8d77f0aa64a72199900bf79b97fe`。仅推送main并检查公开测试页，release保持7b53b23568d18550822fbf98fb5f42e5cda60487。


修复提交 `ca184640cfedf10ebca26a2f8e0625a508aa0651` 已推送并部署。公开main HTML SHA256 `db9bd657259dc26d67523c768b1d98f10fcaad429005296b0dcf1289db8585cd` 与本地按Pages标题/设置命名空间转换后的内容一致。公开Chrome桌面/手机微信UA20机位、static 16位/反射加载及报告两宽度各20比较通过，43张图片逐字节一致，2份JSON按Git LF换行规范一致；无脚本/Shader错误或外部依赖请求。见 `validation/surface-public.json`、`surface-report-public.json`、`surface-public-assets.json`、`surface-deployment.json`。正式release仍7b53b23，HTML hash仍5057ce9c7ddd0471b0f06fa52efa4ca20582bbc755d804a1fe8c5f2b6a7311a9。后续证据提交不改变已验证应用与图片。


## 过曝与模型穿插 / Z-fighting（2026-11-26）

用户反馈仍过曝且部分模型穿插。前轮仅做亮度试验未实际改变默认，本轮已实施：`interiorLighting.fixtureGain=.5`、`exposureGain=.8`。真实灯、发光灯罩/饰条、新旧漫反射和房间反射使用一致的灯光基准；原`lightPower`与全部个人保存控制保持，刷新180%仍为180%但有效灯能量按新基准计算。室内曝光夜晚.9504、正午1.04512；总览按原preset、平面.87。改门/材质/顶面回退也应用相同校正。公开诊断`houseViewer.lightingCalibration`可读用户倍率/有效灯能量/曝光。

衣柜顶/底板缩入侧板、背板内侧；餐边柜底板、洗烘柜层板、阳台台盆柜底板和厨房柜体板件按实际厚度收口。餐椅后扶手端面埋入连接座4mm；书桌横撑缩入立柱。厨房北台面原四块相交条改为单个闭合实体，保留真实水槽开孔，右端缩短30mm与东台面相接，柜体/柜门同步收短。门框竖边终止于横边/门槛，消除顶部共面叠面；门洞/门轴/原建筑快照/墙线未改。未使用全局polygonOffset、改双面或移动建筑墙掩盖。

新模型18类327部件，high/mobile合计654份、269524三角；开放边/非流形/退化/绕序/反法线0，装配各一个连通组。北台面每档4284覆盖射线无缺口。通过`asset-rebuild.js`和decor merge保留部件范围，`scripts/export_surface_audit.cjs`导出实际组装三角供`verify-exposed-overlap.py`法线射线抽样：原high26/mobile27近共面家具候选降至0；厨房台面原29.9997mm交叠变high0/mobile0.102mm接缝。数据在exposed-overlap.json；该抽样针对18类重建资产的保留实体范围，不是全场任意自交证明，原墙体底面/隐藏装配接触不作全零承诺。导出中间文件仅work/exposure-overlap，未提交。

按新家具/门框重新导出完整Cycles场景，全量重生成124图，high143004/mobile102692独立样本，16位编码/缓存、独立chart降噪保持，旧219图不变。应用单HTML39,952,908字节，SHA256 fc062aba2a76635068df24cbc5f527640ebe79d0abae3c9f3a2f93febac8db45，自包含/WebGL1，未加外部请求。

`quality-report/exposure-overlap.html`含48组正常前后对比（96张，PC/手机×昼夜×8房间+4近景）及4处×3横移机位×PC/手机前后诊断48张。诊断仅把各实体换固定颜色，几何和深度不变，用于观察衣柜条纹/台面交叠；不进入家装页。相机、角度、FOV、灯光滑块100%一致，曝光变化确为.8。正常图等待static enabled和probe ready再等3帧，无亮度修图；3并排图仅裁切缩放排版。夜晚桌面高亮像素占比（>=245）厨房18.62%→0.54%、卫生间14.11%→0、阳台台盆7.86%→0，显示像素统计不是照度。

本地验证：exposure-overlap-before/after、overlap-motion-before/after、exposed-overlap、exposure-calibration、exposure-static-lighting、exposure-render-quality、exposure-decor、exposure-report-layout、surface-offline及模型相关结果。Chrome/触控微信UA模拟/缺HDR-depth/Windows WebKit共64固定状态、昼夜开关/自定义表面与门型回退/保存/横竖屏、219图/13PBR、屋顶、门扫掠闭合、床三侧与家具通道和离线通过。报告1280/390宽各48正常比较、24诊断机位及滑块/链接正常。旧亮度与曲面页保留原图，增加历史基线提示并链接当前校正。仅main，release7b53b23保持；手机均为模拟，真机持续性能仍待验收。


功能提交 `32a37de28fff38e2186aba28621386e8b461d613` 已部署main；公开HTML SHA256 `7dc5e1967b803f86318e2b15700e7bdf842117dc7fd9847e0595a11a4bb2fec1` 与本地Pages转换内容一致。公开桌面/手机48实际机位、灯光基准/曝光校正、180%保存刷新、关灯/顶面回退及报告两宽度各48正常比较/24诊断机位均通过，无脚本/Shader错误或外部依赖。147张图片逐字节一致，4份JSON按Git LF规则一致。首次公共CDN一文件503和大HTML30秒下载超时，降低并发/延长下载时限后检查完成；单HTML约40MB的加载成本仍存在。见`validation/exposure-overlap-public.json`、`exposure-calibration-public.json`、`exposure-report-public.json`、`exposure-public-assets.json`、`exposure-deployment.json`。release与feature保持，后续证据提交不改应用。

任务期间已有复审提交420dba8进入同一main历史，已完整保留。其VIS-01对应的默认过亮已在32a37de实际校正；VIS-04原自定义门状态回退按既有约定保持。VIS-05枕头前沿/角部黑斑在新版本正午关灯近景仍可复现：关闭反射后保留，暂时统一家具顶点照明后消失，说明应继续检查烘焙顶点照明/AO与近接缝采样，不能将其标为本轮Z-fighting修复完成。诊断原图在work/exposure-overlap/pillow-*.png，未处理最终截图。本轮未修改床品几何/材质，T01与真机整体验收继续保持进行中。

## 家具贴墙与床头柜朝向（2026-11-26）

电视柜原后空约302.5mm，默认书房平开门下改为贴study-south内沿z2.9575，同时向东约65mm避开原墙角补片123（x1.70–1.78/z2.9575–2.99），范围x1.78–3.23000005。电视/屏幕/台面物品同步平移，保持支撑。为保留可选书房外挂推拉停车空间，新增独立合并层：切sliding整组前移130mm，切回hinged贴墙；阻挡范围和诊断同步。保存sliding刷新保持，切回hinged后全部家具重新匹配固定烘焙。门扫掠验证按实际门型对应布置计算，并另以真实当前家具位置检查，未排除电视柜碰撞。

次卧衣柜位置本已在北/东墙角，改平贴墙的右侧板和背板边缘，避免圆角退让。high/mobile分别从北、东两侧各9条实际网页射线检查接触面，最大偏差小于0.1mm。主卧床头柜绕Y+90°朝东，深/宽方向交换，台灯、书本同步；柜背仍贴西墙x.09，范围z11.085–11.535，床三侧通行保留。

新场景完整导出并重生成124图，high142804/mobile102492独立家具样本；原133mesh/roof130建筑快照、墙线/门洞和219张回退烘焙不变。WebGL1单HTML39,958,984字节。12组前后对比、24张真实WebP画布及一张并排图见quality-report/furniture-placement.html；仅缩放编码排版，无曝光后期处理。验证见validation/furniture-placement-before/after/decor/static/report.json及rebuild-topology.json、static-bake-data.json。Chrome桌面/手机/缺扩展/Windows WebKit共64固定状态，4种移动视口/旋转、设置/门型保存、全门型扫掠和建筑墙碰撞通过。手机均为模拟；VIS-05及整体真机验收仍待完成。仅main，不推进release。


## 卫生间重做与厨房水槽嵌平（2026-11-26）

前项家具修改40d1462已推送并公开验证，证据furniture-placement-public/public-assets/deployment.json。用户随后追加卫生间马桶/洗手台/淋浴间重做，明确选择窄边透明玻璃淋浴房；再指出厨房洗菜盆错位、光影异常并强调盆口与右侧台面要同高。本轮保留前述家具修改和A风格，原墙、门窗、基本分区不改。

模型库新增toilet/shower至20类429实体，high/mobile合计858份、323094三角，闭合/非流形/退化/绕序/反法线均0。洗手台为悬浮双抽木柜、一体内凹盆、墙出龙头、竖砖背板及背光镜；马桶有连续陶瓷壳体/座圈/支撑/桥接/冲水键与前倾掀起的盖板，盖板避水箱。淋浴房8mm玻璃、18mm窄框、铰链/把手/磁封、低挡水边、线性排水槽、顶喷/手持花洒/软管/混水器/置物架齐备，透明材质FrontSide、opacity .13、depthWrite/castShadow false。卫生间踢脚线及窗台改浅石色。

独立淋浴花洒/架体经真实壁座接触北墙，未强加穿过空间的杆件使所有物体连成一块。导出parts记录wallMount，装配验证只在真实支座到声明平面误差<.7mm时承认该组受墙支承；其余悬空组件仍失败。新淋浴房3组（框/底盘/玻璃，花洒，置物架），其余各资产1组。排水盖、龙头底座和花洒夹座等意外悬空间隙同时消除。

厨房旧龙头仍沿早期小盆坐标，出水口比当前盆中心偏东约95mm、偏后约140mm。现在盆/开孔/柜体统一中心，出口x≈4.925/z≈.395，基座同x。水槽规则高密度环带、独立平面法线、roughness .42/metalness .92不锈钢，替代旧角部折痕。盆沿下移4.5mm嵌平，台面做真实承托凹槽、2mm密封边；高/手机实际网页盆沿、北台面、右台面均y=.9390000105，检查容差.15mm。没有叠共面顶面遮掩落差。北台面4284射线各档0缺口，实际组装近共面抽样两档0组、L台面接缝均0mm；该抽样不是任意自交的数学证明。

最终画布曾暴露新淋浴底盘仅四角采样、全被挡水边遮挡导致插值发黑；底盘改12×12闭合格网，两档保留169个顶面位置。重新全量烘焙后桌面/手机中心照明和实际昼夜画布复核，底盘恢复正常，未增加曝光/移除挡水边来掩盖。新Cycles124图，high154802/mobile113227独立采样；原建筑133mesh/roof130/219图及墙线/门洞保持。单HTML42,106,390字节，规范化SHA256 4fe7490253a0b21b385cce8ef38b680ff89bf47ef125b835c2b6fd7bff2faaba。fixtureGain .5、室内exposureGain .8和所有个人保存设置保持。

报告quality-report/bathroom-rebuild.html包含24组前后同机位（PC/手机×昼夜×整体/洗手台/马桶/淋浴/水槽/盆沿）48张真实WebP和2张并排图，仅编码/缩放排版。等待static enabled和probe ready再等3帧；前后相机/角度/FOV/亮度校正一致。验证入口capture-bathroom-rebuild.cjs；其数据含玻璃、实际盆腔、盆/出口中心、台面高度、169样本与中心照明。辅助结果bathroom-topology/assembly/overlap/static/render-quality/report/decor.json、rebuild-assets.json、surface-offline.json和static-bake-data.json。Chrome桌面/手机/缺扩展/Windows WebKit64固定状态与回退、13PBR/219图、屋顶0缺口、门与通道/保存/移动适配、单HTML离线及Pages装配回归。手机为模拟，整体真机验收和VIS-05枕头黑斑仍待完成；不推进release。


## 2026-11-26 · 卫浴重做与厨房水槽齐平公开验证

功能提交 `db310ade97490b4c81dde927ca49dac5fe14ff97` 已部署main。公开HTML SHA256 `f9b540870066846bf9fb7e77c2b9dcf90a7a15c0718dc5ab80f45bda0555b89d` 与本地Pages装配内容一致；原始构建为42,106,390字节、SHA256 `4fe7490253a0b21b385cce8ef38b680ff89bf47ef125b835c2b6fd7bff2faaba`。

公开PC/手机共24实际机位检查通过：盆沿/北台面/右台面高度差均0，盆/出口中心误差小于0.1mm，淋浴底盘169个顶面位置与实际中心照明、玻璃透明/深度设置和门净空正常；电视柜贴墙、次卧衣柜两墙接触及主卧床头柜east朝向保留。报告1280/390宽各24组切换、图片和链接正常，50张图片逐字节一致，HTML/JSON按Git LF规范一致，共52资源。证据`validation/bathroom-public.json`、`bathroom-report-public.json`、`bathroom-rebuild-public-assets.json`与`bathroom-deployment.json`。后续证据提交不改变已验证应用和图像。

release仍`7b53b23568d18550822fbf98fb5f42e5cda60487`，正式HTML哈希仍5057ce9c7ddd0471b0f06fa52efa4ca20582bbc755d804a1fe8c5f2b6a7311a9，feature历史预览保持。没有正式发布；手机为浏览器/微信UA模拟，未真机验收。单HTML约42MB的首次加载成本仍存在，VIS-05枕头黑斑不在本次修复范围。


## 暂停保存与账号同步，转待办T06（2026-11-26）

用户指出易用性不足，明确暂时关闭“保存与账号同步”并转待办。main移除该面板全部DOM和专用CSS，不显示登录/连接/冲突/导入导出控件；新增简短说明“当前调整仅在本次浏览中生效”。通用相机保存图片继续使用，家具/卫浴/嵌平水槽与渲染参数保持。

settings-storage.js通过显式enabled:false在绑定任何保存事件、定时器或云认证/同步前返回，只读恢复有效guest记录；若原公开/本地配置和缓存账号所属项目一致，优先只读恢复该账号的本地payload，不刷新令牌、不使用账号访问网络、不修改session/config/记录。无有效缓存时使用默认值，损坏JSON/存储被浏览器禁止也可正常启动。已有记录和pending/revision原字节保持；不注册storage/focus/online/pagehide监听，新调整刷新后不保存。诊断storage.enabled=false/suspended=true/restoredFrom为defaults/guest/account，不暴露账号、令牌或设置内容。

T06新增为待开始，子任务为简化本机/账号/恢复流程、明确保存状态、重做冲突/迁移与桌面手机真机易用性验收。AGENTS、需求70、README、GitHub访客引导和cloud部署资料同步标明暂停；恢复必须另获用户实施要求。此需求覆盖早期“所有调整自动保存”的描述，旧选择仍保留。

validation/verify-storage-suspended.cjs包含5种纯函数边界（空/游客/账号/损坏/存储禁用）验证无DOM访问、写入、网络或事件/定时器；实际Chrome桌面、手机微信UA与Windows WebKit检查旧记录只读恢复、改灯强/画质/时段后刷新不写入、在线/聚焦/离开事件无同步、正式/预览键隔离、三模式/画布/屋顶/建筑快照与通用截图。browser测试使用专用模拟记录，不读取用户真实会话。核心结果storage-suspended.json，家具门/通道/4移动视口/方案材质即时切换为storage-suspended-decor.json，HDR/depth缺扩展与画质切换为storage-suspended-render-quality.json，独立单HTML为surface-offline.json。Pages8项装配检查通过。

保存相关回归按storage.suspended分支检查刷新回默认/不持久化，启用状态仍保留旧断言；覆盖decor、render-quality、static-lighting、furniture-placement、balcony、exposure-calibration、room-refinements、mobile-compatibility。实际核心新测试仍专门验证旧记录恢复和无写入，不能以跳过保存测试代替暂停验收。模型和124/219烘焙均保持，无需重烘焙；重新从模板构建单HTML42,104,622字节。仅推main，release保持。


## 2026-11-26 · 保存与账号同步暂停公开验证

功能提交`f514f641a1fbbe2872422de0739065a5eaa35469`已部署main。公开HTML SHA256 `1872aaec31139b5e939ec039268e13e5d0d292b9c2a7c6c66840b692ccea8f32`与Pages转换后的本地内容一致；原始规范化HTML hash为4685302864d7ed6efe6caeb604d50f5f3f976107326b754b9cd023dbc0dc24ff，逻辑UTF-8构建42,104,622字节。

公开Chrome桌面、手机微信UA、旧游客/旧账号模拟记录与Windows WebKit均通过：入口完全移除，显示本次浏览说明；原记录只读恢复，新灯强/画质/时段修改和online/focus/pagehide事件不写入、不联网，刷新恢复原记录，三视图/屋顶/建筑快照/手机旋转及通用截图正常。无JS/Shader错误或外部资源请求。证据`validation/storage-suspended-public.json`、`storage-suspended-deployment.json`；只使用隔离的模拟缓存，未接触用户实际账号。后续证据提交不改应用。

T06为待开始，保存/账号同步重新设计与恢复需用户新要求。release仍7b53b23568d18550822fbf98fb5f42e5cda60487，正式HTML hash5057ce9c…，feature历史预览保持。未正式发布，手机为模拟。
