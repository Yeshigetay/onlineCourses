export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get("url");
    const rawFilename = (searchParams.get("filename") || "file.pdf").trim();

    if (!fileUrl) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing url parameter" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    // Basic validation to avoid SSRF to internal addresses (best-effort)
    try {
      const parsed = new URL(fileUrl);
      if (!/^https?:$/.test(parsed.protocol)) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid protocol" }),
          { status: 400, headers: { "content-type": "application/json" } }
        );
      }
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid url parameter" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    const upstreamResponse = await fetch(fileUrl, { cache: "no-store" });
    if (!upstreamResponse.ok || !upstreamResponse.body) {
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch file" }),
        { status: 502, headers: { "content-type": "application/json" } }
      );
    }

    const contentType = upstreamResponse.headers.get("content-type") || "application/pdf";
    const contentLength = upstreamResponse.headers.get("content-length") || undefined;

    // Ensure .pdf extension
    const safeFilenameBase = rawFilename.replace(/[^\w\s.-]/g, "_").replace(/\s+/g, " ").trim() || "file";
    const hasPdf = /\.pdf$/i.test(safeFilenameBase);
    const filename = hasPdf ? safeFilenameBase : `${safeFilenameBase}.pdf`;

    const headers = new Headers();
    headers.set("content-type", contentType);
    if (contentLength) headers.set("content-length", contentLength);
    // Force download on both desktop and mobile browsers
    headers.set("content-disposition", `attachment; filename="${filename}"`);
    // Allow cross-origin usage if needed (adjust as necessary)
    headers.set("cache-control", "no-store");

    return new Response(upstreamResponse.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: "Unexpected server error" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}


