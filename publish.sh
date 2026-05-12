#!/bin/bash
# 英语打卡一键发布到 Netlify

export NETLIFY_AUTH_TOKEN=nfp_ikCFeVnt2ujfTG5792GBtE8zGmYKF2fb0545
export NETLIFY_SITE_ID=e263ee9b-e3e8-41ee-b605-9b8d6f58ea1a

cd "$(dirname "$0")"
npm run build
netlify deploy --dir=dist --prod
