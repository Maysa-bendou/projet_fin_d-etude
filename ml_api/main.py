from fastapi import FastAPI
from pydantic import BaseModel
from transformers import DistilBertForSequenceClassification, DistilBertTokenizerFast
from transformers import MarianMTModel, MarianTokenizer
from langdetect import detect, LangDetectException
import torch
import pickle

app = FastAPI()

# ── Load DistilBERT model ──────────────────────────────────────────
print("Loading DistilBERT model...")
MODEL_PATH = "./distilbert_model_best"

classifier = DistilBertForSequenceClassification.from_pretrained(MODEL_PATH)
tokenizer = DistilBertTokenizerFast.from_pretrained(MODEL_PATH)

with open(f"{MODEL_PATH}/label_encoder.pkl", "rb") as f:
    le = pickle.load(f)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
classifier.to(device)
classifier.eval()
print("✅ DistilBERT loaded!")

# ── Load Helsinki-NLP translator ───────────────────────────────────
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
    # no more manual lang field — we detect it

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