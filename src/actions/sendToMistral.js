import { Mistral } from '@mistralai/mistralai';
import 'dotenv/config';

export async function analyzeLogsWithMistral(logsArray) {
  // Берём токен непосредственно в момент вызова функции
  // Проверь, как у тебя в .env: MISTRAL_TOKEN или MISTRAL_API_KEY
  const apiKey = process.env.MISTRAL_TOKEN || process.env.MISTRAL_API_KEY;

  if (!apiKey) {
    throw new Error('Токен Mistral (MISTRAL_TOKEN / MISTRAL_API_KEY) не найден в .env файле');
  }

  if (!logsArray || logsArray.length === 0) {
    return 'Нет логов для анализа.';
  }

  // Создаем клиент прямо здесь, когда токен точно существует
  const client = new Mistral({ apiKey });

  const logsText = logsArray.join('\n');

  const systemPrompt = `Ты — опытный системный администратор Ubuntu Linux. 
Твоя задача — проанализировать системные логи (syslog), выявить критические ошибки или сбои и предложить точные решения.

Правила:
1. Выбери из логов не более 2-3 самых важных уникальных проблем.
2. Для каждой проблемы четко укажи: суть, причину и пошаговое решение.
3. Ответ должен быть на русском языке, лаконичным и строго умещаться в 3000 символов.
4. Используй Markdown для оформления.`;

  try {
    console.log('[Mistral API]: Отправка запроса в Mistral AI...');
    
    const response = await client.chat.complete({
      model: 'mistral-large-2411',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Вот логи для анализа:\n\n${logsText}` }
      ],
      temperature: 0.2
    });

    let assistantMessage = response.choices[0].message.content;

    if (assistantMessage.length > 3500) {
      assistantMessage = assistantMessage.substring(0, 3450) + '\n\n[...Ответ обрезан из-за лимита символов...]';
    }

    return assistantMessage;

  } catch (error) {
    console.error('❌ Ошибка библиотеки Mistral AI:', error);
    throw new Error(`Не удалось запустить анализ Mistral: ${error.message}`);
  }
}