from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


def draw_icon(size: int) -> Image.Image:
    scale = size / 512
    image = Image.new("RGBA", (size, size), (6, 17, 29, 255))
    draw = ImageDraw.Draw(image)

    for radius, alpha in ((238, 34), (190, 48), (132, 56)):
        r = int(radius * scale)
        draw.ellipse(
            (size // 2 - r, size // 2 - r, size // 2 + r, size // 2 + r),
            outline=(199, 168, 112, alpha),
            width=max(1, int(3 * scale)),
        )

    pad = int(78 * scale)
    draw.rounded_rectangle(
        (pad, int(92 * scale), size - pad, int(420 * scale)),
        radius=int(26 * scale),
        fill=(8, 18, 30, 255),
        outline=(232, 193, 101, 255),
        width=max(2, int(8 * scale)),
    )
    draw.rounded_rectangle(
        (int(112 * scale), int(120 * scale), int(400 * scale), int(188 * scale)),
        radius=int(12 * scale),
        fill=(37, 25, 88, 255),
        outline=(247, 221, 151, 255),
        width=max(1, int(4 * scale)),
    )

    center_x = size // 2
    center_y = int(278 * scale)
    draw.polygon(
        [
            (center_x, int(202 * scale)),
            (int(288 * scale), center_y),
            (center_x, int(354 * scale)),
            (int(224 * scale), center_y),
        ],
        fill=(238, 229, 191, 255),
        outline=(118, 231, 255, 255),
    )
    draw.line(
        (center_x, int(196 * scale), center_x, int(360 * scale)),
        fill=(255, 236, 170, 255),
        width=max(1, int(5 * scale)),
    )
    draw.line(
        (int(216 * scale), center_y, int(296 * scale), center_y),
        fill=(255, 236, 170, 255),
        width=max(1, int(5 * scale)),
    )

    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse(
        (int(160 * scale), int(130 * scale), int(352 * scale), int(322 * scale)),
        fill=(112, 226, 255, 42),
    )
    glow = glow.filter(ImageFilter.GaussianBlur(max(2, int(18 * scale))))
    return Image.alpha_composite(image, glow)


def main() -> None:
    output = Path("public/icons")
    output.mkdir(parents=True, exist_ok=True)
    for size in (192, 512):
        draw_icon(size).save(output / f"icon-{size}.png")


if __name__ == "__main__":
    main()
