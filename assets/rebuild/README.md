# 家装 A 重建资产

基准为用户确认的 `references/interior/preset-a/`，沿用当前墙线、门洞和家具布局。目标是建立专业建筑可视化资产流程；完成本批资产不等同于全屋视觉效果或手机微信最终验收。

- `reference-a-master.blend`：Blender 5.3 可编辑米制源文件，16 个按资产编号组织的集合，已打包 PBR 图像。各集合为原点局部坐标，打开时可单独显示集合编辑。
- `models.json`：WebGL1 离线导出资源，high / mobile 两档；位置量化为 Uint16、法线为 Int8、UV 为 Uint16（恢复后误差约 0.0001 repeat）、索引为 Uint16，另含离线局部 AO。运行时只解码所需档位，材质按房间合并提交。
- `model-report.json`：两档三角形、顶点和材质组预算。
- `materials/`：Poly Haven 原始 CC0 输入及来源 / 哈希记录。
- `*-desktop-*.jpg`、`*-mobile-*.jpg`：处理后的颜色 / OpenGL 法线 / 粗糙度，1024 / 512px 两档。颜色作亮度归一化以继续支持个人底色；数据图不作 sRGB 解码。
- `material-assets.json`：构建内嵌的图像数据。网页运行时无需外部资源。

重建：先运行 `python scripts/prepare_rebuild_materials.py`，再运行 `blender --background --factory-startup --python scripts/rebuild_scene_assets.py`，最后 `python src/build_house.py`。原始下载文件已随库保留，重建无需网络。

`scripts/render_rebuild_studies.py` 从同一个 Blender 主文件渲染独立资产检查图，属于离线 Cycles 棚拍，报告必须和网页 WebGL 场景截图分别标明。它们不能代替网页效果或手机性能。

目前独立重建：沙发、茶几、电视柜、圆餐桌、曲木餐椅、多层吊灯、两间床及衣柜、餐边柜、冰箱、两组橱柜、书桌和浴室柜。房门、窗框、储藏架和洗烘保留之前细化模型；建筑整体照明仍使用原 219 张烘焙纹理，没有重算全屋 Cycles GI。


V16.1：共220个实体部件，管件焊接封口、旋转轴三角扇与闭合截面、被褥连续厚壳、连续水槽盆沿及橱柜收口。同一模型的全部材质使用同一位置量化网格，`parts`保存逐部件索引范围。导出后运行 `node validation/verify-rebuild-topology.cjs`，验证 high / mobile 的闭合、绕序、法线、退化面和指定装配接触；报告为 `validation/rebuild-topology.json`。UV / 硬法线处允许属性顶点分裂，几何坐标必须完全相同。不能把独立板件接触误判为实体非流形，也不能用全局双面材质掩盖缺面。
