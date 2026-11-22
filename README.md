 <div align="center">

# NitiMitra

### Government benefits, explained in your language.

**Making public scheme information easier to discover, understand, and explore.**

<br/>

[![React](https://img.shields.io/badge/React-Frontend-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Type_Safe-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.x-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![OpenAI](https://img.shields.io/badge/OpenAI-AI_Integration-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com/)

<br/>

**English · తెలుగు · हिन्दी**

<br/>

*A multilingual civic information assistant built to make government scheme information more accessible.*

</div>

---

## ◈ The Vision Behind NitiMitra

Public welfare schemes can make a meaningful difference in people's lives. However, finding relevant information, understanding eligibility requirements, and identifying the documents needed to apply can be difficult.

Information is often spread across different websites, presented in complex language, or difficult to understand for people who prefer regional languages.

**NitiMitra brings scheme discovery and preliminary guidance into one accessible digital experience.**

It helps users explore available scheme records, understand eligibility conditions, review document requirements, and interact with an AI-powered multilingual assistant.

> **Our idea is simple:** Public information should be easier to find and easier to understand, regardless of the language a person speaks.

## ◈ Explore NitiMitra

| Feature | What it offers |
|---|---|
| 🔎 Scheme Explorer | Search and explore scheme records. |
| 🗂️ Category Discovery | Browse schemes by their categories. |
| 📋 Scheme Details | Understand benefits, eligibility and application steps when data is available. |
| 🎯 Smart Eligibility Checker | Evaluate structured eligibility conditions. |
| 📑 Document Checklist | Review scheme-specific document requirements when provided. |
| 🤖 AI Assistant | Ask questions through an AI-powered conversational interface. |
| 🌐 Multilingual Experience | Navigate in English, Telugu and Hindi. |
| 🔗 Source Awareness | Distinguish verified information from unverified or demonstration records. |

## ◈ Designed for Everyone

NitiMitra supports three interface languages.

<div align="center">

| English | తెలుగు | हिन्दी |
|:---:|:---:|:---:|
| Explore schemes | పథకాలను అన్వేషించండి | योजनाएँ खोजें |
| Check eligibility | అర్హతను తెలుసుకోండి | पात्रता जाँचें |
| Ask questions | ప్రశ్నలు అడగండి | सवाल पूछें |

</div>

The language selector allows users to change their interface language. Scheme information remains identified according to the language in which its underlying record is available; unofficial translations are not represented as official government translations.

## ◈ How NitiMitra Works

The application connects a user-friendly frontend with a Python backend, structured scheme information, eligibility evaluation, and AI assistance.

```mermaid
flowchart TD
    A["User"] --> B["NitiMitra Web Application"]
    B --> C["React + TypeScript"]
    C --> D["FastAPI Backend"]

    D --> E["Scheme Explorer"]
    D --> F["Eligibility Engine"]
    D --> G["Source Verification"]
    D --> H["AI Assistant"]

    E --> I[("Scheme Database")]
    F --> I
    G --> I
    H --> J["OpenAI Responses API"]
    H --> I

    J --> D
    I --> D
    D --> C
    C --> K["Multilingual User Experience"]
```

## ◈ Technology Behind the Project

<table>
<tr>
<td width="50%" valign="top">

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Lucide React

</td>
<td width="50%" valign="top">

### Backend

- Python
- FastAPI
- Pydantic
- SQLAlchemy

</td>
</tr>
<tr>
<td width="50%" valign="top">

### Database

- SQLite for local development
- SQLAlchemy ORM
- Structured relational records

</td>
<td width="50%" valign="top">

### AI Integration

- Official OpenAI Python SDK
- OpenAI Responses API
- Backend-side AI integration

</td>
</tr>
</table>

## ◈ Project Structure

```text
NitiMitra/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── models/
│   │   ├── routes/
│   │   └── ...
│   ├── .env.example
│   └── ...
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── data/
│   │   └── lib/
│   └── ...
│
├── docs/
│   └── screenshots/
│
├── .gitignore
├── README.md
└── spec.md
```

*The folder tree is a simplified overview. Refer to the repository for the complete structure.*

## ◈ Run NitiMitra Locally

Want to explore or contribute to NitiMitra? Follow these steps.

### Prerequisites

- Python
- Node.js and npm
- Git
- An OpenAI API key for live AI functionality

### 1. Clone the repository

```bash
git clone https://github.com/kanithikalikowsik/nitimitra-multilingual-scheme-assistant.git

cd nitimitra-multilingual-scheme-assistant
```

### 2. Configure the backend

```powershell
cd backend

python -m venv .venv

.venv\Scripts\activate

pip install -r requirements.txt
```

Configure your local `backend/.env` file using the project's `.env.example` as a reference.

Example:

```env
OPENAI_API_KEY=your_actual_api_key
OPENAI_MODEL=gpt-5.4-mini
OPENAI_TIMEOUT_SECONDS=30
```

Never commit your actual `.env` file or API key.

Start the backend:

```bash
uvicorn app.main:app --reload
```

Backend API documentation:

`http://localhost:8000/docs`

### 3. Start the frontend

Open a second terminal:

```bash
cd frontend

npm install

npm run dev
```

Open the local application:

`http://localhost:5173`

**Note:** Use the dependency installation instructions and environment configuration supplied with the actual project. The backend dependency filename and any required frontend API URL should be checked against the repository before running.

## ◈ API Overview

NitiMitra uses FastAPI to provide backend functionality.

| API area | Purpose |
|---|---|
| Health | Backend availability |
| Categories | Available scheme categories |
| Schemes | Listing, searching and filtering |
| Scheme Details | Retrieve an individual scheme |
| Eligibility | Questionnaire and eligibility evaluation |
| Assistant | AI-powered question and answer interface |

For the exact paths, request methods, and schemas, open the locally running API documentation at `/docs`.

## ◈ Trust, Privacy & Information Reliability

NitiMitra is designed with an important principle: **an answer should not be presented as verified government information without reliable supporting evidence.**

The project includes safeguards intended to:

- Distinguish verified sources from unverified records.
- Avoid treating demonstration information as official information.
- Evaluate eligibility only when supported by structured criteria.
- Avoid inventing official URLs or unsupported requirements.
- Keep OpenAI credentials on the backend.
- Handle unavailable information transparently.

**Current data limitation:** The development database has contained demonstration scheme information and no verified official source records in the latest recorded QA results. The availability of verified scheme-specific guidance therefore depends on adding and validating reliable source records.

## ◈ Project Status

NitiMitra has completed its main implementation and automated quality-assurance phases.

The project has included frontend, backend, multilingual support, eligibility evaluation, and AI integration work.

Actual live AI availability, verified scheme-data coverage, and production deployment must be evaluated separately. Passing automated tests does not by itself establish that every production feature is live.

## ◈ Future Possibilities

NitiMitra can continue evolving through:

- Broader verified government scheme coverage.
- More Indian regional languages.
- Side-by-side scheme comparison.
- Improved accessibility for different user groups.
- More comprehensive document guidance.
- Production analytics and reliability improvements.
- Additional verified government information sources.

## ◈ Why This Project Matters

Technology is most meaningful when it helps people solve real problems.

NitiMitra explores how modern web technologies and multilingual AI assistance can make public information easier to understand and navigate.

The objective is not to replace official government portals, but to help people better understand the information available through reliable sources.

---

<div align="center">

## Built with purpose. Designed for accessibility. Powered by technology.

**NitiMitra**

*Government benefits, explained in your language.*

<br/>

[![GitHub Repository](https://img.shields.io/badge/Explore-Source_Code-17324D?style=for-the-badge&logo=github&logoColor=white)](https://github.com/kanithikalikowsik/nitimitra-multilingual-scheme-assistant)

<br/>

**An independent civic-tech project. Not affiliated with any government department.**

</div>