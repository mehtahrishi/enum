# app.py
from flask import Flask, request, jsonify, render_template
from dotenv import load_dotenv
from pymongo import MongoClient
import os
from datetime import datetime, timezone

from utils.scraper import scrape_website_text
from utils.gemini_analyzer import analyze_text_with_gemini

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "a_default_secret_key_if_not_set") # Important for sessions if used

# MongoDB Setup
mongo_uri = os.getenv("MONGO_URI")
if not mongo_uri:
    raise EnvironmentError("MONGO_URI not found in environment variables.")
try:
    client = MongoClient(mongo_uri)
    db = client.get_default_database() # Assumes DB name is in URI, or specify: client['your_db_name']
    analysis_history_collection = db['analysis_history']
    # Test connection
    client.admin.command('ping')
    print("Successfully connected to MongoDB!")
except Exception as e:
    print(f"Failed to connect to MongoDB: {e}")
    raise

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/history')
def history_page():
    return render_template('history.html')

@app.route('/analyze', methods=['POST'])
def analyze_url():
    data = request.get_json()
    url = data.get('url')

    if not url:
        return jsonify({'error': 'URL is required'}), 400

    # Basic URL validation
    if not (url.startswith('http://') or url.startswith('https://')):
        return jsonify({'error': 'Invalid URL format. Must start with http:// or https://'}), 400

    try:
        # 1. Scrape website text
        scraped_text = scrape_website_text(url)
        if not scraped_text:
            return jsonify({'error': 'Failed to scrape content from the URL.'}), 500

        # 2. Analyze text with Gemini
        analysis_results = analyze_text_with_gemini(scraped_text, url)
        
        # 3. Store in MongoDB
        history_entry = {
            'url': url,
            'company_name': analysis_results.get('company_name'),
            'business_description': analysis_results.get('business_description'),
            'industry': analysis_results.get('industry'),
            # 'raw_scraped_text': scraped_text, # Optionally store, can be large
            'timestamp': datetime.now(timezone.utc)
        }
        analysis_history_collection.insert_one(history_entry)
        history_entry['_id'] = str(history_entry['_id']) # Convert ObjectId to string for JSON

        return jsonify({'message': 'Analysis successful', 'analysis': history_entry}), 200

    except Exception as e:
        app.logger.error(f"Error during analysis for {url}: {e}", exc_info=True)
        return jsonify({'error': f'An unexpected error occurred: {str(e)}'}), 500

@app.route('/api/history', methods=['GET'])
def get_history():
    try:
        # Fetch history, sort by most recent, limit to e.g., 50 entries
        history_items = list(analysis_history_collection.find().sort('timestamp', -1).limit(50))
        for item in history_items:
            item['_id'] = str(item['_id']) # Convert ObjectId
        return jsonify(history_items), 200
    except Exception as e:
        app.logger.error(f"Error fetching history: {e}", exc_info=True)
        return jsonify({'error': f'Failed to fetch history: {str(e)}'}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) # Set debug=False for production