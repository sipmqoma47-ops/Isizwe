# seed.py
# Safe upsert seeding: keeps existing products, adds new ones.
# Run: python seed.py

from app import app, db

Category = app.Category
Product = app.Product


with app.app_context():
    def upsert_category(slug, label, description, order):
        c = Category.query.filter_by(slug=slug).first()
        if not c:
            c = Category(slug=slug)
        c.label = label
        c.description = description
        c.sort_order = order
        c.is_active = True
        db.session.add(c)
        db.session.flush()
        return c

    def upsert_product(cat, slug, name, price, desc, image_filename, order):
        p = Product.query.filter_by(slug=slug).first()
        if not p:
            p = Product(slug=slug, category_id=cat.id)

        p.category_id = cat.id
        p.name = name
        p.price_text = price
        p.description = desc
        p.image_filename = image_filename  # "" → placeholder image
        p.sort_order = order
        p.is_active = True

        db.session.add(p)
        return p

    # -----------------------
    # Categories
    # -----------------------
    church = upsert_category("church", "Church", "Church printing: certificates, envelopes, flyers, cards, banners & stamps", 1)
    surgery = upsert_category("surgery", "Doctor's Surgery", "Medical certificates, stamps & cards", 2)
    manual_books = upsert_category("manual_books", "Manual Books", "Invoice, receipt, log and delivery books", 3)
    stamps = upsert_category("stamps", "Stamps", "Company, school, church, teacher & doctor stamps", 4)
    schools = upsert_category("schools", "Schools", "School receipt books and stamps", 5)
    security = upsert_category("security", "Security", "Security books, logbooks, stamps & cards", 6)
    sir_clinics = upsert_category("sir_clinics", "SIR / Clinics", "Clinic cards, medical stationery and branding", 7)
    events = upsert_category("events", "Events & Entertainment", "Event printing, branding, tickets, banners and party items", 8)
    general_printing = upsert_category("general_printing", "General Printing", "Bulk black & white and colour printing (100+ pages)", 9)

    # ============================================================
    # Church products (FROM THE PRICE LIST IMAGE)
    # ============================================================

    # Certificates
    upsert_product(church, "certificate_design_layout", "Certificate Design Layout", "R200 (once-off)", "Design layout for church certificates", "", 10)
    upsert_product(church, "cert_a4_50_colour_nonames", "A4 Certificates (50, Colour - No Names)", "R500", "Colour A4 certificates without names", "cert_a4.jpg", 11)
    upsert_product(church, "cert_a4_single_colour_named", "A4 Certificate (Single, Colour - Named)", "R15 each", "Single A4 colour certificate with name (per certificate)", "", 12)
    upsert_product(church, "cert_a4_50_black_ink", "A4 Certificates (50, Black Ink)", "R300", "Black ink A4 certificates printed on board. Suitable for baptisms/dedications/ordinations", "", 13)

    # Printed Envelopes (price includes envelopes)
    upsert_product(church, "printed_envelopes_100", "Printed Envelopes (100)", "R200", "Price includes envelopes – full service printing", "env100.jpg", 20)
    upsert_product(church, "printed_envelopes_500", "Printed Envelopes (500)", "R550", "Price includes envelopes – full service printing", "", 21)

    # Flyers & Business Cards
    upsert_product(church, "a5_flyers_100", "A5 Flyers (100)", "R310", "A5 flyers for church events", "", 30)
    upsert_product(church, "a5_flyers_250", "A5 Flyers (250)", "R600", "Bulk A5 flyers for campaigns/events", "", 31)
    upsert_product(church, "business_cards_100_church", "Business Cards (100)", "R210", "Business cards (100) for church leaders / departments", "", 32)

    # A5 Membership Cards
    upsert_product(church, "membership_cards_a5_50", "A5 Membership Cards (50)", "R250", "Printed b/w on board (blue/green/white)", "", 40)
    upsert_product(church, "membership_cards_a5_100", "A5 Membership Cards (100)", "R400", "Printed b/w on board (blue/green/white)", "", 41)

    # Name Badges
    upsert_product(church, "name_badge_1", "Name Badge (1)", "R100", "With pin or magnet back", "", 50)
    upsert_product(church, "name_badge_5", "Name Badges (5)", "R80 each", "5 name badges (R80 each). With pin or magnet back", "", 51)

    # Banners & Signs
    upsert_product(church, "pullup_banner_1", "Pull-up Banner (1)", "R1200", "1 x pull-up banner", "", 60)
    upsert_product(church, "chromadek_sign_3x1_2", "Chromadek Sign (3m x 1.2m)", "R3500", "Chromadek sign with steel frame. Excludes poles, installation & delivery", "", 61)

    # Calendars A3 (Church)
    upsert_product(church, "calendar_a3_50_church", "Calendars A3 (50)", "R700", "Printed on board with 1 hole. Mostly used for fundraising", "", 70)
    upsert_product(church, "calendar_a3_100_church", "Calendars A3 (100)", "R1200", "Printed on board with 1 hole. Mostly used for fundraising", "", 71)

    # Stamps (self inking)
    upsert_product(church, "self_inking_stamp_47x18", "Self Inking Stamp (47x18mm)", "R550", "47x18mm self inking stamp", "", 80)
    upsert_product(church, "self_inking_stamp_58x22", "Self Inking Stamp (58x22mm)", "R677", "58x22mm self inking stamp", "", 81)

    # ============================================================
    # Surgery products
    # ============================================================
    upsert_product(surgery, "docstamp", "Doctor Stamp (47x18mm)", "R424", "With name & qualifications", "doc_stamp.jpg", 1)
    upsert_product(surgery, "medical_certificates", "Medical Certificates", "Contact", "Doctor medical certificates (custom books)", "", 2)
    upsert_product(surgery, "doctor_business_cards", "Business Cards (Doctor)", "R200 (100)", "Professional medical practice business cards", "", 3)

    # ============================================================
    # Manual Books products
    # ============================================================
    upsert_product(manual_books, "invoice_books", "Invoice Books", "Contact", "Custom printed invoice books", "", 1)
    upsert_product(manual_books, "quote_books", "Quote Books", "Contact", "Custom printed quotation books", "", 2)
    upsert_product(manual_books, "job_card_books", "Job Card Books", "Contact", "Job card books for workshops", "", 3)
    upsert_product(manual_books, "receipt_books", "Receipt Books", "Contact", "Receipt books (duplicate / triplicate)", "", 4)
    upsert_product(manual_books, "delivery_books", "Delivery Books", "Contact", "Delivery note books", "", 5)
    upsert_product(manual_books, "checklist_books", "Checklist Books", "Contact", "Inspection & checklist books", "", 6)
    upsert_product(manual_books, "log_books", "Log Books", "Contact", "General purpose log books", "", 7)

    # ============================================================
    # Stamps products
    # ============================================================
    upsert_product(stamps, "company_stamp", "Company Stamp", "Contact", "Custom company stamp", "", 1)
    upsert_product(stamps, "school_stamp", "School Stamp", "Contact", "School stamp with logo & details", "", 2)
    upsert_product(stamps, "church_stamp", "Church Stamp", "Contact", "Church administration stamp", "", 3)
    upsert_product(stamps, "teachers_stamp", "Teachers Stamp", "Contact", "Teacher marking stamp", "", 4)
    upsert_product(stamps, "doctors_stamp", "Doctors Stamp", "Contact", "Doctor practice stamp", "", 5)

    # ============================================================
    # Schools products
    # NOTE: slug must be UNIQUE across all products.
    # We avoid clashing with the stamps category "school_stamp".
    # ============================================================
    upsert_product(schools, "school_receipt_books", "Receipt Books (School)", "Contact", "School receipt books for fees and payments", "", 1)
    upsert_product(schools, "school_stamp_schools", "School Stamp (Schools Category)", "Contact", "Official school stamp with logo and details", "", 2)

    # ============================================================
    # Security products
    # ============================================================
    upsert_product(security, "security_incident_books", "Incident Books", "Contact", "Security incident / occurrence books", "", 1)
    upsert_product(security, "security_receipt_books", "Receipt Books (Security)", "Contact", "Receipt books for security services", "", 2)
    upsert_product(security, "security_logbooks", "Logbooks (Security)", "Contact", "Security logbooks (shift, visitors, patrol)", "", 3)
    upsert_product(security, "security_business_cards", "Business Cards (Security)", "Contact", "Professional security company business cards", "", 4)
    upsert_product(security, "security_stamp", "Security Stamp", "Contact", "Official security company stamp", "", 5)

    # ============================================================
    # SIR / Clinics products
    # ============================================================
    upsert_product(sir_clinics, "maternity_cards", "Maternity Cards", "Contact", "Clinic maternity cards", "", 1)
    upsert_product(sir_clinics, "antenatal_cards", "Antenatal Cards", "Contact", "Antenatal clinic cards", "", 2)
    upsert_product(sir_clinics, "appointment_cards", "Appointment Cards", "Contact", "Patient appointment cards", "", 3)
    upsert_product(sir_clinics, "clinic_flyers", "Flyers (Clinics)", "Contact", "Clinic promotional flyers", "", 4)
    upsert_product(sir_clinics, "clinic_business_cards", "Business Cards (Clinics)", "Contact", "Clinic business cards", "", 5)
    upsert_product(sir_clinics, "clinic_pullup_banners", "Pull-up Banners (Clinics)", "Contact", "Clinic pull-up banners", "", 6)
    upsert_product(sir_clinics, "clinic_name_badges", "Name Badges (Clinics)", "Contact", "Clinic staff name badges", "", 7)

    # ============================================================
    # Events & Entertainment products (FROM EVENTS IMAGE)
    # ============================================================

    # Wristbands (enquire for colors)
    upsert_product(events, "wristbands_plain_20_99", "Plain Wristbands (20–99)", "R2.50 each", "Plain event wristbands (enquire for colors)", "", 1)
    upsert_product(events, "wristbands_plain_100_500", "Plain Wristbands (100–500)", "R2.00 each", "Plain event wristbands (enquire for colors)", "", 2)
    upsert_product(events, "wristbands_plain_500_plus", "Plain Wristbands (500+)", "R1.80 each", "Plain event wristbands (enquire for colors)", "", 3)

    upsert_product(events, "wristbands_branded_50_99", "Branded Wristbands (50–99)", "R3.50 each", "Custom branded wristbands (enquire for colors)", "", 4)
    upsert_product(events, "wristbands_branded_100_500", "Branded Wristbands (100–500)", "R3.00 each", "Custom branded wristbands (enquire for colors)", "", 5)
    upsert_product(events, "wristbands_branded_500_plus", "Branded Wristbands (500+)", "R2.50 each", "Custom branded wristbands (enquire for colors)", "", 6)

    # Tickets (tear one side)
    upsert_product(events, "tickets_50", "Tickets (Tear One Side) - 50", "R220", "No numbering. Embossed security feature.", "", 10)
    upsert_product(events, "tickets_100", "Tickets (Tear One Side) - 100", "R260", "No numbering. Embossed security feature.", "", 11)
    upsert_product(events, "tickets_200", "Tickets (Tear One Side) - 200", "R380", "No numbering. Embossed security feature.", "", 12)
    upsert_product(events, "tickets_300", "Tickets (Tear One Side) - 300", "R460", "No numbering. Embossed security feature.", "", 13)
    upsert_product(events, "tickets_500", "Tickets (Tear One Side) - 500", "R680", "No numbering. Embossed security feature.", "", 14)

    # Entertainment boards
    upsert_product(events, "poster_color_a3", "Poster (Color) A3", "R20", "Entertainment / event poster A3", "", 20)
    upsert_product(events, "selfie_board_a2", "Selfie Board A2", "R250", "Selfie board for events", "", 21)
    upsert_product(events, "selfie_board_a1", "Selfie Board A1", "R350", "Large selfie board for events", "", 22)

    # Party items
    upsert_product(events, "party_banner_2x1", "Party Banner (2m x 1m)", "R860", "Party banner", "", 30)
    upsert_product(events, "party_pack_stickers_10s", "Party Pack Stickers (10s)", "R55", "Sticker pack (10)", "", 31)
    upsert_product(events, "welcoming_board", "Welcoming Board", "R350", "Welcome board for events", "", 32)
    upsert_product(events, "event_tags_a6", "Event Tags A6", "R25", "Event tags A6", "", 33)

    # Branded water bottles & stickers
    upsert_product(events, "branded_water_bottles_25", "Branded Water Bottles (25)", "R200", "Branded water bottles for events", "", 40)
    upsert_product(events, "branded_water_bottles_50", "Branded Water Bottles (50)", "R325", "Branded water bottles for events", "", 41)
    upsert_product(events, "branded_water_bottles_100", "Branded Water Bottles (100)", "R600", "Branded water bottles for events", "", 42)
    upsert_product(events, "water_bottle_stickers_100", "Water Bottle Stickers (100)", "R190", "100 stickers (50x90mm)", "", 43)

    # Banners
    upsert_product(events, "banner_2x1", "Banner (2m x 1m)", "R500", "Event banner 2m x 1m", "", 50)
    upsert_product(events, "wall_banner_1_5x2_25", "Wall Banner (1.5m x 2.25m)", "R2500", "Wall banner 1.5m x 2.25m", "", 51)
    upsert_product(events, "wall_banner_2_5x2_25", "Wall Banner (2.5m x 2.25m)", "R4600", "Wall banner 2.5m x 2.25m", "", 52)
    upsert_product(events, "wall_banner_3x2_25", "Wall Banner (3m x 2.25m)", "R5400", "Wall banner 3m x 2.25m", "", 53)
    upsert_product(events, "x_banner", "X Banner", "R850", "X banner", "", 54)
    upsert_product(events, "roll_up_banner", "Roll-up Banner", "R1200", "Roll-up banner", "", 55)
    upsert_product(events, "tear_drops_2x3m", "2 x Tear Drops (3m)", "R2200", "Two tear drop banners (3m)", "", 56)
    upsert_product(events, "telescopic_2x3m", "2 x Telescopic (3m)", "R2400", "Two telescopic banners (3m)", "", 57)

    # Calendar A3 (includes design)
    upsert_product(events, "calendar_a3_1", "Calendar A3 (1)", "R100", "Includes design", "", 60)
    upsert_product(events, "calendar_a3_20", "Calendar A3 (20)", "R280", "Includes design", "", 61)
    upsert_product(events, "calendar_a3_50", "Calendar A3 (50)", "R650", "Includes design", "", 62)
    upsert_product(events, "calendar_a3_100", "Calendar A3 (100)", "R950", "Includes design", "", 63)
    upsert_product(events, "calendar_a3_250", "Calendar A3 (250)", "R1800", "Includes design", "", 64)

    # ============================================================
    # General Printing products (BULK PRINTING)
    # ============================================================
    upsert_product(
        general_printing,
        "bw_printing_bulk",
        "Black & White Printing (Bulk)",
        "R2 per page",
        "Black & white printing. Minimum quantity: 100 pages",
        "",
        1
    )
    upsert_product(
        general_printing,
        "colour_printing_bulk",
        "Colour Printing (Bulk)",
        "R4 per page",
        "Colour printing. Minimum quantity: 100 pages",
        "",
        2
    )

    db.session.commit()
    print("Seed complete ✅ (Church updated from price list image + Events added + General Printing added + other categories)")

