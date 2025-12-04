import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from dotenv import load_dotenv
from google.api_core.exceptions import GoogleAPIError

app = Flask(__name__)
CORS(app)

# --- Gemini Client Initialization ---
API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    print("❌ ERROR: GEMINI_API_KEY environment variable is missing.")
    AI_CLIENT = None
else:
    try:
        genai.configure(api_key=API_KEY)
        print("✅ Gemini Client Initialized.")
        AI_CLIENT = True
    except Exception as e:
        print(f"⚠️ Failed to initialize Gemini Client. Error: {e}")
        AI_CLIENT = None


def get_ai_recommendation(prompt_text):
    """
    Executes the Gemini API call to generate a mobile recommendation summary.
    """
    if not AI_CLIENT:
        return "AI Service failed: Gemini client is not initialized (check API Key)."

    try:
        # FASTEST model for quick responses
        model = genai.GenerativeModel(
            "gemini-2.0-flash",
            system_instruction=(
                "You are a professional mobile phone recommendation expert.\n"
                "When generating the recommendation:\n"
                "1. ALWAYS mention actual numeric values provided by the user "
                "(like ₹ price ranges, battery mAh, screen size, weight, RAM, etc.).\n"
                "2. NEVER replace numbers with vague terms like 'budget-friendly', 'mid-range', "
                "'entry-level', or 'premium'.\n"
                "3. Provide a clean, well-structured summary in 3–5 sentences.\n"
                "4. Recommend EXACTLY two real smartphone models that best match the criteria.\n"
                "5. Do NOT repeat the raw criteria text. Instead, interpret it meaningfully.\n"
                "6. If numeric conditions conflict, choose the closest matching models.\n"
            ),
        )

        response = model.generate_content(
            prompt_text,
            generation_config=genai.types.GenerationConfig(
                temperature=0.6,
                top_p=0.9,
                max_output_tokens=250
            )
        )

        return response.text.strip()

    except GoogleAPIError as e:
        print(f"API Error: {e}")
        return f"AI Service is currently unavailable due to an API error: {str(e)}"

    except Exception as e:
        print(f"General Error: {e}")
        return f"AI Service failed due to a general error: {str(e)}"


@app.route('/generate_summary', methods=['POST'])
def generate_summary():
    data = request.get_json()
    prompt = data.get('prompt')

    if not prompt:
        return jsonify({"error": "No prompt provided"}), 400

    summary = get_ai_recommendation(prompt)

    if summary.startswith(("AI Service failed", "AI Service is currently unavailable")):
        return jsonify({"summary": summary}), 500

    return jsonify({"summary": summary})


if __name__ == '__main__':
    # Turn off debug for faster response time
    app.run(port=5000)
