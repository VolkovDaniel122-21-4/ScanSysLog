#!/bin/bash
# Переходим в папку проекта, чтобы dotenv нашел файл .env
cd "/home/devuser/My Empire/Programs/ScanSyslog"

# Запускаем node через sudo с сохранением окружения (-E)
/usr/bin/node ./src/index.js >> ./cron.log 2>&1
