import type { CardDraft, CardType, Rarity, RenderAssets } from "./types";

export const CARD_WIDTH = 744;
export const CARD_HEIGHT = 1038;

const TYPE_LABELS: Record<CardType, string> = {
  monster: "MONSTER",
  spell: "SPELL",
  field: "FIELD",
};

export type RarityStyle = {
  accent: string;
  accentSoft: string;
  accentDark: string;
  metal: string;
  glow: string;
  rainbow: boolean;
};

export const RARITY_STYLES: Record<Rarity, RarityStyle> = {
  bronze: {
    accent: "#b77745",
    accentSoft: "#f1c19a",
    accentDark: "#6f3d24",
    metal: "#c8874d",
    glow: "rgba(183, 119, 69, 0.38)",
    rainbow: false,
  },
  silver: {
    accent: "#d4dbe5",
    accentSoft: "#ffffff",
    accentDark: "#7e8897",
    metal: "#c5ccd7",
    glow: "rgba(212, 219, 229, 0.36)",
    rainbow: false,
  },
  gold: {
    accent: "#f0b84f",
    accentSoft: "#fff0bb",
    accentDark: "#8b561f",
    metal: "#f2c566",
    glow: "rgba(240, 184, 79, 0.46)",
    rainbow: false,
  },
  legendary: {
    accent: "#7a58d0",
    accentSoft: "#b8a0e8",
    accentDark: "#2a1060",
    metal: "#6845b8",
    glow: "rgba(80, 50, 200, 0.45)",
    rainbow: false,
  },
};

const FONT_STACK =
  '"Noto Sans JP", "Yu Gothic", "Meiryo", "Hiragino Sans", system-ui, sans-serif';
const TITLE_FONT_STACK =
  '"Cinzel", "Noto Serif JP", "Yu Mincho", "Hiragino Mincho ProN", Georgia, serif';

export function drawCard(
  canvas: HTMLCanvasElement,
  draft: CardDraft,
  artworkImage: HTMLImageElement | null,
  renderAssets: RenderAssets = {},
) {
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  const rarityStyle = RARITY_STYLES[draft.rarity];
  const frameColor = rarityStyle.accentDark;
  const frameAsset = renderAssets.frames?.[draft.type]?.[draft.rarity];
  const hasGeneratedFrame = isImageReady(frameAsset);

  ctx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  drawBase(ctx, frameColor, rarityStyle, hasGeneratedFrame);
  drawArt(
    ctx,
    artworkImage,
    frameColor,
    rarityStyle,
    hasGeneratedFrame,
    draft.artworkOffsetX ?? 0.5,
    draft.artworkOffsetY ?? 0.5,
    draft.artworkScale ?? 1,
  );
  if (hasGeneratedFrame) {
    drawGeneratedCardFrame(ctx, frameAsset);
  }
  drawTitle(
    ctx,
    draft,
    frameColor,
    rarityStyle,
    hasGeneratedFrame,
    renderAssets.status?.mana,
  );
  if (!hasGeneratedFrame) {
    drawRarity(ctx, rarityStyle);
  }

  if (draft.type === "monster") {
    drawStat(
      ctx,
      126,
      895,
      Math.max(0, draft.attack),
      "ATK",
      "#c94d45",
      rarityStyle,
      "attack",
      renderAssets.status?.attack,
    );
    drawStat(
      ctx,
      618,
      895,
      Math.max(0, draft.hp),
      "HP",
      "#3f9b62",
      rarityStyle,
      "hp",
      renderAssets.status?.hp,
    );
  }
}

function drawBase(
  ctx: CanvasRenderingContext2D,
  frameColor: string,
  rarityStyle: RarityStyle,
  hasGeneratedFrame: boolean,
) {
  if (hasGeneratedFrame) {
    return;
  }

  const frameGradient = ctx.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT);
  frameGradient.addColorStop(0, adjustHex(frameColor, 72));
  frameGradient.addColorStop(0.18, rarityStyle.accentSoft);
  frameGradient.addColorStop(0.34, frameColor);
  frameGradient.addColorStop(0.7, adjustHex(frameColor, -82));
  frameGradient.addColorStop(1, "#1b202b");

  ctx.save();
  ctx.shadowColor = "rgba(17, 18, 24, 0.36)";
  ctx.shadowBlur = 34;
  ctx.shadowOffsetY = 18;
  roundRect(ctx, 26, 20, 692, 996, 46);
  ctx.fillStyle = frameGradient;
  ctx.fill();
  ctx.restore();

  drawFrameTexture(ctx, frameColor);

  ctx.lineWidth = 9;
  ctx.strokeStyle = createRarityGradient(ctx, rarityStyle, 36, 30, 708, 1006);
  roundRect(ctx, 36, 30, 672, 976, 38);
  ctx.stroke();

  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(15, 18, 24, 0.78)";
  roundRect(ctx, 48, 42, 648, 952, 32);
  ctx.stroke();

  const innerGradient = ctx.createLinearGradient(72, 64, 672, 962);
  innerGradient.addColorStop(0, "#30333d");
  innerGradient.addColorStop(0.5, "#181d27");
  innerGradient.addColorStop(1, "#111520");

  roundRect(ctx, 58, 56, 628, 924, 30);
  ctx.fillStyle = innerGradient;
  ctx.fill();

  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(0, 0, 0, 0.62)";
  roundRect(ctx, 58, 56, 628, 924, 30);
  ctx.stroke();

  drawFrameAccent(ctx, frameColor, rarityStyle);
}

