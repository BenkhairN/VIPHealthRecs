from PIL import Image

logo = Image.open(r"C:\Users\User's\Desktop\VIP\rork-vip-health-recs-copy\expo\assets\images\logo-v.png")
bg = Image.new("RGBA", logo.size, (30, 107, 184, 255))
bg.alpha_composite(logo)
bg.convert("RGB").save(r"C:\Users\User's\Desktop\VIP\rork-vip-health-recs-copy\expo\preview.png")
print("ok")
