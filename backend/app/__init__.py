import os

from dotenv import load_dotenv

# Must run before app.config is imported: Config reads os.environ at class-definition time
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

from flask import Flask, jsonify, request  # noqa: E402
from werkzeug.exceptions import HTTPException  # noqa: E402
from werkzeug.middleware.proxy_fix import ProxyFix  # noqa: E402

from .config import BACKEND_DIR, Config  # noqa: E402
from .extensions import db, jwt  # noqa: E402
from .models import TokenBlocklist, User  # noqa: E402
from .utils import ApiError  # noqa: E402


def create_app(config_class=Config):
    app = Flask(__name__, instance_path=os.path.join(BACKEND_DIR, 'instance'))
    app.config.from_object(config_class)
    if not app.config.get('JWT_SECRET_KEY'):
        raise RuntimeError('JWT_SECRET_KEY belum di-set. Salin backend/.env.example ke backend/.env dan isi kuncinya.')
    os.makedirs(app.instance_path, exist_ok=True)
    if app.config.get('TRUSTED_PROXY_COUNT'):
        # Use X-Forwarded-For from that many proxies as request.remote_addr (rate limiting is per IP)
        app.wsgi_app = ProxyFix(app.wsgi_app, x_for=app.config['TRUSTED_PROXY_COUNT'], x_proto=1)

    db.init_app(app)
    jwt.init_app(app)
    _register_jwt_callbacks()
    _register_error_handlers(app)
    _register_cors(app)

    from .routes.auth import bp as auth_bp
    from .routes.budgets import bp as budgets_bp
    from .routes.categories import bp as categories_bp
    from .routes.data import bp as data_bp
    from .routes.goals import bp as goals_bp
    from .routes.state import bp as state_bp
    from .routes.transactions import bp as transactions_bp
    from .routes.wallets import bp as wallets_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(state_bp, url_prefix='/api/state')
    app.register_blueprint(wallets_bp, url_prefix='/api/wallets')
    app.register_blueprint(categories_bp, url_prefix='/api/categories')
    app.register_blueprint(transactions_bp, url_prefix='/api/transactions')
    app.register_blueprint(budgets_bp, url_prefix='/api/budgets')
    app.register_blueprint(goals_bp, url_prefix='/api/goals')
    app.register_blueprint(data_bp, url_prefix='/api/data')

    with app.app_context():
        db.create_all()

    return app


def _register_jwt_callbacks():
    @jwt.token_in_blocklist_loader
    def is_revoked(_jwt_header, jwt_payload):
        jti = jwt_payload['jti']
        return db.session.scalar(db.select(TokenBlocklist.id).filter_by(jti=jti)) is not None

    @jwt.token_verification_loader
    def token_matches_account(_jwt_header, jwt_payload):
        # The account must still exist and be the same row the token was issued to (see User.token_stamp)
        try:
            user = db.session.get(User, int(jwt_payload['sub']))
        except (KeyError, TypeError, ValueError):
            return False
        return user is not None and jwt_payload.get('ucr') == user.token_stamp()

    def unauthorized(message):
        return jsonify(error=message), 401

    jwt.unauthorized_loader(lambda _reason: unauthorized('Silakan login terlebih dahulu.'))
    jwt.invalid_token_loader(lambda _reason: unauthorized('Token tidak valid.'))
    jwt.expired_token_loader(lambda _h, _p: unauthorized('Sesi kedaluwarsa.'))
    jwt.revoked_token_loader(lambda _h, _p: unauthorized('Sesi sudah berakhir. Silakan login kembali.'))
    jwt.needs_fresh_token_loader(lambda _h, _p: unauthorized('Silakan login kembali.'))
    jwt.token_verification_failed_loader(lambda _h, _p: unauthorized('Sesi tidak valid. Silakan login kembali.'))


def _register_cors(app):
    """Allow cross-origin calls only from origins listed in CORS_ORIGINS (comma separated).

    Not needed for the web app (Vite proxies /api) nor for the native Expo app (no browser origin);
    it exists for the Expo app running in a browser (`npx expo start --web`), which uses header tokens only.
    """
    allowed = {o.strip() for o in app.config.get('CORS_ORIGINS', '').split(',') if o.strip()}
    if not allowed:
        return

    @app.after_request
    def add_cors_headers(resp):
        origin = request.headers.get('Origin')
        if origin in allowed:
            resp.headers['Access-Control-Allow-Origin'] = origin
            resp.headers['Access-Control-Allow-Headers'] = 'Authorization, Content-Type, X-Client'
            resp.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
            resp.headers['Vary'] = 'Origin'
        return resp


def _register_error_handlers(app):
    @app.errorhandler(ApiError)
    def handle_api_error(err):
        db.session.rollback()
        return jsonify(error=err.message), err.status, getattr(err, 'headers', None) or {}

    @app.errorhandler(HTTPException)
    def handle_http_error(err):
        return jsonify(error=err.description), err.code
