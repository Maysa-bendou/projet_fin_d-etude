from huggingface_hub import HfApi

api = HfApi()

api.upload_folder(
    folder_path=r"C:\Users\User1\Projects\Projet L3 PFE\Copie\projet_fin_d-etude\ml_api\distilbert_model_best", 
    repo_id="MAYSA23/ticket-classifier",
    repo_type="model"
)