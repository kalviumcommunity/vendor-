import os
import sys
import logging
import requests
from dotenv import load_dotenv

# Configure logging format
logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def load_configuration():
    """Load and validate environment variables."""
    logger.info("Loading API configuration")
    load_dotenv()
    
    api_key = os.getenv("API_KEY")
    if not api_key or api_key.strip() == "" or api_key.strip() == "your_api_key_here":
        logger.error("API_KEY is missing or not configured in .env file.")
        print("\n[Error] Please set a valid API_KEY in your .env file before running the script.")
        return None, None, None

    api_url = os.getenv("API_URL", "https://api.openai.com/v1/chat/completions")
    model = os.getenv("MODEL_NAME", "gpt-3.5-turbo")
    
    return api_key, api_url, model


def send_chat_completion(api_key: str, api_url: str, model: str):
    """Send a chat completion request to an OpenAI-compatible API."""
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    messages = [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Explain what an API is in one sentence."}
    ]

    payload = {
        "model": model,
        "messages": messages,
        "temperature": 0.7
    }

    try:
        logger.info("Sending chat completion request")
        response = requests.post(api_url, headers=headers, json=payload, timeout=30)

        # Handle specific HTTP error status codes
        if response.status_code == 401:
            logger.error("Authentication failed (HTTP 401).")
            print("\n[Error 401 - Unauthorized]: The provided API key is invalid, missing, or unauthorized. "
                  "Please verify your credentials in the .env file.")
            return

        if response.status_code == 429:
            logger.error("Rate limit or quota exceeded (HTTP 429).")
            print("\n[Error 429 - Too Many Requests]: You have exceeded your API rate limit or credit quota. "
                  "Please wait a moment and retry later, or check your account billing details.")
            return

        response.raise_for_status()

        logger.info("API request successful")
        logger.info("Response received")

        data = response.json()
        model_response = data["choices"][0]["message"]["content"].strip()

        print("\nModel response:")
        print(model_response)

    except requests.exceptions.HTTPError as http_err:
        logger.error(f"HTTP error occurred: {http_err.response.status_code}")
        print(f"\n[HTTP Error]: Request failed with status code {http_err.response.status_code}.")
    except requests.exceptions.ConnectionError:
        logger.error("Network connection error.")
        print("\n[Connection Error]: Failed to connect to the API server. Please check your internet connection.")
    except requests.exceptions.Timeout:
        logger.error("Request timed out.")
        print("\n[Timeout Error]: The request timed out while waiting for a response from the API.")
    except requests.exceptions.RequestException as req_err:
        logger.error(f"Unexpected request error occurred: {type(req_err).__name__}")
        print(f"\n[Request Error]: An unexpected error occurred while communicating with the API.")
    except (KeyError, IndexError) as parse_err:
        logger.error("Failed to parse API response structure.")
        print("\n[Parsing Error]: The API response format was unexpected and could not be parsed.")


def main():
    api_key, api_url, model = load_configuration()
    if not api_key:
        sys.exit(1)

    send_chat_completion(api_key, api_url, model)


if __name__ == "__main__":
    main()
