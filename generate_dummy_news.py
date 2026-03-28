import json
import random
import re
from datetime import datetime, timedelta

# Data sources for permutation
sections = ["Academics", "Admissions", "Careers", "Current Affairs", "Study Materials"]
exams = ["JEE Main", "JEE Advanced", "NEET UG", "NEET PG", "CUET UG", "UPSC CSE", "SSC CGL", "SBI PO", "IBPS Clerk", "GATE 2026", "CAT 2026", "CLAT 2026", "AP EAPCET", "TS EAPCET"]
boards = ["CBSE Class 10", "CBSE Class 12", "ICSE", "ISC", "UP Board", "Maharashtra Board", "AP Inter", "TS Inter"]
careers = ["Data Science", "Artificial Intelligence", "Software Engineering", "Digital Marketing", "Financial Analysis", "Nursing", "Civil Services"]
current_topics = [
    "Indian Economy Growth", "New IT Rules 2026", "G20 Summit Preparations", 
    "Space Exploration Milestones", "National Education Policy Updates", 
    "Climate Change Initiatives", "Sports Triumphs",
    "Startup India Initiatives", "Digital Payment Breakthroughs", 
    "Healthcare Tech Innovations", "Renewable Energy Drives", 
    "Global Tech Talent Demand", "Infrastructure Mega Projects", 
    "Women in STEM"
]

news_topics = ["Tech Innovation Hubs", "University Regulations", "Scholarship Programs", "Campus Placement Trends"]
results_topics = ["JEE Phase 1 Results", "NEET Seat Allotment", "CBSE Top Rankers List"]
campus_events = ["IIT TechFest 2026", "DU Cultural Week", "NIT Hackathon", "VIT Science Exhibition"]

templates_exams = [
    ("{exam} 2026: Registration Process to Begin Next Week", "Candidates aspiring for {exam} can check the official portal soon as the application window is expected to open."),
    ("How to Crack {exam} 2026 on Your First Attempt", "Expert strategies and subject-wise breakdowns for students targeting the upcoming {exam}."),
    ("{exam} Revised Syllabus and Exam Pattern Released", "The conducting body for {exam} has issued important circulars regarding changes to the question paper format."),
    ("Top 10 recommended books for {exam} preparation", "A curated list of essential study materials to boost your percentile in the {exam}."),
    ("Previous Year Question Papers Analysis for {exam}", "Understanding the weightage of different topics is crucial for clearing {exam} with high scores.")
]

templates_boards = [
    ("{board} 2026 Exam Timetable Expected Soon", "Millions of students await the official date sheet for the upcoming {board} final examinations."),
    ("{board} Practical Exams to Conclude by February", "Schools affiliated with {board} are wrapping up practicals ahead of the theory papers."),
    ("Stress Management Tips for {board} Students", "Effective ways to handle exam anxiety and maintain focus during the crucial {board} period."),
    ("{board} Marking Scheme Explained in Detail", "Understand how examiners evaluate answer sheets for the {board} to maximize your score.")
]

templates_careers = [
    ("Why {career} is the Most In-Demand Skill in 2026", "An analysis of the job market reveals massive growth in recruitment for {career} professionals."),
    ("A Complete Beginner's Guide to Starting a {career} Career", "Everything you need to know about required degrees, certifications, and entry-level salaries in {career}."),
    ("{career} vs Traditional Roles: What to Choose?", "Navigating the modern employment landscape and deciding if {career} is right for you.")
]

templates_current = [
    ("Latest Updates on {topic}: What You Need to Know", "A comprehensive breakdown of recent developments regarding {topic} and its impact on the nation."),
    ("In-Depth Analysis: The Real Impact of {topic}", "Experts weigh in on the long-term consequences and strategic shifts associated with {topic}.")
]

articles = []

def generate_slug(title):
    base_slug = re.sub(r'[^a-z0-9_-]', '', title.lower().replace(" ", "-"))
    return base_slug[:45] + f"-{random.randint(100,999)}"

# Generate Articles
# 1. Exams (approx 70 articles)
for exam in exams:
    for title_tpl, summary_tpl in templates_exams:
        title = title_tpl.format(exam=exam)
        articles.append({
            "slug": generate_slug(title),
            "section": "EXAMS",
            "eng_title": title,
            "eng_summary": summary_tpl.format(exam=exam),
            "eng_content": f"<p>Welcome to our comprehensive guide on <strong>{exam}</strong>.</p><p>{summary_tpl.format(exam=exam)}</p><p>Preparing for competitive exams in 2026 requires dedication, proper study materials, and consistent mock test practice. Make sure you stay updated with official announcements.</p>",
            "tags": [exam, "2026", "Exams", "Preparation"],
            "keywords": [exam, "Exams", "Preparation"],
            "status": "PUBLISHED"
        })

