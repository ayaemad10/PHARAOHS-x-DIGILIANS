# 🔥 Flame in Freefall

**PHARAOHS x DIGILIANS · NASA Space Apps Challenge 2026**

Flame in Freefall is a web app about how fire behaves in microgravity: how it ignites, spreads and goes out in space, and how spacecraft sensors detect it. It is built on **1,412 real NASA experiments from 10 research programmes**, and it turns that data into AI-powered fire-safety insights for spacecraft and future missions to the Moon and Mars.

> 📖 **New here?** Start with **[READ-ME-FIRST.md](READ-ME-FIRST.md)**. It covers how to run the project, the pages, the data and troubleshooting.

---

## ✨ Features

| Page | What it does |
|---|---|
| **Home: Interactive Dashboard** | A one-screen dashboard with a 3D cabin model, five fire sensors and the real SAFFIRE-III fire timeline. Tabs cover Fire Response, Recommendations, Flame behaviour, Evidence, and Demo & media. |
| **Explore** | Browse and filter all 1,412 experiments, sort them by setting (station, lunar base, rover) and export them as CSV. |
| **Flame Lab** | The share of FLEX experiments that extinguished, shown beside a flame model. |
| **Mission Lab** | Compares Earth, ISS, Moon and Mars habitats, and ranks the experiments most relevant to each destination. |
| **Firewise AI** | An AI assistant (Groq) that answers only from the experiment records and cites every experiment it uses. |
| **Insights** | Key findings with figures, charts, cross-experiment insights and an evidence library. |
| **Compare** | Compares the 10 research programmes side by side, and up to 3 experiments at a time. |

## 🛠️ Tech Stack

- **Framework:** Next.js 16, React 19
- **Styling:** Tailwind CSS 4
- **3D & charts:** Three.js with React Three Fiber, Recharts
- **AI:** Groq API (GPT-OSS 120B), with a search-only fallback when the model is unavailable
- **Data processing:** Python (`scripts/merge_psi.py`)
- **Deployment:** Vercel

## 📊 Data

The app uses 1,412 experiments from 10 NASA research programmes. Most come from the NASA Physical Sciences Informatics (PSI) system, and the rest from published reports:

ACME · FLEX · CFI · BASS / BASS-II · SAME / SAME-R · SPICE · Counterflow extinction · SAFFIRE (I–VI) · Cool flames · LUCI

The merge report is in `data/real/merge_report.json`. For more detail on each source, see [READ-ME-FIRST.md](READ-ME-FIRST.md#4-الداتا).

## 🚀 Getting Started

**Requirement:** Node.js 20.9 or later.

```bash
npm install
npx next build
npx next start -p 3005
```

Then open <http://localhost:3005>. On Windows, you can double-click `RUN-APP.bat` instead.

To use **Firewise AI**, copy `.env.example` to `.env.local` and add your `GROQ_API_KEY`. Without a key, the app still works, and Firewise returns the matching experiment records instead of a generated answer.

---

## 👥 Project Team

This project was built by a team of five.

| # | Team Member | Role | GitHub |
|---|---|---|---|
| 1 | Aya Emad | Project Owner | [@ayaemad10](https://github.com/ayaemad10) |
| 2 | Abdelrahman | Team Member | [GitHub Profile](https://github.com/abdelrahman1999osman-Da) |
| 3 | Marwa | Team Member | [GitHub Profile](https://github.com/marwaalaa254-wq) |
| 4 | Abdelrhman Khaled | Team Leader Member | [GitHub Profile](https://github.com/Abdelrhman-Khaled-Abdulmoneam) |
| 5 | Aisha Alsadani | Team Member: Interactive Dashboard (Home) | [@aishaalsadani](https://github.com/aishaalsadani) |

Team CVs are in [`Team_Member_CV/`](Team_Member_CV).

## 🤝 Team Collaboration

We are a team of five working together on research, development, implementation and innovation. Every member contributed through collaborative work, knowledge sharing and technical development.

Built together with passion, teamwork and innovation. 🚀
