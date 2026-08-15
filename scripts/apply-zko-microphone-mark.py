"""Apply the disclosed ZKO pixel wordmark to the homepage microphone mockup."""

from pathlib import Path

from PIL import Image, ImageDraw


IMAGE_PATH = Path(__file__).resolve().parents[1] / "assets" / "images" / "pixel-hero.webp"


PIXEL_FONT = {
    "Z": (
        "11111",
        "00001",
        "00010",
        "00100",
        "01000",
        "10000",
        "11111",
    ),
    "K": (
        "10001",
        "10010",
        "10100",
        "11000",
        "10100",
        "10010",
        "10001",
    ),
    "O": (
        "01110",
        "10001",
        "10001",
        "10001",
        "10001",
        "10001",
        "01110",
    ),
}


def draw_word(draw: ImageDraw.ImageDraw, origin: tuple[int, int], scale: int, color: tuple[int, int, int]) -> None:
    x_cursor, y_cursor = origin
    for letter in "ZKO":
        glyph = PIXEL_FONT[letter]
        for row, line in enumerate(glyph):
            for column, pixel in enumerate(line):
                if pixel == "1":
                    x = x_cursor + column * scale
                    y = y_cursor + row * scale
                    draw.rectangle((x, y, x + scale - 1, y + scale - 1), fill=color)
        x_cursor += 6 * scale


def main() -> None:
    image = Image.open(IMAGE_PATH).convert("RGB")
    draw = ImageDraw.Draw(image)

    # The panel already has a neutral texture. Add a small embossed pixel wordmark
    # sized to the microphone face, with a dark offset and warm-white foreground.
    scale = 4
    origin = (1040, 275)
    draw_word(draw, (origin[0] + 3, origin[1] + 4), scale, (34, 44, 58))
    draw_word(draw, origin, scale, (255, 248, 232))

    image.save(IMAGE_PATH, "WEBP", quality=94, method=6)


if __name__ == "__main__":
    main()
