# Adesh Boudh — Master Career Document

> Last updated: March 2026
> Purpose: Long-term career tracking, resume source of truth, interview prep reference, AI assistant briefing doc.

---

## Table of Contents

1. [Personal Information](#1-personal-information)
2. [Career Identity & Positioning](#2-career-identity--positioning)
3. [Skills & Proficiency](#3-skills--proficiency)
4. [Work Experience — Full Detail](#4-work-experience--full-detail)
5. [Personal Projects — Full Detail](#5-personal-projects--full-detail)
6. [Education](#6-education)
7. [Interview Narratives](#7-interview-narratives)
8. [Career Strategy & Goals](#8-career-strategy--goals)
9. [Salary & Compensation Context](#9-salary--compensation-context)
10. [Constraints & Logistics](#10-constraints--logistics)
11. [Gaps & Development Areas](#11-gaps--development-areas)
12. [Resume Versions Log](#12-resume-versions-log)

---

## 1. Personal Information

| Field       | Detail                                           |
| ----------- | ------------------------------------------------ |
| Full Name   | Adesh Boudh                                      |
| Email       | adeshboudh16@gmail.com                           |
| Phone       | +91 9109516207                                   |
| LinkedIn    | linkedin.com/in/adeshboudh                       |
| GitHub      | github.com/adeshboudh                            |
| Location    | Hyderabad, India (currently); open to relocation |
| HuggingFace | huggingface.co/adesh01                           |

---

## 2. Career Identity & Positioning

### Who You Are (Honest Assessment)

AI/ML Engineer with ~1 year of combined experience (internship + full-time) in production AI systems. Not a researcher. Not a data scientist. An engineer who builds things that work — RAG pipelines, LLM integrations, cloud-based conversational AI, and backend AI infrastructure.

### Positioning Statement

> "Engineer specializing in production-grade LLM systems, RAG pipelines, and scalable AI backend infrastructure."

### Target Roles (in priority order)

1. AI/ML Engineer (0–2 years experience)
2. LLM Engineer
3. Applied AI Engineer
4. Backend AI Engineer

### Roles to Avoid

- Pure Data Scientist roles (no publications, not your strength)
- Research Engineer roles (require academic background)
- Android/Java/mobile development (not your domain)
- Pure MLOps without AI/ML component

### Recommended Specialization

**RAG Systems Engineering** — you have the deepest, most demonstrable experience here via CivicSetu. This is also one of the highest-demand niches in applied AI right now.

### Market Positioning

- Currently undervalued due to low last salary (₹2.4 LPA) and short tenure
- Real market value: ₹6–10 LPA with correct positioning
- Key differentiator from other freshers: you have live, production deployed systems, not just toy projects

---

## 3. Skills & Proficiency

### Programming & Databases

| Skill      | Proficiency | Used In                        |
| ---------- | ----------- | ------------------------------ |
| Python     | Strong      | All projects and roles         |
| SQL        | Comfortable | CivicSetu (PostgreSQL queries) |
| PostgreSQL | Comfortable | CivicSetu                      |
| MongoDB    | Comfortable | Curie (FIS Clouds)             |
| Neo4j      | Comfortable | CivicSetu (graph traversal)    |

### AI/ML Expertise

| Skill                          | Proficiency | Used In                             |
| ------------------------------ | ----------- | ----------------------------------- |
| RAG Pipelines                  | Strong      | CivicSetu, Curie                    |
| LLMs                           | Strong      | All projects                        |
| NER (Named Entity Recognition) | Strong      | Curie (BioBERT, SciBERT, NCBI-BERT) |
| Fine-Tuning (SFT with LoRA)    | Comfortable | LLM Playground (UltraChat 200k)     |
| GRPO Alignment                 | Comfortable | LLM Playground                      |
| Reward Modelling               | Comfortable | LLM Playground                      |
| Deep Learning                  | Comfortable | LLM Playground (GPT-2 from scratch) |
| NLP                            | Comfortable | Curie, LLM Playground               |
| Generative AI                  | Strong      | FIS Clouds, Resolute AI             |

### Frameworks & Libraries

| Skill                     | Proficiency | Used In                                                |
| ------------------------- | ----------- | ------------------------------------------------------ |
| FastAPI                   | Strong      | CivicSetu, LLM Playground                              |
| PyTorch                   | Comfortable | LLM Playground                                         |
| Hugging Face Transformers | Comfortable | Curie, LLM Playground                                  |
| LangGraph                 | Comfortable | CivicSetu                                              |
| CrewAI                    | Comfortable | Resolute AI (Social Media Agent)                       |
| Ollama                    | Comfortable | CivicSetu (embeddings), Resolute AI (LLaMA deployment) |
| Streamlit                 | Comfortable | Resolute AI (chatbot UI)                               |
| PEFT / LoRA               | Comfortable | LLM Playground                                         |
| FlashRank                 | Used        | CivicSetu (reranker)                                   |
| LiteLLM                   | Used        | CivicSetu (LLM routing)                                |

### MLOps & Systems

| Skill           | Proficiency | Notes                                                              |
| --------------- | ----------- | ------------------------------------------------------------------ |
| Docker          | Comfortable | CivicSetu deployed on HF Spaces via Docker                         |
| Git / CI-CD     | Comfortable | All projects                                                       |
| REST APIs       | Strong      | FastAPI across multiple projects                                   |
| Kafka           | Basic       | Used in Curie — can consume/publish to topics. Not a Kafka expert. |
| pgvector (HNSW) | Comfortable | CivicSetu                                                          |
| Vector Search   | Comfortable | CivicSetu                                                          |
| Redis           | Used        | Resolute AI (patient document caching)                             |

### Cloud Platforms

| Platform | Services Used                                                     | Project                    |
| -------- | ----------------------------------------------------------------- | -------------------------- |
| GCP      | Dialogflow CX, Cloud Functions, Firestore, GCS, Artifact Registry | FIS Clouds                 |
| AWS      | Lex, Lambda, DynamoDB, EC2, ECR                                   | FIS Clouds (pre-migration) |

### Honest Proficiency Notes

- **Kafka:** Used in Curie to consume input and publish output between pipeline steps. Set up with GenAI assistance. Understand the producer/consumer model conceptually. Not qualified to design Kafka architecture independently yet. Needs 1–2 weekends of focused study to own this confidently in interviews.
- **TensorFlow:** Used briefly for small DL models ~1 year ago. Not current. Do not list on resume.
- **LangChain:** Not used. Only LangGraph. Do not conflate the two.
- **System Design:** Known gap. Not interview-ready yet. Needs deliberate practice.
- **DSA:** Known gap. Weak for competitive coding rounds. Needs Python-focused practice.

---

## 4. Work Experience — Full Detail

---

### Role 1: Associate AI/ML Engineer — FIS Clouds

**Duration:** June 2025 – November 14, 2025 (5.5 months)
**Location:** Hyderabad, India (On-site)
**Type:** Full-time
**Last Salary:** ₹2.4 LPA
**Departure Reason (Actual):** Terminated due to miscommunication between Adesh and management.
**Departure Reason (Interview Narrative):** "My role was deviating toward Android and Java development, away from AI/ML. I wanted to stay focused on AI/ML engineering, so I decided to move on." _(Use this consistently in all interviews.)_

#### Project 1: Globe-Bobot & PLDT Chatbot — Conversational AI Migration and Development

**Context:**
FIS Clouds was contracted to migrate a production Facebook Messenger chatbot for Globe Telecom (Philippines) from AWS to GCP. A separate PLDT (Philippines Long Distance Telephone) demo chatbot was also built from scratch to showcase capabilities to a new enterprise client.

**Your Role:**
Contributed to the design, migration, and development of enterprise-grade conversational AI systems on GCP.

**Technical Details:**

- **Globe-Bobot Migration:** The chatbot originally ran on AWS Lex (NLU) + Lambda (business logic) + DynamoDB (session state). Migrated entirely to GCP: Dialogflow CX (NLU), Cloud Functions (business logic), Firestore (session state).
- The original bot was button-based — users could only tap predefined options. Post-migration it became a hybrid conversational agent accepting free-text input with multi-turn conversation support.
- Total intents migrated: **25 intents**
- Lambda business logic was refactored into Cloud Functions. Shared code was modularized and published to GCP Artifact Registry, serving approximately **~50 Cloud Functions**.
- Firestore replaced DynamoDB for session state and conversation logging — enabling consistency across multi-turn flows.
- **PLDT Demo Chatbot:** Built entirely from scratch in Dialogflow CX. Designed **6 end-to-end conversational flows** with custom webhooks. Used Firestore as a mock backend to simulate real-time customer data retrieval during the demo.

**Tech Stack:** Python · Dialogflow CX · GCP (Cloud Functions, Firestore, Artifact Registry) · AWS (Lex, Lambda, DynamoDB) · Facebook Graph API

**Impact:** Improved chatbot flexibility and reusability while establishing a unified, modular architecture for future conversational AI deployments on GCP.

**Key Numbers:**

- 25 intents migrated
- 6 PLDT conversational flows built from scratch
- ~50 Cloud Functions served by the modularized Artifact Registry code

---

#### Project 2: Curie — RAG-Based Biomedical Knowledge Pipeline

**Context:**
An internal FIS Clouds project building a RAG-based biomedical document processing system. Adesh joined for approximately 1 week and was responsible for 2 specific steps of a larger downstream pipeline. Two developers (including Adesh) worked on these 2 steps.

**Your Role:**
Implemented the NER (Named Entity Recognition) and entity canonicalization steps of the pipeline.

**Technical Details:**

- **NER Pipeline:** Used fine-tuned transformer models — BioBERT, SciBERT, and NCBI-BERT — to extract biomedical entities: diseases, drugs, genes, and MeSH terms from research documents.
- **Entity Canonicalization:** Built a mapping layer to normalize extracted entities across standards: MeSH → SNOMED, Gene names → Gene IDs. Integrated BioPortal and MyDisease.info APIs for entity enrichment and metadata validation.
- **Pipeline Integration:** Consumed input messages from Kafka topics (upstream step), ran the NER + canonicalization pipeline, and published processed results to Kafka topics for the next downstream step.
- Dataset used for testing: **500+ research documents**
- Storage: processed entities stored in MongoDB and GCS.

**Tech Stack:** Python · BioBERT · SciBERT · NCBI-BERT · Hugging Face Transformers · Kafka · MongoDB · GCS · BioPortal API · MyDisease.info

**Impact:** Enabled structured entity extraction and normalization across 500+ biomedical documents, contributing to a scalable downstream knowledge pipeline.

**Honest Context (for your own reference, not for interviews):**

- Kafka was new to you and set up with GenAI tool assistance. You understand how to consume/publish to topics but are not a Kafka expert.
- This was a 1-week contribution to a larger system — don't overclaim ownership of the full pipeline.
- The 500 docs were for testing, not a full production run at scale.

---

### Role 2: AI/Backend Intern — Resolute AI

**Duration:** February 2025 – June 2025 (4 months)
**Location:** Remote
**Type:** Internship

#### Project 1: Social Media Agent

**Context:** Built a multi-agent system to automate generation of healthcare-focused social media content.

**Technical Details:**

- Framework: CrewAI
- Structure: 5 crews, 1 agent each, 1 custom tool
- LLM: Gemini
- Web search integration: Serper API (web + image search)
- Output: Healthcare-focused social media posts

**Tech Stack:** Python · CrewAI · Gemini LLM · Serper API · FastAPI

---

#### Project 2: LLaMA 3.1 (1B) Mental Health Chatbot

**Context:** Fine-tuned and deployed a local LLM for mental health conversations with multilingual support.

**Technical Details:**

- Base model: LLaMA 3.1 1B
- Fine-tuned for mental health conversation domain
- Converted to GGUF format for efficient local inference
- Deployed via Ollama for low-latency local serving
- Added Telugu language support using deep-translator library
- Frontend: Streamlit with a language selector

**Tech Stack:** Python · LLaMA 3.1 · GGUF · Ollama · Hugging Face · deep-translator · Streamlit

---

#### Project 3: Healthcare GenAI Chatbot — Latency Optimization

**Context:** An existing healthcare chatbot was taking ~25 seconds to respond on first message. Adesh identified the bottleneck and fixed it.

**The Problem:** Patient documents were being fetched from the database only after the user sent their first message. This caused a ~25 second delay on every new session.

**The Fix:** Shifted document fetching to happen at login time — as soon as the patient authenticated, their documents were fetched and stored in Redis cache. By the time the user sent their first message, the documents were already in memory.

**Result:** Response time reduced from ~25s to under 5s — an ~80% latency reduction.

**Key Numbers:**

- Before: ~25 seconds
- After: ~5 seconds
- Improvement: ~80% reduction
- Mechanism: Login-time prefetch + Redis caching

**Tech Stack:** Python · FastAPI · Redis · Hugging Face

**Why This Matters in Interviews:** This is a real engineering decision, not just "I used a library." You identified a retrieval bottleneck, understood the user flow, and redesigned when prefetching happens. This demonstrates systems thinking.

---

## 5. Personal Projects — Full Detail

---

### Project 1: CivicSetu — Open-Source Civic RAG System

**Live:** https://civicsetu-two.vercel.app
**GitHub:** github.com/adeshboudh/civicsetu _(update with correct URL)_
**Status:** Phase 4 complete — actively maintained, open to expansion

**What It Does:**
Ask a plain-English question about Indian RERA (Real Estate Regulation and Development Act). Get a cited, structured answer with section references, confidence score, and legal disclaimer — grounded in real legal text across 5 jurisdictions.

**Example Query:**

```
Query:  "Which state rules implement section 9 of RERA on agent registration?"

Answer: "Section 9 of the RERA Act 2016 governs agent registration at the central
level. Rule 11 of Maharashtra Rules 2017 and Rule 8 of Karnataka RERA Rules derive
from Section 9, specifying application procedures and timelines..."

Citations: [Section 9, RERA Act 2016], [Rule 11, Maharashtra Rules 2017],
           [Rule 8, Karnataka RERA Rules]
Confidence: 0.96 (high)
```

**Architecture:**

```
FastAPI → LangGraph Agent → pgvector + Neo4j + PostgreSQL
              ↑
    Ingestion Pipeline (PDF → chunks → embeddings → graph)
```

**Three-Store Retrieval Design:**

- **pgvector** — semantic similarity search via HNSW index (fact lookups)
- **Neo4j** — section graph traversal (cross-references, DERIVED_FROM edges between jurisdictions)
- **PostgreSQL** — full chunk text + metadata storage

**Key Technical Decisions (ADRs):**

1. **Three-store architecture** over single vector DB — enables hybrid semantic + structural retrieval
2. **Section boundary chunking** — chunks follow legal section boundaries, not arbitrary token windows
3. **LangGraph over LangChain chains** — stateful agent with explicit graph edges, better for multi-step legal reasoning
4. **Multi-format chunker** — handles different PDF layouts across jurisdictions
5. **Document registry** — tracks ingested documents to prevent re-ingestion

**Scale & Numbers:**
| Metric | Value |
|---|---|
| Total chunks | 1,203 |
| Jurisdictions covered | 5 (Central, MH, UP, KA, TN) |
| Graph nodes | 2,090 section nodes |
| Reference edges | 933 REFERENCES edges |
| Derived-from edges | 91 DERIVED_FROM edges |
| HAS_SECTION edges | 1,297 |
| E2E benchmark | 12/12 passing |

**Documents Ingested:**
| Document | Jurisdiction | Sections |
|---|---|---|
| RERA Act 2016 | Central | 224 |
| Maharashtra Real Estate Rules 2017 | Maharashtra | 214 |
| UP RERA Rules 2016 | Uttar Pradesh | 170 |
| UP RERA General Regulations 2019 | Uttar Pradesh | 85 |
| Karnataka RERA Rules 2017 | Karnataka | 235 |
| Tamil Nadu RERA Rules 2017 | Tamil Nadu | 157 |

**Production Infrastructure:**

- PostgreSQL + pgvector: Neon (free tier)
- Neo4j: AuraDB Free
- API: Hugging Face Spaces (Docker)
- LLM: LiteLLM with fallback routing (Gemini → Groq → OpenRouter)
- Embeddings: nomic-embed-text-v1.5 via sentence-transformers (local, ~550MB)

**Full Tech Stack:**
| Layer | Technology |
|---|---|
| API | FastAPI + Uvicorn |
| Orchestration | LangGraph StateGraph |
| LLM routing | LiteLLM (Gemini → Groq → OpenRouter) |
| Embeddings | nomic-embed-text-v1.5 via sentence-transformers (local) |
| Vector DB | pgvector + HNSW index |
| Graph DB | Neo4j Community |
| Relational | PostgreSQL + SQLAlchemy |
| Reranker | FlashRank (ms-marco-MiniLM-L-12-v2) |
| PDF parsing | PyMuPDF |
| Deployment | Docker on Hugging Face Spaces |

**Phase Roadmap:**
| Phase | Scope | Status |
|---|---|---|
| 0 | RERA Act 2016, vector RAG, FastAPI | ✅ Complete |
| 1 | Neo4j graph, cross-reference queries | ✅ Complete |
| 2 | MahaRERA Rules 2017, multi-jurisdiction | ✅ Complete |
| 3 | DERIVED_FROM edges, cross-jurisdiction graph | ✅ Complete |
| 4 | Multi-state expansion (UP, TN, Karnataka) | ✅ Complete |
| 5 | Open-source SaaS, UI, public API | ✅ Complete |

**Why This Matters for Interviews:**
This project demonstrates everything a RAG Systems Engineer needs: retrieval architecture decisions, hybrid search, graph-based reasoning, legal domain complexity, evaluation (12/12 E2E), production deployment, and open-source ownership. It is your single strongest proof point.

---

### Project 2: LLM Playground — LLM Pre-Training & Alignment System from Scratch

**GitHub:** github.com/adeshboudh/llm-playground _(update with correct URL)_
**Status:** All 5 phases fully implemented with working code and tests
**Compute:** Free-tier only (Google Colab + Kaggle)

**What It Does:**
End-to-end pipeline for building, training, aligning, and serving a Large Language Model from scratch — covering the full lifecycle from raw data to a deployed chatbot.

**Architecture Overview:**
| Phase | Component | Details |
|---|---|---|
| Phase 1 | Data Layer | FineWeb-edu ingestion, custom filters, MinHash dedup, BPE tokenizer (32k vocab), shard encoding |
| Phase 2 | Pre-Training | GPT-2 124M from scratch, DDP-ready, HellaSwag eval |
| Phase 3 | Post-Training | SFT with LoRA, Reward Model, GRPO alignment |
| Phase 4 | Evaluation | HellaSwag, perplexity, custom eval harness |
| Phase 5 | Serving | FastAPI + SSE streaming + browser chatbot UI |

**Phase 1 — Data Pipeline:**

- `DatasetDownloader`: Streams from HuggingFace datasets (FineWeb-edu), supports sampling
- `FilterPipeline`: 5 quality filters with short-circuit evaluation (length, word length, symbol ratio, bullet lines, alphanumeric ratio)
- `MinHashDeduplicator`: MinHash-based near-duplicate detection
- `BPETokenizerTrainer`: Custom BPE tokenizer, 32k vocab, trained on cleaned corpus
- `ShardEncoder`: Tokenized shard writer (.bin format, 100M tokens/shard)
- `HFHubPusher`: Pushes tokenizer and shards to HuggingFace Hub

**Phase 2 — Pre-Training:**

- GPT-2 architecture implemented from scratch: CausalSelfAttention, MLP, Block, GPT
- Config: 768 dim, 12 heads, 12 layers, 50k vocab, 1024 context window = 124M parameters
- DDP-ready training loop via torchrun (multi-GPU capable)
- HellaSwag evaluation during training
- Checkpointing every 500 steps
- Dataset: FineWeb-edu (5.6B tokens target)

**Phase 3 — Post-Training (Full RLHF Pipeline):**

_SFT (Supervised Fine-Tuning):_

- Dataset: UltraChat 200k
- LoRA config: r=16, alpha=32, dropout=0.05
- Training via PEFT
- Chat template: `<|user|>` and `<|assistant|>` tokens

_Reward Model:_

- Architecture: GPT-2 base + scalar regression head
- Trained on preference pairs (hh-rlhf format)
- Output: scalar reward score per response

_GRPO (Group Relative Policy Optimization):_

- Group size G=4
- KL-anchored regularization (no value model needed)
- Verifiable reward system
- Final merged model: SFT + GRPO weights combined via PEFT's merge_and_unload()

**Phase 4 — Evaluation:**

- HellaSwag evaluation integrated into pre-training loop
- Perplexity calculation on validation sets
- Custom eval harness for generation quality

**Phase 5 — Serving:**

- FastAPI inference server with SSE streaming
- Browser-based chatbot UI (HTML + Jinja2 templates)
- Temperature and max_tokens controls
- Model loads from gpt2_grpo_merged/ checkpoint

**Key Design Patterns:**

- Streaming-first: all data components use iterators/generators
- Dataclasses for config (DownloaderConfig, GPTConfig) — no magic numbers
- Abstract base classes: BaseFilter interface with concrete implementations
- Short-circuit evaluation in FilterPipeline (stops on first filter failure)
- Stats tracking: FilterPipeline tracks rejection counts per filter
- Full unit test coverage across all components

**Full Tech Stack:**
Python · PyTorch · Hugging Face · PEFT · LoRA · GRPO · FastAPI · BPE Tokenizer · DDP · Weights & Biases · Uvicorn · Jinja2

**Why This Matters for Interviews:**
Very few candidates at 0–2 years have implemented a full pre-training + RLHF pipeline from scratch. This signals genuine depth in LLM internals — tokenization, training dynamics, alignment — not just API wrapper experience. The free-tier compute constraint also demonstrates resourcefulness.

---

## 6. Education

**Degree:** Bachelor of Technology, Computer Science
**Institution:** Government Engineering College, Rewa
**Duration:** July 2019 – June 2023
**CGPA:** 7.1

**Context:** Tier-3 engineering college. CGPA is average but not disqualifying at your target companies (startups, mid-size). Compensated by strong project work and real production experience.

---

## 7. Interview Narratives

### "Why did you leave FIS Clouds?"

> "My role started deviating toward Android and Java development, which wasn't aligned with my goal of building expertise in AI/ML engineering. I wanted to stay on the AI/ML track, so I decided to move on and focus on opportunities where I can work on production AI systems full-time."

_Use this consistently. Do not mention termination. This narrative is honest enough — the role was indeed deviating — and protects you from unnecessary bias._

### "Walk me through CivicSetu."

> "CivicSetu is a live RAG system I built to query Indian RERA legal documents. The core challenge was that legal reasoning isn't just semantic search — laws reference other laws, and you need to traverse those relationships. So I built a three-store architecture: pgvector for semantic similarity, Neo4j for cross-reference graph traversal, and PostgreSQL for chunk metadata. The LangGraph agent queries all three stores and synthesizes a cited answer. It's live on Hugging Face Spaces, covers 5 jurisdictions, and passes 12/12 E2E benchmark cases."

### "What's your strongest technical achievement?"

> "Probably the Redis caching fix at Resolute AI. The healthcare chatbot was taking ~25 seconds to respond because patient documents were fetched after the first message. I realized the prefetch timing was wrong — documents should be fetched at login, not at first message. Shifted the fetch to login-time and cached in Redis. Response time dropped from ~25s to under 5s. It's a simple fix but it required understanding the full user flow and identifying where the bottleneck actually was."

### "Do you know Kafka?"

> "I've used Kafka in a production pipeline at FIS Clouds — specifically consuming from and publishing to topics as part of a biomedical NER pipeline. I understand the producer/consumer model, topics, partitions, and how Kafka enables decoupled, async communication between pipeline steps. I'm not a Kafka infrastructure expert — I haven't managed clusters or designed partition strategies — but I'm comfortable using it as a messaging layer in AI pipelines."

### "Your CGPA is 7.1 — how do you respond?"

> "My CGPA reflects a period where I was still figuring out my direction. What I'd point to instead is what I've built since graduating — a live open-source RAG system with a three-store architecture, a full LLM pre-training pipeline from scratch, and production deployments on real enterprise systems. I think that's a stronger signal of what I can do."

### "You only have 1 year of experience — why should we hire you?"

> "I've built things that most 1-year engineers haven't. CivicSetu is a production RAG system live on the internet with real architectural decisions — not a tutorial clone. LLM Playground covers the full pre-training to alignment pipeline from scratch. And at FIS Clouds I worked on a real AWS-to-GCP migration for an enterprise telecom client. The experience is short but the depth is real."

---

## 8. Career Strategy & Goals

### Short-Term (0–6 months)

- Land a role at ₹6–10 LPA in AI/ML engineering, LLM engineering, or applied AI
- Target: startups and mid-size product companies (faster growth, more ownership)
- Apply to 20–30 jobs per week
- Focus applications on RAG, LLM, and backend AI roles

### Medium-Term (6–18 months)

- Build DSA and system design interview readiness
- Deepen Kafka knowledge to own it confidently in interviews
- Expand CivicSetu to more domains (geopolitics, space policy — aligned with personal interests)
- Contribute meaningfully to open-source AI tooling

### Long-Term (2–4 years)

- Senior AI/ML Engineer or Staff Engineer at a product company
- Known in the open-source community for civic tech / knowledge graph AI systems
- Build toward GenesiGraph — a dependency graph of all human scientific knowledge

### Application Strategy

- **Primary targets:** AI-first startups, mid-size SaaS companies with AI products, consulting firms with AI practices
- **Avoid:** Large IT services companies (TCS, Infosys, Wipro) — commodity work, slow growth
- **Geography:** Open to Hyderabad, Bangalore, remote; open to relocation
- **Platforms:** LinkedIn, Naukri, AngelList/Wellfound, direct company career pages

---

## 9. Salary & Compensation Context

| Data Point                | Value                                                                                            |
| ------------------------- | ------------------------------------------------------------------------------------------------ |
| Last CTC                  | ₹2.4 LPA (FIS Clouds)                                                                            |
| Bond Status               | Moot — no longer employed there                                                                  |
| Target Range              | ₹6–10 LPA                                                                                        |
| Floor (minimum to accept) | ₹5 LPA                                                                                           |
| Negotiation Note          | Last salary was below market. Don't anchor to it. Lead with skills and projects, not last drawn. |

**If asked about last salary in interviews:**
You are not legally required to disclose it in most states. You can say: "I'm looking for a role in the ₹6–10 LPA range based on my skills and the market rate for this role."

---

## 10. Constraints & Logistics

| Constraint           | Detail                                                  |
| -------------------- | ------------------------------------------------------- |
| Employment Status    | Currently unemployed (since Nov 14, 2025)               |
| Notice Period        | Immediate joiner                                        |
| Work Mode Preference | Open to on-site, hybrid, or remote                      |
| Location             | Hyderabad currently; open to Bangalore and other cities |
| Weekday Availability | Limited (job searching + project work)                  |
| Weekend Availability | High — best time for deep learning/project work         |
| Compute              | Free-tier only (Colab, Kaggle, HF Spaces)               |

---

## 11. Gaps & Development Areas

### Known Gaps (as of March 2026)

| Gap             | Severity                                            | Plan                                                                 |
| --------------- | --------------------------------------------------- | -------------------------------------------------------------------- |
| DSA proficiency | High — blocks coding rounds                         | Python-focused LeetCode practice, start with arrays/strings/hashmaps |
| System Design   | High — blocks senior-level interviews               | Study distributed systems fundamentals, practice common patterns     |
| Kafka depth     | Medium — can be caught in deep technical interviews | 1–2 weekend focused study, run local producer/consumer in Python     |
| TensorFlow      | Low — just don't list it                            | N/A                                                                  |
| No publications | Low — not targeting research roles                  | N/A                                                                  |

### DSA Study Plan (recommended)

1. Start: Arrays, Strings, HashMaps (most common in AI/ML interviews)
2. Then: Trees, Graphs (relevant to your graph work in CivicSetu)
3. Then: Dynamic Programming (commonly asked)
4. Target: LeetCode Easy/Medium, ~2–3 problems/day

### Kafka Weekend Study Plan

1. Day 1: Core concepts (topics, partitions, consumer groups, offsets), run local Kafka via Docker
2. Day 2: Python producer/consumer with confluent-kafka, map it back to how you used it in Curie
3. After: You can confidently own Kafka usage in interviews

---

## 12. Resume Versions Log

### Version 5.4 — Pre-Review (Original FlowCV)

- Generic summary
- Flat skills list with TensorFlow, no Kafka, no Neo4j
- No quantified metrics
- Curie buried under FIS Clouds with overclaimed scope
- Resolute AI with sub-headers and tech stack lines
- No personal projects section
- **Rating: 5.5/10**

### Version 6.0 — Post-Review (March 2026)

- Specific summary leading with CivicSetu as flagship
- Skills restructured: added SQL, Neo4j, Kafka, pgvector, LangGraph, Redis; removed TensorFlow, LangChain, DVC
- FIS Clouds: project-based format with real numbers (25 intents, 6 flows, ~50 Cloud Functions)
- Curie: honest scope (1-week, 500 docs, 2 pipeline steps)
- Resolute AI: compressed to 3 clean bullets, Redis caching metric (25s→5s) as headline
- New Projects section: CivicSetu (flagship) + LLM Playground
- Education unchanged
- Exactly 2 pages
- **Rating: 8/10**

### Remaining Improvements for Version 6.1+

- Add LLM Playground eval metrics (perplexity, HellaSwag score) when available
- Add GitHub stars / HF Space visit count for CivicSetu when meaningful
- Add any new projects or roles as they happen
- Consider adding a "Certifications" section if you complete any relevant courses

---

_This document is a living reference. Update it after every role, project milestone, or interview cycle._
