import re
import json

def parse_report():
    filepath = "/Users/vardaangahlot/.gemini/antigravity/brain/1457c58f-7f07-4d95-b429-9097e02df5f8/jiit_shelf_links_report.md"
    with open(filepath, 'r') as f:
        lines = f.readlines()

    current_branch = None
    current_semester = None
    current_subject_code = None
    current_subject_name = None
    current_category = "Notes"  # default

    materials = []

    # Regular expressions
    branch_re = re.compile(r"^##\s+(CSE|IT|ECE|Mathematics and Computing|Robotics and Artificial Intelligence.*)", re.IGNORECASE)
    semester_re = re.compile(r"^###\s+Semester\s+(\d+)", re.IGNORECASE)
    subject_re = re.compile(r"^####\s+📖\s+\[([^\]]+)\]\(([^)]+)\)", re.IGNORECASE)
    
    # Categories under a subject
    category_re = re.compile(r"^-\s+\*\*\[(Assignments|Lectures|PYQs|Tutorials|Books)\]", re.IGNORECASE)
    # File links under a category or directly under subject
    file_re = re.compile(r"^\s*-\s+\[([^\]]+)\]\((https://drive\.google\.com/[^)]+)\)", re.IGNORECASE)
    direct_course_desc_re = re.compile(r"^-\s+\*\*Course Description:\*\*\s+\[([^\]]+)\]\(([^)]+)\)", re.IGNORECASE)

    for line in lines:
        line_str = line.strip()
        if not line_str:
            continue

        # Check branch
        branch_match = branch_re.match(line_str)
        if branch_match:
            b_str = branch_match.group(1).strip()
            if b_str.upper() == 'CSE':
                current_branch = 'Computer Science & Engineering'
            elif b_str.upper() == 'IT':
                current_branch = 'Information Technology'
            elif b_str.upper() == 'ECE':
                current_branch = 'Electronics & Communication'
            else:
                current_branch = b_str
            continue

        # Check semester
        sem_match = semester_re.match(line_str)
        if sem_match:
            current_semester = f"Semester {sem_match.group(1)}"
            continue

        # Check subject
        subj_match = subject_re.match(line_str)
        if subj_match:
            subj_full = subj_match.group(1).strip()
            # Split "18B15GE111 - Engineering Drawing & Design Lab"
            parts = subj_full.split(' - ', 1)
            if len(parts) == 2:
                current_subject_code = parts[0].strip()
                current_subject_name = parts[1].strip()
            else:
                current_subject_code = "GEN-101"
                current_subject_name = subj_full
            current_category = "Notes"  # reset category
            
            # Let's also add the main subject folder as a resource
            subj_link = subj_match.group(2).strip()
            materials.append({
                "code": current_subject_code,
                "name": f"{current_subject_name} (All Materials)",
                "driveLink": subj_link,
                "branch": current_branch,
                "semester": current_semester,
                "type": "Books",
                "subject": current_subject_name,
                "size": "Folder"
            })
            continue

        # Check course description
        cd_match = direct_course_desc_re.match(line_str)
        if cd_match:
            materials.append({
                "code": current_subject_code,
                "name": f"{current_subject_name} Course Syllabus",
                "driveLink": cd_match.group(2).strip(),
                "branch": current_branch,
                "semester": current_semester,
                "type": "Notes",
                "subject": current_subject_name,
                "size": "0.5 MB"
            })
            continue

        # Check category
        cat_match = category_re.match(line_str)
        if cat_match:
            cat_name = cat_match.group(1).strip()
            # Map report category to M3 category: Notes, Tutorials, PYQs, Books
            if cat_name.lower() in ['lectures', 'assignments']:
                current_category = 'Notes'
            elif cat_name.lower() == 'pyqs':
                current_category = 'PYQs'
            elif cat_name.lower() == 'tutorials':
                current_category = 'Tutorials'
            elif cat_name.lower() == 'books':
                current_category = 'Books'
            continue

        # Check file link
        file_match = file_re.match(line)
        if file_match:
            f_name = file_match.group(1).strip()
            f_link = file_match.group(2).strip()
            materials.append({
                "code": current_subject_code,
                "name": f_name,
                "driveLink": f_link,
                "branch": current_branch,
                "semester": current_semester,
                "type": current_category,
                "subject": current_subject_name,
                "size": "PDF"
            })

    print(f"Extracted {len(materials)} study materials.")
    
    # Save a subset or write to json
    with open('/Users/vardaangahlot/Projects/CampOS/Prototype 3/scratch/extracted_materials.json', 'w') as out:
        json.dump(materials, out, indent=2)

if __name__ == "__main__":
    parse_report()
