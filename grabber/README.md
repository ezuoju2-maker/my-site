# 抓号层

交互式脚本，用于在本地处理待抓订单。

## 工作原理

由于小红书/抖音等平台是**手机 App 授权**（不是网页 OAuth），
Termux 无法自动抓取 Cookie。因此抓号层采用**人工辅助模式**：

1. 脚本拉取后端待抓订单
2. 用户选择要处理的订单
3. 用户根据脚本提示，打开手机 App 查看自己账号的 ID 和昵称
4. 用户把 ID 和昵称输入脚本
5. 脚本提交到后端，网页自动刷新为「抓号成功」

## 前置准备

**在 Cloudflare Worker 上配置过 `GRAB_WORKER_SECRET`**（你之前已配置）。

## 使用方法

在 Termux 或电脑上：

```bash
cd ~/my-site

# 设置密钥（和 Cloudflare 上的一致）
export GRAB_WORKER_SECRET="你的64位hex密钥"

# 可选：指定后端地址（默认生产环境）
# export GRAB_API_BASE="https://my-site-n7j.pages.dev"

# 运行
node grabber/index.mjs
