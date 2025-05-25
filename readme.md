# Enum 🔎

**Enum** is an intelligent web application designed to analyze and extract core information from any website URL you provide. Built with a sleek, modern glassmorphic UI, it leverages the power of **Python** for robust web scraping (including dynamic JavaScript-rendered sites) and Google's **Gemini API** for advanced natural language understanding. Get quick insights into what a company is, what it does, and its industry, all read aloud for convenience, with a visual snapshot of the website itself. Plus, easily revisit past analyses with a dedicated history section.

---

## ✨ Features

* **Modern Glassmorphic User Interface:** A visually appealing and intuitive design that enhances user experience.
* **Intelligent Website Analysis:**
    * **Company Identification:** Determines the company or organization name associated with the URL.
    * **Core Business Description:** Summarizes what the company does and its primary services/products.
    * **Industry Classification:** Identifies the industry the company operates in.
    * **Google Gemini API Powered:** Utilizes the **Google Gemini API** for sophisticated text understanding and summarization, providing accurate and concise insights.
* **Automatic Text-to-Speech (Read Aloud):** Extracted information is automatically read out using the browser's built-in Web Speech API, making consumption effortless.
* **Live Website Preview:** Displays an interactive `iframe` of the analyzed website, allowing you to visually browse the site alongside the generated insights.
* **Analysis History:** Stores a record of all previously analyzed URLs, including the generated insights (company name, description, industry).
    * **Revisit Content:** Easily click from the history page to view the detailed analysis of any past entry on the main page.
* **Python-Powered Backend:** Robust and scalable, handling all web scraping, AI interactions, and database operations.
* **Dynamic Content Scraping:** Employs **Playwright** to handle JavaScript-rendered websites, ensuring comprehensive data extraction.

---

## 🛠️ Technologies Used

### Backend (Python)

* **Flask:** A lightweight and flexible web framework for serving the API and web content.
* **Requests:** For making initial HTTP requests to fetch webpage content.
* **BeautifulSoup4:** For parsing HTML content and extracting static data.
* **Playwright:** For browser automation to scrape JavaScript-rendered dynamic content, ensuring comprehensive data gathering.
* **`google-generativeai` (Google Gemini API):** Python SDK for interacting directly with Google's Gemini models for advanced NLP tasks.
* **Pymongo:** Python driver for MongoDB, used for database interactions.
* **MongoDB (Atlas/Local):** NoSQL database for storing analysis history and retrieved website data.
* **Gunicorn:** WSGI HTTP server for running the Flask application in production.

### Frontend (HTML, CSS, JavaScript)

* **HTML5:** Structure of the web pages.
* **CSS3:** For styling, including glassmorphic effects and a modern look.
* **JavaScript (ES6+):** For dynamic UI updates, API calls to the backend, and integrating the Web Speech API for text-to-speech.

---

## 🚀 Getting Started

Follow these instructions to set up and run Enum on your local machine.

### Prerequisites

* Python 3.8+
* `pip` (Python package installer)
* MongoDB instance (local or a cloud service like [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) - a free tier is available)
* Google Gemini API Key:
    * Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
    * Create an API key.

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/enum.git # Replace with your repo URL
cd enum
```

### 2. Create and Activate Virtual Environment

Create:

```bash
python -m venv venv
```

Activate:

```bash
# Windows
.\venv\Scripts\activate

# Linux/macOS
source venv/bin/activate
```

### 3. Install Dependencies

Make sure Playwright browser binaries are also installed:

```bash
pip install -r requirements.txt
playwright install --with-deps chromium
```

(You can install other browsers like firefox or webkit if needed, but chromium is often sufficient).

### 4. Set Up Environment Variables

Create a `.env` file in the project root directory with the following content:

```bash
GEMINI_API_KEY="YOUR_GOOGLE_GEMINI_API_KEY"
MONGO_URI="YOUR_MONGODB_CONNECTION_STRING" # e.g., mongodb://localhost:27017/enum_db or your Atlas URI
FLASK_SECRET_KEY="your_very_strong_random_secret_key" # Generate a random string
```

Replace placeholders with your actual API key and MongoDB connection string.

**Important:** Add `.env` to your `.gitignore` file to prevent committing sensitive credentials.

### 5. Running the Application

Start the Flask development server:

```bash
python app.py
```

The application will typically be available at `http://127.0.0.1:5000/`. Open this URL in your web browser.