function drawFrameTexture(ctx: CanvasRenderingContext2D, frameColor: string) {
  ctx.save();
  roundRect(ctx, 26, 20, 692, 996, 46);
  ctx.clip();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.lineWidth = 2;
  for (let offset = -CARD_HEIGHT; offset < CARD_WIDTH; offset += 42) {
    ctx.beginPath();
    ctx.moveTo(offset, CARD_HEIGHT);
    ctx.lineTo(offset + CARD_HEIGHT, 0);
    ctx.stroke();
  }

  ctx.strokeStyle = adjustHex(frameColor, -56);
  ctx.globalAlpha = 0.28;
  ctx.lineWidth = 5;
  for (let offset = -CARD_HEIGHT; offset < CARD_WIDTH; offset += 92) {
    ctx.beginPath();
    ctx.moveTo(offset, 0);
    ctx.lineTo(offset + CARD_HEIGHT, CARD_HEIGHT);
    ctx.stroke();
  }
  ctx.restore();
}

function drawFrameAccent(
  ctx: CanvasRenderingContext2D,
  frameColor: string,
  rarityStyle: RarityStyle,
) {
  ctx.save();
  drawCornerOrnament(ctx, 78, 76, 1, 1, frameColor, rarityStyle);
  drawCornerOrnament(ctx, 666, 76, -1, 1, frameColor, rarityStyle);
  drawCornerOrnament(ctx, 78, 936, 1, -1, frameColor, rarityStyle);
  drawCornerOrnament(ctx, 666, 936, -1, -1, frameColor, rarityStyle);

  drawGem(ctx, CARD_WIDTH / 2, 64, 18, rarityStyle.accent);
  drawGem(ctx, CARD_WIDTH / 2, 964, 16, rarityStyle.accent);

  ctx.strokeStyle = rarityStyle.rainbow
    ? createRainbowGradient(ctx, 132, 42, 612, 116)
    : withAlpha(rarityStyle.accentSoft, 0.5);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(132, 116);
  ctx.quadraticCurveTo(372, 42, 612, 116);
  ctx.stroke();

  ctx.strokeStyle = rarityStyle.rainbow
    ? createRainbowGradient(ctx, 112, 884, 632, 968)
    : adjustHex(frameColor, 74);
  ctx.globalAlpha = 0.68;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(112, 884);
  ctx.quadraticCurveTo(372, 968, 632, 884);
  ctx.stroke();

  drawSideFiligree(ctx, 66, 286, 1, rarityStyle);
  drawSideFiligree(ctx, 678, 286, -1, rarityStyle);
  ctx.restore();
}

function drawCornerOrnament(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scaleX: number,
  scaleY: number,
  frameColor: string,
  rarityStyle: RarityStyle,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scaleX, scaleY);

  const metalGradient = ctx.createLinearGradient(0, 0, 90, 90);
  metalGradient.addColorStop(0, rarityStyle.accentSoft);
  metalGradient.addColorStop(0.42, rarityStyle.metal);
  metalGradient.addColorStop(1, adjustHex(frameColor, -54));

  ctx.fillStyle = metalGradient;
  ctx.strokeStyle = "rgba(26, 22, 18, 0.58)";
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(78, 0);
  ctx.lineTo(60, 18);
  ctx.lineTo(20, 18);
  ctx.lineTo(20, 60);
  ctx.lineTo(0, 78);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = "rgba(255, 246, 214, 0.7)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(16, 8);
  ctx.lineTo(58, 8);
  ctx.moveTo(8, 16);
  ctx.lineTo(8, 58);
  ctx.stroke();
  ctx.restore();
}

function drawSideFiligree(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  direction: 1 | -1,
  rarityStyle: RarityStyle,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(direction, 1);
  ctx.strokeStyle = withAlpha(rarityStyle.accentSoft, 0.52);
  ctx.lineWidth = 3;

  for (let index = 0; index < 3; index += 1) {
    const top = index * 148;
    ctx.beginPath();
    ctx.moveTo(0, top);
    ctx.quadraticCurveTo(26, top + 30, 0, top + 60);
    ctx.quadraticCurveTo(-26, top + 90, 0, top + 120);
    ctx.stroke();
    drawGem(ctx, 0, top + 60, 9, rarityStyle.accent);
  }

  ctx.restore();
}

function drawGem(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  gemColor: string,
) {
  const gradient = ctx.createLinearGradient(x - radius, y - radius, x + radius, y + radius);
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(0.32, adjustHex(gemColor, 68));
  gradient.addColorStop(1, adjustHex(gemColor, -86));

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y - radius);
  ctx.lineTo(x + radius, y);
  ctx.lineTo(x, y + radius);
  ctx.lineTo(x - radius, y);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.lineWidth = Math.max(2, radius / 5);
  ctx.strokeStyle = "rgba(255, 239, 196, 0.76)";
  ctx.stroke();
  ctx.restore();
}

function drawGeneratedCardFrame(
  ctx: CanvasRenderingContext2D,
  frameAsset: HTMLImageElement,
) {
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.52)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 10;
  ctx.drawImage(frameAsset, 44, 16, 656, 1004);
  ctx.restore();
}

