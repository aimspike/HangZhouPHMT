# 手机功能演示素材

基于 V14.2 实际网页制作。录制环境为 Chromium、390×844 手机视口及微信 UA，使用页面真实操作；外框、章节与中文字幕在剪辑时添加。不是物理手机录屏，也不作为微信真机验证证据。

## 当前版本：60秒自然女声视频，修复画面闪跳

- [最新60秒视频](mobile-feature-tour-60s-v5.mp4) · [同步字幕](mobile-feature-tour-60s-v5.srt) · [媒体规格](media-info-60s-v5.json) · [本地检查](revision-5-validation.json)。
- 用户指出19–20秒跳变；逐帧确认旧片19.367–19.600秒与35.467–35.567秒发生界面/场景瞬时放大。与录制中Playwright自动截图时点对应，故重录全部7章，期间只读取诊断数据，不调用截图，并让录屏尺寸与390×844页面视口一致。
- 保留第四版自然神经女声、口语化解说、14条词语边界同步字幕与背景音乐，60秒节奏和22–33秒毛坯漫游保持。输出仍1080×1920/30fps/1800帧，采用新的文件名避免缓存混淆。

新片1800帧全部解码通过；固定上方界面及整张手机画面分别进行15帧时间中位数瞬时差异扫描，未发现同类闪跳候选。另检查重点时段与全部章节的画面，并在桌面/手机视口验证播放和跳转。诊断采样视口390×844、画布780×1688、219张纹理始终一致。近景六宫格保持不变。

