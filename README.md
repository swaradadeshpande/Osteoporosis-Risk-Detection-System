<div align="center">

<img src="https://img.grepmed.com/uploads/5117/bony-handxray-progression-handbones-clinical-original.gif" width="120" height="120" alt="OsteoAI"/>

# OsteoAI — Osteoporosis Risk Detection System

**AI-powered osteoporosis risk screening from routine bone X-ray radiographs**

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-osteoporosis--risk--detection.vercel.app-4f46e5?style=for-the-badge)](https://osteoporosis-risk-detection.vercel.app/)
[![Backend](https://img.shields.io/badge/⚙️_API-Render-46d369?style=for-the-badge)](https://osteoai-backend.onrender.com/docs)
[![Model](https://img.shields.io/badge/🤗_Model-Hugging_Face-ff9d00?style=for-the-badge)](https://huggingface.co/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

[![React](https://img.shields.io/badge/React_18-TypeScript-61DAFB?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?logo=vite)](https://vitejs.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![TensorFlow](https://img.shields.io/badge/TensorFlow-2.17-FF6F00?logo=tensorflow)](https://tensorflow.org/)

</div>

---

## 🔗 Live Application

| Service | URL | Platform |
|---|---|---|
| 🌐 **Frontend (App)** | [osteoporosis-risk-detection.vercel.app](https://osteoporosis-risk-detection.vercel.app/) | Vercel |
| ⚙️ **Backend (API)** | [osteoai-backend.onrender.com](https://osteoai-backend.onrender.com/docs) | Render |
| 🤗 **ML Model** | Hugging Face Hub | Hugging Face |

> **Note:** The Render free tier spins down after 15 minutes of inactivity. The first request after idle may take ~30 seconds to wake up — this is expected.

---

## 📋 Table of Contents

- [About the Project](#-about-the-project)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [ML Model](#-ml-model)
- [API Endpoints](#-api-endpoints)
- [Local Setup](#-local-setup)
- [Deployment](#-deployment)
- [Demo Credentials](#-demo-credentials)
- [Test Patients](#-test-patients)
- [Contributing](#-contributing)

---

## 🩺 About the Project

Osteoporosis silently weakens bones and dramatically increases fracture risk — especially in postmenopausal women and the elderly. The diagnostic gold standard, **DEXA scanning**, is expensive, scarce in rural healthcare settings, and not performed routinely.

**OsteoAI** bridges this gap by analysing routine hand/wrist X-rays with a deep learning model to estimate osteoporosis risk — enabling large-scale early screening using existing imaging infrastructure.

> **Clinical use:** This is a **screening/triage tool** to flag high-risk patients for confirmatory DEXA scans — not a replacement for clinical diagnosis.

### Risk Classes

| Class | Label | Clinical Recommendation |
|---|---|---|
| **0** | 🟢 Low Risk | No immediate action needed. Maintain a healthy lifestyle. |
| **1** | 🟡 Medium Risk | Consider bone density screening. Review calcium/Vitamin D intake. |
| **2** | 🔴 High Risk | Urgent DEXA scan recommended. Consult a physician immediately. |

---

## ✨ Features

- **AI Prediction** — Upload a bone X-ray and get an instant risk classification with confidence scores
- **Grad-CAM Heatmap** — Visual explanation showing which bone regions influenced the prediction
- **Patient Dashboard** — Stats overview, appointment tracking, and prediction history
- **Patient History** — Search and retrieve predictions by patient ID
- **Doctor Directory** — Browse specialists and book appointments
- **AI Chatbot** — Rule-based bone health Q&A assistant
- **Medication Cost Estimator** — Cost guidance for common osteoporosis treatments
- **PDF Report** — Download a full clinical prediction report
- **Role-based Access** — Separate views for doctors and patients
- **Responsive UI** — Works on desktop and mobile

---

## 🛠 Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18 | UI framework |
| TypeScript | 5 | Type safety |
| Vite | 5 | Build tool & dev server |
| Tailwind CSS | 3 | Styling |
| React Router | 6 | Client-side routing |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| FastAPI | 0.111 | REST API framework |
| Uvicorn | 0.30 | ASGI server |
| TensorFlow (CPU) | 2.17 | ML inference |
| OpenCV Headless | 4.9 | Image processing & CLAHE |
| Pillow | 10.3 | Image I/O |
| scikit-learn | 1.4 | Preprocessing (MinMaxScaler) |

### ML Model
| Component | Detail |
|---|---|
| Backbone | EfficientNetV2S (ImageNet pre-trained) |
| Architecture | Dual-input fusion: Image branch + Tabular branch |
| Image input | 224×224 px hand/wrist X-ray |
| Tabular input | Bone age (months) + Gender |
| Loss function | Focal Loss (γ=2, α=0.25) |
| Imbalance handling | Focal loss + Class weights |
| Primary metric | Macro F1 Score |

### Infrastructure
| Service | Role |
|---|---|
| **Vercel** | Frontend hosting (CDN, auto-deploy from GitHub) |
| **Render** | Backend hosting (Python/FastAPI server) |
| **Hugging Face** | ML model file storage & serving |
| **GitHub** | Source control & CI/CD trigger |

---

## 📁 Project Structure

```
Osteoporosis-Risk-Detection-System/
├── backend/
│   ├── main.py                  ← FastAPI app — all API routes
│   ├── ml_model.py              ← EfficientNetV2S inference + Grad-CAM
│   ├── requirements.txt         ← Python dependencies
│   ├── start_backend.bat        ← Windows one-click local start
│   └── uploads/
│       └── xrays/               ← Auto-created; stores uploads & Grad-CAM images
│
├── frontend/
│   ├── src/
│   │   ├── lib/
│   │   │   └── api.ts           ← API client (reads VITE_API_URL env variable)
│   │   ├── pages/
│   │   │   ├── Upload.tsx       ← X-ray upload + boneage + gender form
│   │   │   ├── Result.tsx       ← Prediction result + Grad-CAM heatmap
│   │   │   ├── Dashboard.tsx    ← Stats & appointment overview
│   │   │   ├── History.tsx      ← Patient prediction history
│   │   │   ├── Doctors.tsx      ← Doctor directory & appointments
│   │   │   ├── Chatbot.tsx      ← Bone health Q&A chatbot
│   │   │   ├── Cost.tsx         ← Medication cost estimator
│   │   │   └── Login.tsx        ← Authentication
│   │   └── components/          ← Shared UI components
│   ├── public/
│   ├── vercel.json              ← SPA routing config for Vercel
│   ├── package.json
│   └── start_frontend.bat       ← Windows one-click local start
│
└── README.md
```

---

## 🧠 ML Model

### Architecture

The model uses a **multi-modal fusion** approach — combining visual bone density patterns from X-rays with clinical metadata:

```
📷 Image Branch
   X-ray (224×224×3)
   → EfficientNetV2S backbone (ImageNet, 21.5M params)
   → GlobalAveragePooling2D
   → Dense(256, ReLU) → BatchNorm → Dropout(0.3)

📊 Tabular Branch
   [boneage_normalised, gender_encoded]
   → Dense(64, ReLU) → BatchNorm
   → Dense(32, ReLU) → BatchNorm

🔀 Fusion
   Concatenate([image_features, tabular_features])
   → Dense(128, ReLU) → Dropout(0.4)
   → Dense(64, ReLU)
   → Dense(3, Softmax)  ← risk class probabilities
```

### Training Strategy

- **Phase 1** — Backbone frozen, only fusion/dense head trained (LR: 1e-3, 20 epochs)
- **Phase 2** — Full fine-tuning with lower learning rate (LR: 1e-5, 15 epochs)
- **Callbacks** — EarlyStopping (patience=7), ReduceLROnPlateau (factor=0.5), ModelCheckpoint (monitor val_auc)

### Explainability

**Grad-CAM with CLAHE** — X-rays are contrast-enhanced using CLAHE (Contrast Limited Adaptive Histogram Equalization) before Grad-CAM overlay, making bone structures and heatmap hotspots clearly visible on dark X-ray backgrounds.

---

## 🔌 API Endpoints

Base URL (production): `https://osteoai-backend.onrender.com`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/login` | Login with email + password |
| `POST` | `/auth/signup` | Create new account |
| `GET` | `/patients` | List all patients |
| `GET` | `/patients/{id}` | Get single patient record |
| `POST` | `/patients/add` | Add or update a patient |
| `POST` | `/predict` | **Run ML prediction** (multipart/form-data) |
| `GET` | `/history/{id}` | Patient prediction history |
| `GET` | `/stats` | Dashboard statistics |
| `GET` | `/doctors` | List available doctors |
| `POST` | `/appointments/book` | Book an appointment |
| `POST` | `/chatbot` | Query the bone health chatbot |
| `GET` | `/health` | Health check + model load status |

### `/predict` Request Format

```
POST /predict
Content-Type: multipart/form-data

Fields:
  patientId  (string)          — patient identifier
  boneage    (float, months)   — e.g. 156 for a 13-year-old
  gender     (string)          — "Male" or "Female"
  xray       (file)            — PNG or JPG X-ray image
```

### Example Response

```json
{
  "risk_class": 2,
  "risk_label": "High Risk",
  "confidence": 0.87,
  "probabilities": {
    "Low Risk": 0.04,
    "Medium Risk": 0.09,
    "High Risk": 0.87
  },
  "recommendation": "Urgent bone density test (DEXA scan) recommended. Consult physician.",
  "gradcam_url": "/uploads/xrays/gradcam_P001_1714123456.png"
}
```

Interactive API docs (Swagger UI): [osteoai-backend.onrender.com/docs](https://osteoai-backend.onrender.com/docs)

---

## 💻 Local Setup

### Prerequisites

| Tool | Version | Download |
|---|---|---|
| Python | **3.11 or 3.12** (NOT 3.13 — TensorFlow incompatible) | [python.org](https://python.org/downloads/) |
| Node.js | 18+ | [nodejs.org](https://nodejs.org/) |
| Git | any | [git-scm.com](https://git-scm.com/) |

### 1 — Clone the Repository

```bash
git clone https://github.com/Jidnyasa-P/OsteoAI-Osteoporosis-Risk-Prediction-System.git
cd Osteoporosis-Risk-Detection-System
```

### 2 — Backend Setup

```bash
cd backend

# Create virtual environment with Python 3.11 or 3.12
# Windows:
C:\Python311\python.exe -m venv venv
venv\Scripts\activate

# macOS / Linux:
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Install TensorFlow — choose one:
pip install tensorflow-cpu==2.17.0    # CPU only (works everywhere)
pip install tensorflow[and-cuda]==2.17.0  # GPU (NVIDIA + CUDA 12 only)
```

**Add your trained model file:**

```bash
# Copy your trained model to the backend folder:
cp /path/to/osteoporosis_risk_model_final.keras ./osteoporosis_risk_model_final.keras
```

> If the model file is absent, the backend runs in **heuristic fallback mode** — predictions are rule-based (boneage + gender) and Grad-CAM is not available.

**Start the backend:**

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
# or on Windows: double-click start_backend.bat
```

Backend: [http://localhost:8000](http://localhost:8000)  
API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### 3 — Frontend Setup

Open a **new terminal**:

```bash
cd frontend

# Install dependencies
npm install

# Create local environment file
echo "VITE_API_URL=http://localhost:8000" > .env

# Start dev server
npm run dev
# or on Windows: double-click start_frontend.bat
```

App: [http://localhost:3000](http://localhost:3000)

---

## 🚀 Deployment

This app is deployed across three free platforms:

### Frontend → Vercel

1. Connect GitHub repo to [vercel.com](https://vercel.com)
2. Set **Root Directory** to `frontend`
3. Add environment variable: `VITE_API_URL` = your Render backend URL
4. Deploy — Vercel auto-deploys on every push to `main`

### Backend → Render

1. Connect GitHub repo to [render.com](https://render.com)
2. Set **Root Directory** to `backend`
3. **Build Command:** `pip install -r requirements.txt`
4. **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. The model is downloaded automatically from Hugging Face on startup

### ML Model → Hugging Face

The `.keras` model file (~80MB+) is hosted on Hugging Face Hub and downloaded by the backend on first startup. To update the model:

```bash
pip install huggingface_hub
huggingface-cli upload your-username/osteoai-model osteoporosis_risk_model_final.keras
```

---

## 🔐 Demo Credentials

The app uses in-memory authentication (resets on backend restart). Use any of the following or sign up:

| Role | Email | Password |
|---|---|---|
| **Doctor** | `doctor@osteoai.com` | any password |
| **Patient** | `patient@osteoai.com` | any password |

> **Login logic:** If your email contains the word `"patient"` you log in as a Patient. Any other email logs in as a Doctor.

---

## 🧪 Test Patients

Pre-loaded sample patients for testing predictions:

| Patient ID | Name | Condition |
|---|---|---|
| P001 | Arjun Verma | Chronic back pain |
| P002 | Sunita Devi | Previous hip fracture |
| P003 | Rahul Sharma | Osteoporosis screening |
| P004 | Priya Singh | Vitamin D deficiency |
| P005 | Amit Patel | Low bone density |
| P006 | Kavita Reddy | Menopausal bone health |
| P007 | Sanjay Gupta | History of vertebral fracture |
| P008 | Meera Iyer | Family history of osteoporosis |

---

## ❓ Troubleshooting

**Backend won't start**
- Confirm Python version: `python --version` — must be 3.11 or 3.12
- Activate the virtual environment before running uvicorn

**TensorFlow import error**
```bash
pip uninstall tensorflow tensorflow-cpu -y
pip install tensorflow-cpu==2.17.0
```

**CORS error in browser**
- Confirm the backend is running on port 8000
- Check `VITE_API_URL` is set correctly in your `.env` file

**Model not found / heuristic mode**
- Copy `osteoporosis_risk_model_final.keras` into the `backend/` folder
- Check the `/health` endpoint to confirm model load status

**Render cold start (slow first request)**
- The free Render tier spins down after 15 minutes idle — the first request will take ~30 seconds. This is normal.

**Frontend 404 on page refresh**
- Ensure `frontend/vercel.json` exists with the SPA rewrite rule (already included in this repo)

---

## 📊 Model Performance

| Metric | Target | Description |
|---|---|---|
| **Macro F1** | > 0.65 | Primary metric — equal weight to all 3 risk classes |
| **MCC** | > 0.40 | Matthews Correlation Coefficient — imbalance-robust |
| **Macro AUC** | > 0.80 | One-vs-Rest ROC AUC across all classes |
| Accuracy | ~70–85% | Secondary — less meaningful under class imbalance |

Benchmarked against: Lim et al. 2023 (ResNet50), Yamamoto et al. 2020 (DenseNet121), RSNA Challenge winner (Xception).

---

## ⚠️ Disclaimer

OsteoAI is a **research prototype** and academic demonstration project. It is **not a certified medical device** and must not be used as a substitute for professional medical diagnosis. All predictions should be reviewed by a qualified healthcare professional. The system is intended for screening/triage purposes only — to help identify patients who should undergo confirmatory DEXA scanning.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

<div align="center">

Built with ❤️ for AI-assisted healthcare screening

**[🌐 Try the Live App](https://osteoporosis-risk-detection.vercel.app/)**

</div>
