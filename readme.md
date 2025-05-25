# Enum - Intelligent Website Analysis Tool

![Enum Screenshot](./Screenshot%202025-05-25%20090418.png)

---

**Enum** is an intelligent web application designed to analyze and extract core information from any website URL you provide. Built with a sleek, modern glassmorphic UI, it leverages the power of **Python** for robust web scraping (including dynamic JavaScript-rendered sites) and Google's **Gemini API** for advanced natural language understanding. Get quick insights into what a company is, what it does, and its industry, all read aloud for convenience, with a visual snapshot of the website itself. Plus, easily revisit past analyses with a dedicated history section.

---

## ✨ Features

* **Modern Glassmorphic User Interface:** A visually appealing and intuitive design that enhances user experience.
* **Intelligent Website Analysis:**

  * **Company Identification:** Determines the company or organization name associated with the URL.
  * **Core Business Description:** Summarizes what the company does and its primary services/products.
  * **Industry Classification:** Identifies the industry the company operates in.
* **Automatic Text-to-Speech (Read Aloud):** Extracted information is automatically read out using the browser's built-in Web Speech API.
* **Live Website Preview:** Displays an interactive `iframe` of the analyzed website.
* **Analysis History:** Stores a record of all previously analyzed URLs, including the generated insights.

  * **Revisit Content:** Click from the history page to view the detailed analysis of any past entry on the main page.
* **Python-Powered Backend:** Handles all web scraping, AI interactions, and database operations.
* **Dynamic Content Scraping:** Uses **Playwright** to handle JavaScript-rendered websites.

---

## 🛠️ Technologies Used

### Backend (Python)

* **Flask**
* **Requests**
* **BeautifulSoup4**
* **Playwright**
* **Gemini API** (Google)
* **Pymongo**
* **MongoDB (Atlas/Local)**
* **Gunicorn**

### Frontend (HTML, CSS, JavaScript)

* **HTML5**
* **CSS3 (Glassmorphism style)**
* **JavaScript (ES6+)** with Web Speech API

---

## 🚀 Getting Started

### Prerequisites

* Python 3.8+
* `pip`
* MongoDB instance (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))

### 1. Clone the Repository

```bash
git clone https://github.com/mehtahrishi/enum.git
cd enum
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
playwright install --with-deps chromium
```

> **Note:** Add `.env` to `.gitignore` to prevent committing sensitive credentials.

### 3. Run the Application

```bash
python app.py
```

Navigate to: `http://127.0.0.1:5000/`

---

## 📖 Usage

1. Open the app in your browser.
2. Enter a full URL (with `http://` or `https://`) into the input box.
3. Click "Analyze Website."
4. View:

   * **Company Name**
   * **Business Description**
   * **Industry**
   * Live website preview (`iframe`)
   * Listen to the insights via Web Speech API.
5. Use **History** to revisit past analyses.

---

## 🏐 Project Structure

```
enum/
├── app.py                  # Main Flask application
├── requirements.txt        # Python dependencies
├── .env                    # Environment variables (ignored)
├── static/
│   ├── css/
│   │   └── style.css       # Glassmorphic styles
│   ├── js/
│   │   └── script.js       # Web Speech API + frontend logic
│   └── img/                # Icons/images
├── templates/
│   ├── index.html          # Main analysis page
│   └── history.html        # History view page
├── utils/
│   ├── __init__.py
│   ├── scraper.py          # Scraping logic (Requests + Playwright)
│   └── gemini_analyzer.py  # Gemini API interaction logic
└── README.md
```

---

## 🐳 Deployment

### Render/Heroku (Procfile):

```
web: playwright install --with-deps chromium && gunicorn app:app --preload --timeout 120 -w 2
```

* Ensure the platform supports Playwright and necessary dependencies.
* Add required environment variables in the platform's settings.

---

## 🤝 Contributing

Feel free to:

* Fork the repo
* Submit pull requests
* Open issues for bugs or feature requests

---

## 📌 License

MIT License - see `LICENSE.md` for details.

---
