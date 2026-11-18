# Codex 续接上下文

更新时间：2026-11-18。当前版本 V9。先阅读本文件及 REQUIREMENTS.md；完整会话快照位于本地 `.local/`，不在 GitHub 中。

## 模型与环境

- 户型外包络约 6.2 × 12.5m；全部墙体正交。用户的整层参考左端阴影为此户型，整栋不是简单复制本户型。
- 杭州 30.2741N / 120.1551E，UTC+8。阳台方位角190°，图纸上方10°。
- 太阳参考日期2026-11-18；清晨07:09、正午11:45、黄昏16:38、夜晚21:00。NOAA近似方向，详见solar-presets.json。
- 默认18层、3m层高，室内地坪相对地面51m；眼高1.5m，FOV105°。总楼层默认26层为示意，可1–70调整且不低于所在楼层。

## 源码入口

- `src/house.template.html`：建模、UI、主循环、烘焙shader和诊断接口。
- `src/interior.js`：按房间裁切可见墙面、地面和屋顶下表面生成独立材质；7扇门及开关/碰撞；整栋透明结构。
- `src/environment.js`：程序化云、城市、小区以及地面随楼层偏移。
- `src/build_house.py`：将Three r128、OrbitControls、FXAA、Lucide子集、环境代码及146张内嵌PNG纹理写进一个HTML。
- `src/redraw_plan.py`：重建SVG、PDF和PNG；`src/make_solar.py`计算四种天空时间。
- `src/bake-source.json`：122个mesh、屋顶id119、卧室新增门楣id120/121。`houseBakeSource()`可重新导出原始几何；材质拆分前已捕获快照。
- `src/bake_lighting.py`烘焙73张灯光贴图；`src/bake_sun.py`为3个太阳方向生成RGB贴图，最终`baked-lighting.json`含146张图。

## 关键修复

1. 夜间异常光斑：旧baker的direction是表面指向灯，却对downward用了负y，导致地板与下墙缺少直射，1.15m虚拟点反射光的硬遮挡和半径裁切形成奇怪形状。现改正正y，顶灯使用5个面积采样，反射改为房间内连续平滑场，客餐厅连通；室内模式即使隐藏天花板仍使用烘焙。
2. 房顶厚0.38m，包络跨过墙顶约0.16m，覆盖凹角，顶灯二次反射照亮顶面。射线扫描当前覆盖无缺口。
3. 材质按房间边界裁切墙两侧及屋顶下表面，保留uv2和shader钩子，uv改为世界尺寸重复纹理，group按material合并以控制draw call。隐藏重复floorFill，裁去卧室交叠地板。tiny墙补uv2并使用平滑室内shader。
4. 7扇门：入户、书房、厨房、卫生间、储藏间、主卧、次卧；原阳台玻璃滑门保留。入户默认关，其余默认开约86.4°。门线段为太阳烘焙提供动态遮挡；关门时室内移动有碰撞。
5. 整栋轮廓来自references/whole-building-reference.png，户型在左端，包含中廊及两处凸出公共区。楼栋只在三维显示；所在层金色，其他层透明，当前层留空避免遮挡。整栋按钮fit全栋，重置返回户型；远景隐藏重叠房间标签。
6. 微信适配：visualViewport/WeixinJSBridgeReady重算尺寸、canvas显式设置、面板默认收起，手机限制DPR和帧率，MSAA+FXAA。无WebGL时内嵌SVG降级。contextLost事件前也用gl.isContextLost()保护frame/renderView，避免shader null trim错误。

## 验证

桌面WebGL1启动正常，无JS/shader错误；146/146图完成；roofCoverage()为0缺口；7扇门全关/全开；厨房修改不改变书房；夜间墙面和屋顶平滑，FOV105°、眼高1.5m。手机模拟360×780、390×844、740×360，UA包含MicroMessenger，模型覆盖视口，面板正确开关。详见validation/。仅模拟微信UA与屏幕，尚未真机测试。

只读诊断：`houseViewer.diagnostics`、`.roofCoverage()`、`.bakedMaps`、`.finishes`、`.doors`、`.building`。场景数据通过`houseBakeSource()`导出。修改后必须构建，并检查公开部署。

## 迁移与发布

源工作区和旧版V3–V6保留。新项目采用`src`、`plans`、`references`、`context`、`validation`及`docs`布局。GitHub仓库和Pages目标为`aimspike/hangzhou-89a-house-viewer`，Pages入口`docs/index.html`。实际发布状态记录在`context/DEPLOYMENT.md`。

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

项目现位于 `D:/hangzhou-89a-house-viewer`，原位置为 `C:/Users/Admin/Documents/Codex/hangzhou-89a-house-viewer`。全部源码、图纸、Git历史及完整本地会话备份已迁移；早期工作区work/outputs归档在 `.local/legacy-workspace/`。183个项目文件及1086个历史文件复制后逐一SHA256核对一致，再在D盘重新构建和验证。

后续命令与编辑明确使用D盘项目，切勿继续改历史C盘目录。桌面本轮cwd不会自动切换；后续从D盘目录打开项目。
