from PIL import Image, ImageFilter

src = Image.open(r"C:\Users\User's\Desktop\VIP\rork-vip-health-recs-copy\expo\assets\images\logo-v.png").convert("RGBA")
a = src.getchannel("A")

# erode alpha: kills thin 1-2px ring, keeps thick V strokes
eroded = a.filter(ImageFilter.MinFilter(5))
# second pass for safety
eroded = eroded.filter(ImageFilter.MinFilter(3))

out_img = Image.new("RGBA", src.size, (255, 255, 255, 0))
out_img.putalpha(eroded)

# crop to content
bbox = out_img.getbbox()
if bbox:
    pad = 8
    w, h = out_img.size
    l, t, r, b = bbox
    out_img = out_img.crop((max(0, l - pad), max(0, t - pad), min(w, r + pad), min(h, b + pad)))

out_img.save(r"C:\Users\User's\Desktop\VIP\rork-vip-health-recs-copy\expo\assets\images\logo-v.png")
print("done", out_img.size)
