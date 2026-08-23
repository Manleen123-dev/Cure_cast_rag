# CureCast

CureCast is an AI-powered disease prediction application. It allows users to input their symptoms and uses a machine learning model to predict the most likely diseases, along with their probabilities, severity, and the recommended specialist to consult.

## Architecture

The project follows a standard decoupled client-server architecture:

1. **Frontend (React + Vite + Tailwind CSS):**
   - Provides a responsive, modern user interface.
   - Allows users to select symptoms and view predictions.
   - Communicates with the backend via REST API calls using `axios`.
   - Uses `framer-motion` for smooth UI animations.

2. **Backend (Flask + Python):**
   - Serves as the API layer connecting the frontend to the machine learning model.
   - Built with Flask and handles CORS for frontend communication.
   - Loads a pre-trained CatBoost model (`curecast_catboost_optimized.pkl`).
   - Maps diseases to severity levels and specialist recommendations using a catalog (`disease_list_with_counts.csv`).

3. **Machine Learning:**
   - Uses a serialized CatBoost model (`.pkl` file) trained on symptom-disease datasets.
   - The `train.py` script contains the logic used to train and optimize this model.

## API Endpoints

The Flask backend exposes the following REST endpoints:

- `GET /` : Health check endpoint.
- `GET /symptoms` : Returns a list of all available symptoms that the model can process.
- `GET /diseases` : Returns a catalog of diseases along with metadata (severity, sample counts, recommended specialist).
- `POST /predict` : 
  - **Payload:** `{"symptoms": ["fever", "cough", ...]}`
  - **Response:** Returns the top 3 most likely diseases based on the provided symptoms, including their probabilities, severity, and recommended specialist.

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- Python (v3.8+ recommended)
- pip

### 1. Start the Backend Server

```bash
# Navigate to the project root
cd CureCast

# Install dependencies
pip install -r backend/requirements.txt

# Start the Flask server
flask --app backend/main.py run
```
The backend will run on `http://127.0.0.1:5000`.

### 2. Start the Frontend Application

```bash
# Open a new terminal and navigate to the frontend directory
cd CureCast/frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```
The frontend will run on `http://localhost:5173`.

## Scaling & Future Enhancements

If you want to scale this project further, consider the following areas:

### Backend & Model
- **Database Integration:** Replace the static CSV (`disease_list_with_counts.csv`) with a robust database (e.g., PostgreSQL, MongoDB) to store disease catalogs, user histories, and telemetry.
- **Model Updating:** Automate the retraining pipeline. Trigger `train.py` periodically with new data and deploy the updated `.pkl` artifact via CI/CD.
- **Containerization:** Wrap the Flask app and React app in Docker containers (`Dockerfile` and `docker-compose.yml`) for easier deployment and scaling using cloud providers (AWS, GCP, etc.).
- **API Authentication:** Secure the `/predict` endpoint using JWT or API keys if you plan to expose it to the public internet or third-party apps.

### Frontend
- **State Management:** As the app grows, introduce a state management library (like Redux or Zustand) to handle complex symptom selections and user sessions.
- **Progressive Web App (PWA):** Configure Vite to output a PWA so users can install CureCast on their mobile devices for offline capabilities and native feel.
- **Localization (i18n):** Add multi-language support so users can select symptoms and view diseases in their native languages.

### Machine Learning
- **Feedback Loop:** Allow users or medical professionals to provide feedback on prediction accuracy to improve the model over time.
- **More Features:** Incorporate user demographics (age, gender, pre-existing medical history) into the prediction model alongside symptoms for much higher accuracy.
