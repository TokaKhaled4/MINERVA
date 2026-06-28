# MINERVA
### Multimodal Intelligent Notes for Education, Review, Visualization, and Assistance

MINERVA is an AI-powered educational platform that transforms lecture videos into interactive learning resources. By combining Automatic Speech Recognition (ASR), Vision-Language Models (VLMs), Retrieval-Augmented Generation (RAG), and multimodal AI, MINERVA helps students study more efficiently through automated summaries, mind maps, flashcards, quizzes, image retrieval, and conversational question answering.

---

## Features

- 🎥 **Lecture Video Processing**
  - Automatic audio transcription
  - Semantic topic segmentation
  - Slide extraction from lecture videos

- 📝 **AI-Generated Summaries**
  - Topic-based multimodal summaries
  - Combines transcript and slide information

- 🧠 **Mind Map Generation**
  - Automatically generates hierarchical mind maps for each topic

- 🎯 **Flashcards & Quizzes**
  - AI-generated revision questions
  - Multiple-choice quizzes
  - Interactive flashcards

- 💬 **Retrieval-Augmented Chatbot (RAG)**
  - Ask questions about uploaded lectures
  - Context-aware answers with source citations
  - Semantic search over lecture content

- 🖼️ **Image Retrieval**
  - Text-to-slide retrieval
  - Image-to-slide retrieval
  - Timestamp localization within videos

- 🌍 **Arabic-English Code-Switched Support**
  - Fine-tuned Whisper model for Egyptian Arabic-English educational lectures
  - Fine-tuned Qwen Vision-Language Model for educational summarization

---

## System Architecture

MINERVA consists of multiple AI modules working together:

```
Lecture Video
      │
      ▼
Audio Extraction ─────────► Whisper ASR
      │                          │
      │                          ▼
      │                 Topic Segmentation
      │                          │
      ▼                          ▼
Slide Extraction          Transcript
      │                          │
      └──────────────┬───────────┘
                     ▼
         Multimodal Content Alignment
                     │
        ┌────────────┼─────────────┐
        ▼            ▼             ▼
   Summaries     Mind Maps    Flashcards
        │            │             │
        └────────────┼─────────────┘
                     ▼
               RAG Knowledge Base
                     │
         Semantic Search + Chatbot
                     │
                     ▼
                Student Interface
```

---

## AI Technologies

### Speech Recognition
- Fine-tuned Whisper Large V3
- Egyptian Arabic-English code-switched transcription

### Vision-Language Model
- Fine-tuned Qwen3-4B-VLM
- Multimodal educational summarization

### Retrieval-Augmented Generation
- ChromaDB
- Multilingual embeddings
- Cross-Encoder reranking

### Image Retrieval
- CLIP embeddings
- Semantic image search

---

## Technology Stack

### Frontend
- React

### Backend
- FastAPI
- Python

### AI & Machine Learning
- Whisper Large V3
- Qwen3-4B-VLM
- LangChain
- ChromaDB
- CLIP
- Sentence Transformers

### Video & Image Processing
- OpenCV
- FFmpeg
- SSIM
- OCR

---

## Pipeline

### 1. Video Processing
- Extract audio
- Generate transcript
- Detect lecture topics
- Extract unique presentation slides

### 2. Multimodal Summarization
- Align transcript with extracted slides
- Generate structured summaries for each topic

### 3. Knowledge Base Construction
- Chunk lecture content
- Generate embeddings
- Store vectors in ChromaDB

### 4. Educational Content Generation
- Mind maps
- Flashcards
- Quizzes

### 5. Intelligent Retrieval
- Semantic search
- Question answering
- Image retrieval
- Source citation generation

---

## Project Structure

```text
MINERVA/
├── frontend/                    # React + Vite frontend
│   ├── public/                  # Static assets and fonts
│   ├── src/
│   │   ├── assets/              # Images and icons
│   │   ├── Components/          # Reusable UI components
│   │   ├── Pages/               # Application pages
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                     # FastAPI backend
│   ├── api/                     # API routes
│   ├── services/                # Business logic
│   ├── pipelines/
│   │   ├── transcription/
│   │   ├── segmentation/
│   │   ├── summarization/
│   │   ├── rag/
│   │   ├── flashcards/
│   │   ├── quizzes/
│   │   ├── image_retrieval/
│   │   └── mindmap/
│   ├── models/                  # Model loading and inference
│   ├── utils/
│   ├── main.py                  # FastAPI entry point
│   └── requirements.txt
│
├── MINERVA Notebook.ipynb       # AI experimentation notebook
├── README.md                    # Project documentation
└── .gitignore                   # Git ignore rules
```

---

## Key Capabilities

- Convert lecture videos into concise summaries
- Generate structured study notes
- Produce interactive quizzes and flashcards
- Create AI-generated mind maps
- Search lecture slides using text or images
- Chat with lecture content using Retrieval-Augmented Generation
- Support multilingual educational lectures with Arabic-English code switching

---

## Research Contributions

- Fine-tuned Whisper Large V3 on a custom Egyptian Arabic-English educational dataset.
- Fine-tuned Qwen3-4B-VLM on educational topic-summary pairs for multimodal summarization.
- Developed a multimodal pipeline combining audio, text, and visual information.
- Integrated RAG with lecture-aware semantic search and citation-based responses.
- Built an end-to-end AI educational assistant for lecture understanding and revision.

---

## Future Improvements

- Support additional languages and dialects
- Live lecture processing
- Personalized learning recommendations
- LMS integration
- Enhanced multimodal reasoning
- Expanded educational datasets for improved model performance

---

## Team

Developed by students from the **Scientific Computing Department**  
**Faculty of Computer and Information Sciences**  
**Ain Shams University**

- Toka Khaled Moustafa
- Jana Essam Abdelfatah
- Jana Hani El-Sheikh
- Rawan Mohamed Taha
- Manar Moustafa Fathy

### Supervisors

- Dr. Dina Khattab
- T.A. Mohamed Essam
- T.A. Nouran El-Sayed
