# 启用个人账号云同步

当前发布版没有配置云服务。离线自动保存和设置导入/导出立即可用；邮箱登录与跨设备自动同步需完成以下部署。

1. 在 https://supabase.com/dashboard 创建自己的项目。数据库密码只在 Supabase 保存，不写入本仓库。
2. 在 SQL Editor 执行本目录的 `supabase.sql`，创建个人设置表、行级权限及版本比较保存函数。
3. 在 Authentication → Providers → Email 启用邮箱登录和注册。Authentication → Email Templates 中，将 Magic Link 模板正文改成包含验证码的文本，例如：`你的户型浏览器登录验证码是 {{ .Token }}。请勿转发。` 用户在网页内输入验证码，不需要微信跳转登录链接。
4. 将 Site URL 设为 `https://aimspike.github.io/hangzhou-89a-house-viewer/`。生产环境配置自己的 SMTP；Supabase 默认测试邮件服务通常只允许项目团队成员接收邮件，并有限流，不能直接当作面向所有访客的邮件服务。
5. 在 Project Settings → API / API Keys 找到项目 URL 与公开 publishable key（或 legacy anon key）。不要使用 secret/service_role key，它们拥有服务端权限。
6. 将公开信息填入 `src/cloud-config.json` 的 `url` 和 `publishableKey`，运行 `python src/build_house.py`，提交并推送，等待 Pages 发布。每位访客之后都能看到同一个云服务登录入口。也可先在网页“保存与账号同步 → 云服务连接”填入这两项，在当前浏览器试用；该连接不会自动传给其他设备。
7. 用两个浏览器分别登录同一邮箱。修改房间材质、门、灯光、楼层等设置，等待“已同步到云端”，另一个浏览器点“立即同步”或重新获得焦点，应恢复相同设置。

网页不使用外部 SDK。未配置时不发云请求，单 HTML 可继续离线打开。登录后使用 HTTPS 访问 Supabase Auth / PostgREST；账号令牌保存在该浏览器本地，用于后续刷新登录，不包含在设置导出文件或云端 payload 中。公共设备使用完毕应退出账号。

每个账号一份独立设置，RLS 限制只读写自己的 user_id。两个设备同时修改时会检测版本冲突，由用户选择云端或本机；不会自动覆盖尚未同步的另一版。离线期间先保存在当前账号的本地缓存，恢复网络后重试。退出账号恢复游客设置，不把上一个账号的数据自动传给下一个账号。

验证建议：匿名请求无法读取设置表；账号 A 读取账号 B 的 user_id 返回空；账号 A 插入/更新 B 的 user_id 被 RLS 拒绝；对同一 revision 连续保存，后一次返回 `settings_conflict`。服务部署后应进行真实邮箱、跨设备与 RLS 验证。本仓库的浏览器模拟服务测试只能验证客户端流程，不能替代云端权限验收。
