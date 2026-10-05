# Production Security Checklist

## Frontend environment

Use `VITE_API_BASE_URL` for the backend base URL. Values exposed to Vite client code are public, so never put API keys, passwords, JWT secrets, database credentials, or private tokens in `VITE_*` variables.

Example:

```env
VITE_API_BASE_URL=https://api.example.com
```

## HTTPS

The application redirects production HTTP traffic to HTTPS at runtime. The recommended deployment configuration should also enforce HTTPS at the reverse proxy/CDN layer.

Example Nginx pattern:

```nginx
server {
    listen 80;
    server_name example.com;
    return 301 https://$host$request_uri;
}
```

Serve the application and API over HTTPS in production.

## Browser storage

The UI stores only interface/consent state and optional UTM attribution metadata in browser storage. No advertising or third-party tracking script is required by the application.

## Research security

The application is intended for authorized defensive research. Do not connect it to systems or datasets that you are not authorized to inspect.
