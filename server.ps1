# Simple HTTP Server for Windows PowerShell
# Usage: powershell -ExecutionPolicy Bypass -File server.ps1

$Port = 5500
$Root = Get-Location
$Listener = New-Object System.Net.HttpListener
$Listener.Prefixes.Add("http://localhost:$Port/")

Write-Host "Starting HTTP Server on http://localhost:$Port/"
Write-Host "Serving files from: $Root"
Write-Host "Press Ctrl+C to stop"

$Listener.Start()

$mimeTypes = @{
    ".html" = "text/html"
    ".htm" = "text/html"
    ".css" = "text/css"
    ".js" = "application/javascript"
    ".json" = "application/json"
    ".png" = "image/png"
    ".jpg" = "image/jpeg"
    ".gif" = "image/gif"
    ".svg" = "image/svg+xml"
    ".ico" = "image/x-icon"
    ".txt" = "text/plain"
}

while ($Listener.IsListening) {
    $Context = $Listener.GetContext()
    $Request = $Context.Request
    $Response = $Context.Response
    
    $RequestPath = $Request.Url.LocalPath
    if ($RequestPath -eq "/") {
        $RequestPath = "/index.html"
    }
    
    $FilePath = Join-Path $Root $RequestPath.TrimStart("/")
    
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] GET $RequestPath"
    
    if (Test-Path $FilePath -PathType Leaf) {
        $Extension = [System.IO.Path]::GetExtension($FilePath)
        $MimeType = $mimeTypes[$Extension]
        if (-not $MimeType) { $MimeType = "application/octet-stream" }
        
        $Response.ContentType = $MimeType
        $Response.StatusCode = 200
        $Content = [System.IO.File]::ReadAllBytes($FilePath)
        $Response.ContentLength64 = $Content.Length
        $Response.OutputStream.Write($Content, 0, $Content.Length)
    } else {
        $Response.StatusCode = 404
        $Response.ContentType = "text/html"
        $ErrorContent = [System.Text.Encoding]::UTF8.GetBytes("<h1>404 Not Found</h1><p>$RequestPath</p>")
        $Response.ContentLength64 = $ErrorContent.Length
        $Response.OutputStream.Write($ErrorContent, 0, $ErrorContent.Length)
    }
    
    $Response.OutputStream.Close()
}