function drawTitle(
  ctx: CanvasRenderingContext2D,
  draft: CardDraft,
  frameColor: string,
  rarityStyle: RarityStyle,
  hasGeneratedFrame: boolean,
  manaAsset?: HTMLImageElement,
) {
  const x = hasGeneratedFrame ? 144 : 142;
  const width = 466;
  const height = 78;

  let y: number;
  if (!hasGeneratedFrame) {
    y = 70;
  } else {
    switch (draft.type) {
      case "spell": y = 83; break;
      case "field": y = 107; break;
      default: y = 135; break; // monster
    }
  }
  const titleText = draft.name.trim();

  if (!hasGeneratedFrame) {
    const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
    gradient.addColorStop(0, "#2a1f28");
    gradient.addColorStop(0.22, adjustHex(frameColor, -38));
    gradient.addColorStop(0.5, adjustHex(frameColor, 26));
    gradient.addColorStop(0.78, adjustHex(frameColor, -52));
    gradient.addColorStop(1, "#201920");

    drawTitleCap(ctx, x - 34, y + height / 2, frameColor, rarityStyle, -1);
    drawTitleCap(ctx, x + width + 34, y + height / 2, frameColor, rarityStyle, 1);
    roundRect(ctx, x, y, width, height, 22);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = createRarityGradient(ctx, rarityStyle, x, y, x + width, y + height);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(20, 17, 16, 0.62)";
    ctx.stroke();
  }

  // Generated frames: center under the top crystal (card horizontal center = frame center).
  // With textAlign="center", the middle character of odd-length text lands under the crystal.
  // Non-generated frames: center in the title bar, offset for mana badge.
  const textLeft = x + (hasGeneratedFrame ? 72 : 64);
  const textRight = x + width - (hasGeneratedFrame ? 6 : 10);
  const textMaxWidth = hasGeneratedFrame ? 380 : textRight - textLeft;
  const textCenterX = hasGeneratedFrame ? CARD_WIDTH / 2 : (textLeft + textRight) / 2;
  const textCenterY = y + height / 2;

  let titleFontSize = hasGeneratedFrame ? 34 : 37;
  const titleMinSize = 16;
  if (titleText) {
    ctx.font = `700 ${titleFontSize}px ${TITLE_FONT_STACK}`;
    while (titleFontSize > titleMinSize && ctx.measureText(titleText).width > textMaxWidth) {
      titleFontSize -= 1;
      ctx.font = `700 ${titleFontSize}px ${TITLE_FONT_STACK}`;
    }
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 1;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const isLegendaryMonster =
      hasGeneratedFrame && draft.rarity === "legendary" && draft.type === "monster";
    if (rarityStyle.rainbow) {
      ctx.lineJoin = "round";
      ctx.lineWidth = 7;
      ctx.strokeStyle = "rgba(15, 5, 35, 0.95)";
      ctx.strokeText(titleText, textCenterX, textCenterY);
    } else if (isLegendaryMonster) {
      ctx.lineJoin = "round";
      ctx.lineWidth = 6;
      ctx.strokeStyle = "#241046";
      ctx.strokeText(titleText, textCenterX, textCenterY);
    }
    ctx.fillStyle = isLegendaryMonster ? "#ffffff" : "#fff7dc";
    ctx.fillText(titleText, textCenterX, textCenterY);
    ctx.restore();
  }

  drawCost(ctx, Math.max(0, draft.cost), rarityStyle, manaAsset);
}

function drawTitleCap(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  frameColor: string,
  rarityStyle: RarityStyle,
  direction: -1 | 1,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(direction, 1);

  const gradient = ctx.createLinearGradient(-34, -34, 34, 34);
  gradient.addColorStop(0, rarityStyle.accentSoft);
  gradient.addColorStop(0.42, rarityStyle.metal);
  gradient.addColorStop(1, adjustHex(frameColor, -62));

  ctx.beginPath();
  ctx.moveTo(-4, -35);
  ctx.lineTo(34, 0);
  ctx.lineTo(-4, 35);
  ctx.lineTo(-30, 22);
  ctx.lineTo(-18, 0);
  ctx.lineTo(-30, -22);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(31, 25, 19, 0.72)";
  ctx.stroke();
  ctx.restore();
}

function drawCost(
  ctx: CanvasRenderingContext2D,
  cost: number,
  rarityStyle: RarityStyle,
  manaAsset?: HTMLImageElement,
) {
  const x = 102;
  const y = 96;

  if (isImageReady(manaAsset)) {
    ctx.save();
    ctx.shadowColor = rarityStyle.glow;
    ctx.shadowBlur = 18;
    ctx.drawImage(manaAsset, x - 78, y - 93, 156, 190);
    ctx.restore();
    drawOutlinedText(ctx, String(cost), x, y + 3, 62, "#ffffff", "#102653", 7);
    return;
  }

  const radius = 57;
  const rotation = Math.PI / 8;

  ctx.save();
  ctx.shadowColor = rarityStyle.glow;
  ctx.shadowBlur = 24;
  drawRegularPolygon(ctx, x, y, 8, radius + 23, rotation);
  const metalGradient = ctx.createLinearGradient(x - 80, y - 80, x + 78, y + 84);
  metalGradient.addColorStop(0, rarityStyle.accentSoft);
  metalGradient.addColorStop(0.2, rarityStyle.metal);
  metalGradient.addColorStop(0.58, "#8f5b18");
  metalGradient.addColorStop(1, rarityStyle.accentDark);
  ctx.fillStyle = metalGradient;
  ctx.fill();
  ctx.strokeStyle = "rgba(19, 20, 26, 0.74)";
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.lineWidth = 3;
  ctx.strokeStyle = createRarityGradient(ctx, rarityStyle, x - 72, y - 72, x + 72, y + 72);
  drawRegularPolygon(ctx, x, y, 8, radius + 15, rotation);
  ctx.stroke();
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = "rgba(255, 244, 197, 0.72)";
  drawRegularPolygon(ctx, x, y, 8, radius + 7, rotation);
  ctx.stroke();
  drawGem(ctx, x, y - radius - 18, 9, rarityStyle.accent);
  drawGem(ctx, x - radius - 13, y, 7, rarityStyle.accent);
  drawGem(ctx, x + radius + 13, y, 7, rarityStyle.accent);
  ctx.restore();

  const crystalGradient = ctx.createLinearGradient(x - 46, y - 54, x + 46, y + 54);
  crystalGradient.addColorStop(0, "#f8fdff");
  crystalGradient.addColorStop(0.18, "#77d6ff");
  crystalGradient.addColorStop(0.48, "#0f64c9");
  crystalGradient.addColorStop(0.76, "#06316f");
  crystalGradient.addColorStop(1, "#071733");

  drawRegularPolygon(ctx, x, y, 8, radius - 2, rotation);
  ctx.fillStyle = crystalGradient;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(255, 248, 218, 0.88)";
  ctx.stroke();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = "rgba(15, 23, 42, 0.82)";
  ctx.stroke();

  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 28, y - 29);
  ctx.lineTo(x + 26, y - 43);
  ctx.moveTo(x - 34, y + 18);
  ctx.lineTo(x + 35, y + 34);
  ctx.moveTo(x - 39, y - 2);
  ctx.lineTo(x + 40, y - 16);
  ctx.stroke();
  ctx.restore();

  drawOutlinedText(ctx, String(cost), x, y + 1, 62, "#ffffff", "#102653", 7);
}

