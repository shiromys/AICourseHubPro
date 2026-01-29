import os
import zipfile
from reportlab.pdfgen import canvas

def extract_scorm(zip_path, extract_to):
    """Extracts a Zip file and finds the launch file (index.html or similar)"""
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(extract_to)
    
    # Try to find an entry point (imsmanifest.xml is standard SCORM, but we use index.html for simplicity)
    for root, dirs, files in os.walk(extract_to):
        if 'index.html' in files:
            return os.path.relpath(os.path.join(root, 'index.html'), extract_to).replace("\\", "/")
        if 'story.html' in files: # Articulate Storyline
            return os.path.relpath(os.path.join(root, 'story.html'), extract_to).replace("\\", "/")
            
    return "index.html" # Fallback

def generate_certificate(user_name, course_title, output_path):
    """Generates a simple PDF certificate"""
    c = canvas.Canvas(output_path)
    c.setFont("Helvetica-Bold", 30)
    c.drawCentredString(300, 500, "Certificate of Completion")
    
    c.setFont("Helvetica", 20)
    c.drawCentredString(300, 450, f"This certifies that")
    c.drawCentredString(300, 400, user_name)
    c.drawCentredString(300, 350, f"Has successfully completed")
    c.drawCentredString(300, 300, course_title)
    
    c.save()