from PIL import Image, ImageDraw, ImageFont

S = 2                      # draw at 2x, downscale for smooth edges
W, H = 1920, 800
F = '/tmp/fonts/'

INDIGO, INDIGO_DEEP = (30, 42, 120), (20, 28, 82)
HALDI, MINT, INK = (244, 180, 0), (11, 122, 85), (21, 25, 51)
PAPER, WHITE = (245, 246, 250), (255, 255, 255)
MINT_SOFT = (226, 244, 236)

def brico(size, wght=800, wdth=100):
    f = ImageFont.truetype(F + 'BricolageGrotesque', size * S)
    f.set_variation_by_axes([96 if size > 40 else 24, wght, wdth])
    return f

def mukta(size, weight='Bold'):
    return ImageFont.truetype(F + f'Mukta-{weight}.ttf', size * S)

def P(*v):  # scale coords
    return tuple(int(x * S) for x in v)

def text(d, xy, s, font, fill, anchor='la'):
    d.text(P(*xy), s, font=font, fill=fill, anchor=anchor)

def width(d, s, font):
    b = d.textbbox((0, 0), s, font=font)
    return (b[2] - b[0]) / S

def logo(d, x, y, bg, mark, wordmark):
    d.rounded_rectangle(P(x, y, x + 60, y + 60), radius=14 * S, fill=mark)
    k = 60 / 64
    A = [(18, 46), (30, 16), (34, 16), (46, 46), (40, 46), (37, 38), (27, 38), (24, 46)]
    d.polygon([P(x + a * k, y + b * k) for a, b in A], fill=bg)
    d.polygon([P(x + a * k, y + b * k) for a, b in [(29, 33), (35, 33), (32, 25)]], fill=mark)
    d.ellipse(P(x + 41 * k, y + 11 * k, x + 53 * k, y + 23 * k), fill=HALDI)
    text(d, (x + 78, y + 30), 'Aali Market', brico(34), wordmark, 'lm')

def cta(d, x, y, label, bg, fg):
    f = mukta(40, 'Bold')
    w = width(d, label, f)
    d.rounded_rectangle(P(x, y, x + w + 88, y + 92), radius=46 * S, fill=bg)
    text(d, (x + 44, y + 44), label, f, fg, 'lm')

def left_block(d, lines, hindi, fg, sub_fg):
    y = 230
    f = brico(116)
    for line in lines:
        text(d, (120, y), line, f, fg)
        y += 120
    text(d, (122, y + 22), hindi, mukta(48, 'Medium'), sub_fg)
    return y

def price_hero(d, x_right, y_base, rupees, unit, mrp, color, mrp_color, label=None, label_color=None, size=430):
    """Signature price block: small ₹, huge number, unit, struck MRP — right aligned at x_right."""
    k = size / 430
    big, cur, small = brico(size, 800, 82), brico(int(150 * k), 800), brico(70, 700)
    nw, cw = width(d, rupees, big), width(d, '₹', cur)
    x = x_right - nw
    text(d, (x, y_base), rupees, big, color, 'ls')
    text(d, (x - cw - 10, y_base - 200 * k), '₹', cur, color, 'ls')  # top-aligned with the number's cap height
    if unit:
        text(d, (x_right + 14, y_base), unit, small, color, 'ls')
    if mrp:
        mf = brico(64, 600)
        mw = width(d, mrp, mf)
        mx, my = x_right - mw, y_base + 90
        text(d, (mx, my), mrp, mf, mrp_color, 'ls')
        d.line(P(mx - 4, my - 22, mx + mw + 4, my - 22), fill=mrp_color, width=5 * S)
    if label:
        text(d, (x - cw - 10, y_base - 350 * k), label, mukta(46, 'Bold'), label_color, 'ls')

def save(img, name):
    img = img.resize((W, H), Image.LANCZOS)
    img.save(f'/tmp/banners/{name}.webp', quality=90)
    img.save(f'/tmp/banners/{name}.png', optimize=True)

