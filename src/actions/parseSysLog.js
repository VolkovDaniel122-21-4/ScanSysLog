import fs from 'fs';
import readline from 'readline';

function getLogFingerprint(line) {
  const parts = line.split(' ');
  const messageWithoutTime = parts.slice(1).join(' ');
  return messageWithoutTime.replace(/audit\(\d+\.\d+:\d+\)/, 'audit()');
}

export async function getSyslogLastHour() {
  const logPath = '/var/log/syslog';
  const uniqueLogs = [];
  const seenFingerprints = new Set();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  try {
    await fs.promises.access(logPath, fs.constants.R_OK);
  } catch (err) {
    throw new Error(`Нет доступа к файлу ${logPath}. Нужен sudo или группа adm.`);
  }

  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const line of rl) {
    if (!line.trim()) continue;

    const firstWord = line.split(' ')[0];
    const logTime = new Date(firstWord);

    if (!isNaN(logTime.getTime()) && logTime >= oneHourAgo) {
      const fingerprint = getLogFingerprint(line);

      if (!seenFingerprints.has(fingerprint)) {
        seenFingerprints.add(fingerprint);
        uniqueLogs.push(line);
      }
    }
  }

  return uniqueLogs;
}