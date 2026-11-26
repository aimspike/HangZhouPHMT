# 室内灯光与曝光对比

2026-11-26，从当前main自包含应用的真实WebGL画布采集。70张WebP原图，固定家装A/相机/时间/材质，五档分别是原值、灯70%、灯50%、相对曝光80%、相对曝光65%。PC1280×900与手机390×844/微信UA模拟；原画布由应用按设备像素比输出，详见captures.json。

night-strong.jpg、night-mild.jpg、noon-strong.jpg、noon-off-control.jpg为原图统一缩放和文字排版，没有修改图像亮度/色彩。contact-sheets.json列出源图哈希和摆放位置。曝光是renderer.toneMappingExposure的相对倍率，不是截图后调色；灯光用原界面控件。等待完整的Cycles数据及反射更新后截图，采集诊断代码不进入应用。

复现：本地8879服务 + node validation/capture-brightness-comparison.cjs；然后python scripts/compose_brightness_comparisons.py。报告为上级brightness-comparison.html。

当前应用/默认参数/用户设置/烘焙/模型均保持。图用于评审两种调整，建议优先灯50%、原曝光；未代表已经选定此默认，也不代表物理手机效果。
