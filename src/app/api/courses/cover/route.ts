import { NextRequest, NextResponse } from "next/server";
import { fromPath } from "pdf2pic";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pdfUrl = searchParams.get("url");

    if (!pdfUrl) {
      return NextResponse.json({ error: "PDF URL is required" }, { status: 400 });
    }

    // Validate URL scheme
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(pdfUrl);
      if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
        return NextResponse.json({ error: "Only http/https URLs are allowed" }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // Create a unique filename based on the PDF URL
    const urlHash = Buffer.from(pdfUrl).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
    const coverPath = path.join(process.cwd(), 'public', 'covers', `${urlHash}.png`);

    // Check if cover already exists
    if (fs.existsSync(coverPath)) {
      const coverUrl = `/covers/${urlHash}.png`;
      return NextResponse.json({ 
        coverImage: coverUrl,
        success: true 
      });
    }

    // Download PDF to temporary file with retry and headers to avoid remote blocks
    const maxAttempts = 2;
    let lastError: unknown = null;
    let response: Response | null = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        response = await fetch(parsedUrl.toString(), {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
            Accept: "application/pdf,application/octet-stream;q=0.9,*/*;q=0.8",
          },
          redirect: "follow",
          cache: "no-store",
        } as RequestInit);
        if (response && response.ok) break;
        lastError = new Error(`Unexpected response: ${response?.status} ${response?.statusText}`);
      } catch (err) {
        lastError = err;
      }
    }
    if (!response || !response.ok) {
      return NextResponse.json({ error: "Failed to download PDF", details: `${lastError}` }, { status: 400 });
    }

    const pdfBuffer = await response.arrayBuffer();
    const tempPdfPath = path.join(process.cwd(), 'public', 'covers', `temp_${urlHash}.pdf`);
    
    // Write PDF to temporary file
    fs.writeFileSync(tempPdfPath, Buffer.from(pdfBuffer));

    try {
      // Configure pdf2pic options
      const convert = fromPath(tempPdfPath, {
        density: 100, // DPI
        saveFilename: urlHash,
        savePath: path.join(process.cwd(), 'public', 'covers'),
        format: "png",
        width: 200,
        height: 280,
      });

      // Convert first page (page 1)
      const result = await convert(1);
      
      if (!result || !result.path) {
        return NextResponse.json({ error: "Failed to convert PDF to image" }, { status: 500 });
      }

      // Return the cover image URL
      const coverUrl = `/covers/${urlHash}.png`;
      return NextResponse.json({ 
        coverImage: coverUrl,
        success: true 
      });

    } finally {
      // Clean up temporary PDF file
      if (fs.existsSync(tempPdfPath)) {
        fs.unlinkSync(tempPdfPath);
      }
    }

  } catch (error) {
    console.error("PDF cover conversion error:", error);
    return NextResponse.json({ error: "Failed to generate cover image" }, { status: 500 });
  }
}