function drawArt(
  ctx: CanvasRenderingContext2D,
  artworkImage: HTMLImageElement | null,
  frameColor: string,
  rarityStyle: RarityStyle,
  hasGeneratedFrame: boolean,
  offsetX = 0.5,
  offsetY = 0.5,
  scale = 1,
) {
  const x = hasGeneratedFrame ? 86 : 86;
  const y = hasGeneratedFrame ? 184 : 178;
  const width = hasGeneratedFrame ? 572 : 572;
  const height = hasGeneratedFrame ? 792 : 764;
  const radius = hasGeneratedFrame ? 24 : 18;

  ctx.save();
  if (!hasGeneratedFrame) {
    roundRect(ctx, x - 8, y - 8, width + 16, height + 16, 24);
    ctx.fillStyle = "rgba(255, 255, 255, 0.24)";
    ctx.fill();
  }

  roundRect(ctx, x, y, width, height, radius);
  ctx.clip();
  drawPlaceholderArt(ctx, x, y, width, height, frameColor);

  if (artworkImage?.complete && artworkImage.naturalWidth > 0) {
    drawImageCover(ctx, artworkImage, x, y, width, height, offsetX, offsetY, scale);
  }

  const shade = ctx.createLinearGradient(x, y, x, y + height);
  shade.addColorStop(0, "rgba(255, 255, 255, 0.08)");
  shade.addColorStop(0.68, "rgba(0, 0, 0, 0.08)");
  shade.addColorStop(1, "rgba(0, 0, 0, 0.46)");
  ctx.fillStyle = shade;
  ctx.fillRect(x, y, width, height);
  ctx.restore();

  if (!hasGeneratedFrame) {
    ctx.lineWidth = 5;
    ctx.strokeStyle = "rgba(8, 10, 16, 0.82)";
    roundRect(ctx, x, y, width, height, radius);
    ctx.stroke();
    drawArtFrame(ctx, x, y, width, height, frameColor, rarityStyle);
  }
}

function drawArtFrame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  frameColor: string,
  rarityStyle: RarityStyle,
) {
  ctx.save();
  const borderGradient = ctx.createLinearGradient(x, y, x + width, y + height);
  if (rarityStyle.rainbow) {
    borderGradient.addColorStop(0, "#fff9e6");
    borderGradient.addColorStop(0.16, "#a8e7ff");
    borderGradient.addColorStop(0.34, "#f4d9ff");
    borderGradient.addColorStop(0.52, "#f4d98f");
    borderGradient.addColorStop(0.7, "#94f7ef");
    borderGradient.addColorStop(0.86, "#ffb8ef");
    borderGradient.addColorStop(1, "#ffffff");
  } else {
    borderGradient.addColorStop(0, rarityStyle.accentSoft);
    borderGradient.addColorStop(0.38, rarityStyle.metal);
    borderGradient.addColorStop(0.72, adjustHex(frameColor, -48));
    borderGradient.addColorStop(1, rarityStyle.accentSoft);
  }

  ctx.lineWidth = 8;
  ctx.strokeStyle = borderGradient;
  roundRect(ctx, x - 6, y - 6, width + 12, height + 12, 24);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
  ctx.lineWidth = 2;
  roundRect(ctx, x + 10, y + 10, width - 20, height - 20, 14);
  ctx.stroke();

  drawGem(ctx, x + width / 2, y + height + 5, 13, rarityStyle.accent);
  drawArtCorner(ctx, x + 16, y + 16, 1, 1);
  drawArtCorner(ctx, x + width - 16, y + 16, -1, 1);
  drawArtCorner(ctx, x + 16, y + height - 16, 1, -1);
  drawArtCorner(ctx, x + width - 16, y + height - 16, -1, -1);
  ctx.restore();
}

function drawArtCorner(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scaleX: number,
  scaleY: number,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scaleX, scaleY);
  ctx.strokeStyle = "rgba(255, 239, 190, 0.84)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 34);
  ctx.quadraticCurveTo(6, 8, 34, 0);
  ctx.moveTo(0, 20);
  ctx.lineTo(20, 0);
  ctx.stroke();
  ctx.restore();
}

