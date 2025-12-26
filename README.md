# FloorPlan Pro v5.0

A cross-platform floor plan editor for desktop and iPad.

## Local Development

Just open `index.html` in your browser, or use VS Code's Live Server extension:

1. Install "Live Server" extension in VS Code
2. Right-click `index.html` → "Open with Live Server"

## Deploy to Your Droplet

### Option 1: Using SCP (from your local machine)

```bash
scp index.html root@YOUR_DROPLET_IP:/var/www/floorplan/
```

### Option 2: Using SFTP in VS Code

1. Install "SFTP" extension by Natizyskunk
2. Press Ctrl+Shift+P → "SFTP: Config"
3. Edit the config:

```json
{
    "name": "My Droplet",
    "host": "YOUR_DROPLET_IP",
    "protocol": "sftp",
    "port": 22,
    "username": "root",
    "remotePath": "/var/www/floorplan",
    "uploadOnSave": true
}
```

4. Right-click file → "Upload"

### Option 3: Copy/Paste via SSH

```bash
ssh root@YOUR_DROPLET_IP
mkdir -p /var/www/floorplan
nano /var/www/floorplan/index.html
# Paste content, Ctrl+X, Y, Enter
```

## Nginx Setup (one-time)

```bash
# Create nginx config
sudo nano /etc/nginx/sites-available/floorplan
```

Add this config:
```nginx
server {
    listen 80;
    server_name floorplan.yourdomain.com;
    root /var/www/floorplan;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable and reload:
```bash
sudo ln -s /etc/nginx/sites-available/floorplan /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Features

- Wall drawing with multiple types (exterior, interior, partition, half-wall)
- Doors and windows with customizable sizes
- Furniture library
- Text labels and dimensions
- Multi-floor support
- Touch support for iPad
- Save/load projects
- Print support

## Keyboard Shortcuts

- `V` - Select tool
- `W` - Wall tool
- `D` - Door tool
- `N` - Window tool
- `M` - Dimension tool
- `Delete` - Remove selected items
- `Ctrl+C/V` - Copy/paste
- `Ctrl+Z` - Undo
- `Ctrl+S` - Save project
