# Adesh Boudh AI/ML Engineer

adeshboudh16@gmail.com^ | +91 9109516207^ | Adesh Boudh^ | github.com/adeshboudh^

## Summary

AI/ ML Engineer specializing in production-grade RAG pipelines, LLM integration, and scalable AI backend
systems. Built CivicSetu — a live open-source RAG system for querying Indian civic and legal documents with
citation accuracy, cross-reference traversal, and conflict detection. Also experienced in cloud migration (AWS →
GCP), biomedical NER pipelines (BioBERT/ SciBERT), LLM pre-training from scratch, and reducing production
chatbot latency from ~40s to under 5s. Targeting roles in LLM engineering, applied AI, and backend AI systems.

## Skills

**Programming & Databases**
Python, SQL, PostgreSQL, MongoDB, Neo4j

**Cloud Platforms**
GCP (Dialogflow CX, Cloud Functions, Firestore, GCS,
Artifact Registry), AWS (Lex, Lambda, DynamoDB,
EC2, ECR)

**MLOps & Systems**
Docker, Git, CI/ CD, REST APIs, Kafka, pgvector
(HNSW), Vector Search

```
AI/ML Expertise
Deep Learning, NLP, LLMs, Generative AI, RAG
Pipelines, Fine-Tuning (SFT, RLHF/ GRPO), NER
```
```
Frameworks & Libraries
PyTorch, Hugging Face, LangGraph, CrewAI, FastAPI,
Ollama, Streamlit
```
## Experience

**Associate AI/ML Engineer**
_FIS Clouds_

### 06/2025 – 11/

```
Hyderabad, India (On-site)
Globe-Bobot & PLDT Chatbot - Conversational AI Migration and Development
Contributed to the design, migration, and development of enterprise-grade conversational AI systems on Google
Cloud Platform (GCP), enhancing chatbot intelligence, scalability, and modularity across telecom and enterprise
use cases.
Key Contributions:
```
- Migrated a production-grade Facebook Messenger chatbot from AWS (Lex + Lambda + DynamoDB) to GCP
(Dialogflow CX + Cloud Functions + Firestore), transforming it from a button-based bot into a hybrid
conversational agent supporting free-text input and multi-turn conversations across 25 intents.
- Refactored AWS Lambda business logic into Cloud Functions and modularized shared code published to GCP
Artifact Registry, serving ~50 Cloud Functions and reducing duplication across deployments.
- Replaced DynamoDB with Firestore for session state and conversation logging, ensuring consistency and
scalability across multi-turn conversational flows.
- Built the PLDT telecom demo chatbot from scratch in Dialogflow CX — designed 6 end-to-end conversational
flows with custom webhooks and a Firestore mock backend simulating real-time customer data retrieval.
**Impact:** Improved chatbot flexibility and reusability while establishing a unified, modular architecture for future
conversational AI deployments on GCP.
**Tech Stack:** Python · Dialogflow CX · GCP (Cloud Functions, Firestore, Artifact Registry) · AWS (Lex, Lambda,
DynamoDB) · Facebook Graph API
**Curie — RAG-Based Biomedical Knowledge Pipeline**
Contributed to a 2-step segment of a larger biomedical document processing pipeline, implementing NER and
entity canonicalization on a dataset of 500+ research documents.
**Key Contributions:**
- Implemented NER pipeline (BioBERT, SciBERT, NCBI-BERT) extracting diseases, drugs, genes, and MeSH terms
from 500+ biomedical documents.
- Built entity canonicalization layer (MeSH→SNOMED, Gene IDs) with BioPortal and MyDisease.info integration;
published results to Kafka topics for downstream consumption.
**Impact:** Enabled structured entity extraction and normalization across 500+ biomedical documents, contributing
to a scalable downstream knowledge pipeline.
**Tech Stack:** Python · BioBERT · SciBERT · NCBI-BERT · Hugging Face Transformers · Kafka · MongoDB · GCS ·
BioPortal API · MyDisease.info


**AI/Backend Intern**
_Resolute AI_

```
02/2025 – 06/2025 | Remote
```
- Fine-tuned LLaMA 3.1 1B, converted to GGUF, deployed via Ollama with Telugu multilingual support using
deep-translator.
- Reduced healthcare chatbot response time from ~25s to under 5s by shifting patient document fetching to
login-time prefetch with Redis caching.
- Built a CrewAI multi-agent system (5 crews, 1 custom tool) generating healthcare content using Gemini LLM
and Serper API.

**Personal Project
CivicSetu — Open-Source Civic RAG System** | Live | GitHub
Open-source RAG system for querying Indian civic and legal documents with cited, structured answers, cross-
reference traversal, and conflict detection across jurisdictions.
**Key Highlights:**

- Built a three-store retrieval architecture — pgvector (semantic search), Neo4j (cross-reference graph traversal),
PostgreSQL (chunk metadata) — queried in parallel via a LangGraph StateGraph agent.
- Ingested 1,203 chunks across 5 RERA jurisdictions (Central, MH, UP, KA, TN); graph contains 2,090 section
nodes, 933 reference edges, and 91 DERIVED_FROM edges for cross-jurisdiction reasoning.
- Implemented FlashRank reranker (ms-marco-MiniLM-L-12-v2) and LiteLLM routing (Gemini → Groq →
OpenRouter) for resilient, low-cost inference.
- Deployed on Hugging Face Spaces via Docker with local nomic-embed-text-v1.5 embeddings; 12/ 12 E2E
benchmark cases passing across all jurisdictions.
**Tech Stack:** Python · FastAPI · LangGraph · pgvector · Neo4j · PostgreSQL · nomic-embed-text-v1.5 · FlashRank ·
LiteLLM · PyMuPDF · Docker
**LLM Playground — LLM Pre-Training & Alignment System from Scratch** | GitHub
End-to-end system for building, training, aligning, and serving a Large Language Model from scratch using only
free-tier compute (Colab, Kaggle).
**Key Highlights:**
- Pre-trained GPT-2 124M from scratch on FineWeb-edu with custom BPE tokenizer (32k vocab), MinHash
dedup, and HellaSwag evaluation using free-tier compute only.
- Implemented full post-training pipeline: SFT with LoRA (UltraChat 200k), GPT-2 reward model on preference
pairs, and GRPO alignment; served via FastAPI with SSE streaming.
**Tech Stack:** Python · PyTorch · Hugging Face · PEFT · LoRA · GRPO · FastAPI · BPE Tokenizer · DDP · Weights &
Biases

## Education

**Bachelor of Technology, Computer Science***
_Government Engineering College, Rewa_

### 07/2019 – 06/

### CGPA: 7.