function drawPlaceholderArt(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  frameColor: string,
) {
  const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
  gradient.addColorStop(0, adjustHex(frameColor, 58));
  gradient.addColorStop(0.52, "#343440");
  gradient.addColorStop(1, adjustHex(frameColor, -70));
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, width, height);

  ctx.save();
  ctx.globalAlpha = 0.26;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  for (let i = -height; i < width; i += 42) {
    ctx.beginPath();
    ctx.moveTo(x + i, y + height);
    ctx.lineTo(x + i + height, y);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.translate(x + width / 2, y + height / 2 - 12);
  ctx.rotate(Math.PI / 4);
  const sealGradient = ctx.createLinearGradient(-88, -88, 88, 88);
  sealGradient.addColorStop(0, "rgba(255, 255, 255, 0.88)");
  sealGradient.addColorStop(1, "rgba(255, 255, 255, 0.16)");
  ctx.fillStyle = sealGradient;
  roundRect(ctx, -72, -72, 144, 144, 24);
  ctx.fill();
  ctx.restore();
}

function drawTypeRibbon(
  ctx: CanvasRenderingContext2D,
  draft: CardDraft,
  frameColor: string,
  rarityStyle: RarityStyle,
  hasGeneratedFrame: boolean,
) {
  const x = hasGeneratedFrame ? 162 : 158;
  const y = hasGeneratedFrame ? 580 : 558;
  const width = 428;
  const height = 54;
  const gradient = ctx.createLinearGradient(x, y, x + width, y);
  gradient.addColorStop(0, "#211a20");
  gradient.addColorStop(0.22, adjustHex(frameColor, -52));
  gradient.addColorStop(0.5, adjustHex(frameColor, 32));
  gradient.addColorStop(0.78, adjustHex(frameColor, -52));
  gradient.addColorStop(1, "#211a20");

  drawRibbonTail(ctx, x - 20, y + height / 2, frameColor, rarityStyle, -1);
  drawRibbonTail(ctx, x + width + 20, y + height / 2, frameColor, rarityStyle, 1);
  roundRect(ctx, x, y, width, height, 18);
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = createRarityGradient(ctx, rarityStyle, x, y, x + width, y + height);
  ctx.stroke();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "rgba(27, 22, 17, 0.7)";
  ctx.stroke();

  ctx.font = `700 23px ${FONT_STACK}`;
  ctx.fillStyle = readableTextColor(frameColor);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(TYPE_LABELS[draft.type], CARD_WIDTH / 2, y + height / 2 + 1);
}

function drawRibbonTail(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  frameColor: string,
  rarityStyle: RarityStyle,
  direction: -1 | 1,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(direction, 1);
  const gradient = ctx.createLinearGradient(-34, -24, 32, 24);
  gradient.addColorStop(0, rarityStyle.accentSoft);
  gradient.addColorStop(0.58, adjustHex(frameColor, -38));
  gradient.addColorStop(1, "#1e1a20");
  ctx.beginPath();
  ctx.moveTo(-34, -22);
  ctx.lineTo(26, -22);
  ctx.lineTo(8, 0);
  ctx.lineTo(26, 22);
  ctx.lineTo(-34, 22);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(29, 24, 18, 0.64)";
  ctx.stroke();
  ctx.restore();
}

function drawTextPanel(
  ctx: CanvasRenderingContext2D,
  type: CardType,
  rarityStyle: RarityStyle,
  hasGeneratedFrame: boolean,
) {
  const isMonster = type === "monster";
  const x = hasGeneratedFrame ? 104 : 90;
  const y = hasGeneratedFrame ? 660 : 630;
  const width = hasGeneratedFrame ? 536 : 564;
  const height = hasGeneratedFrame ? (isMonster ? 196 : 262) : isMonster ? 250 : 316;

  const panelGradient = ctx.createLinearGradient(x, y, x, y + height);
  panelGradient.addColorStop(0, "#fff9ea");
  panelGradient.addColorStop(0.5, "#ecd8ad");
  panelGradient.addColorStop(1, "#c9a870");

  roundRect(ctx, x, y, width, height, 18);
  ctx.fillStyle = panelGradient;
  ctx.fill();
  drawTextPanelTexture(ctx, x, y, width, height);

  ctx.lineWidth = 6;
  ctx.strokeStyle = createRarityGradient(ctx, rarityStyle, x, y, x + width, y + height);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(65, 44, 24, 0.68)";
  ctx.stroke();

  ctx.save();
  ctx.globalAlpha = 0.24;
  ctx.strokeStyle = "#7b582b";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x + 40, y + height / 2);
  ctx.lineTo(x + width - 40, y + height / 2);
  ctx.stroke();
  ctx.restore();
}

function drawTextPanelTexture(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  ctx.save();
  roundRect(ctx, x, y, width, height, 18);
  ctx.clip();
  ctx.strokeStyle = "rgba(97, 68, 35, 0.13)";
  ctx.lineWidth = 1;
  for (let lineY = y + 28; lineY < y + height; lineY += 28) {
    ctx.beginPath();
    ctx.moveTo(x + 24, lineY);
    ctx.lineTo(x + width - 24, lineY);
    ctx.stroke();
  }
  ctx.restore();
}

function drawRarity(ctx: CanvasRenderingContext2D, rarityStyle: RarityStyle) {
  const x = CARD_WIDTH / 2;
  const y = 915;
  const size = 25;
  const color = rarityStyle.accent;

  ctx.save();
  ctx.shadowColor = rarityStyle.glow;
  ctx.shadowBlur = 16;
  ctx.translate(x, y);
  ctx.rotate(Math.PI / 4);
  const gradient = rarityStyle.rainbow
    ? createRainbowGradient(ctx, -size, -size, size, size)
    : ctx.createLinearGradient(-size, -size, size, size);
  if (!rarityStyle.rainbow) {
    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(0.34, color);
    gradient.addColorStop(1, adjustHex(color, -72));
  }
  roundRect(ctx, -size, -size, size * 2, size * 2, 8);
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.62)";
  ctx.stroke();
  ctx.restore();
}

