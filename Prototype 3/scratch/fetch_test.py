import urllib.request
import json
import ssl

semIdMap = {
  "1": "1wcqXk9t5TfZjwpW2rvjBMKXwwWIrQ4ca",
  "2": "1Rb23Q-_-hZ0NCNPNlPJ9e4px2-wikiVB",
  "3": "1mfEfqFWJ3NkeYmdjM1-YED0GZ9q3Qvt2",
  "4": "1A9FLeKbVnJXS3W5h9iUi2s6tvxqQdC84",
}

def fetch_folder(folder_id):
    url = f"https://jiit-shelf.onrender.com/api/drive/{folder_id}"
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, context=ctx) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print(f"Error fetching {folder_id}: {e}")
        return None

if __name__ == "__main__":
    for sem, folder_id in semIdMap.items():
        print(f"\n--- Semester {sem} ({folder_id}) ---")
        subjects = fetch_folder(folder_id)
        if subjects:
            for sub in subjects:
                print(f"ID: {sub['id']} | Name: {sub['name']}")
        else:
            print("Failed to fetch.")
