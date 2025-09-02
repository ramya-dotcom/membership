from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import sqlite3
import os
from datetime import datetime
import json
from PIL import Image, ImageDraw, ImageFont
import io
import base64

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
def init_db():
    conn = sqlite3.connect('membership.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            contact_no TEXT NOT NULL,
            membership_no TEXT UNIQUE NOT NULL,
            profession TEXT,
            mandal TEXT,
            dob DATE,
            blood_group TEXT,
            address TEXT,
            photo_path TEXT,
            pdf_proof_path TEXT,
            epic_number TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

# Initialize database on startup
init_db()

# Serve HTML page at root
@app.get("/", response_class=HTMLResponse)
async def serve_html():
    try:
        with open("membership.html", "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    except FileNotFoundError:
        return HTMLResponse(content="<h1>membership.html not found</h1>", status_code=404)

# MODIFIED: Bypass verification - always return success
@app.post("/verify-document/")
async def verify_document(
    epic_number: str = Form(...),
    file: UploadFile = File(...)
):
    """
    Demo bypass: Always return successful verification
    """
    try:
        # Basic validation
        if not epic_number or len(epic_number.strip()) < 3:
            raise HTTPException(status_code=400, detail="EPIC number must be at least 3 characters")
        
        # In demo mode, we accept any file
        if not file:
            raise HTTPException(status_code=400, detail="Document file is required")
        
        # Always return success for demo
        return {
            "success": True,
            "message": "Document verified successfully (Demo mode)",
            "epic_number": epic_number.strip().upper(),
            "verification_token": f"demo-token-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "proceed_to_details": True
        }
    
    except Exception as e:
        # Even if there's an error, return success for demo
        return {
            "success": True,
            "message": f"Document accepted (Demo mode): {str(e)}",
            "epic_number": epic_number.strip().upper() if epic_number else "DEMO123",
            "verification_token": "demo-token-fallback",
            "proceed_to_details": True
        }

# Seed member to database
@app.post("/seed-sqlite-member/")
async def seed_member(
    name: str = Form(...),
    contact_no: str = Form(...),
    membership_no: str = Form(...),
    profession: str = Form(""),
    mandal: str = Form(""),
    dob: str = Form(""),
    blood_group: str = Form(""),
    address: str = Form(""),
    photo_path: str = Form(""),
    pdf_proof_path: str = Form(""),
    epic_number: str = Form("")
):
    try:
        conn = sqlite3.connect('membership.db')
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO members 
            (name, contact_no, membership_no, profession, mandal, dob, blood_group, address, photo_path, pdf_proof_path, epic_number)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (name, contact_no, membership_no, profession, mandal, dob, blood_group, address, photo_path, pdf_proof_path, epic_number))
        
        member_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return {
            "success": True,
            "message": "Member added successfully",
            "id": member_id,
            "membership_no": membership_no
        }
        
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Membership number already exists")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# Generate membership card
@app.post("/generate-card-pillow/")
async def generate_card(member_id: int = Form(...)):
    try:
        # Get member data
        conn = sqlite3.connect('membership.db')
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM members WHERE id = ?', (member_id,))
        member = cursor.fetchone()
        conn.close()
        
        if not member:
            raise HTTPException(status_code=404, detail="Member not found")
        
        # Parse member data
        (id, name, contact, membership_no, profession, mandal, dob, blood_group, 
         address, photo_path, pdf_proof_path, epic_number, created_at) = member
        
        # Create card
        card_path = create_membership_card({
            'id': id,
            'name': name,
            'contact_no': contact,
            'membership_no': membership_no,
            'profession': profession,
            'mandal': mandal,
            'dob': dob,
            'blood_group': blood_group,
            'address': address,
            'epic_number': epic_number
        })
        
        return {
            "success": True,
            "message": "Card generated successfully",
            "card_path": card_path,
            "member_id": member_id,
            "membership_no": membership_no
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Card generation failed: {str(e)}")

def create_membership_card(member_data):
    """Create a membership card using PIL"""
    try:
        # Create card dimensions (credit card size: 3.370" x 2.125" at 300 DPI)
        width, height = 1011, 638
        
        # Create image with white background
        card = Image.new('RGB', (width, height), color='white')
        draw = ImageDraw.Draw(card)
        
        # Colors
        primary_blue = '#1565C0'
        secondary_blue = '#1976D2'
        text_dark = '#333333'
        text_light = '#666666'
        
        # Draw header background
        header_height = 120
        draw.rectangle([(0, 0), (width, header_height)], fill=primary_blue)
        
        # Try to load fonts (fallback to default if not available)
        try:
            title_font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 36)
            subtitle_font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 20)
            name_font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 32)
            info_font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 18)
            small_font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 14)
        except:
            # Fallback to default font
            title_font = ImageFont.load_default()
            subtitle_font = ImageFont.load_default()
            name_font = ImageFont.load_default()
            info_font = ImageFont.load_default()
            small_font = ImageFont.load_default()
        
        # Draw title
        title = "TNBSP MEMBERSHIP"
        title_bbox = draw.textbbox((0, 0), title, font=title_font)
        title_x = (width - (title_bbox[2] - title_bbox[0])) // 2
        draw.text((title_x, 25), title, fill='white', font=title_font)
        
        # Draw subtitle
        subtitle = "Tamil Nadu BSP - Official Member"
        subtitle_bbox = draw.textbbox((0, 0), subtitle, font=subtitle_font)
        subtitle_x = (width - (subtitle_bbox[2] - subtitle_bbox[0])) // 2
        draw.text((subtitle_x, 75), subtitle, fill='white', font=subtitle_font)
        
        # Member information
        y_pos = header_height + 30
        
        # Member name (large)
        name = member_data.get('name', 'N/A')
        draw.text((50, y_pos), f"Name: {name}", fill=text_dark, font=name_font)
        y_pos += 50
        
        # Two-column layout
        left_x = 50
        right_x = 500
        
        # Left column
        draw.text((left_x, y_pos), f"ID: {member_data.get('id', 'N/A')}", fill=text_dark, font=info_font)
        draw.text((left_x, y_pos + 30), f"Membership: {member_data.get('membership_no', 'N/A')}", fill=text_dark, font=info_font)
        draw.text((left_x, y_pos + 60), f"Profession: {member_data.get('profession', 'N/A')}", fill=text_light, font=info_font)
        draw.text((left_x, y_pos + 90), f"Mandal: {member_data.get('mandal', 'N/A')}", fill=text_light, font=info_font)
        
        # Right column
        draw.text((right_x, y_pos), f"Contact: {member_data.get('contact_no', 'N/A')}", fill=text_dark, font=info_font)
        draw.text((right_x, y_pos + 30), f"DOB: {member_data.get('dob', 'N/A')}", fill=text_light, font=info_font)
        draw.text((right_x, y_pos + 60), f"Blood: {member_data.get('blood_group', 'N/A')}", fill=text_light, font=info_font)
        draw.text((right_x, y_pos + 90), f"EPIC: {member_data.get('epic_number', 'N/A')}", fill=text_light, font=info_font)
        
        # Footer
        footer_y = height - 60
        draw.rectangle([(0, footer_y), (width, height)], fill=secondary_blue)
        
        issue_date = datetime.now().strftime("%d/%m/%Y")
        footer_text = f"Issued: {issue_date} | Valid: Lifetime | Tamil Nadu BSP Official"
        footer_bbox = draw.textbbox((0, 0), footer_text, font=small_font)
        footer_x = (width - (footer_bbox[2] - footer_bbox[0])) // 2
        draw.text((footer_x, footer_y + 20), footer_text, fill='white', font=small_font)
        
        # Add border
        draw.rectangle([(0, 0), (width-1, height-1)], outline=primary_blue, width=3)
        
        # Save card
        card_filename = f"card_{member_data.get('membership_no', 'unknown')}.png"
        card_path = os.path.join("cards", card_filename)
        
        # Create cards directory if it doesn't exist
        os.makedirs("cards", exist_ok=True)
        
        card.save(card_path, 'PNG', quality=95)
        
        return card_path
        
    except Exception as e:
        raise Exception(f"Card creation failed: {str(e)}")

# Download card
@app.get("/download-card-pillow")
async def download_card(card_path: str):
    try:
        if not os.path.exists(card_path):
            raise HTTPException(status_code=404, detail="Card file not found")
        
        # Get filename for download
        filename = os.path.basename(card_path)
        
        return FileResponse(
            path=card_path,
            filename=filename,
            media_type='image/png'
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "TNBSP Membership API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)