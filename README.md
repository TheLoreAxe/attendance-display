# Tradeshow Attendance Dashboard

A live, visually engaging dashboard built with **React + Vite + TypeScript** for our company tradeshow. This app pulls real-time attendance data from a Google Sheet (populated by a separate check-in system) and displays it across three full-screen slides:

---

## Pages Overview

### 1. **CORE Offices Attendance**
- Bar graph showing **live headcount per CORE office**
- Updates automatically as new scans come in
- Clean, bold visuals optimized for large tradeshow displays

### 2. **HAR Offices Attendance**
- Same style as CORE — dedicated bar graph for **HAR office attendance**
- Side-by-side comparison potential when toggled

### 3. **Awards & Stats Slide**
- **Best Attendance**: Office with the highest turnout (percentage or raw count)
- **Last Arrival**: Most recent check-in with name and timestamp
- **Total Attendees**: Running count across all offices



---

## How It Works

1. **Check-in System** → Scans badge → Writes to **Google Sheet**
2. This app **reads the sheet every 10 seconds** (configurable)
3. Data is parsed and grouped by office (CORE vs HAR)
4. Charts auto-update — no refresh needed
<img width="2047" height="1062" alt="scoreboard1" src="https://github.com/user-attachments/assets/d2d9e975-d953-4f17-9bd0-ea6ebfa9b526" />
<img width="2047" height="1063" alt="scoreboard2" src="https://github.com/user-attachments/assets/bec8b91b-96d0-4f00-9086-8439bb16615e" />

---

## Tech Stack

- **React** + **Vite** – Fast dev server & builds
- **TypeScript** – Type safety for sheet data & config
- **Recharts** – Beautiful, responsive charts
- **Google Sheets API** – Direct read access (via service account)
- **Tailwind CSS** – Rapid, consistent styling for large screens

---

## Setup (Quick Start)

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd tradeshow-dashboard
npm install
