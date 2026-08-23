# Instructions to run the CureCast Application

I have completed the refactoring of the application to use Flask and JavaScript.

Here is how you can run the application:

**1. Start the Backend Server**

First, ensure you have installed the necessary Python packages. From the project's root directory, run:
```bash
pip install -r backend/requirements.txt
```
Then, to start the Flask server, run the following command from the root directory:
```bash
flask --app backend/main.py run
```
The backend will be running at `http://127.0.0.1:5000`.

**2. Start the Frontend Application**

In a separate terminal, navigate to the `frontend` directory. First, install the Node.js dependencies:
```bash
npm install
```
Then, start the React development server:
```bash
npm run dev
```
The application will be available in your web browser at the address provided by Vite (usually `http://localhost:5173`).

Once both servers are running, you can use the CureCast application in your browser.
