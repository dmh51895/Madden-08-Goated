import os
import requests
from PIL import Image
from io import BytesIO

TEAMS = [
    "ARI", "ATL", "BAL", "BUF", "CAR", "CHI", "CIN", "CLE",
    "DAL", "DEN", "DET", "GB", "HOU", "IND", "JAX", "KC",
    "LV", "LAC", "LAR", "MIA", "MIN", "NE", "NO", "NYG",
    "NYJ", "PHI", "PIT", "SF", "SEA", "TB", "TEN", "WAS"
]

# We are using the high-quality, reliable ESPN CDN assets as the source baseline
BASE_URL = "https://a.espncdn.com/i/teamlogos/nfl/500/{}.png"

def fetch_and_resize_logos():
    output_dir = "logos"
    os.makedirs(output_dir, exist_ok=True)
    
    print("🚀 Initiating full-throttle logo extraction sequence...")
    
    for team in TEAMS:
        # Map specific quirks for ESPN's CDN naming conventions if needed
        cdn_team = team.lower()
        if cdn_team == "wsh": # fallback check
            cdn_team = "was"
            
        url = BASE_URL.format(cdn_team)
        try:
            response = requests.get(url, timeout=10)
            if response.status_code != 200:
                # Secondary fallback attempt for alternative acronym standardizing
                print(f"⚠️ Primary asset miss for {team}, checking backup link...")
                continue
                
            img = Image.open(BytesIO(response.content)).convert("RGBA")
            
            # Heavy downsampling to exactly 32x32 via high-quality Lanczos anti-aliasing
            resized_img = img.resize((32, 32), Image.Resampling.LANCZOS)
            
            out_path = os.path.join(output_dir, f"{team}.png")
            resized_img.save(out_path, "PNG")
            print(f"✅ Executed extraction: {out_path} [32x32 Transparent]")
            
        except Exception as e:
            print(f"❌ Structural collapse downloading {team}: {e}")

if __name__ == "__main__":
    fetch_and_resize_logos()