---

## 📖 Usage

1.  **Navigate to the Homepage:** Open the application in your browser.
2.  **Enter a URL:** In the "Get Started" section, paste the full URL (including `http://` or `https://`) of the website you want to analyze into the input field.
3.  **Analyze:** Click the "Analyze Website" button.
4.  **Receive Insights:** Wait a few moments. The application will scrape the website, send the content to the Gemini API for analysis, and then display:
    * The identified **Company Name**.
    * A **Core Business Description**.
    * The **Industry Classification**.

    These insights will also be automatically read aloud.
5.  **View Website Preview:** An iframe below the analysis will load the live website for your reference.
6.  **View History:** Click the "View History" button (on the main page) or navigate to the `/history` page to see a list of all previously analyzed websites.
7.  **Revisit Content:** Click on any entry in the history list to automatically populate the main analysis page with its details and preview.

---

## 🏗️ Project Structure

```
enum/
├── app.py                  # Main Flask application
├── requirements.txt        # Python dependencies
├── .env                    # Environment variables (ignored by Git)
├── static/
│   ├── css/
│   │   └── style.css       # Main CSS styles
│   ├── js/
│   │   └── script.js       # Frontend JavaScript logic
│   └── img/                # For images like favicons (e.g., favicon.png)
├── templates/
│   ├── index.html          # Main analysis page
│   └── history.html        # Page to display analysis history
├── utils/
│   ├── __init__.py
│   ├── scraper.py          # Web scraping logic (Requests, BeautifulSoup, Playwright)
│   └── gemini_analyzer.py  # Logic for interacting with Gemini API
├── Procfile                # For Heroku/Render deployment (optional)
├── Dockerfile              # For Docker-based deployment (optional)
└── README.md               # This file
```

---

## 🐳 Deployment

This application can be deployed to various platforms. Here are general guidelines:

### Using Docker (Recommended for Playwright)

A `Dockerfile` is provided for building a containerized version of the app. The `mcr.microsoft.com/playwright/python` base image is used to simplify Playwright browser dependency management.

Build the Docker image:

```bash
docker build -t enum-app .
```

Run the Docker container (example for local testing):

```bash
docker run -p 8000:8000 \
  -e MONGO_URI="your_mongo_uri" \
  -e GEMINI_API_KEY="your_gemini_key" \
  -e FLASK_SECRET_KEY="your_flask_secret" \
  -e PORT="8000" \
  enum-app
```

Access at `http://localhost:8000`.

For deployment platforms (like Render, Google Cloud Run), configure these environment variables in the platform's settings.

### Using Procfile (e.g., Heroku, Render)

A `Procfile` is provided:

```
web: playwright install --with-deps chromium && gunicorn app:app --preload --timeout 120 -w 2
```

Ensure your platform's Python buildpack correctly handles the `playwright install` command and its dependencies. Gunicorn is used as the production WSGI server.

**Environment Variables on the Platform:**
Remember to set `GEMINI_API_KEY`, `MONGO_URI`, and `FLASK_SECRET_KEY` in your chosen hosting platform's environment variable settings. The platform usually provides `PORT`.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Please feel free to:

* Open an issue to discuss a change or report a bug.
* Fork the repository and submit a pull request.

---

## 📜 License

This project is open-source and available under the [MIT License](LICENSE.md).

---

*(Replace `placeholder_screenshot.png` with an actual screenshot of your app, and remember to update `https://github.com/your-username/enum.git` to your actual repository URL. Also, create a `LICENSE.md` file in your project root if you haven't already.)*