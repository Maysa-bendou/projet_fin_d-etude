
# Every time you want to run the FastAPI server:

# Open terminal in ml_api
# venv\Scripts\Activate.ps1
# uvicorn main:app --reload --port 8000


from fastapi import FastAPI
from pydantic import BaseModel
from transformers import DistilBertForSequenceClassification, DistilBertTokenizerFast
from transformers import MarianMTModel, MarianTokenizer
from langdetect import detect, LangDetectException
from huggingface_hub import hf_hub_download
import torch
import pickle

app = FastAPI()

# ── Load DistilBERT model from HuggingFace ─────────────────────────
print("Loading DistilBERT model...")
MODEL_REPO = "MAYSA23/ticket-classifier"

classifier = DistilBertForSequenceClassification.from_pretrained(MODEL_REPO)
tokenizer = DistilBertTokenizerFast.from_pretrained(MODEL_REPO)

# Download label_encoder.pkl from HuggingFace
label_encoder_path = hf_hub_download(repo_id=MODEL_REPO, filename="label_encoder.pkl")
with open(label_encoder_path, "rb") as f:
    le = pickle.load(f)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
classifier.to(device)
classifier.eval()
print("✅ DistilBERT loaded!")

# ── Load Helsinki-NLP translator (downloads automatically) ─────────
print("Loading translator...")
TRANSLATOR_MODEL = "Helsinki-NLP/opus-mt-fr-en"
tr_tokenizer = MarianTokenizer.from_pretrained(TRANSLATOR_MODEL)
tr_model = MarianMTModel.from_pretrained(TRANSLATOR_MODEL)
tr_model.eval()
print("✅ Translator loaded!")

# ── Request schema ─────────────────────────────────────────────────
class TicketRequest(BaseModel):
    title: str
    description: str

# ── Translate French to English ────────────────────────────────────
def translate(text: str) -> str:
    inputs = tr_tokenizer([text], return_tensors="pt", padding=True, truncation=True)
    with torch.no_grad():
        translated = tr_model.generate(**inputs)
    return tr_tokenizer.decode(translated[0], skip_special_tokens=True)

# ── Predict category ───────────────────────────────────────────────
def predict(text: str) -> str:
    encoding = tokenizer(
        text,
        truncation=True,
        padding=True,
        max_length=128,
        return_tensors="pt"
    )
    encoding = {k: v.to(device) for k, v in encoding.items()}
    with torch.no_grad():
        logits = classifier(**encoding).logits
    pred_id = logits.argmax(dim=-1).item()
    return le.classes_[pred_id]

# ── API endpoint ───────────────────────────────────────────────────
@app.post("/predict")
def predict_ticket(req: TicketRequest):
    text = f"{req.title}. {req.description}"

    # Detect language
    try:
        lang = detect(text)
        print(f"Detected language: {lang}")
    except LangDetectException:
        lang = "en"  # fallback

    # Translate only if French
    if lang == "fr":
        text = translate(text)
        print(f"Translated: {text}")

    # Classify
    category = predict(text)

    # Fallback for removed categories
    REMOVED = {"messagerie": "access"}
    category = REMOVED.get(category, category)

    print(f"Predicted: {category}")
    return {"category": category, "detected_lang": lang}

# ── Health check ───────────────────────────────────────────────────
@app.get("/")
def health():
    return {"status": "ok"}