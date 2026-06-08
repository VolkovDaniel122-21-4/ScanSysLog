# AI-Driven Syslog Monitoring & Alerting Utility

A lightweight, production-ready backend utility designed for proactive Linux server administration. It continuously monitors system logs (`syslog`), detects critical anomalies in real-time, leverages **Mistral AI** to instantly diagnose root causes, and dispatches structured alerts straight to a Telegram channel.

---

## The Core Purpose

Traditional server monitoring tools either flood administrators with cryptic raw log traces or require manual digging after a crash occurs. 

This utility shifts system management from **reactive fixing to proactive automation**. It doesn't just report *that* an error happened — it explains *why* it happened and how to fix it, using intelligent AI diagnostics at the moment of failure.

---

## Key Features

*   **Real-Time Log Parsing:** Continuously monitors system log inputs to capture errors the exact millisecond they occur.
*   **Intelligent Diagnostics via Mistral AI:** Passes isolated error signatures to Mistral LLM via API to receive a concise, human-readable breakdown of the system anomaly.
*   **Instant Automated Alerting:** Formats and delivers structured payloads (raw log data + AI troubleshooting recommendations) directly to an administrative Telegram chat.
*   **Fault-Tolerant Network Logic:** Features a robust retry mechanism to handle potential API rate limits or network hiccups gracefully without dropping the primary log stream.

---

## System Architecture & Principles

The application is built on modern backend engineering standards:
*   **Decoupled Design:** Log ingestion, AI processing, and alerting layers are strictly separated, ensuring that a network delay in the AI layer never crashes the core log monitoring.
*   **Root-Cause Focus:** Designed specifically to reduce "alert fatigue" by replacing raw, multi-line stack traces with actionable insights.
*   **Secure Environment:** Strict isolation of sensitive credentials (API keys, bot tokens) using secure environment variables.

---

## Tech Stack

*   **Runtime:** Node.js
*   **Language:** JavaScript (ES6+)
*   **AI Engine:** Mistral AI API
*   **Alerting Layer:** Telegram Bot API
*   **Target Environment:** Linux (Ubuntu LTS)

---

## ⚙️ Getting Started & Deployment

Follow these steps to configure and run the utility on your environment.

### 1. Prerequisites
Ensure you have **Node.js** (v18+ recommended) and **npm** installed on your Linux system.

### 2. Configuration
The utility uses environment variables for secure authentication. Create a `.env` file in the root directory of the project:

```
MISTRAL_API_KEY=your_mistral_api_key_here
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_target_telegram_chat_or_channel_id
```

### 3. Installation

```
npm install
```

### 4. Automation & Scheduled Execution (Hourly Cron)

To ensure continuous, hands-free monitoring, the utility is automated to run every hour with elevated (`sudo`) privileges. This is achieved by configuring a cron job directly within the **root user's crontab**, eliminating the need to hardcode sensitive sudo passwords into scripts.

To set up this automation on your Linux server:

1. Open the root crontab configuration:
```bash
sudo crontab -e
```

2. Add the following line at the end of the file to trigger the automation script at the beginning of every hour:
```
0 * * * * "/path/to/run.sh"
```