function drawStat(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  value: number,
  label: string,
  color: string,
  rarityStyle: RarityStyle,
  kind: "attack" | "hp",
  statusAsset?: HTMLImageElement,
) {
  if (isImageReady(statusAsset)) {
    const width = 142;
    const height = 222;
    const top = y - 88;
    ctx.save();
    ctx.shadowColor = rarityStyle.glow;
    ctx.shadowBlur = 18;
    ctx.drawImage(statusAsset, x - width / 2, top, width, height);
    ctx.restore();

    drawOutlinedText(ctx, String(value), x, top + 100, 56, "#ffffff", "#241517", 7);
    drawOutlinedText(ctx, label, x, top + 183, 16, "#ffffff", "#241517", 3);
    return;
  }

  const radius = 62;
  const outerRadius = radius + 23;
  const innerRadius = radius - 4;
  ctx.save();
  ctx.shadowColor = rarityStyle.glow;
  ctx.shadowBlur = 22;
  drawStatSilhouette(ctx, x, y, outerRadius, kind);
  const plateGradient = ctx.createLinearGradient(x - 80, y - 80, x + 80, y + 92);
  plateGradient.addColorStop(0, rarityStyle.accentSoft);
  plateGradient.addColorStop(0.2, rarityStyle.metal);
  plateGradient.addColorStop(0.52, "#8e5818");
  plateGradient.addColorStop(1, rarityStyle.accentDark);
  ctx.fillStyle = plateGradient;
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = "rgba(22, 20, 20, 0.76)";
  ctx.stroke();
  ctx.restore();

  drawStatOrnaments(ctx, x, y, outerRadius, rarityStyle);

  ctx.save();
  drawStatSilhouette(ctx, x, y, innerRadius, kind);
  ctx.clip();

  const gradient = ctx.createLinearGradient(x - radius, y - radius, x + radius, y + radius + 20);
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(0.18, adjustHex(color, 60));
  gradient.addColorStop(0.52, color);
  gradient.addColorStop(0.82, adjustHex(color, -76));
  gradient.addColorStop(1, "#120e12");
  ctx.fillStyle = gradient;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2 + 34);

  const gloss = ctx.createRadialGradient(x - 25, y - 34, 4, x - 18, y - 30, 72);
  gloss.addColorStop(0, "rgba(255, 255, 255, 0.58)");
  gloss.addColorStop(0.34, "rgba(255, 255, 255, 0.16)");
  gloss.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = gloss;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);

  ctx.globalAlpha = 0.24;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  for (let offset = -82; offset <= 88; offset += 25) {
    ctx.beginPath();
    ctx.moveTo(x + offset - 54, y + 78);
    ctx.lineTo(x + offset + 54, y - 78);
    ctx.stroke();
  }
  ctx.restore();

  drawStatSilhouette(ctx, x, y, innerRadius, kind);
  ctx.lineWidth = 4.5;
  ctx.strokeStyle = "rgba(255, 248, 218, 0.9)";
  ctx.stroke();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = "rgba(20, 20, 25, 0.82)";
  ctx.stroke();

  drawOutlinedText(ctx, String(value), x, y + 6, 63, "#ffffff", "#241517", 7);
  drawStatLabel(ctx, x, y + 68, label, rarityStyle);
}

function drawStatOrnaments(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  rarityStyle: RarityStyle,
) {
  ctx.save();
  ctx.lineWidth = 2.4;
  ctx.strokeStyle = createRarityGradient(
    ctx,
    rarityStyle,
    x - radius,
    y - radius,
    x + radius,
    y + radius,
  );
  drawStatSilhouette(ctx, x, y, radius - 9, "attack");
  ctx.stroke();

  ctx.lineWidth = 1.4;
  ctx.strokeStyle = "rgba(255, 246, 204, 0.78)";
  drawStatSilhouette(ctx, x, y, radius - 17, "attack");
  ctx.stroke();

  drawGem(ctx, x, y - radius + 10, 8, rarityStyle.accent);
  drawGem(ctx, x - radius * 0.73, y - radius * 0.17, 6, rarityStyle.accent);
  drawGem(ctx, x + radius * 0.73, y - radius * 0.17, 6, rarityStyle.accent);

  ctx.strokeStyle = withAlpha(rarityStyle.accentSoft, 0.76);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - radius * 0.74, y + radius * 0.42);
  ctx.quadraticCurveTo(x - radius * 0.45, y + radius * 0.62, x - radius * 0.12, y + radius * 0.72);
  ctx.moveTo(x + radius * 0.74, y + radius * 0.42);
  ctx.quadraticCurveTo(x + radius * 0.45, y + radius * 0.62, x + radius * 0.12, y + radius * 0.72);
  ctx.stroke();
  ctx.restore();
}

function drawStatLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  rarityStyle: RarityStyle,
) {
  const width = 96;
  const height = 32;

  ctx.save();
  const labelGradient = ctx.createLinearGradient(x - width / 2, y, x + width / 2, y + height);
  labelGradient.addColorStop(0, "rgba(10, 12, 17, 0.95)");
  labelGradient.addColorStop(0.5, "rgba(43, 31, 18, 0.96)");
  labelGradient.addColorStop(1, "rgba(10, 12, 17, 0.95)");

  ctx.beginPath();
  ctx.moveTo(x - width / 2 + 11, y);
  ctx.lineTo(x + width / 2 - 11, y);
  ctx.lineTo(x + width / 2 + 6, y + height / 2);
  ctx.lineTo(x + width / 2 - 11, y + height);
  ctx.lineTo(x - width / 2 + 11, y + height);
  ctx.lineTo(x - width / 2 - 6, y + height / 2);
  ctx.closePath();
  ctx.fillStyle = labelGradient;
  ctx.fill();
  ctx.lineWidth = 2.4;
  ctx.strokeStyle = createRarityGradient(ctx, rarityStyle, x - width / 2, y, x + width / 2, y + height);
  ctx.stroke();

  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(255, 246, 204, 0.7)";
  ctx.stroke();

  drawGem(ctx, x, y - 1, 6, rarityStyle.accent);

  ctx.font = `800 16px ${FONT_STACK}`;
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x, y + height / 2 + 2);
  ctx.restore();
}

