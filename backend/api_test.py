import requests

url = "https://jsonplaceholder.typicode.com/todos/1"

try:
    response = requests.get(url, timeout=10)

    response.raise_for_status()

    data = response.json()

    print("Request succeeded!")
    print("Status:", response.status_code)
    print("Title:", data.get("title"))
    print("Completed:", data.get("completed"))

except requests.exceptions.RequestException as error:
    print("Request failed:", error)

except ValueError as error:
    print("The response wasn't valid JSON:", error)