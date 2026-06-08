@echo off
chcp 65001 >nul
title SMARTBOX V10.8.1 PROXY SERVER
cd /d "D:\DAUTU\GET_link_tiktok\Tool_tim_vang\kenh_radio"
echo ================================================================
echo SMARTBOX V10.8.1 PROXY SERVER
echo Health: http://localhost:8899/health
echo Proxy : http://localhost:8899/proxy?url=
echo ================================================================
python SMARTBOX_V10_8_1_PROXY_SERVER.py
pause
