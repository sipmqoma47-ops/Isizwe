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
            .order_by(Product.sort_order.asc())
            .all()
        )

        items = []
        for p in products:
            image_url = "/static/images/placeholder.jpg"
            if p.image_filename:
                image_url = f"/static/images/{cat.slug}/{p.image_filename}"

            items.append({
                "id": p.slug,
                "name": p.name,
                "desc": p.description,
                "price": p.price_text,
                "image": image_url
            })

        return jsonify({
            "whatsapp": app.config["WHATSAPP_NUMBER"],
            "category": {
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

    # ✅ CRITICAL FIX
    return app


# =====================
# App bootstrap
# =====================
app = create_app()

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0")

