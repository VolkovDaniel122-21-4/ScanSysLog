import 'dotenv/config';
import { getSyslogLastHour } from './parseSysLog.js';
import { analyzeLogsWithMistral } from './sendToMistral.js';

const targetChatId = process.env.TELEGRAM_CHAT_ID;

export function startHourlyLogAnalysis(bot) {
  if (!targetChatId) {
    console.warn('⚠️ [Авто-планировщик]: TELEGRAM_CHAT_ID не задан. Автоматический анализ логов отключен.');
    return;
  }

  const ONE_HOUR = 60 * 60 * 1000;

  async function runCheck() {
    console.log('[1] runCheck стартовал');

    try {
      console.log('[2] Получаем логи...');

      const logs = await getSyslogLastHour();

      console.log('[3] Логи получены');
      console.log(logs);

      if (logs.length === 0) {
        console.log('[4] Логов нет');
        return;
      }

      console.log('[5] Отправляем в Mistral...');

      const aiAnalysis = await analyzeLogsWithMistral(logs);

      console.log('[6] Ответ Mistral получен');
      console.log(aiAnalysis);

      console.log('[7] Отправляем сообщение в Telegram...');

      await bot.telegram.sendMessage(
        targetChatId,
        `🕒 Автоматический отчет:\n\n${aiAnalysis}`
      );

      console.log('[8] Сообщение отправлено');

    } catch (error) {
      console.error('❌ ОШИБКА runCheck:', error);
    }
  }

  // СРАЗУ ВЫЗЫВАЕМ ПРОВЕРКУ ПРИ ЗАПУСКЕ (Пункт 8.2)
  runCheck();

  // Затем взводим ежечасный интервал
  setInterval(runCheck, ONE_HOUR);
  console.log('📅 [Система]: Ежечасный таймер для ScanSyslog успешно запущен.');
}