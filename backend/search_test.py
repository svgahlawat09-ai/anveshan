
import os
import requests
from dotenv import load_dotenv

# Load private settings from the project's .env file
load_dotenv()

# Read the Tavily API key
api_key = os.getenv("TAVILY_API_KEY")

if not api_key:
    print("API key missing. Check your .env file.")

else:
    url = "https://api.tavily.com/search"

    headers = {
        "Authorization": f"Bearer {api_key}"
    }

    payload = {
        "query": "NASA evidence that Earth is approximately spherical",
        "topic": "general",
        "search_depth": "basic",
        "max_results": 5,
        "include_answer": False
    }

    try:
        response = requests.post(
            url,
            headers=headers,
            json=payload,
            timeout=20
        )

        response.raise_for_status()
        data = response.json()
        results = data.get("results", [])

        print("HTTP status:", response.status_code)
        print("Number of results:", len(results))

        for result in results:
            print("\nTitle:", result.get("title", "No title"))
            print("URL:", result.get("url", "No URL"))
            print("Relevance score:", result.get("score", "N/A"))
            print("Content:", result.get("content", ""))

    except requests.exceptions.RequestException as error:
        print("Search request failed:", error)
