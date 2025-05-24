# utils/scraper.py
import requests
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
import time

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"

def get_static_content(url):
    """Fetches HTML using requests (for simpler sites or as a fallback)."""
    try:
        headers = {'User-Agent': USER_AGENT}
        response = requests.get(url, headers=headers, timeout=15) # Increased timeout slightly
        response.raise_for_status()
        return response.text
    except requests.RequestException as e:
        print(f"Requests error fetching {url}: {e}")
        return None

def get_dynamic_content(url):
    """Fetches HTML using Playwright (for JavaScript-heavy sites)."""
    html_content = None
    try:
        with sync_playwright() as p:
            # Try firefox as an alternative sometimes, or stick to chromium
            # browser = p.firefox.launch(headless=True)
            browser = p.chromium.launch(headless=True) # Use headless=False for debugging
            context = browser.new_context(
                user_agent=USER_AGENT,
                java_script_enabled=True, # Ensure JS is enabled
                ignore_https_errors=True  # Can be helpful for some sites
            )
            page = context.new_page()

            # Optional: Add a more robust stealth script if needed
            # page.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")

            page.goto(url, timeout=30000, wait_until='networkidle') # wait_until 'networkidle' can be more reliable
            
            # An alternative to time.sleep is to wait for a specific selector that indicates page load,
            # but 'networkidle' and a small sleep often work.
            # time.sleep(3) # Keep a small sleep as a fallback if networkidle isn't enough

            html_content = page.content()
            browser.close()
        return html_content
    except Exception as e:
        print(f"Playwright error fetching {url}: {e}")
        return None # Fallback or error indication

def extract_relevant_text(html_content, url=""):
    """Extracts text from common HTML tags, preferring main content areas."""
    if not html_content:
        return ""

    soup = BeautifulSoup(html_content, 'html.parser')

    # Remove script, style, nav, footer, header, aside, form, noscript as they usually don't contain main content
    # Also remove elements that are often visually hidden but might contain text
    for element in soup(["script", "style", "nav", "footer", "header", "aside", "form", "noscript", "button", "input", "select", "textarea"]):
        element.decompose()
    
    # Further remove common non-content containers if they are empty or just have wrapper divs
    for selector in [".cookie-banner", ".modal", ".popup", "#cookie-consent", ".advertisement", ".sidebar"]:
        for el in soup.select(selector):
            el.decompose()


    texts = []

    # Get title first as it's very important context
    title_tag = soup.find('title')
    if title_tag and title_tag.string:
        texts.append(title_tag.string.strip())

    # Get meta description next
    meta_description_tag = soup.find('meta', attrs={'name': 'description'})
    if meta_description_tag:
        content_value = meta_description_tag.get('content')
        if content_value: # Check if the attribute exists and has a value
            texts.append(content_value.strip()) # Strip the value

    # Try to find main content areas
    main_content_selectors = ['main', 'article', '[role="main"]', '.content', '#content', '.main-content', '#main-content', '.post-content', '.entry-content']
    main_text_found = False
    for selector in main_content_selectors:
        main_element = soup.select_one(selector)
        if main_element:
            # Extract text more carefully from the main element, trying to get meaningful blocks
            block_texts = []
            for child in main_element.find_all(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'div'], recursive=True):
                text = child.get_text(separator=' ', strip=True)
                if text and len(text.split()) > 3 : # Only add if it has some substance
                    block_texts.append(text)
            if block_texts:
                texts.append(" ".join(block_texts))
                main_text_found = True
                break # Use the first main content area found that yields text

    if not main_text_found:
        # Fallback: Get text from body if no specific main content area is found or it yielded no text
        body = soup.find('body')
        if body:
            # Try to get meaningful blocks from the body as well
            block_texts = []
            for child in body.find_all(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'div'], recursive=False): # recursive=False for direct children
                text = child.get_text(separator=' ', strip=True)
                if text and len(text.split()) > 3:
                    block_texts.append(text)
            if block_texts:
                 texts.append(" ".join(block_texts))
            else: # Absolute fallback for body
                texts.append(body.get_text(separator=' ', strip=True))
        else: # If no body, very unusual, just get all text
            texts.append(soup.get_text(separator=' ', strip=True))

    # Join all collected text parts, ensuring no duplicates if title/meta was also in main
    # Using a set for intermediate storage can help with duplicates but might change order
    # For now, simple join is fine, Gemini can handle some redundancy.
    full_text = " ".join(texts)

    # Basic cleaning: remove excessive whitespace and potential leftover JS/CSS if not fully removed
    cleaned_text = " ".join(full_text.split())
    # Remove lines that are mostly special characters or very short (often artifacts)
    lines = [line.strip() for line in cleaned_text.splitlines() if len(line.strip()) > 10 and sum(c.isalnum() for c in line) / len(line) > 0.5]
    cleaned_text = " ".join(lines)


    # Limit text length to avoid overly long inputs for Gemini
    MAX_TEXT_LENGTH = 20000 # Reduced slightly for safety, Gemini models have different limits
    if len(cleaned_text) > MAX_TEXT_LENGTH:
        # Try to cut at a sentence boundary
        end_index = cleaned_text.rfind('.', 0, MAX_TEXT_LENGTH)
        if end_index != -1:
            cleaned_text = cleaned_text[:end_index+1]
        else:
            cleaned_text = cleaned_text[:MAX_TEXT_LENGTH]
            
    return cleaned_text


def scrape_website_text(url):
    """
    Scrapes website text, trying dynamic rendering first.
    Returns a string of extracted text.
    """
    print(f"Attempting to scrape: {url}")

    html_content = get_dynamic_content(url)

    if not html_content:
        print(f"Playwright failed or returned no content for {url}, trying static request.")
        html_content = get_static_content(url)

    if not html_content:
        print(f"Failed to retrieve content from {url} using both methods.")
        return None

    extracted_text = extract_relevant_text(html_content, url)

    if not extracted_text or len(extracted_text.strip()) < 50: # Check for minimal meaningful content
        print(f"No relevant or sufficient text extracted from {url}. Extracted: '{extracted_text[:100]}...'")
        # Optionally, you could return the raw HTML or a snippet if text extraction fails badly
        # but for Gemini, clean text is better.
        return None

    print(f"Successfully extracted text (length: {len(extracted_text)}) from {url}")
    return extracted_text