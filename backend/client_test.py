import requests

url = "http://127.0.0.1:8000/investigate"

payload = {
    "claim": "The Earth is flat."
}

try:
    response = requests.post(
        url,
        json=payload,
        timeout=10
    )

    response.raise_for_status()

    data = response.json()

    print("Status:", response.status_code)
    print("Backend response:", data)

except requests.exceptions.RequestException as error:
    print("Request failed:", error)

except ValueError as error:
    print("The response wasn't valid JSON:", error)