# 2. Boards (approx 32 articles)
for board in boards:
    for title_tpl, summary_tpl in templates_boards:
        title = title_tpl.format(board=board)
        articles.append({
            "slug": generate_slug(title),
            "section": "ACADEMICS",
            "eng_title": title,
            "eng_summary": summary_tpl.format(board=board),
            "eng_content": f"<p>The <strong>{board}</strong> board examinations are a crucial milestone for students.</p><p>{summary_tpl.format(board=board)}</p><p>Students are advised to revise thoroughly, focus on NCERT or prescribed textbooks, and solve at least 5 years of past papers.</p>",
            "tags": [board, "Board Exams", "2026", "School"],
            "keywords": [board, "Board Exams", "Education"],
            "status": "PUBLISHED"
        })

# 3. Careers (approx 21 articles)
for career in careers:
    for title_tpl, summary_tpl in templates_careers:
        title = title_tpl.format(career=career)
        articles.append({
            "slug": generate_slug(title),
            "section": "JOBS",
            "eng_title": title,
            "eng_summary": summary_tpl.format(career=career),
            "eng_content": f"<p>The landscape of modern employment heavily favors specializations like <strong>{career}</strong>.</p><p>{summary_tpl.format(career=career)}</p><p>If you are planning to transition into this field, acquiring relevant practical skills and certifications can significantly boost your employability.</p>",
            "tags": [career, "Jobs", "Career Guidance", "2026 Trends"],
            "keywords": [career, "Careers", "Jobs"],
            "status": "PUBLISHED"
        })

# 4. Current Affairs (approx 14 articles)
for topic in current_topics:
    for title_tpl, summary_tpl in templates_current:
        title = title_tpl.format(topic=topic)
        articles.append({
            "slug": generate_slug(title),
            "section": "CURRENT AFFAIRS",
            "eng_title": title,
            "eng_summary": summary_tpl.format(topic=topic),
            "eng_content": f"<p>Recent developments around <strong>{topic}</strong> have garnered significant attention globally and within India.</p><p>{summary_tpl.format(topic=topic)}</p><p>These events possess far-reaching implications across political, economic, and social spheres.</p>",
            "tags": [topic, "Current Affairs", "News", "India 2026"],
            "keywords": [topic, "Current Affairs", "News"],
            "status": "PUBLISHED"
        })

# 5. News (approx 8 articles)
for topic in news_topics:
    for title_tpl, summary_tpl in templates_current:
        title = title_tpl.format(topic=topic)
        articles.append({
            "slug": generate_slug(title),
            "section": "NEWS",
            "eng_title": title,
            "eng_summary": summary_tpl.format(topic=topic),
            "eng_content": f"<p>Breaking news regarding <strong>{topic}</strong> has been officially confirmed today.</p><p>{summary_tpl.format(topic=topic)}</p>",
            "tags": [topic, "News", "Updates"],
            "keywords": [topic, "News"],
            "status": "PUBLISHED"
        })

# 6. Results (approx 6 articles)
for topic in results_topics:
    for title_tpl, summary_tpl in templates_current:
        title = title_tpl.format(topic=topic)
        articles.append({
            "slug": generate_slug(title),
            "section": "RESULTS",
            "eng_title": title,
            "eng_summary": summary_tpl.format(topic=topic) + " Check your scorecard now.",
            "eng_content": f"<p>The highly requested <strong>{topic}</strong> have officially been declared online.</p><p>{summary_tpl.format(topic=topic)}</p>",
            "tags": [topic, "Results", "Scorecard"],
            "keywords": [topic, "Results"],
            "status": "PUBLISHED"
        })

# 7. Campus Pages (approx 8 articles)
for topic in campus_events:
    for title_tpl, summary_tpl in templates_current:
        title = title_tpl.format(topic=topic)
        articles.append({
            "slug": generate_slug(title),
            "section": "CAMPUS PAGES",
            "eng_title": title,
            "eng_summary": summary_tpl.format(topic=topic),
            "eng_content": f"<p>Excitement is building inside campuses as <strong>{topic}</strong> is rolling out.</p><p>{summary_tpl.format(topic=topic)}</p>",
            "tags": [topic, "Campus", "Events"],
            "keywords": [topic, "Campus"],
            "status": "PUBLISHED"
        })

# Add some randomness to the list
random.shuffle(articles)

# Take 150 items to fulfill the requirement perfectly
final_dataset = articles[:150]

output_file = 'public/bulkArticles.json'
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(final_dataset, f, indent=2, ensure_ascii=False)

print(f"Generated {len(final_dataset)} articles to {output_file}")
