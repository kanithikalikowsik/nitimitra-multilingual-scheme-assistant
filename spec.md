# NitiMitra – Project Specification

## 1. Project Overview

**Project Name:** NitiMitra  
**Tagline:** Government benefits, explained in your language.  
**Hackathon:** Idea Forge Hackathon  
**Track:** Track 1 – Civic Pulse, Digital Governance & Public Information  
**Problem Statement:** Multilingual Policy, Rights & Scheme Explainer

NitiMitra is an AI-assisted multilingual citizen information platform that helps people understand Indian government schemes, eligibility requirements, required documents, application procedures, and important public information in simple language.

The platform initially supports English and Telugu.

Its primary purpose is to make government information easier to understand, especially for people who face language and information barriers.

## 2. Problem Statement

Many citizens find it difficult to understand government schemes because:

- Official information can be complicated.
- Information is distributed across different government websites.
- Eligibility conditions and required documents can be confusing.
- Language barriers make it difficult to access information.
- Citizens may struggle to identify the correct official application portal.

NitiMitra aims to simplify access to this information through a clear and multilingual interface.

## 3. Proposed Solution

NitiMitra provides a single platform where users can:

1. Search for government schemes.
2. Understand schemes in simple English or Telugu.
3. Check eligibility requirements.
4. View required documents.
5. Follow application instructions.
6. Ask questions using an AI-powered assistant.
7. Access official government information sources.

The platform is an information and guidance assistant. It does not make official eligibility decisions or submit government applications.

## 4. Target Users

- Students
- Farmers
- Women
- Senior citizens
- Job seekers
- Low-income families
- Citizens who prefer Telugu explanations

## 5. Core Features

### Feature 1: Multilingual Interface

- English and Telugu language options.
- Language switching without losing the current page.
- Simple and readable language.
- Mobile-friendly design.

### Feature 2: Government Scheme Explorer

- Browse available government schemes.
- Search by scheme name or keyword.
- Filter by category.
- Display scheme descriptions.
- Show eligibility, benefits, and application steps.

### Feature 3: AI Scheme Assistant

- Users can ask questions in English or Telugu.
- Explain government policies in simple language.
- Provide answers based on the platform's verified information.
- Include relevant official source links.
- Clearly communicate when information is unavailable.

### Feature 4: Eligibility Guidance

- Ask relevant questions about the user's circumstances.
- Compare provided answers with published scheme conditions.
- Display possible eligibility, possible ineligibility, or insufficient information.
- Explain which conditions need further verification.

The result is preliminary guidance, not an official eligibility decision.

### Feature 5: Required Documents

- Display the documents listed by the official scheme source.
- Explain why each document may be needed.
- Provide a checklist users can review.

### Feature 6: Application Guidance

- Show application steps in order.
- Display the official application website.
- Explain important instructions.
- Never pretend an application has been submitted.

### Feature 7: Official Source Verification

Every scheme record should contain:
- Official scheme name.
- Government department or authority.
- Official source URL.
- Last verified date.
- Available eligibility information.
- Benefits and application instructions.

Unverified information must not be presented as confirmed government policy.

## 6. Main Application Pages

### Home Page
- Professional navigation bar.
- Hero section introducing NitiMitra.
- Search government schemes.
- Popular scheme categories.
- How it works section.
- AI assistant introduction.
- Footer with information and disclaimers.

### Scheme Explorer
- Search bar.
- Category filters.
- Scheme cards.
- Scheme details navigation.

### Scheme Details
- Scheme overview.
- Benefits.
- Eligibility conditions.
- Required documents.
- Application steps.
- Official source links.
- Last verified date.

### AI Assistant
- Chat interface.
- English and Telugu support.
- Suggested questions.
- Source references.
- Clear uncertainty messages.

### Eligibility Checker
- Simple guided questions.
- Condition-by-condition comparison.
- Preliminary result.
- Explanation and verification links.

## 7. Initial Scheme Categories