def canvas(bg):
    img = Image.new('RGB', P(W, H), bg)
    return img, ImageDraw.Draw(img)

# 1 ── Fresh vegetables (mint) ─────────────────────────────
img, d = canvas(MINT)
d.ellipse(P(1180, -260, 2160, 720), fill=(14, 134, 94))      # one quiet shape behind the price
logo(d, 120, 90, MINT, WHITE, WHITE)
y = left_block(d, ['Fresh sabzi,', 'mandi ke daam'], 'रोज़ ताज़ी सब्ज़ियाँ, सीधे आपके घर', WHITE, (200, 236, 222))
cta(d, 120, 600, 'Shop vegetables', HALDI, INK)
price_hero(d, 1640, 560, '28', '/kg', '₹35', HALDI, (170, 222, 200), 'Tomato', WHITE)
save(img, 'banner-fresh-vegetables')

# 2 ── AALI50 coupon (indigo) ──────────────────────────────
img, d = canvas(INDIGO)
logo(d, 120, 90, INDIGO, WHITE, WHITE)
left_block(d, ['Pehla order?', 'Aur bhi sasta'], '₹199 से ऊपर के ऑर्डर पर ₹50 की छूट', WHITE, (196, 202, 236))
cta(d, 120, 600, 'Use code AALI50', HALDI, INK)

tag = Image.new('RGBA', P(760, 460), (0, 0, 0, 0))
t = ImageDraw.Draw(tag)
t.polygon([P(*p) for p in [(110, 0), (760, 0), (760, 460), (110, 460), (0, 230)]], fill=HALDI)
t.ellipse(P(70, 205, 120, 255), fill=INDIGO)
f50 = brico(250, 800, 82)
t.text(P(470, 215), '₹50', font=f50, fill=INK, anchor='ms')
t.text(P(470, 292), 'OFF', font=brico(72, 800), fill=INK, anchor='ms')
t.rounded_rectangle(P(255, 330, 685, 410), radius=12 * S, outline=INK, width=4 * S)
t.text(P(470, 372), 'AALI50', font=brico(54, 800), fill=INK, anchor='mm')
tag = tag.rotate(-7, resample=Image.BICUBIC, expand=True)
img.paste(tag, P(1050, 140), tag)
save(img, 'banner-coupon-aali50')

# 3 ── Free delivery (haldi) ───────────────────────────────
img, d = canvas(HALDI)
d.rectangle(P(1240, 0, 1920, 800), fill=(236, 168, 0))
logo(d, 120, 90, HALDI, INDIGO, INK)
left_block(d, ['Free delivery', '₹199 se upar'], 'घर तक डिलीवरी, कोई चार्ज नहीं', INK, (92, 70, 0))
cta(d, 120, 600, 'Start shopping', INDIGO, WHITE)
big = brico(430, 800, 82)
text(d, (1580, 560), '₹0', big, INDIGO, 'ms')
text(d, (1580, 650), 'delivery charge', mukta(56, 'Bold'), INK, 'ms')
save(img, 'banner-free-delivery')

# 4 ── Staples (paper) ─────────────────────────────────────
img, d = canvas(PAPER)
d.rectangle(P(0, 0, 18, 800), fill=INDIGO)
logo(d, 120, 90, PAPER, INDIGO, INK)
left_block(d, ['Ghar ka raashan,', 'kam daam mein'], 'आटा, चावल, दाल, तेल — सब एक जगह', INK, (91, 97, 128))
cta(d, 120, 600, 'Shop staples', INDIGO, WHITE)
price_hero(d, 1790, 540, '249', None, '₹275', INDIGO, (130, 136, 165), 'Aata 5 kg', INK, size=330)
sf = mukta(44, 'Bold')
sw = width(d, 'Save ₹26', sf)
d.rounded_rectangle(P(1790 - sw - 56, 650, 1790, 718), radius=34 * S, fill=MINT_SOFT)
text(d, (1790 - sw / 2 - 28, 684), 'Save ₹26', sf, MINT, 'mm')
save(img, 'banner-staples')
print('done')
