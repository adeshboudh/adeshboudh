# Hi, I'm Adesh Boudh

**AI/ML Engineer** — I build production-grade RAG pipelines, LLM systems, and scalable AI backend infrastructure.

Not a researcher. Not a data scientist. An engineer who builds things that work and ships them.

---

## Featured Projects

### [CivicSetu](https://adesh01-civicsetu.hf.space) — Open-Source Civic RAG System
Ask a plain-English question about Indian RERA law. Get a cited, structured answer with section references, confidence score, and cross-jurisdiction reasoning — grounded in real legal text across 5 jurisdictions.

- **Three-store retrieval:** pgvector (semantic search) + Neo4j (cross-reference graph traversal) + PostgreSQL (chunk metadata), queried in parallel via a LangGraph agent
- **Scale:** 1,203 chunks · 2,090 section nodes · 933 reference edges · 91 DERIVED_FROM edges · 5 jurisdictions
- **Evaluation:** 12/12 E2E benchmark cases passing
- **Stack:** Python · FastAPI · LangGraph · pgvector · Neo4j · PostgreSQL · FlashRank · LiteLLM · Docker · HF Spaces

### [LLM Playground](https://github.com/adeshboudh/llm-playground) — LLM Pre-Training & Alignment from Scratch
End-to-end pipeline for building, training, aligning, and serving a GPT-2 124M model — using only free-tier compute (Colab + Kaggle).

- Pre-training on FineWeb-edu with custom BPE tokenizer (32k vocab) and MinHash dedup
- Full post-training: SFT with LoRA (UltraChat 200k) → Reward Model → GRPO alignment
- Served via FastAPI with SSE streaming and a browser chatbot UI
- **Stack:** Python · PyTorch · Hugging Face · PEFT · LoRA · GRPO · FastAPI · DDP

---

## Skills

**AI/ML:** RAG Pipelines · LLMs · NER · Fine-Tuning (SFT/LoRA) · RLHF/GRPO · Generative AI · NLP · Deep Learning
**Frameworks:** PyTorch · Hugging Face · LangGraph · FastAPI · CrewAI · Ollama · Streamlit
**Databases:** PostgreSQL · pgvector · Neo4j · MongoDB · Redis
**MLOps & Systems:** Docker · Kafka · REST APIs · Vector Search · Git
**Cloud:** GCP (Dialogflow CX, Cloud Functions, Firestore, GCS, Artifact Registry) · AWS (Lex, Lambda, DynamoDB, EC2, ECR)
**Languages:** Python · SQL

---

## Experience

**Associate AI/ML Engineer — FIS Clouds** *(Jun 2025 – Nov 2025)*
Migrated a production Facebook Messenger chatbot from AWS to GCP (Dialogflow CX + Cloud Functions + Firestore) — 25 intents, ~50 Cloud Functions. Built PLDT demo chatbot from scratch (6 conversational flows). Implemented biomedical NER pipeline using BioBERT/SciBERT/NCBI-BERT on 500+ research documents with Kafka integration.

**AI/Backend Intern — Resolute AI** *(Feb 2025 – Jun 2025)*
Reduced healthcare chatbot response time from ~25s to under 5s via login-time Redis prefetch. Fine-tuned and deployed LLaMA 3.1 1B with multilingual support. Built a CrewAI multi-agent system for healthcare content generation.

---

## Connect

- **Email:** adeshboudh16@gmail.com
- **LinkedIn:** [linkedin.com/in/adeshboudh](https://www.linkedin.com/in/adeshboudh/)
- **HuggingFace:** [huggingface.co/adesh01](https://huggingface.co/adesh01)
