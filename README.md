# HangZhouPHMT · 项目说明与制作规范

璞荟铭庭 89-A 户型的平面图复原与单文件 3D 浏览项目。main 当前版本 V16.2，运行时使用 WebGL1、实时烘焙照明与分房间场景反射。

V16.1 家装 A 重建及接缝修复已合入 `main`，同时保留阳台顶板、顶灯和配套烘焙，后续在主干开发。[main 家装 A 测试页](https://aimspike.github.io/HangZhouPHMT/preview/main/?decor=a) · [PC / 手机效果报告](https://aimspike.github.io/HangZhouPHMT/preview/main/quality-report/) · [重建与验收状态](context/ASSET_REBUILD.md)。工业级整体效果和真机微信仍待验收；正式版继续使用 release。

**[仓库展示首页](.github/README.md)** · [正式在线体验](https://aimspike.github.io/HangZhouPHMT/) · [main 开发测试版](https://aimspike.github.io/HangZhouPHMT/preview/main/)

主干最新细节修正：[入户门框、米白冰箱、厨房油烟机与窗帘前后对比](https://aimspike.github.io/HangZhouPHMT/preview/main/quality-report/room-refinements.html)。包含桌面/手机视口的昼夜实际网页截图，建筑墙线、原始门洞与阳台烘焙保持。

最新调整：[家具接缝、阳台洗烘洗漱角与窗玻璃反射对比](https://aimspike.github.io/HangZhouPHMT/preview/main/quality-report/compact.html)。包含18类双档模型装配检查、贴墙/落地与昼夜实际网页画布。

新增：[Cycles固定光照 / AO / 反射前后对比](https://aimspike.github.io/HangZhouPHMT/preview/main/quality-report/static-lighting.html)。16种固定组合、双档家具照明与房间反射，数据与流程见 [静态烘焙资产](assets/static-bake/README.md)。

首次室内亮度测试：[降低灯光与降低曝光效果对比](https://aimspike.github.io/HangZhouPHMT/preview/main/quality-report/brightness-comparison.html)。保留70张同机位试验画布和4张并排总览，使用当时的原亮度基线。

稳定画面修复：[墙顶斑驳与陶瓷折面前后对比](https://aimspike.github.io/HangZhouPHMT/preview/main/quality-report/surface-fixes.html)。提高离线采样、分 UV 区域降噪，16位照明数据消除暗部量化色带；两处台盆的曲面、平面法线和马桶陶瓷材质同步修正，保留默认灯光与曝光。

当前亮度与装配校正：[过曝、模型穿插与 Z-fighting 前后对比](https://aimspike.github.io/HangZhouPHMT/preview/main/quality-report/exposure-overlap.html)。实际采用原灯光基准能量50%、原室内曝光80%，保存的用户滑块值保持。重做厨房台面并修正衣柜、洗烘柜、餐椅、书桌和门框共面接头；报告含正常画面和独立诊断色横移对比。

家具位置调整：[电视柜贴墙、次卧衣柜两面贴墙与主卧床头柜转向](https://aimspike.github.io/HangZhouPHMT/preview/main/quality-report/furniture-placement.html)。电视柜默认贴北墙，书房切外挂推拉门时连同电视和物品前移13厘米留出门扇空间，切回平开门后恢复贴墙；次卧衣柜背板、右侧板使用平直接触面，主卧床头柜旋转90°朝东。

## 文档分工与任务入口

| 文档 | 用途 |
| --- | --- |
| [.github/README.md](.github/README.md) | GitHub 仓库首页：宣传介绍、在线体验、六宫格、视频链接与赞赏支持 |
| [README.md](README.md) | 项目说明、制作规范、构建与维护入口 |
| [AGENTS.md](AGENTS.md) | 在本项目中工作的具体约束与操作要求 |
| [context/HANDOFF.md](context/HANDOFF.md) | 当前实现、历史决策、验证结果与续接上下文 |
| [context/REQUIREMENTS.md](context/REQUIREMENTS.md) | 用户需求及后续修订 |
| [context/TODO.md](context/TODO.md) | 五项后续目标的状态、子任务、依赖与验收标准 |
| [context/DEPLOYMENT.md](context/DEPLOYMENT.md#分支与发布流程) | main / release 发布流程与部署记录 |
| [context/DEVELOPMENT.md](context/DEVELOPMENT.md) | 开发细节与版本记录 |

GitHub 优先展示所浏览分支的 `.github/README.md`；仓库根首页采用默认分支，当前为 `release`。`main` 中新版看房引导按用户选择保留待发布，正式发布时再同步到根首页。本文件保留在根目录，供项目维护使用。开始任务前先阅读 `AGENTS.md`、`context/HANDOFF.md`、`context/REQUIREMENTS.md` 和本文件。历史记录中的旧目录、默认值及发布规则以当前指引为准。

## 工程结构

| 路径 | 职责 |
| --- | --- |
| [src/house.template.html](src/house.template.html) | 主模板、场景、交互、界面与诊断接口 |
| [src/interior.js](src/interior.js) | 分房间材质、7 扇房门、碰撞与透明楼栋 |
| [src/environment.js](src/environment.js) | 天空、城市、小区示意及楼层高度适配 |
| [src/asset-rebuild.js](src/asset-rebuild.js) | Blender 双 LOD 模型与内嵌 PBR 资源加载 |
| [src/decor-preset-a.js](src/decor-preset-a.js) | 独立可选家装 A 家具层 |
| [src/render-quality.js](src/render-quality.js) | 画质档位、分房间反射及接触遮蔽 |
| [src/settings-storage.js](src/settings-storage.js) | 本地保存、JSON 导入导出与可选云同步 |
| [src/plan-layout.json](src/plan-layout.json) | 图纸与网页共用的墙线、门洞、门配置及原图实黑标记 |
| [src/wall_junctions.py](src/wall_junctions.py) | 网页与矢量图共用的 11 处直角补片 |
| [src/roof_geometry.py](src/roof_geometry.py) | 从网页导出的屋顶轮廓生成烘焙遮挡体与贴图范围，含阳台顶板 |
| [src/bake-source.json](src/bake-source.json) | 建筑烘焙几何快照，当前 133 mesh、屋顶 id 130 |
| [src/build_house.py](src/build_house.py) | 将代码、依赖、图片及 219 张烘焙纹理内嵌到单 HTML |
| [docs/index.html](docs/index.html) | 已构建的自包含网页与 Pages 入口 |
| [plans/](plans/) | 复原 SVG / PDF / PNG 平面图 |
| [references/](references/) | 原始图纸、装修参考与可追溯小区资料 |
| [assets/](assets/) | 处理后的公开图片、实际场景截图与宣传成品 |
| [validation/](validation/) | 验证脚本、结果与实际画布截图 |
| [scripts/assemble_pages.py](scripts/assemble_pages.py) | 组合正式站点与 main 独立测试站点 |
| `work/` | 中间文件、采集脚本与临时工具，Git 忽略 |
| `.local/` | 完整本地会话备份，Git 忽略，不发布 |

以当前工作区及 `git rev-parse --show-toplevel` 确认项目目录；当前克隆为 `C:/PHMT`，远程为 `aimspike/HangZhouPHMT`。

## 本地构建与预览

Python 3.10+ 可直接构建 HTML，无需安装额外 Python 依赖：

```sh
python src/build_house.py
python -m http.server 8879 --bind 127.0.0.1
```

从项目根目录提供服务，访问 [本地网页](http://127.0.0.1:8879/docs/)。也可以直接在支持 WebGL 的浏览器中打开 `docs/index.html`。

重新绘图或烘焙时安装所需依赖：

```sh
python -m pip install -r requirements.txt
```

平面图默认使用 Windows 微软雅黑；其他系统通过 `HOUSE_FONT` 指定支持中文的 TTF / TTC 文件。浏览器检查使用 Node.js、Playwright 与 Chrome；`PLAYWRIGHT_MODULE` 指向本机 Playwright 包，`CHROME_PATH` 可指定浏览器路径。

修改应用源码后重新构建并同步提交 `docs/index.html`，不要只编辑生成文件。文档或已有宣传素材的整理不需要重新构建应用。

V16 的重建资产与可编辑 Blender 主文件在 [assets/rebuild/](assets/rebuild/README.md)。材质生成先运行 `python scripts/prepare_rebuild_materials.py`，模型使用 Blender 5.3 执行 `scripts/rebuild_scene_assets.py`，最后构建。生成文件已提交，日常 HTML 构建无需安装 Blender；构建会校验生成脚本哈希，拒绝过期导出资源。

## 制作规范

### 图纸、模型与家具

- 所有墙体保持横平竖直；照片斜线来自纸面褶皱。墙线、门洞、门配置和实黑标记统一维护在 `src/plan-layout.json`，修改门洞须同步重绘与重烘焙。
- 承重标记仅按原图实黑区域转录，不按墙厚自动推断。楼栋轮廓取自示意图，当前户型位于左端；其他户型、总层数、周边环境及估算尺寸不能描述为测绘结果或施工依据。
- 阳台东西侧均为全高实墙；西侧与邻居相连，不能按低围栏剖切。家具布置不得通过移动原墙或门洞解决。
- 装修只保留毛坯与 A。毛坯无家具、采用水泥基底；A 的电视在客厅北侧、沙发在南侧，主卧床头朝西贴墙、次卧朝东贴墙，衣柜背面贴墙，保留书房推拉门停车空间与卧室门扫掠、床三侧通道。
- 7 扇入户和房间门默认平开。两卧室仅允许贴墙平开；书房、厨房、卫生间、储藏间可选房外单侧吊轨推拉，保留用户已保存的门型与状态。

### 渲染、适配与保存

- 最终应用保持单 HTML、自包含、无 CDN、无外部资源依赖；保留微信与移动布局、默认收起的设置面板、canvas 显式视口尺寸和 WebGL1 兼容。
- 材质 clone 保留 `onBeforeCompile`、`customProgramCacheKey` 与光照 `uv2`。天光占用灯光贴图 R 通道，G/B 保留夜间灯具；太阳反射和天光采用 sqrt 编码，在 shader 中解码后参与线性照明。
- 分房间反射相机 far 须覆盖半径 420m 的天空。透明混合不写 RGBE 目标，优先 linear half-float，缺扩展回退 linear RGBA8；环境反射与烘焙漫反射避免重复累加。
- 当前默认夜晚，已有个人设置优先。画质 auto / high / balanced / light 沿用现有保存；桌面 auto 精细、触屏与微信 auto 均衡，移动设备使用兼容烘焙阴影。运行时路径追踪已移除。
- `cloud-config.json` 为空时不得发云请求。可选 Supabase 部署见 [cloud/README.md](cloud/README.md)；令牌不得导出，凭据不得写入源码、日志或仓库。

### 图文与视频素材

- 用户原图保留原始内容、分类与来源；装修参考在 [references/interior/preset-a/](references/interior/preset-a/README.md)，实际网页场景图在 [assets/interior/preset-a/](assets/interior/preset-a/README.md)。
- 宣传成品、规格和验证放在 [assets/promo/mobile-v14.2/](assets/promo/mobile-v14.2/README.md)，网页下载副本在 [docs/promo/](docs/promo/)。最新成品为 60 秒中文配音视频与近景六宫格，旧版保留。
- 截图和视频须来自实际页面；说明采集视口、浏览器与后期排版范围。手机视口录制或微信 UA 模拟不能称为物理手机录屏、真机微信验证或照片级效果。
- 原始录屏、排版与音频中间文件写入 `work/`；`.local/` 不提交、不发布。首页链接须适配 `.github/README.md` 所在目录，新素材尚在 main 时使用明确的预览链接。

## 几何变更与重烘焙

修改建筑几何或门洞后，先在浏览器通过 `houseBakeSource()` 导出并更新 `src/bake-source.json`；同步图纸时运行：

```sh
python src/redraw_plan.py
```

再按顺序完成全量烘焙与构建：

```sh
python src/bake_lighting.py
python src/bake_sun.py
python src/build_house.py
```

`bake_sun.py` 依次调用 `solar_bake.py` 和 `sky_bake.py`。改变太阳参考日期或朝向时先更新并运行 `src/make_solar.py`。仅家具、表面材质或纯渲染变化无需重烘焙建筑，但应验证 `houseBakeSource()` 与既有快照一致。

## 验证与交付

按变更范围选择检查，结果和截图放入 `validation/`：

| 变更范围 | 对应验证 |
| --- | --- |
| 页面与渲染 | 桌面和移动横竖屏启动、219/219 纹理、屋顶覆盖、控制交互，无脚本 / shader 错误或自动外部请求 |
| 家具与门 | `node validation/verify-decor-preset.cjs`；家具门扫掠、贴墙、床三侧通行与安全观景点；改门位置额外检查 `houseViewer.doorMotion()` 和 `doorClosure()` |
| 渲染品质 | `node validation/verify-render-quality.cjs`；昼夜、画质保存、HDR / depth 缺失回退；手机阴影检查见 [本机验证说明](context/MOBILE_VERIFICATION.md) |
| 发布装配 | `python -m unittest discover -s validation -p test_pages_assembly.py -v` |
| 文档与宣传 | 相对链接、图片和视频可打开；桌面 / 移动排版、媒体规格、字幕及播放；说明模拟与实机范围 |

运行浏览器脚本前按上文在项目根目录启动 8879 服务，并配置本机 Playwright。测试通过后检查 diff，提交与推送 Git，并检查对应公开测试内容；保存验证证据。后续目标推进时同步更新 [TodoList](context/TODO.md)。

## 分支与发布

开发前按 [git-sync-before-feature 工作要求](AGENTS.md) 检查状态、分支与 upstream；工作区干净且目标正确时先执行 `git pull --ff-only`。遇到本地改动、分叉或同步失败先保留现场并解决，不自动 stash、rebase、丢弃改动或强推。

- `main` 是开发分支，也是仓库展示首页的维护分支。验证后提交并 `git push origin main`，更新 [main 测试版](https://aimspike.github.io/HangZhouPHMT/preview/main/)。
- `release` 是正式发布分支。[正式网址](https://aimspike.github.io/HangZhouPHMT/)始终使用 `release/docs`；仅在用户要求正式发布时，将已验证 main 快进合入 release。
- GitHub Actions 分别检出两分支，由 `scripts/assemble_pages.py` 组合发布。main 测试页有独立标题、noindex 和设置命名空间；每个入口的 `deployment.json` 记录分支和提交。

完整步骤与发布证据见 [context/DEPLOYMENT.md](context/DEPLOYMENT.md#分支与发布流程)。仅调整仓库 Markdown 不改变正式应用版本。

## 资料与边界

[小区公开资料与来源](references/phmt/README.md) · [图纸复核记录](context/PLAN_AUDIT.md) · [光照方案评估](context/LIGHTING_OPTIONS.md) · [第三方授权](licenses/THIRD_PARTY.md)

照片复原与程序化环境用于浏览、讨论及方案示意；尺寸和结构性质以正式图纸为准。自动化浏览器、WebKit 和微信 UA 检查与真实手机检查分开记录，未经实机验证不得补记真机通过。
