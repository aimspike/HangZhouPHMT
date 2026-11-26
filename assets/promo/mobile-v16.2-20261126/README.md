# V16.2 全新展示素材 · 2026-11-26

本轮按用户要求重新录制全部七章视频、重新拍摄六宫格。正式发布系列为v1.1，应用版本仍V16.2。素材采自main的`d1c85ee`，应用HTML规范化SHA256 `3e0c591f57b606c3a6b1fdf3f1a02bcc51bc4ca4181fe16c9b6c67a3ac114421`。

- [60秒视频](mobile-feature-tour-60s-v6.mp4)：1080×1920、30fps、1800帧、H.264/yuv420p、AAC双声道、MP4 fast start。
- [同步字幕](mobile-feature-tour-60s-v6.srt)、[封面](mobile-video-cover-60s-v6.jpg)、[1800×2400六宫格](app-features-six-grid-v4.png)。
- [原始截图](captures/)、[采集记录](capture.json)、[媒体规格](media-info-60s-v6.json)、[逐帧检查](frame-audit.json)、[播放验证](release-media-validation.json)。
- [正式展示入口](https://aimspike.github.io/HangZhouPHMT/promo/)、[main素材预览](https://aimspike.github.io/HangZhouPHMT/preview/main/promo/)。旧版素材保留。

三维/平面、家装漫游、毛坯漫游、四时段、装修切换、材质/门/楼层七章依次为8/6/8/11/9/7/11秒。全部1倍速。Chrome390×844手机视口、deviceScaleFactor2、微信UA，录屏尺寸与CSS视口一致；录制中不截图，独立会话重新拍照。图文外框/分屏/字幕为后期排版，场景没有AI重绘或补光。浏览器模拟不是物理手机或微信真机测试。

保留既有自然普通话神经女声及原创96BPM器乐；末章重新合成同一女声，纠正“自动保存”为“本次调整仅本次浏览有效”。字幕按词语边界对齐，声音原速无拉伸。录制期间赞赏提示不在最终章节内。

新视频1800帧完整解码通过，固定上方UI及全手机画面的15帧时间中位数检查没有瞬时缩放候选。桌面/手机视口有声播放、各20处跳转通过。毛坯样本0家具且可通行；阳台昼夜同机位并关室内灯；贴图219/219，视口390×844与画布780×1688保持。视频/海报并非全屋无瑕疵承诺，VIS-04门配置导致全局照明回退、VIS-05枕头接缝暗点仍见[第三轮审计](../../../context/VISUAL_AUDIT3_2026-11-26.md)。用户本轮已明确要求正式发布，未自动修复上述问题。

中间录屏、音频和制作脚本仅在`work/mobile-promo-r6/`及`work/*promo-r6*`，不提交。正式素材副本在`docs/promo/`，主应用仍单HTML、自包含，不增加启动请求。
