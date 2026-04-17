from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import uvicorn
import uuid
import shutil
from pathlib import Path
from typing import Optional
import base64
import os, requests

MODEL_PATH = "osteoporosis_risk_model_final.keras"
# Replace this with your actual Google Drive direct-download link
MODEL_URL = MODEL_URL = "https://huggingface.co/Saj2005/OsteoAI/resolve/main/osteoporosis_risk_model_final.keras"

def download_model():
    if not os.path.exists(MODEL_PATH):
        print("Downloading model from Google Drive...")
        response = requests.get(MODEL_URL, stream=True)
        with open(MODEL_PATH, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        print("Model downloaded successfully.")

download_model()

from ml_model import predict_risk, get_model_status

app = FastAPI(title="OsteoAI Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path("uploads/xrays")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# In-memory storage (no database)
patients_db = {
    "P001": {"patientId": "P001", "name": "Arjun Verma", "age": 65, "gender": "Male", "notes": "Chronic back pain"},
    "P002": {"patientId": "P002", "name": "Sunita Devi", "age": 72, "gender": "Female", "notes": "Previous hip fracture"},
    "P003": {"patientId": "P003", "name": "Rahul Sharma", "age": 58, "gender": "Male", "notes": "Osteoporosis screening"},
    "P004": {"patientId": "P004", "name": "Priya Singh", "age": 62, "gender": "Female", "notes": "Vitamin D deficiency"},
    "P005": {"patientId": "P005", "name": "Amit Patel", "age": 70, "gender": "Male", "notes": "Low bone density"},
    "P006": {"patientId": "P006", "name": "Kavita Reddy", "age": 68, "gender": "Female", "notes": "Menopausal bone health"},
    "P007": {"patientId": "P007", "name": "Sanjay Gupta", "age": 75, "gender": "Male", "notes": "History of vertebral fracture"},
    "P008": {"patientId": "P008", "name": "Meera Iyer", "age": 64, "gender": "Female", "notes": "Family history of osteoporosis"},
}

from datetime import datetime, timedelta
import random

predictions_db = [
    {"patientId": "P001", "result": "Osteopenia", "probability": 0.82, "timestamp": (datetime.now() - timedelta(days=30)).isoformat(), "gradcamImage": None},
    {"patientId": "P001", "result": "Normal", "probability": 0.91, "timestamp": (datetime.now() - timedelta(days=180)).isoformat(), "gradcamImage": None},
    {"patientId": "P002", "result": "Osteoporosis", "probability": 0.94, "timestamp": (datetime.now() - timedelta(days=10)).isoformat(), "gradcamImage": None},
    {"patientId": "P002", "result": "Osteopenia", "probability": 0.88, "timestamp": (datetime.now() - timedelta(days=365)).isoformat(), "gradcamImage": None},
    {"patientId": "P003", "result": "Normal", "probability": 0.95, "timestamp": (datetime.now() - timedelta(days=5)).isoformat(), "gradcamImage": None},
    {"patientId": "P004", "result": "Osteopenia", "probability": 0.78, "timestamp": (datetime.now() - timedelta(days=15)).isoformat(), "gradcamImage": None},
    {"patientId": "P005", "result": "Osteoporosis", "probability": 0.92, "timestamp": (datetime.now() - timedelta(days=20)).isoformat(), "gradcamImage": None},
    {"patientId": "P006", "result": "Normal", "probability": 0.89, "timestamp": (datetime.now() - timedelta(days=25)).isoformat(), "gradcamImage": None},
    {"patientId": "P007", "result": "Osteoporosis", "probability": 0.96, "timestamp": (datetime.now() - timedelta(days=2)).isoformat(), "gradcamImage": None},
    {"patientId": "P008", "result": "Osteopenia", "probability": 0.84, "timestamp": (datetime.now() - timedelta(days=8)).isoformat(), "gradcamImage": None},
]

xrays_db = []

appointments_db = [
    {"id": "A001", "doctorId": "D-ADMIN", "patientId": "P001", "patientName": "Arjun Verma", "time": "09:00", "date": (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d"), "type": "Online"},
    {"id": "A002", "doctorId": "D-ADMIN", "patientId": "P002", "patientName": "Sunita Devi", "time": "10:30", "date": (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d"), "type": "Offline"},
    {"id": "A003", "doctorId": "D-ADMIN", "patientId": "P003", "patientName": "Rahul Sharma", "time": "11:00", "date": datetime.now().strftime("%Y-%m-%d"), "type": "Online"},
    {"id": "A004", "doctorId": "D-ADMIN", "patientId": "P004", "patientName": "Priya Singh", "time": "14:30", "date": datetime.now().strftime("%Y-%m-%d"), "type": "Offline"},
    {"id": "A005", "doctorId": "D-ADMIN", "patientId": "P005", "patientName": "Amit Patel", "time": "16:00", "date": datetime.now().strftime("%Y-%m-%d"), "type": "Online"},
    {"id": "A006", "doctorId": "D-ADMIN", "patientId": "P006", "patientName": "Kavita Reddy", "time": "09:30", "date": (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d"), "type": "Online"},
    {"id": "A007", "doctorId": "D-ADMIN", "patientId": "P007", "patientName": "Sanjay Gupta", "time": "11:30", "date": (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d"), "type": "Offline"},
]

# ── Auth ─────────────────────────────────────────────────────────────────────
@app.post("/auth/login")
async def login(data: dict):
    email = data.get("email", "")
    role = data.get("role") or ("patient" if "patient" in email.lower() else "doctor")
    if role == "patient":
        user = {"id": "P002", "name": "Sunita Devi", "email": email}
    else:
        user = {"id": "D-ADMIN", "name": "Dr. Rajesh Kumar", "email": email}
    token = f"mock-jwt-{uuid.uuid4().hex}"
    return {"token": token, "role": role, "user": user}

@app.post("/auth/signup")
async def signup(data: dict):
    email = data.get("email", "")
    role = data.get("role") or ("patient" if "patient" in email.lower() else "doctor")
    if role == "patient":
        user = {"id": "P002", "name": data.get("name", "New Patient"), "email": email}
    else:
        user = {"id": "D-ADMIN", "name": data.get("name", "Dr. New Doctor"), "email": email}
    token = f"mock-jwt-{uuid.uuid4().hex}"
    return {"token": token, "role": role, "user": user}

# ── Stats ─────────────────────────────────────────────────────────────────────
@app.get("/stats")
async def get_stats():
    dist = {}
    for p in predictions_db:
        r = p["result"]
        dist[r] = dist.get(r, 0) + 1
    distribution = [{"_id": k, "count": v} for k, v in dist.items()]
    return {
        "totalPatients": len(patients_db),
        "osteoporosisCases": dist.get("Osteoporosis", 0),
        "totalPredictions": len(predictions_db),
        "distribution": distribution
    }

# ── Patients ──────────────────────────────────────────────────────────────────
@app.get("/patients")
async def get_patients():
    return list(patients_db.values())

@app.get("/patients/{patient_id}")
async def get_patient(patient_id: str):
    if patient_id not in patients_db:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patients_db[patient_id]

@app.post("/patients/add")
async def add_patient(data: dict):
    pid = data.get("patientId", "")
    if not pid:
        raise HTTPException(status_code=400, detail="patientId required")
    patients_db[pid] = data
    return data

# ── Appointments ──────────────────────────────────────────────────────────────
@app.get("/appointments")
async def get_appointments():
    return appointments_db

@app.get("/appointments/doctor/{doctor_id}")
async def get_doctor_appointments(doctor_id: str):
    return [a for a in appointments_db if a["doctorId"] == doctor_id]

@app.post("/appointments/book")
async def book_appointment(data: dict):
    doctor_id = data.get("doctorId")
    time = data.get("time")
    date = data.get("date")
    conflict = next((a for a in appointments_db if a["doctorId"] == doctor_id and a["time"] == time and a["date"] == date), None)
    if conflict:
        raise HTTPException(status_code=400, detail="This slot is already booked")
    appt = {"id": f"APP-{uuid.uuid4().hex[:8]}", **data}
    appointments_db.append(appt)
    return appt

# ── Doctors ───────────────────────────────────────────────────────────────────
@app.get("/doctors")
async def get_doctors():
    regions = ['Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Ahmedabad', 'Kolkata', 'Jaipur', 'Lucknow']
    specialties = ['Orthopedic Surgeon', 'Rheumatologist', 'Endocrinologist', 'Bone Health Specialist', 'Physical Therapist']
    first_names = ['Rajesh', 'Anjali', 'Vikram', 'Priya', 'Amit', 'Meena', 'Arjun', 'Sunita', 'Rahul', 'Kavita',
                   'Sanjay', 'Meera', 'Suresh', 'Deepa', 'Vijay', 'Anita', 'Karan', 'Pooja', 'Rohan', 'Sneha']
    last_names = ['Kumar', 'Sharma', 'Mehra', 'Iyer', 'Patel', 'Singh', 'Rao', 'Verma', 'Joshi', 'Gupta',
                  'Nair', 'Sethi', 'Reddy', 'Deshmukh', 'Chauhan', 'Pandey', 'Malhotra', 'Bose', 'Das', 'Mishra']
    docs = []
    for i in range(1, 51):
        docs.append({
            "id": f"D{str(i).zfill(3)}",
            "name": f"Dr. {first_names[i % len(first_names)]} {last_names[i % len(last_names)]}",
            "specialty": specialties[i % len(specialties)],
            "region": regions[i % len(regions)],
            "experience": f"{10 + (i % 15)}+ Years",
            "rating": round(4.5 + (i % 5) * 0.1, 1),
            "image": f"https://picsum.photos/seed/doc{i}/400/400",
            "availability": ["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00"]
        })
    return docs

# ── History ───────────────────────────────────────────────────────────────────
@app.get("/history/{patient_id}")
async def get_history(patient_id: str):
    preds = [p for p in predictions_db if p["patientId"] == patient_id]
    xrays = [x for x in xrays_db if x["patientId"] == patient_id]
    return {"predictions": preds, "xrays": xrays}

# ── Upload X-ray (without prediction) ────────────────────────────────────────
@app.post("/upload-xray")
async def upload_xray(
    patientId: str = Form(...),
    xrays: list[UploadFile] = File(...)
):
    uploaded = []
    for file in xrays:
        ext = Path(file.filename).suffix or ".png"
        filename = f"{uuid.uuid4().hex}{ext}"
        filepath = UPLOAD_DIR / filename
        with open(filepath, "wb") as f:
            shutil.copyfileobj(file.file, f)
        url = f"/uploads/xrays/{filename}"
        uploaded.append({"patientId": patientId, "imagePath": url, "uploadDate": datetime.now().isoformat()})
        xrays_db.append({"patientId": patientId, "imagePath": url, "uploadDate": datetime.now().isoformat()})
    return {"message": "Files uploaded", "files": uploaded}

# ── Predict ───────────────────────────────────────────────────────────────────
@app.post("/predict")
async def predict(
    patientId: str = Form(...),
    boneage: float = Form(...),
    gender: str = Form(...),
    xray: UploadFile = File(...)
):
    # Save image
    ext = Path(xray.filename).suffix or ".png"
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = UPLOAD_DIR / filename
    img_bytes = await xray.read()
    with open(filepath, "wb") as f:
        f.write(img_bytes)

    is_male = gender.lower() in ("male", "m", "1", "true")

    result = predict_risk(
        image_path=str(filepath),
        boneage=boneage,
        is_male=is_male,
    )

    xray_url = f"/uploads/xrays/{filename}"
    gradcam_url = None
    if result.get("gradcam_path"):
        gradcam_url = f"/uploads/xrays/{Path(result['gradcam_path']).name}"

    # Map class labels to frontend format
    label_map = {"Low Risk": "Normal", "Medium Risk": "Osteopenia", "High Risk": "Osteoporosis"}
    result_label = label_map.get(result["risk_label"], result["risk_label"])

    prediction = {
        "patientId": patientId,
        "result": result_label,
        "probability": round(result["confidence"], 4),
        "riskClass": result["risk_class"],
        "allProbabilities": {
            "Normal": round(result["all_probabilities"].get("Low Risk", 0), 4),
            "Osteopenia": round(result["all_probabilities"].get("Medium Risk", 0), 4),
            "Osteoporosis": round(result["all_probabilities"].get("High Risk", 0), 4),
        },
        "recommendation": result["recommendation"],
        "gradcamImage": gradcam_url,
        "xrayImage": xray_url,
        "timestamp": datetime.now().isoformat(),
    }

    # Save to xrays db
    xrays_db.append({"patientId": patientId, "imagePath": xray_url, "uploadDate": prediction["timestamp"]})

    predictions_db.append(prediction)
    return prediction

# ── Chatbot (rule-based, no API key needed) ───────────────────────────────────
@app.post("/chatbot")
async def chatbot(data: dict):
    patient_id = data.get("patientId", "")
    message = data.get("message", "").lower()
    patient = patients_db.get(patient_id)
    last_pred = next((p for p in reversed(predictions_db) if p["patientId"] == patient_id), None)

    responses = {
        "diet": "For bone health, focus on calcium-rich foods (dairy, leafy greens, almonds), vitamin D (fatty fish, egg yolks, sunlight), and magnesium (nuts, seeds). Avoid excessive caffeine and alcohol.",
        "exercise": "Weight-bearing exercises are excellent for bone health: walking, jogging, dancing, and resistance training. Aim for 30 minutes most days. Balance exercises like Tai Chi help prevent falls.",
        "calcium": "Adults need 1000-1200mg calcium daily. Best sources: dairy (milk 300mg/cup), fortified foods, sardines with bones, and leafy greens like kale and bok choy.",
        "vitamin": "Vitamin D3 (1000-2000 IU/day) helps absorb calcium. Get 15-20 min sunlight daily, eat fatty fish, eggs, or take supplements if deficient.",
        "treatment": "Osteoporosis treatments include: bisphosphonates (alendronate, risedronate), denosumab injections, and hormone therapy. Always consult your doctor for personalized treatment.",
        "fracture": "To reduce fracture risk: exercise regularly, ensure adequate calcium/vitamin D, remove home fall hazards, use grab bars, and consider bone density monitoring.",
        "dexa": "DEXA scan is the gold standard for bone density measurement. Results given as T-score: above -1 is normal, -1 to -2.5 is osteopenia, below -2.5 is osteoporosis.",
        "pain": "Bone pain can have many causes. Keep track of location, severity, and duration. See your doctor promptly - it may indicate fracture, infection, or other conditions needing evaluation.",
    }

    reply = None
    for key, resp in responses.items():
        if key in message:
            reply = resp
            break

    if reply is None:
        if any(w in message for w in ["hello", "hi", "hey"]):
            name = patient["name"] if patient else "there"
            reply = f"Hello {name}! I'm your OsteoAI bone health assistant. I can help with questions about diet, exercise, calcium, vitamin D, treatment options, and fracture prevention."
        elif any(w in message for w in ["result", "report", "prediction", "diagnosis"]):
            if last_pred:
                reply = f"Your latest screening result is: {last_pred['result']} with {last_pred['probability']*100:.1f}% confidence. {last_pred.get('recommendation', '')}"
            else:
                reply = "No prediction results found yet. Please upload an X-ray for analysis."
        elif any(w in message for w in ["risk", "osteoporosis", "osteopenia"]):
            reply = "Osteoporosis risk increases with age, being female, low body weight, smoking, excessive alcohol, low calcium/vitamin D intake, and family history. Early detection via DEXA scan is key."
        else:
            reply = f"Thank you for your question about bone health. I can assist with diet recommendations, exercise guidance, calcium and vitamin D intake, treatment options, and fracture prevention. Could you please be more specific about what you'd like to know?"

    if patient:
        reply = f"[Patient: {patient['name']}] " + reply

    return {"reply": reply}

@app.get("/health")
async def health():
    return {"status": "ok", "model": get_model_status()}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
