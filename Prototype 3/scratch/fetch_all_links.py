import urllib.request
import json
import ssl
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

semIdMap = {
  "1": "1wcqXk9t5TfZjwpW2rvjBMKXwwWIrQ4ca",
  "2": "1Rb23Q-_-hZ0NCNPNlPJ9e4px2-wikiVB",
  "3": "1mfEfqFWJ3NkeYmdjM1-YED0GZ9q3Qvt2",
  "4": "1A9FLeKbVnJXS3W5h9iUi2s6tvxqQdC84",
}

def fetch_folder_contents(folder_id):
    url = f"https://jiit-shelf.onrender.com/api/drive/{folder_id}"
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    
    # Retry logic
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, context=ctx, timeout=15) as response:
                return json.loads(response.read().decode('utf-8'))
        except Exception as e:
            if attempt == 2:
                print(f"Failed to fetch {folder_id} after 3 attempts: {e}")
                return []
            time.sleep(1)
    return []

def process_subject(subject, sem):
    sub_id = subject['id']
    sub_name_raw = subject['name']
    
    print(f"Fetching subfolders for subject: {sub_name_raw} (Sem {sem})")
    contents = fetch_folder_contents(sub_id)
    
    # Check if we got back a file dictionary instead of a list of folder contents
    if isinstance(contents, dict) and contents.get('type') == 'file':
        return {
            'id': sub_id,
            'name': sub_name_raw,
            'type': 'file',
            'link': f"https://drive.google.com/file/d/{sub_id}/view"
        }
        
    subfolders_data = []
    
    # Retrieve contents of subfolders in parallel
    with ThreadPoolExecutor(max_workers=5) as executor:
        future_to_subfolder = {}
        for item in contents:
            if item.get('type') == 'folder':
                future = executor.submit(fetch_folder_contents, item['id'])
                future_to_subfolder[future] = item
            else:
                # Direct file or yt.txt etc.
                subfolders_data.append({
                    'id': item['id'],
                    'name': item['name'],
                    'type': item.get('type', 'file'),
                    'link': f"https://drive.google.com/file/d/{item['id']}/view" if item.get('mimeType') != 'text/plain' else None,
                    'webViewLink': item.get('webViewLink'),
                    'webContentLink': item.get('webContentLink')
                })
        
        for future in as_completed(future_to_subfolder):
            item = future_to_subfolder[future]
            folder_files = future.result()
            files_list = []
            for f in folder_files:
                files_list.append({
                    'id': f['id'],
                    'name': f['name'],
                    'webViewLink': f.get('webViewLink'),
                    'webContentLink': f.get('webContentLink'),
                    'link': f"https://drive.google.com/file/d/{f['id']}/view"
                })
            
            subfolders_data.append({
                'id': item['id'],
                'name': item['name'],
                'type': 'folder',
                'files': files_list
            })
            
    return {
        'id': sub_id,
        'name': sub_name_raw,
        'contents': subfolders_data
    }

def main():
    all_data = {}
    
    for sem, sem_folder_id in semIdMap.items():
        print(f"\n--- Processing Semester {sem} ---")
        subjects = fetch_folder_contents(sem_folder_id)
        if not subjects:
            print(f"No subjects found or error fetching Semester {sem}")
            continue
            
        all_data[sem] = []
        
        # Process subjects in parallel
        with ThreadPoolExecutor(max_workers=4) as executor:
            future_to_subject = {executor.submit(process_subject, sub, sem): sub for sub in subjects}
            for future in as_completed(future_to_subject):
                subject_data = future.result()
                all_data[sem].append(subject_data)
                
    with open('scratch/jiit_shelf_links.json', 'w', encoding='utf-8') as f:
        json.dump(all_data, f, indent=2)
        
    print("\nFetch completed successfully! Saved to scratch/jiit_shelf_links.json")

if __name__ == "__main__":
    main()