- Education and Scholarships
- Agriculture
- Women and Child Welfare
- Employment and Skill Development
- Healthcare
- Housing
- Social Security

Start with a small, carefully verified collection of schemes. Expand the collection after the MVP works correctly.

## 8. Technology Stack

### Frontend
- React.js
- Vite
- TypeScript
- Tailwind CSS
- React Router
- Lucide Icons

### Backend
- Python
- FastAPI
- Pydantic

### Data Storage
- SQLite for initial local development.
- A database abstraction that allows PostgreSQL migration later.

### AI Integration
- OpenAI API through the backend.
- Server-side API key management.
- Retrieval from verified scheme information.
- Answers must include source references where available.

### Deployment
- Frontend: Vercel
- Backend: Render

Deployment is a later phase, after local testing.

## 9. Design System

**Design Direction:** Modern, trustworthy, accessible public-service platform.

Suggested colors:

- Primary Navy: #17324D
- Secondary Teal: #167C80
- Background: #F5F7FA
- Surface: #FFFFFF
- Accent Saffron: #E9A23B
- Main Text: #263445
- Muted Text: #687789
- Error: #C74747
- Success: #26845B

Typography:
- Headings: Manrope
- Body: Inter

Design requirements:
- Clean navigation.
- Professional cards.
- Consistent spacing.
- Subtle animations.
- Clear buttons and labels.
- Responsive mobile, tablet, laptop, and desktop layouts.
- Accessible text contrast and keyboard navigation.
- Telugu font support.

Avoid cluttered layouts and excessive gradients.

## 10. AI Safety and Information Accuracy

This is a critical requirement.

1. AI must not invent government schemes, benefits, eligibility rules, or application links.
2. Answers should use the platform's verified scheme information.
3. Every factual scheme answer should provide supporting sources.
4. If verified information is unavailable, the assistant must say so.
5. Eligibility results must be labelled preliminary.
6. The platform must not claim to be an official government service.
7. Personal information must not be unnecessarily collected or stored.
8. API keys must remain on the backend.
9. AI must not submit applications or make decisions on behalf of government authorities.
10. Display a disclaimer that users should verify important information through official government sources.

## 11. MVP Scope

The first working version must include:

- Professional responsive home page.
- English and Telugu language switching.
- Government scheme explorer.
- Scheme detail pages.
- Verified sample scheme dataset.
- Basic eligibility guidance.
- AI assistant with source-grounded answers.
- Official source links.
- Clear error and empty states.

Prioritize working features over unnecessary complexity.

## 12. Non-Goals

The initial version will not:

- Submit government applications.
- Process payments.
- Access government citizen databases.
- Verify identity using Aadhaar.
- Make official eligibility decisions.
- Guarantee approval of any benefit.
- Collect sensitive personal documents.
- Claim affiliation with a government department.

## 13. Development Phases

**Phase 1:** Project setup, specification review, and architecture.

**Phase 2:** Responsive frontend and design system.

**Phase 3:** Scheme explorer and scheme details using verified sample data.

**Phase 4:** Backend APIs and database integration.

**Phase 5:** English and Telugu language support.

**Phase 6:** Eligibility guidance.

**Phase 7:** AI assistant and source-grounded responses.

**Phase 8:** Testing, security review, and bug fixing.

**Phase 9:** Deployment and hackathon presentation preparation.

Complete and test each phase before moving to the next.

## 14. Definition of Success

NitiMitra will be considered a successful MVP when:

- Users can navigate the platform easily.
- Users can discover schemes.
- Scheme details are understandable in English and Telugu.
- Eligibility guidance is transparent.
- AI responses are grounded in available verified information.
- Official sources are accessible.
- The application works across mobile and desktop screens.
- No secrets are exposed in the frontend or GitHub repository.
- The project can be demonstrated reliably.

## 15. Project Mission

Make government information understandable, accessible, and useful to every citizen, regardless of language or technical knowledge.

**NitiMitra – Government benefits, explained in your language.**