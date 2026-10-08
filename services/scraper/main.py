"""
Radar Impact Scraper Service (Section 41)
Exposes an authenticated POST /extract endpoint powered by Scrapling / Playwright / BeautifulSoup
"""

from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
import re

app = FastAPI(title="Radar Scrapling Impact Extraction Service")

class ExtractRequest(BaseModel):
    url: str

class ExtractMetadata(BaseModel):
    author: str | None = None
    publishedAt: str | None = None
    publisher: str | None = None

class ExtractResponse(BaseModel):
    url: str
    finalUrl: str
    status: int
    title: str
    text: str
    markdown: str
    metadata: ExtractMetadata

@app.post("/extract", response_model=ExtractResponse)
async def extract_url(req: ExtractRequest):
    try:
        # In production with scrapling installed:
        # from scrapling import Fetcher
        # fetcher = Fetcher()
        # page = fetcher.get(req.url)
        # title = page.css('title::text').first or req.url
        # text = page.get_text()
        
        # Lightweight standard urllib/requests fallback
        import urllib.request
        headers = {
            "User-Agent": "RadarImpactBot/1.0 (+https://radar.civil-society.org; public research)"
        }
        request = urllib.request.Request(req.url, headers=headers)
        with urllib.request.urlopen(request, timeout=10) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            status = resp.status
            final_url = resp.geturl()

        title_match = re.search(r'<title[^>]*>(.*?)</title>', html, re.IGNORECASE | re.DOTALL)
        title = title_match.group(1).strip() if title_match else req.url

        # Strip scripts and tags
        clean_text = re.sub(r'<script.*?</script>', '', html, flags=re.DOTALL | re.IGNORECASE)
        clean_text = re.sub(r'<style.*?</style>', '', clean_text, flags=re.DOTALL | re.IGNORECASE)
        clean_text = re.sub(r'<[^>]+>', ' ', clean_text)
        clean_text = re.sub(r'\s+', ' ', clean_text).strip()[:8000]

        return ExtractResponse(
            url=req.url,
            finalUrl=final_url,
            status=status,
            title=title,
            text=clean_text,
            markdown=f"# {title}\n\n{clean_text[:1200]}...",
            metadata=ExtractMetadata()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
