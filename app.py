from flask import Flask, render_template, jsonify, request, abort
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from config import Config

db = SQLAlchemy()
migrate = Migrate()


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    migrate.init_app(app, db)

    # =====================
    # Models
    # =====================
    class Category(db.Model):
        __tablename__ = "categories"
        id = db.Column(db.Integer, primary_key=True)
        slug = db.Column(db.String(80), unique=True, nullable=False)
        label = db.Column(db.String(120), nullable=False)
        description = db.Column(db.String(255), default="")
        sort_order = db.Column(db.Integer, default=0)
        is_active = db.Column(db.Boolean, default=True)

        products = db.relationship("Product", backref="category", lazy=True)

    class Product(db.Model):
        __tablename__ = "products"
        id = db.Column(db.Integer, primary_key=True)
        category_id = db.Column(db.Integer, db.ForeignKey("categories.id"), nullable=False)
        slug = db.Column(db.String(120), unique=True, nullable=False)
        name = db.Column(db.String(160), nullable=False)
        description = db.Column(db.String(255), default="")
        price_text = db.Column(db.String(80), default="")
        image_filename = db.Column(db.String(255), default="")
        sort_order = db.Column(db.Integer, default=0)
        is_active = db.Column(db.Boolean, default=True)

    # expose models for seed.py
    app.Category = Category
    app.Product = Product

    # =====================
    # Helpers
    # =====================
    def build_product_image_url(category_slug: str, image_filename: str) -> str:
        """
        Build a safe image URL for the frontend.
        If filename is missing/blank, returns the placeholder.
        """
        if image_filename and str(image_filename).strip():
            return f"/static/images/{category_slug}/{image_filename.strip()}"
        return "/static/images/placeholder.jpg"

    # =====================
    # Routes
    # =====================
    @app.get("/")
    def index():
        return render_template("index.html")

    @app.get("/api/categories")
    def api_categories():
        cats = (
            Category.query
            .filter_by(is_active=True)
            .order_by(Category.sort_order.asc())
            .all()
        )
        return jsonify([
            {
                "id": c.id,  # ✅ include id for admin/debugging
                "slug": c.slug,
                "label": c.label,
                "description": c.description
            } for c in cats
        ])

    @app.get("/api/products")
    def api_products():
        slug = (request.args.get("category") or "").strip()
        if not slug:
            abort(400, "Missing category")

        cat = Category.query.filter_by(slug=slug, is_active=True).first()
        if not cat:
            abort(404, "Category not found")

        products = (
            Product.query
            .filter_by(category_id=cat.id, is_active=True)
            .order_by(Product.sort_order.asc(), Product.id.asc())
            .all()
        )

        items = []
        for p in products:
            image_url = build_product_image_url(cat.slug, p.image_filename)

            items.append({
                # ✅ Keep the frontend-friendly fields
                "id": p.id,                 # ✅ MUST be numeric id (you were returning slug before)
                "slug": p.slug,             # ✅ keep slug too
                "name": p.name,
                "desc": p.description,
                "price": p.price_text,
                "image": image_url,

                # ✅ Extra fields (safe + useful for debugging/mapping)
                "image_filename": p.image_filename,
                "category_slug": cat.slug,
                "sort_order": p.sort_order
            })

        return jsonify({
            "whatsapp": app.config.get("WHATSAPP_NUMBER", ""),
            "category": {
                "id": cat.id,
                "slug": cat.slug,
                "label": cat.label,
                "description": cat.description
            },
            "products": items
        })

    # =====================
    # PWA files
    # =====================
    @app.get("/manifest.json")
    def manifest():
        return app.send_static_file("manifest.json")

    @app.get("/sw.js")
    def sw():
        return app.send_static_file("sw.js")

    return app


# =====================
# App bootstrap
# =====================
app = create_app()

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0")

