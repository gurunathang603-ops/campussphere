from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import FileResponse, HttpResponse, JsonResponse
from django.urls import include, path

from accounts.urls import resource_urls

admin.site.site_header = "CampusSphere Administration"
admin.site.site_title = "CampusSphere Admin"
admin.site.index_title = "Manage department content"

def api_home(request):
    html = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>CampusSphere API</title>
        <style>
            body {
                margin: 0;
                font-family: Arial, sans-serif;
                background: linear-gradient(135deg, #0f172a, #111827 40%, #1d4ed8);
                color: #eef2ff;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
            }
            .card {
                background: rgba(15, 23, 42, 0.8);
                border: 1px solid rgba(148, 163, 184, 0.3);
                border-radius: 18px;
                max-width: 700px;
                width: 90%;
                padding: 32px;
                box-shadow: 0 20px 40px rgba(15, 23, 42, 0.35);
            }
            h1 {
                margin-top: 0;
                font-size: 2.2rem;
            }
            p {
                font-size: 1rem;
                line-height: 1.6;
            }
            ul {
                padding-left: 18px;
                line-height: 1.9;
            }
            code {
                background: rgba(148, 163, 184, 0.12);
                padding: 2px 6px;
                border-radius: 6px;
            }
        </style>
    </head>
    <body>
        <div class="card">
            <h1>CampusSphere API</h1>
            <p>Welcome to the CampusSphere backend service.</p>
            <p>The server is running successfully and is ready to serve the application data.</p>
            <ul>
                <li><code>/admin/</code> — Django admin panel</li>
                <li><code>/api/auth/</code> — authentication endpoints</li>
                <li><code>/api/</code> — application data endpoints</li>
                <li><code>/media/</code> — uploaded files</li>
            </ul>
            <p>Frontend app: <code>http://localhost:5173/</code></p>
            <p>Backend API: <code>http://127.0.0.1:8000/</code></p>
        </div>
    </body>
    </html>
    """
    return HttpResponse(html)
def frontend_app(request, path=""):
    index_file = settings.FRONTEND_DIST_DIR / "index.html"
    if not index_file.is_file():
        return HttpResponse("Frontend build missing. Run npm run build in frontend/.", status=503)
    return FileResponse(index_file.open("rb"), content_type="text/html")


def frontend_asset(request, filename, content_type):
    asset_path = settings.FRONTEND_DIST_DIR / filename
    if not asset_path.is_file():
        return HttpResponse("Frontend asset missing. Rebuild the frontend.", status=503)
    return FileResponse(asset_path.open("rb"), content_type=content_type)


def api_not_found(request, path=""):
    return JsonResponse({"detail": "Not found."}, status=404)


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/", include(resource_urls)),
    path("api/", include("departments.urls")),
    path("api/", include("events.urls")),
    path("api/", include("academics.urls")),
    path("api/", include("documents.urls")),
    path("api/", include("announcements.urls")),
    path("api/", include("chatbot.urls")),
    path("sw.js", lambda request: frontend_asset(request, "sw.js", "application/javascript")),
    path("manifest.webmanifest", lambda request: frontend_asset(request, "manifest.webmanifest", "application/manifest+json")),
    path("favicon.svg", lambda request: frontend_asset(request, "favicon.svg", "image/svg+xml")),
    path("api/", api_not_found),
    path("api/<path:path>", api_not_found),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

urlpatterns += [path("", frontend_app), path("<path:path>", frontend_app)]