[观看或下载最新版本](https://aimspike.github.io/HangZhouPHMT/preview/main/promo/mobile-feature-tour-60s-v5.mp4) · [下载字幕](https://aimspike.github.io/HangZhouPHMT/preview/main/promo/mobile-feature-tour-60s-v5.srt)

中间录屏、编码与逐帧检查材料在未提交的`work/mobile-promo-r5/`，旧版异常对照在`work/mobile-promo-r4/jump-review/`。实际网页素材重新录制，未修改应用源码、几何、烘焙或六宫格；本次仅推送main。

提交`d2c4b47`已上线：视频/字幕与Git内容逐字节一致；GitHub首页入口指向v5，桌面和手机视口在线播放、音频解码和跳转通过。[公网检查记录](revision-5-public.json)。新旧两版解码音频哈希一致，保留自然女声及音乐。

## 第四版：60秒自然女声视频

- [60秒自然女声版](mobile-feature-tour-60s-soft-voice.mp4)：将第三版桌面语音替换为 Microsoft Xiaoxiao 在线神经普通话女声（`zh-CN-XiaoxiaoNeural`，语音目录标注 Warm）。语速设为 -6%、音高 -1Hz，采用更口语化的解说，整章合成以保留句间语气和自然停顿，没有对语音做变速拉伸。
- [同步字幕 SRT](mobile-feature-tour-60s-soft-voice.srt)：根据神经语音返回的词语时间边界重新对齐，共14条，无重叠；字幕已烧录在视频中。
- [规格与制作记录](media-info-60s-soft-voice.json)、[本地验证](revision-4-validation.json)。仍为60.00秒、1080×1920、30fps、1800帧、H.264/AAC、MP4 fast start。

画面继续使用第三版的原速录制与7章时间线，保留22–33秒毛坯漫游；[近景六宫格](app-features-six-grid-v3.png)保持。原有原创背景音乐继续使用，解说期间平滑降低音量。自然女声为通用合成语音，不模仿具体真人；在线语音服务只接收公开宣传稿，应用运行时不依赖语音服务。

[观看或下载最新自然女声版](https://aimspike.github.io/HangZhouPHMT/preview/main/promo/mobile-feature-tour-60s-soft-voice.mp4) · [下载最新字幕](https://aimspike.github.io/HangZhouPHMT/preview/main/promo/mobile-feature-tour-60s-soft-voice.srt)

新的公开副本位于`docs/promo/`，旧配音版保留；仓库展示首页改为链接新文件，避免视频缓存混淆。中间音频、词语时间边界及制作脚本在未提交的`work/mobile-promo-r4/`和`work/*promo-r4*`。仅更新main测试素材，正式release保持原版本。

## 第三版：60秒配音视频与近景六宫格

- [60秒竖屏视频](mobile-feature-tour-60s.mp4)：重新录制全部七个章节，按正常操作速度播放；1080×1920、30fps、1800帧、H.264/yuv420p、MP4 fast start。包含普通话合成解说、同步中文字幕与原创轻背景音乐。
- [新版六宫格功能图](app-features-six-grid-v3.png)：1800×2400，“三维总览”在真实网页中进一步拉近相机后重新截图，完整保留户型；其余五格与第二版逐像素一致，包含室内灯关闭的同一阳台昼夜分屏。
- [60秒视频封面](mobile-video-cover-60s.jpg)、[独立字幕](mobile-feature-tour-60s.srt)、[采集与媒体规格](media-info-60s.json)、[本地验证记录](revision-3-validation.json)。

| 视频时间 | 内容 |
| --- | --- |
| 0–8秒 | 三维总览：拉近与旋转，看清全屋空间 |
| 8–14秒 | 平面户型：房间布局与门窗位置 |
| 14–22秒 | 家装室内漫游：转向、前进、家具与通道 |
| 22–33秒 | 毛坯室内漫游：无家具、原速行走与转向 |
| 33–42秒 | 昼夜采光：关闭室内灯，同一阳台视角看四时段 |
| 42–49秒 | 装修对比：毛坯切换家装A |
| 49–60秒 | 随心设置：地板材质、房门、楼层与开始看房 |

解说使用 Windows 已安装的 Microsoft Huihui Desktop 普通话合成语音，正常语速，没有模仿真人；音乐由振荡器合成的96 BPM钢琴琶音与低音组成，不使用第三方歌曲或采样。解说期间音乐自动降低音量，开头和结尾淡入淡出。字幕按每句语音的实际长度对齐，另提供SRT。所有章节重新采集，不以旧的快速片段放慢或补帧代替。

新素材随 `main` 推送后在[60秒视频测试链接](https://aimspike.github.io/HangZhouPHMT/preview/main/promo/mobile-feature-tour-60s.mp4)与[六宫格测试链接](https://aimspike.github.io/HangZhouPHMT/preview/main/promo/app-features-six-grid-v3.png)提供。站点根目录仍来自 `release`，待用户要求正式发布时更新。原始录屏、排版与音频中间文件保留在未提交的 `work/mobile-promo-r3/`；应用源码、个人设置和建筑烘焙均未修改。

素材提交`b6d4729`的公开MP4/PNG/SRT均返回200，内容与Git提交一致；390×844浏览器模拟完成有声播放、进度跳转与图片加载，详见[公网检查](revision-3-public.json)。本地1800帧完整解码、14处跳转、字幕无重叠；音频约-17.5 LUFS，真峰值-2.9 dBFS。六宫格差异仅在第一格手机截图区域。

## 第二版：30秒视频与窗外昼夜对比图

- [30秒竖屏视频](mobile-feature-tour-30s.mp4)：在原20秒功能演示中，9.5–19.5秒新增独立10秒毛坯、无家具室内漫游。其余六项功能保留；1080×1920、30fps、900帧、H.264/yuv420p、MP4 fast start，无声中文字幕。
- [新版六宫格功能图](app-features-six-grid-v2.png)：仍为1800×2400、2列×3行；“昼夜采光”改为关闭室内灯、面向窗外的同一阳台视角，以白天/夜晚分屏展示天空与楼景。
- [30秒视频封面](mobile-video-cover-30s.jpg)、[新采集及媒体规格](media-info-30s.json)、[本地验证记录](revision-2-validation.json)。

新版时间线为0–3秒三维、3–5.5秒平面、5.5–9.5秒家装室内、9.5–19.5秒毛坯漫游、19.5–22.5秒四时段、22.5–25.5秒装修切换、25.5–30秒设置。毛坯漫游保留灯光以看清空间，图片中的自然采光对比单独关闭室内灯；两项拍摄目的分别记录。采样点均验证无家具、219贴图、位置可通行，发生转向和前进。昼夜图片相机位置与视角相同，三个采集时段均确认室内灯关闭。

新版保留旧素材，发布直链为`/promo/mobile-feature-tour-30s.mp4`和`/promo/app-features-six-grid-v2.png`。

## 初版素材

- [20秒竖屏视频](mobile-feature-tour-20s.mp4)：1080×1920、30fps、600帧、H.264/yuv420p、MP4 fast start；无声，含中文功能字幕。
- [六宫格功能图](app-features-six-grid.png)：1800×2400 PNG，2列×3行，含真实页面截图与正式展示页二维码。
- [视频封面](mobile-video-cover.jpg)。
- [采集与媒体检查记录](media-info.json)：各段内容、渲染诊断和最终视频规格。

| 视频时间 | 内容 |
| --- | --- |
| 0–3秒 | 三维总览：旋转、缩放与全屋空间 |
| 3–5.5秒 | 平面户型：房间、门窗及空间关系 |
| 5.5–9.5秒 | 室内漫游：转向与移动 |
| 9.5–12.5秒 | 昼夜采光：清晨、正午、黄昏与夜晚 |
| 12.5–15.5秒 | 装修对比：毛坯与家装A切换 |
| 15.5–20秒 | 随心设置：地板材质、房门开关、所在楼层 |

画面采集使用独立浏览器上下文，未修改用户个人保存设置、应用源码、几何或烘焙数据。三维总览关闭周边示意环境与透明楼栋，以突出当前户型；其他片段使用对应功能的实际界面。录屏按章节剪辑与调整速度，总时长20.00秒。

验证包括219/219贴图完成、无页面/Shader错误、六宫格图片与文字无溢出、600帧完整解码以及Chrome内MP4加载、播放和跳转。原始录屏、排版HTML与中间帧在未提交的`work/mobile-promo/`中。

发布副本位于`docs/promo/`，正式应用入口仍为自包含的`docs/index.html`；它不会自动加载这些宣传素材。
