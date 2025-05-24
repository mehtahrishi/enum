# utils/gemini_analyzer.py
import google.generativeai as genai
import os

def configure_gemini():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY not found in environment variables.")
    genai.configure(api_key=api_key)

def analyze_text_with_gemini(text_content, url):
    """
    Analyzes text content using Gemini to extract:
    - Company Name
    - Core Business Description
    - Industry Classification
    """
    if not text_content:
        return {
            "company_name": "N/A (No text content provided)",
            "business_description": "N/A (No text content provided)",
            "industry": "N/A (No text content provided)"
        }
        
    try:
        configure_gemini()
        # Using gemini-1.5-flash as it's good for fast, concise tasks
        # You can also use 'gemini-pro'
        model = genai.GenerativeModel('gemini-1.5-flash-latest') 
        
        prompt = f"""
        Analyze the following text content from the website URL: {url}
        The text content is:
        ---
        {text_content[:15000]}
        ---
        Based on this text, provide the following information. If a piece of information cannot be determined, state "Not found".
        1. Company Name: (The primary company or organization name associated with the website)
        2. Core Business Description: (A concise summary of what the company does, its primary services, or products)
        3. Industry Classification: (The primary industry the company operates in)

        Format your response clearly for each item. Example:
        Company Name: Example Corp
        Core Business Description: Provides cloud-based software solutions for small businesses.
        Industry Classification: Software as a Service (SaaS)
        """

        response = model.generate_content(prompt)
        
        # Basic parsing of the response. This can be made more robust.
        # Assumes Gemini follows the requested format.
        ai_response_text = response.text
        
        analysis = {
            "company_name": "Not found",
            "business_description": "Not found",
            "industry": "Not found"
        }

        lines = ai_response_text.split('\n')
        for line in lines:
            if "Company Name:" in line:
                analysis["company_name"] = line.split("Company Name:", 1)[1].strip()
            elif "Core Business Description:" in line:
                analysis["business_description"] = line.split("Core Business Description:", 1)[1].strip()
            elif "Industry Classification:" in line:
                analysis["industry"] = line.split("Industry Classification:", 1)[1].strip()
        
        # Fallback if specific parsing fails but some text is there
        if all(val == "Not found" for val in analysis.values()) and ai_response_text.strip():
             analysis["business_description"] = f"AI Raw Output: {ai_response_text.strip()}"


        return analysis

    except Exception as e:
        print(f"Error with Gemini analysis: {e}")
        return {
            "company_name": f"Error during analysis: {str(e)}",
            "business_description": f"Error during analysis: {str(e)}",
            "industry": f"Error during analysis: {str(e)}"
        }