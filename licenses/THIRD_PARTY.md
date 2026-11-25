# 第三方授权

- Three.js r128、OrbitControls 和 FXAAShader：MIT，见 THREE-LICENSE.txt。Three Authors copyright 2010–2021。
- FXAA 原始算法：Timothy Lottes / NVIDIA，WebGL移植@supereggbert，版权说明保留在FXAAShader.js中。
- Lucide 图标子集：ISC，见 LUCIDE-LICENSE.txt，原始授权同时内嵌于HTML。

V16 feature 重建使用 Poly Haven 的四组 CC0 材质原始资产：

- [Oak Veneer 01](https://polyhaven.com/a/oak_veneer_01)：木饰面颜色、OpenGL 法线与粗糙度。
- [Fabric Pattern 05](https://polyhaven.com/a/fabric_pattern_05)：织物局部采样、OpenGL 法线与粗糙度；重建贴图去除大格纹并按原 A 风格调整。
- [Herringbone Parquet](https://polyhaven.com/a/herringbone_parquet)：人字拼地板颜色、OpenGL 法线与粗糙度。
- [Marble 01](https://polyhaven.com/a/marble_01)：石材局部颜色、OpenGL 法线与粗糙度。

[Poly Haven 官方许可](https://polyhaven.com/license)将资产以 CC0 提供，允许修改、商业使用与再分发。原始下载 URL、许可与 SHA256 见 `assets/rebuild/materials/sources.json`，处理过程在 `scripts/prepare_rebuild_materials.py`。网页使用处理后的内嵌资产，运行时不访问 Poly Haven。原始纹理与 Blender 源模型均保留在仓库，参考图不作为纹理直接贴入模型。

云、城市、小区及未替换的程序材质由本项目代码生成。重建几何由本项目按家装 A 参考风格编写，尺寸沿用当前近似户型布置，不能作为施工尺寸。
