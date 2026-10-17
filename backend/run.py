import os

from app import create_app

app = create_app()

if __name__ == '__main__':
    # FLASK_HOST=0.0.0.0 makes the API reachable from a phone on the same Wi-Fi (Expo Go)
    app.run(host=os.environ.get('FLASK_HOST', '127.0.0.1'), port=int(os.environ.get('FLASK_PORT', 5000)), debug=True)
