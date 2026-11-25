# Cycles 固定场景烘焙

本目录保存 `scripts/export_static_bake_scene.cjs` 导出的实际网页场景，以及 `scripts/bake_static_cycles.py` 使用 Blender 5.3 / Cycles OptiX 生成的离线数据。运行时继续 WebGL1，不执行路径追踪。

- `scene.json.gz`：完整高度的墙、顶、地、门与已经组装的家具；包含桌面与手机模型、毛坯和 A 的材质底色以及默认门状态。没有凭近似盒子重建家具。
- `bare-bake.blend`、`a-bake.blend`：烘焙场景的可编辑快照；生成结果中的影像另存为 PNG，不依赖本地绝对路径运行网页。
- `static-lighting.json`：主应用内嵌的包，包含 PNG、固定组合、UV 图集位置、顶点采样引用与来源哈希。单 PNG 与 JSON 中的影像逐字节一致。
- `*-atlas-*.png`：1024 方形图集；sky 为天光的直接与间接漫反射，morning/noon/dusk 为对应太阳的直接与间接漫反射，lamps 为室内灯的直接与间接漫反射；ao 为全场景局部遮蔽。光照图保存 sqrt(linear / 8)，AO 保存线性 0–1。
- `*-vertices-*.png`：同一场景的家具顶点照明与 AO。high / mobile 独立烘焙；模型位置与法线哈希、采样下标负责准确映射，未使用桌面顶点近邻替代手机烘焙。
- `*-reflection-*.png`：每套布局 10 个房间、每房间5个线性辐射分量的256×128全景；与照明同样分离天光、三个太阳方向及灯光。网页按当前控制值组合后预滤波为 PMREM。反射材质使用实际底色和粗糙度，未复制室外城市全部细节或材质纹理。

四个既有时段 × 开/关灯 × 毛坯/A = 16种固定状态。天光、太阳、灯光保持分离，日光/天光/灯光强度控件参与线性组合。匹配固定状态时，新漫反射取代旧漫反射，避免重复加光；旧建筑219张贴图保留作为其他状态回退。已有建筑快照、墙线、门洞与 uv2 保持。

默认参考为入户门关闭、6扇房门平开且打开。改变门型/开关/透明、墙顶地材质或隐藏天花板后使用原有实时/旧烘焙路径，避免固定阴影与反射错位；不会覆盖用户设置。AO 只对已含遮挡的漫反射轻量使用，建筑 AO 主要约束环境高光，避免将接触遮蔽反复叠黑。

重新生成：启动本地8879服务，运行导出脚本，再执行 `blender --background --factory-startup --python scripts/bake_static_cycles.py`，最后运行 `python src/build_house.py`。导出、烘焙和资源检查中间文件在 `work/static-bake/`。`STATIC_REUSE_REFLECTIONS=1` 仅供同一导出场景、反射配置未改时复用已有反射PNG；正式默认运行全量重生成。

验证范围与实际对比见 `validation/verify-static-bake-data.cjs`、`verify-static-lighting.cjs` 和 `docs/quality-report/static-lighting.html`。手机视口/微信UA与Windows WebKit均为模拟，没有真机微信结论。烘焙单位为网页视觉标定，不能作为实际灯具照度或施工方案。