function drawStatSilhouette(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  kind: "attack" | "hp",
) {
  ctx.beginPath();
  const side = kind === "attack" ? 0.82 : 0.78;
  ctx.moveTo(x, y - radius);
  ctx.lineTo(x + radius * side, y - radius * 0.36);
  ctx.lineTo(x + radius * 0.68, y + radius * 0.5);
  ctx.quadraticCurveTo(x + radius * 0.44, y + radius * 0.8, x, y + radius * 1.06);
  ctx.quadraticCurveTo(x - radius * 0.44, y + radius * 0.8, x - radius * 0.68, y + radius * 0.5);
  ctx.lineTo(x - radius * side, y - radius * 0.36);
  ctx.closePath();
}

function drawBladeMark(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rarityStyle: RarityStyle,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = withAlpha(rarityStyle.accentSoft, 0.72);
  roundRect(ctx, -4, -24, 8, 44, 4);
  ctx.fill();
  ctx.fillStyle = rarityStyle.accentDark;
  roundRect(ctx, -14, 16, 28, 6, 3);
  ctx.fill();
  ctx.restore();
}

function drawHeartMark(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rarityStyle: RarityStyle,
) {
  ctx.save();
  ctx.fillStyle = withAlpha(rarityStyle.accentSoft, 0.74);
  ctx.beginPath();
  ctx.moveTo(x, y + 18);
  ctx.bezierCurveTo(x + 28, y, x + 15, y - 25, x, y - 8);
  ctx.bezierCurveTo(x - 15, y - 25, x - 28, y, x, y + 18);
  ctx.fill();
  ctx.restore();
}

function drawBottomSeal(
  ctx: CanvasRenderingContext2D,
  type: CardType,
  frameColor: string,
  rarityStyle: RarityStyle,
) {
  const x = CARD_WIDTH / 2;
  const y = 920;
  const radius = 58;
  ctx.save();
  ctx.beginPath();
  for (let index = 0; index < 10; index += 1) {
    const angle = (Math.PI * 2 * index) / 10 - Math.PI / 2;
    const pointRadius = radius + (index % 2 === 0 ? 18 : 4);
    const px = x + Math.cos(angle) * pointRadius;
    const py = y + Math.sin(angle) * pointRadius;
    if (index === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.closePath();
  ctx.fillStyle = rarityStyle.metal;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(35, 28, 20, 0.68)";
  ctx.stroke();
  ctx.restore();

  const gradient = ctx.createRadialGradient(x - 18, y - 22, 10, x, y, radius);
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(0.24, adjustHex(frameColor, 54));
  gradient.addColorStop(0.64, rarityStyle.accent);
  gradient.addColorStop(1, adjustHex(frameColor, -80));

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = rarityStyle.accentSoft;
  ctx.stroke();

  const symbol = type === "spell" ? "✦" : "◆";
  drawOutlinedText(ctx, symbol, x, y + 2, 52, "#ffffff", "#2d2431", 5);
}

function drawFittedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  maxSize: number,
  minSize: number,
  weight: string,
  fontFamily = FONT_STACK,
) {
  let size = maxSize;
  do {
    ctx.font = `${weight} ${size}px ${fontFamily}`;
    if (ctx.measureText(text).width <= maxWidth || size <= minSize) {
      break;
    }
    size -= 1;
  } while (size >= minSize);

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(text, x, y);
}

type WrappedBlockOptions = {
  maxSize: number;
  minSize: number;
  color: string;
  fontFamily: string;
  fontStyle: "normal" | "italic";
  fontWeight: string;
};

function drawWrappedBlock(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  width: number,
  height: number,
  options: WrappedBlockOptions,
) {
  if (width <= 0 || height <= 0) {
    return;
  }

  let lines: string[] = [];
  let fontSize = options.maxSize;
  let lineHeight = fontSize * 1.35;

  for (fontSize = options.maxSize; fontSize >= options.minSize; fontSize -= 1) {
    ctx.font = `${options.fontStyle} ${options.fontWeight} ${fontSize}px ${options.fontFamily}`;
    lineHeight = Math.floor(fontSize * 1.35);
    lines = wrapText(ctx, text, width);
    if (lines.length * lineHeight <= height) {
      break;
    }
  }

  ctx.font = `${options.fontStyle} ${options.fontWeight} ${fontSize}px ${options.fontFamily}`;
  ctx.fillStyle = options.color;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  const maxLines = Math.max(1, Math.floor(height / lineHeight));
  const visibleLines = lines.slice(0, maxLines);

  if (lines.length > maxLines) {
    const last = visibleLines[visibleLines.length - 1] ?? "";
    visibleLines[visibleLines.length - 1] = trimToWidth(ctx, `${last}...`, width);
  }

  visibleLines.forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight);
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  if (maxWidth <= 0) {
    return [];
  }

  const paragraphs = text.split(/\n/);
  const lines: string[] = [];

  paragraphs.forEach((paragraph) => {
    if (!paragraph.trim()) {
      lines.push("");
      return;
    }

    const tokens = paragraph.split(/(\s+)/).filter((token) => token.length > 0);
    let current = "";

    tokens.forEach((token) => {
      const next = current + token;
      if (ctx.measureText(next).width <= maxWidth) {
        current = next;
        return;
      }

      if (current.trim()) {
        lines.push(current.trimEnd());
        current = token.trimStart();
      }

      while (ctx.measureText(current).width > maxWidth && current.length > 1) {
        let slice = "";
        for (const char of current) {
          if (ctx.measureText(slice + char).width > maxWidth) {
            break;
          }
          slice += char;
        }
        if (!slice) {
          current = current.slice(1);
          continue;
        }
        lines.push(slice);
        current = current.slice(slice.length);
      }
    });

    if (current.trim()) {
      lines.push(current.trimEnd());
    }
  });

  return lines;
}

function trimToWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) {
  if (maxWidth <= 0) {
    return "";
  }

  if (ctx.measureText(text).width <= maxWidth) {
    return text;
  }

  let next = text;
  const marker = "...";
  while (next.length > marker.length && ctx.measureText(next).width > maxWidth) {
    next = `${next.slice(0, -1 - marker.length)}${marker}`;
  }

  return ctx.measureText(next).width <= maxWidth ? next : "";
}

function drawOutlinedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  fill: string,
  stroke: string,
  strokeWidth: number,
) {
  ctx.font = `800 ${size}px ${FONT_STACK}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.strokeStyle = stroke;
  ctx.lineWidth = strokeWidth;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  offsetX = 0.5,
  offsetY = 0.5,
  scale = 1,
) {
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const targetRatio = width / height;

  // Base size (in destination px) at which the whole image exactly covers the frame, no zoom.
  let coverWidth = width;
  let coverHeight = height;
  if (imageRatio > targetRatio) {
    coverHeight = height;
    coverWidth = height * imageRatio;
  } else {
    coverWidth = width;
    coverHeight = width / imageRatio;
  }

  const safeScale = Math.max(0.1, scale);
  const drawWidth = coverWidth * safeScale;
  const drawHeight = coverHeight * safeScale;

  // Slack is the leftover space to pan through: negative when the image overflows the frame
  // (crop, scale >= 1), positive when it's smaller than the frame (zoom out, background shows).
  const slackX = width - drawWidth;
  const slackY = height - drawHeight;
  const dx = x + slackX * offsetX;
  const dy = y + slackY * offsetY;

  ctx.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight, dx, dy, drawWidth, drawHeight);
}

function drawRegularPolygon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  points: number,
  radius: number,
  rotation: number,
) {
  ctx.beginPath();
  for (let index = 0; index < points; index += 1) {
    const angle = rotation + (Math.PI * 2 * index) / points;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (index === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.closePath();
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  points: number,
  outerRadius: number,
  innerRadius: number,
  rotation: number,
) {
  ctx.beginPath();
  for (let index = 0; index < points * 2; index += 1) {
    const radius = index % 2 === 0 ? outerRadius : innerRadius;
    const angle = rotation + (Math.PI * index) / points;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (index === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.closePath();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  if (width <= 0 || height <= 0) {
    return;
  }

  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function normalizeHexColor(value: string, fallback: string) {
  const normalized = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(normalized)) {
    return normalized;
  }

  if (/^#[0-9a-fA-F]{3}$/.test(normalized)) {
    const [, r, g, b] = normalized;
    return `#${r}${r}${g}${g}${b}${b}`;
  }

  return fallback;
}

function adjustHex(hex: string, amount: number) {
  const color = normalizeHexColor(hex, "#6c63ff");
  const red = clamp(parseInt(color.slice(1, 3), 16) + amount, 0, 255);
  const green = clamp(parseInt(color.slice(3, 5), 16) + amount, 0, 255);
  const blue = clamp(parseInt(color.slice(5, 7), 16) + amount, 0, 255);

  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
}

function readableTextColor(hex: string) {
  const color = normalizeHexColor(hex, "#6c63ff");
  const red = parseInt(color.slice(1, 3), 16);
  const green = parseInt(color.slice(3, 5), 16);
  const blue = parseInt(color.slice(5, 7), 16);
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;

  return luminance > 0.58 ? "#1f2330" : "#ffffff";
}

function withAlpha(hex: string, alpha: number) {
  const color = normalizeHexColor(hex, "#ffffff");
  const red = parseInt(color.slice(1, 3), 16);
  const green = parseInt(color.slice(3, 5), 16);
  const blue = parseInt(color.slice(5, 7), 16);

  return `rgba(${red}, ${green}, ${blue}, ${clamp(alpha, 0, 1)})`;
}

function createRarityGradient(
  ctx: CanvasRenderingContext2D,
  rarityStyle: RarityStyle,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
) {
  return rarityStyle.rainbow
    ? createRainbowGradient(ctx, x0, y0, x1, y1)
    : rarityStyle.metal;
}

function isImageReady(image: HTMLImageElement | undefined): image is HTMLImageElement {
  return Boolean(image?.complete && image.naturalWidth > 0);
}

export function createRainbowGradient(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
) {
  const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
  gradient.addColorStop(0, "#fff8df");
  gradient.addColorStop(0.1, "#ffffff");
  gradient.addColorStop(0.2, "#8ee2ff");
  gradient.addColorStop(0.33, "#d6c3ff");
  gradient.addColorStop(0.46, "#ffb9ee");
  gradient.addColorStop(0.58, "#fff4cf");
  gradient.addColorStop(0.7, "#8df8ef");
  gradient.addColorStop(0.84, "#b9c8ff");
  gradient.addColorStop(0.94, "#ffe7a8");
  gradient.addColorStop(1, "#ffffff");
  return gradient;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function toHex(value: number) {
  return value.toString(16).padStart(2, "0");
}
