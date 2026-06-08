import dns from 'node:dns';

dns.setDefaultResultOrder('ipv4first');

import { Telegraf } from 'telegraf';
import { Mistral } from '@mistralai/mistralai';
import 'dotenv/config';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

// ======================================
// CONFIG
// ======================================

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const MISTRAL_TOKEN = process.env.MISTRAL_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!TELEGRAM_TOKEN) {
  throw new Error('TELEGRAM_TOKEN отсутствует');
}

if (!MISTRAL_TOKEN) {
  throw new Error('MISTRAL_TOKEN отсутствует');
}

if (!TELEGRAM_CHAT_ID) {
  throw new Error('TELEGRAM_CHAT_ID отсутствует');
}

const bot = new Telegraf(TELEGRAM_TOKEN);

const mistral = new Mistral({
  apiKey: MISTRAL_TOKEN
});

// ======================================
// LOG READER
// ======================================

async function getLastHourLogs() {
  console.log('[SYSLOG] Чтение логов...');

  // Флаг -n 400 скажет journalctl выдать ТОЛЬКО последние 400 строк за этот час
  const { stdout } = await execAsync(
    `journalctl --since "1 hour ago" -n 400 --no-pager -q`
  );

  if (!stdout.trim()) {
    return [];
  }

  // Теперь split не перегрузит память, так как строк гарантированно мало
  const lines = stdout
    .split('\n')
    .filter(Boolean);

  console.log(`[SYSLOG] Получено ${lines.length} строк`);

  return lines;
}

// ======================================
// MISTRAL
// ======================================

async function analyzeLogs(logs) {
  console.log('[MISTRAL] Анализ логов...');

const prompt = `
Ты Senior DevOps инженер Linux. Твоя задача — провести глубокий проактивный аудит предоставленного лога syslog (journalctl).

Внимательно проанализируй текст и выяви проблемы по следующим категориям:
1. КРИТИЧЕСКИЕ СБОИ: Kernel panic, Срабатывание OOM Killer, Segfaults, Hardware errors (MCE).
2. ДИСКОВАЯ СИСТЕМА: Ошибки ввода-вывода (I/O), проблемы монтирования, ошибки файловых систем, нехватка места.
3. СИСТЕМНЫЕ СЛУЖБЫ: Сбои systemd-сервисов (Core dumped, Failed), блокировки AppArmor/SELinux.
4. СЕТЕВОЙ СТЕК: Падение интерфейсов, ошибки DHCP, сбои DNS, TCP retransmissions, проблемы с firewall.
5. БЕЗОПАСНОСТЬ: Подозрительные сессии sudo, массовые ошибки авторизации.

СТРОГИЕ ПРАВИЛА ОФОРМЛЕНИЯ ДЛЯ ТЕЛЕГРАМА (Парсер Markdown):
1. Чтобы сделать текст жирным, оборачивай его СТРОГО в одиночные звездочки с двух сторон, например: *Мой Текст*.
2. НЕ используй знаки решеток (###) для заголовков. Заголовками служат строки с эмодзи.
3. НЕ ставь звездочки внутри других звездочек. Пример жирного заголовка с эмодзи: *🛑 AppArmor блокирует Discord*
4. Названия параметров пиши просто: *Суть*:, *Причина*:, *Решение*:.
5. НЕ используй разделительные линии из дефисов (типа ---). Вместо них разделяй блоки просто пустой строкой.
6. Любые команды Bash ОБЯЗАТЕЛЬНО оборачивай в блоки кода с новой строки.
7. КРИТИЧЕСКИ ВАЖНО: Внутри блока кода перед каждой командой напиши комментарий через знак #, объясняющий на русском языке, ЧТО КОНКРЕТНО ДЕЛАЕТ эта команда и к чему приведет её выполнение. Выполнять команды вслепую запрещено!
8. Ответ должен быть лаконичным, на русском языке, максимум 2200 символов. Если критических проблем нет, так и напиши.

План ответа:
*🔍 Анализ syslog: обнаруженные аномалии*
(Пустая строка)
*Эмодзи Категория: Название проблемы*
*Суть*: ...
*Причина*: ...
*Решение*: 
\`\`\`
# Комментарий: что делает первая команда
команда_1

# Комментарий: что делает вторая команда
команда_2
\`\`\`
(Пустая строка между блоками)
*📌 Итог*
*Критичность*: ...
*Общая рекомендация по здоровью системы*: ...
`;

  const response = await mistral.chat.complete({
    model: 'mistral-large-latest',
    temperature: 0.2,
    messages: [
      {
        role: 'system',
        content: prompt
      },
      {
        role: 'user',
        content: logs.join('\n')
      }
    ]
  });

  return response.choices[0].message.content;
}

// ======================================
// AUTO CHECK
// ======================================

async function runAnalysis() {
  console.log('[AUTO] Запуск анализа');

  try {
    const logs = await getLastHourLogs();

    if (!logs.length) {
      console.log('[AUTO] Логов нет');
      return;
    }

    const analysis = await analyzeLogs(logs);

    await bot.telegram.sendMessage(
      TELEGRAM_CHAT_ID,
      `🕒 *Отчет системы за последний час*:\n\n${analysis}`,
      { parse_mode: 'Markdown' } // Добавили эту опцию!
    );

    console.log('[AUTO] Отчет отправлен');

  } catch (err) {
    console.error('[AUTO ERROR]', err);

    try {
      await bot.telegram.sendMessage(
        TELEGRAM_CHAT_ID,
        `❌ Ошибка анализа:\n${err.message}`
      );
    } catch {}
  }
}

// ======================================
// START
// ======================================
async function start() {
  // Просто выполняем один цикл анализа логов за последний час
  await runAnalysis();
  
  // Принудительно завершаем процесс, чтобы Cron понимал, что задача выполнена
  process.exit(0);
}

start();