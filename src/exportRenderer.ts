import {
  CARD_HEIGHT,
  CARD_WIDTH,
  RARITY_STYLES,
  createRainbowGradient,
  drawCard,
  type RarityStyle,
} from "./cardRenderer";
import type { CardDraft, CardType, Rarity, RenderAssets } from "./types";

export type ExportMode = "card" | "flavor";

export const FLAVOR_EXPORT_WIDTH = 1600;
export const FLAVOR_EXPORT_HEIGHT = 900;

const FONT_STACK =
  '"Noto Sans JP", "Yu Gothic", "Meiryo", "Hiragino Sans", system-ui, sans-serif';
const SERIF_STACK =
  '"Noto Serif JP", "Yu Mincho", "Hiragino Mincho ProN", Georgia, serif';
const TITLE_FONT_STACK =
  '"Cinzel", "Noto Serif JP", "Yu Mincho", "Hiragino Mincho ProN", Georgia, serif';

const LORE_ACCENT = "#c8a870";

const TYPE_LABELS: Record<CardType, string> = {
  monster: "ユニット",
  spell: "スペル",
  field: "フィールド",
};

const RARITY_LABELS: Record<Rarity, string> = {
  bronze: "ブロンズ",
  silver: "シルバー",
  gold: "ゴールド",
  legendary: "レジェンド",
};

const INFO_ROW_HEIGHT = 56;

export function drawExportImage(
  canvas: HTMLCanvasElement,
  draft: CardDraft,
  artworkImage: HTMLImageElement | null,
  mode: ExportMode,
  renderAssets: RenderAssets = {},
) {
  if (mode === "card") {
    drawCard(canvas, draft, artworkImage, renderAssets);
    return;
  }

  canvas.width = FLAVOR_EXPORT_WIDTH;
  canvas.height = FLAVOR_EXPORT_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  const rarityStyle = RARITY_STYLES[draft.rarity];
  ctx.clearRect(0, 0, FLAVOR_EXPORT_WIDTH, FLAVOR_EXPORT_HEIGHT);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const sceneBackground = renderAssets.sceneBackground;
  if (isImageReady(sceneBackground)) {
    safeDraw(() => {
      ctx.drawImage(
        sceneBackground,
        0,
        0,
        FLAVOR_EXPORT_WIDTH,
        FLAVOR_EXPORT_HEIGHT,
      );
    }, () => drawSceneBackground(ctx, rarityStyle));
    safeDraw(
      () =>
        drawCardPlate(
          ctx,
          draft,
          artworkImage,
          86,
          55,
          545,
          790,
          rarityStyle,
          renderAssets,
          false,
        ),
      () => drawCardPlaceholder(ctx, 86, 55, 545, 790, rarityStyle),
    );
    safeDraw(() => drawGeneratedLoreContents(ctx, draft, 770, 92, 735, 730, rarityStyle));
    return;
  }

  drawSceneBackground(ctx, rarityStyle);
  safeDraw(
    () => drawCardPlate(ctx, draft, artworkImage, 86, 55, 545, 790, rarityStyle, renderAssets, false),
    () => drawCardPlaceholder(ctx, 86, 55, 545, 790, rarityStyle),
  );
  safeDraw(() => drawLorePanel(ctx, draft, 820, 65, 705, 770, rarityStyle));
}

function safeDraw(draw: () => void, fallback?: () => void) {
  try {
    draw();
  } catch (error) {
    console.error("Failed to draw export layer", error);
    fallback?.();
  }
}

function drawSceneBackground(ctx: CanvasRenderingContext2D, rarityStyle: RarityStyle) {
  const base = ctx.createLinearGradient(0, 0, FLAVOR_EXPORT_WIDTH, FLAVOR_EXPORT_HEIGHT);
  base.addColorStop(0, "#04080d");
  base.addColorStop(0.42, "#091522");
  base.addColorStop(0.72, "#0c1017");
  base.addColorStop(1, "#17110c");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, FLAVOR_EXPORT_WIDTH, FLAVOR_EXPORT_HEIGHT);

  drawStarField(ctx);
  drawConstellationLines(ctx, 95, 90, 590, 720, 0.36);
  drawConstellationLines(ctx, 780, 70, 770, 750, 0.22);
  drawAstrolabe(ctx, 420, 330, 185, rarityStyle, 0.22);
  drawAstrolabe(ctx, 1348, 705, 115, rarityStyle, 0.16);

  const glow = ctx.createRadialGradient(495, 210, 10, 495, 210, 520);
  glow.addColorStop(0, "rgba(255, 211, 112, 0.22)");
  glow.addColorStop(0.34, "rgba(255, 211, 112, 0.08)");
  glow.addColorStop(1, "rgba(255, 211, 112, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, FLAVOR_EXPORT_WIDTH, FLAVOR_EXPORT_HEIGHT);

  const vignette = ctx.createRadialGradient(800, 440, 260, 800, 440, 850);
  vignette.addColorStop(0, "rgba(255, 255, 255, 0)");
  vignette.addColorStop(0.72, "rgba(0, 0, 0, 0.15)");
  vignette.addColorStop(1, "rgba(0, 0, 0, 0.62)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, FLAVOR_EXPORT_WIDTH, FLAVOR_EXPORT_HEIGHT);

  if (rarityStyle.rainbow) {
    const rainbow = ctx.createLinearGradient(0, 0, FLAVOR_EXPORT_WIDTH, 0);
    rainbow.addColorStop(0, "rgba(255, 255, 255, 0)");
    rainbow.addColorStop(0.16, "rgba(142, 226, 255, 0.16)");
    rainbow.addColorStop(0.34, "rgba(214, 195, 255, 0.17)");
    rainbow.addColorStop(0.52, "rgba(255, 185, 238, 0.15)");
    rainbow.addColorStop(0.7, "rgba(141, 248, 239, 0.14)");
    rainbow.addColorStop(0.88, "rgba(255, 231, 168, 0.13)");
    rainbow.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = rainbow;
    ctx.fillRect(0, 0, FLAVOR_EXPORT_WIDTH, FLAVOR_EXPORT_HEIGHT);

    const opalGlow = ctx.createRadialGradient(382, 142, 20, 382, 142, 440);
    opalGlow.addColorStop(0, "rgba(255, 244, 207, 0.22)");
    opalGlow.addColorStop(0.28, "rgba(142, 226, 255, 0.12)");
    opalGlow.addColorStop(0.58, "rgba(255, 185, 238, 0.08)");
    opalGlow.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = opalGlow;
    ctx.fillRect(0, 0, FLAVOR_EXPORT_WIDTH, FLAVOR_EXPORT_HEIGHT);
  }
}

function drawStarField(ctx: CanvasRenderingContext2D) {
  ctx.save();
  for (let index = 0; index < 130; index += 1) {
    const x = (index * 137) % FLAVOR_EXPORT_WIDTH;
    const y = (index * 89) % FLAVOR_EXPORT_HEIGHT;
    const radius = index % 9 === 0 ? 1.8 : 0.9;
    const alpha = index % 7 === 0 ? 0.72 : 0.32;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 218, 139, ${alpha})`;
    ctx.fill();
  }
  ctx.restore();
}

function drawConstellationLines(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  alpha: number,
) {
  ctx.save();
  ctx.strokeStyle = `rgba(214, 161, 65, ${alpha})`;
  ctx.lineWidth = 1;
  for (let row = 0; row < 6; row += 1) {
    ctx.beginPath();
    for (let col = 0; col < 7; col += 1) {
      const px = x + ((col * 93 + row * 31) % width);
      const py = y + ((row * 113 + col * 47) % height);
      if (col === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
      ctx.moveTo(px + 4, py);
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.moveTo(px, py);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawAstrolabe(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  rarityStyle: RarityStyle,
  alpha: number,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = rarityStyle.rainbow
    ? createRainbowGradient(ctx, x - radius, y - radius, x + radius, y + radius)
    : rarityStyle.metal;
  ctx.lineWidth = 1.4;
  for (let ring = 0; ring < 4; ring += 1) {
    ctx.beginPath();
    ctx.arc(x, y, radius - ring * 35, 0, Math.PI * 2);
    ctx.stroke();
  }

  for (let index = 0; index < 12; index += 1) {
    const angle = (Math.PI * 2 * index) / 12;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSceneBorder(ctx: CanvasRenderingContext2D, rarityStyle: RarityStyle) {
  const stroke = rarityStyle.rainbow
    ? createRainbowGradient(ctx, 18, 18, FLAVOR_EXPORT_WIDTH - 18, FLAVOR_EXPORT_HEIGHT - 18)
    : rarityStyle.metal;

  ctx.save();
  ctx.lineWidth = 3;
  ctx.strokeStyle = stroke;
  roundRect(ctx, 18, 18, FLAVOR_EXPORT_WIDTH - 36, FLAVOR_EXPORT_HEIGHT - 36, 6);
  ctx.stroke();

  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(255, 222, 151, 0.56)";
  roundRect(ctx, 31, 31, FLAVOR_EXPORT_WIDTH - 62, FLAVOR_EXPORT_HEIGHT - 62, 4);
  ctx.stroke();

  drawLargeCorner(ctx, 44, 44, 1, 1, rarityStyle);
  drawLargeCorner(ctx, FLAVOR_EXPORT_WIDTH - 44, 44, -1, 1, rarityStyle);
  drawLargeCorner(ctx, 44, FLAVOR_EXPORT_HEIGHT - 44, 1, -1, rarityStyle);
  drawLargeCorner(ctx, FLAVOR_EXPORT_WIDTH - 44, FLAVOR_EXPORT_HEIGHT - 44, -1, -1, rarityStyle);
  ctx.restore();
}

function drawCardPlate(
  ctx: CanvasRenderingContext2D,
  draft: CardDraft,
  artworkImage: HTMLImageElement | null,
  x: number,
  y: number,
  width: number,
  height: number,
  rarityStyle: RarityStyle,
  renderAssets: RenderAssets,
  drawPlate: boolean,
) {
  if (drawPlate) {
    const panelStroke = rarityStyle.rainbow
      ? createRainbowGradient(ctx, x, y, x + width, y + height)
      : rarityStyle.metal;

    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.62)";
    ctx.shadowBlur = 28;
    ctx.shadowOffsetX = 12;
    ctx.shadowOffsetY = 18;
    roundRect(ctx, x - 18, y - 18, width + 36, height + 36, 28);
    ctx.fillStyle = "rgba(1, 5, 8, 0.54)";
    ctx.fill();
    ctx.restore();

    ctx.lineWidth = 2;
    ctx.strokeStyle = panelStroke;
    roundRect(ctx, x - 18, y - 18, width + 36, height + 36, 28);
    ctx.stroke();
  }

  const cardCanvas = document.createElement("canvas");
  drawCard(cardCanvas, draft, artworkImage, renderAssets);
  ctx.drawImage(cardCanvas, x, y, width, height);
}

function drawCardPlaceholder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  rarityStyle: RarityStyle,
) {
  const fill = ctx.createLinearGradient(x, y, x, y + height);
  fill.addColorStop(0, "rgba(9, 15, 25, 0.96)");
  fill.addColorStop(1, "rgba(2, 5, 10, 0.96)");

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
  ctx.shadowBlur = 24;
  roundRect(ctx, x, y, width, height, 18);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();

  ctx.lineWidth = 3;
  ctx.strokeStyle = rarityStyle.rainbow
    ? createRainbowGradient(ctx, x, y, x + width, y + height)
    : rarityStyle.metal;
  roundRect(ctx, x, y, width, height, 18);
  ctx.stroke();
}

function drawLorePanel(
  ctx: CanvasRenderingContext2D,
  draft: CardDraft,
  x: number,
  y: number,
  width: number,
  height: number,
  rarityStyle: RarityStyle,
) {
  const panelFill = ctx.createLinearGradient(x, y, x, y + height);
  panelFill.addColorStop(0, "rgba(8, 18, 29, 0.97)");
  panelFill.addColorStop(0.52, "rgba(2, 9, 15, 0.985)");
  panelFill.addColorStop(1, "rgba(7, 8, 9, 0.985)");

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 14;
  roundRect(ctx, x, y, width, height, 22);
  ctx.fillStyle = panelFill;
  ctx.fill();
  ctx.restore();

  const border = rarityStyle.rainbow
    ? createRainbowGradient(ctx, x, y, x + width, y + height)
    : rarityStyle.metal;
  ctx.lineWidth = 2.4;
  ctx.strokeStyle = border;
  roundRect(ctx, x, y, width, height, 22);
  ctx.stroke();

  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(255, 222, 151, 0.5)";
  roundRect(ctx, x + 18, y + 18, width - 36, height - 36, 12);
  ctx.stroke();

  drawPanelCorners(ctx, x + 22, y + 22, width - 44, height - 44, rarityStyle);
  drawLoreHeader(ctx, draft, x + 58, y + 28, width - 116, rarityStyle);
  const infoY = y + 116;
  const infoRowCount = drawInfoRows(ctx, draft, x + 72, infoY, width - 144, rarityStyle);
  const sectionsY = infoY + infoRowCount * INFO_ROW_HEIGHT + 20;
  drawWindowSections(ctx, draft, x + 72, sectionsY, width - 144, y + 748 - sectionsY, rarityStyle);
}

function drawGeneratedLoreContents(
  ctx: CanvasRenderingContext2D,
  draft: CardDraft,
  x: number,
  y: number,
  width: number,
  height: number,
  rarityStyle: RarityStyle,
) {
  drawLoreHeader(ctx, draft, x + 42, y + 28, width - 92, rarityStyle);
  const infoY = y + 116;
  const infoRowCount = drawInfoRows(ctx, draft, x + 72, infoY, width - 144, rarityStyle);
  const sectionsY = infoY + infoRowCount * INFO_ROW_HEIGHT + 20;
  drawWindowSections(ctx, draft, x + 72, sectionsY, width - 144, y + height - 22 - sectionsY, rarityStyle);
}

function drawLoreHeader(
  ctx: CanvasRenderingContext2D,
  draft: CardDraft,
  x: number,
  y: number,
  width: number,
  rarityStyle: RarityStyle,
) {
  const title = draft.name.trim();
  if (title) {
    ctx.fillStyle = "#fff4dc";
    drawCenteredFittedText(
      ctx,
      title,
      x + 62,
      y + 26,
      width - 124,
      44,
      26,
      "700",
      TITLE_FONT_STACK,
    );
  }

  const lineY = y + 44;
  ctx.strokeStyle = LORE_ACCENT;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, lineY);
  ctx.lineTo(x + width, lineY);
  ctx.stroke();

  drawCenterOrnament(ctx, x + width / 2, lineY, LORE_ACCENT);
}

function drawInfoRows(
  ctx: CanvasRenderingContext2D,
  draft: CardDraft,
  x: number,
  y: number,
  width: number,
  rarityStyle: RarityStyle,
) {
  const rows = [
    ["種類", TYPE_LABELS[draft.type]],
    draft.showClassName ? ["分類", draft.className.trim()] : null,
    ["レアリティ", RARITY_LABELS[draft.rarity]],
  ].filter((row): row is [string, string] => Boolean(row));

  rows.forEach(([label, value], index) => {
    const rowY = y + index * INFO_ROW_HEIGHT;
    ctx.strokeStyle = "rgba(222, 166, 68, 0.32)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, rowY + 42);
    ctx.lineTo(x + width, rowY + 42);
    ctx.stroke();

    ctx.font = `700 22px ${SERIF_STACK}`;
    ctx.fillStyle = LORE_ACCENT;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(label, x + 16, rowY + 27);

    ctx.font = `600 22px ${SERIF_STACK}`;
    ctx.fillStyle = "#fff4dc";
    ctx.textAlign = "right";
    ctx.fillText(value, x + width - 16, rowY + 27);
  });

  return rows.length;
}

function drawStatCards(
  ctx: CanvasRenderingContext2D,
  draft: CardDraft,
  x: number,
  y: number,
  width: number,
  rarityStyle: RarityStyle,
) {
  const stats =
    draft.type === "monster"
      ? [
          { label: "マナ", value: draft.cost, color: "#0d5bb7" },
          { label: "攻撃", value: draft.attack, color: "#9d3326" },
          { label: "HP", value: draft.hp, color: "#106f34" },
        ]
      : [{ label: "マナ", value: draft.cost, color: "#0d5bb7" }];

  const gap = 18;
  const boxWidth = (width - gap * (stats.length - 1)) / stats.length;
  stats.forEach((stat, index) => {
    const boxX = x + index * (boxWidth + gap);
    drawStatBox(ctx, boxX, y, boxWidth, 154, stat.label, stat.value, stat.color, rarityStyle);
  });
}

function drawStatBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  value: number,
  color: string,
  rarityStyle: RarityStyle,
) {
  const fill = ctx.createLinearGradient(x, y, x, y + height);
  fill.addColorStop(0, "rgba(255, 255, 255, 0.075)");
  fill.addColorStop(1, "rgba(255, 255, 255, 0.02)");
  roundRect(ctx, x, y, width, height, 10);
  ctx.fillStyle = fill;
  ctx.fill();

  ctx.lineWidth = 1.6;
  ctx.strokeStyle = rarityStyle.rainbow
    ? createRainbowGradient(ctx, x, y, x + width, y + height)
    : rarityStyle.metal;
  ctx.stroke();

  drawPanelCorners(ctx, x + 8, y + 8, width - 16, height - 16, rarityStyle);

  ctx.font = `800 24px ${FONT_STACK}`;
  ctx.fillStyle = rarityStyle.metal;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + width / 2, y + 35);

  drawSmallShield(ctx, x + width / 2, y + 96, 42, color, rarityStyle);
  drawOutlinedText(ctx, String(value), x + width / 2, y + 102, 50, "#ffffff", "#25160c", 6);
}

function drawWindowSections(
  ctx: CanvasRenderingContext2D,
  draft: CardDraft,
  x: number,
  y: number,
  width: number,
  height: number,
  rarityStyle: RarityStyle,
) {
  if (width <= 0 || height <= 0) {
    return;
  }

  const sections = [
    draft.showEffectText
      ? {
          title: "カード効果",
          text: draft.text.trim(),
        }
      : null,
    draft.showFlavorText
      ? {
          title: "フレーバーテキスト",
          text: draft.flavorText.trim(),
        }
      : null,
  ].filter((section): section is { title: string; text: string } => Boolean(section));

  if (sections.length === 0) {
    return;
  }

  const compact = sections.length > 1;
  const gap = compact ? 28 : 0;
  const sectionHeight = (height - gap * (sections.length - 1)) / sections.length;
  if (sectionHeight <= 0) {
    return;
  }

  sections.forEach((section, index) => {
    drawTextSection(
      ctx,
      section.title,
      section.text,
      x,
      y + index * (sectionHeight + gap),
      width,
      sectionHeight,
      rarityStyle,
      compact,
    );
  });
}

function drawTextSection(
  ctx: CanvasRenderingContext2D,
  title: string,
  text: string,
  x: number,
  y: number,
  width: number,
  height: number,
  rarityStyle: RarityStyle,
  compact: boolean,
) {
  if (width <= 0 || height <= 0) {
    return;
  }

  // Title area is carved out from the TOP of the section's y-range.
  // The box starts below — so sections never overlap regardless of gap size.
  const titleH = compact ? 38 : 50;
  const titleFontSize = compact ? 17 : 23;
  const boxY = y + titleH;
  const boxH = height - titleH;

  // Content box below the title
  if (boxH > 0) {
    roundRect(ctx, x, boxY, width, boxH, 8);
    ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(222, 166, 68, 0.32)";
    ctx.stroke();
  }

  // Title label — italic serif, sits above the box inside the section's own y range
  ctx.font = `italic 700 ${titleFontSize}px ${SERIF_STACK}`;
  ctx.fillStyle = LORE_ACCENT;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(title, x + 8, y + titleH - 11);

  // Horizontal accent line from after the title text to the right edge
  const titleMidY = y + titleH - 11 - titleFontSize * 0.38;
  const lineStartX = x + 8 + ctx.measureText(title).width + 14;
  if (lineStartX < x + width) {
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.strokeStyle = LORE_ACCENT;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(lineStartX, titleMidY);
    ctx.lineTo(x + width, titleMidY);
    ctx.stroke();
    ctx.restore();
  }

  // Body text inside the content box
  if (boxH > 20) {
    drawWrappedBlock(ctx, text, x + 24, boxY + 20, width - 48, boxH - 38, {
      maxSize: compact ? 20 : 31,
      minSize: compact ? 12 : 18,
      color: "#fff5df",
      fontFamily: SERIF_STACK,
      fontStyle: "normal",
      fontWeight: "600",
      lineHeightRatio: compact ? 1.5 : 1.56,
    });
  }
}

function drawLargeCorner(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scaleX: number,
  scaleY: number,
  rarityStyle: RarityStyle,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scaleX, scaleY);
  ctx.strokeStyle = rarityStyle.rainbow
    ? createRainbowGradient(ctx, 0, 0, 95, 95)
    : rarityStyle.metal;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 95);
  ctx.quadraticCurveTo(20, 22, 95, 0);
  ctx.moveTo(0, 54);
  ctx.quadraticCurveTo(34, 44, 54, 0);
  ctx.moveTo(13, 82);
  ctx.bezierCurveTo(12, 42, 42, 12, 82, 13);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(21, 21, 13, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawPanelCorners(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  rarityStyle: RarityStyle,
) {
  const color = rarityStyle.rainbow
    ? createRainbowGradient(ctx, x, y, x + width, y + height)
    : rarityStyle.metal;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.4;
  drawCornerLine(ctx, x, y, 1, 1);
  drawCornerLine(ctx, x + width, y, -1, 1);
  drawCornerLine(ctx, x, y + height, 1, -1);
  drawCornerLine(ctx, x + width, y + height, -1, -1);
  ctx.restore();
}

function drawCornerLine(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scaleX: number,
  scaleY: number,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scaleX, scaleY);
  ctx.beginPath();
  ctx.moveTo(0, 30);
  ctx.lineTo(0, 0);
  ctx.lineTo(30, 0);
  ctx.moveTo(8, 22);
  ctx.quadraticCurveTo(13, 9, 28, 7);
  ctx.stroke();
  ctx.restore();
}

function drawCenterOrnament(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - 9);
  ctx.lineTo(x + 12, y);
  ctx.lineTo(x, y + 9);
  ctx.lineTo(x - 12, y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawSmallShield(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  rarityStyle: RarityStyle,
) {
  ctx.save();
  const outer = ctx.createLinearGradient(x - radius, y - radius, x + radius, y + radius);
  outer.addColorStop(0, rarityStyle.accentSoft);
  outer.addColorStop(0.35, rarityStyle.metal);
  outer.addColorStop(1, rarityStyle.accentDark);

  ctx.beginPath();
  ctx.moveTo(x, y - radius);
  ctx.lineTo(x + radius * 0.84, y - radius * 0.32);
  ctx.lineTo(x + radius * 0.64, y + radius * 0.64);
  ctx.lineTo(x, y + radius * 0.96);
  ctx.lineTo(x - radius * 0.64, y + radius * 0.64);
  ctx.lineTo(x - radius * 0.84, y - radius * 0.32);
  ctx.closePath();
  ctx.fillStyle = outer;
  ctx.fill();

  const inner = ctx.createLinearGradient(x - radius, y - radius, x + radius, y + radius);
  inner.addColorStop(0, "#ffffff");
  inner.addColorStop(0.24, adjustHex(color, 56));
  inner.addColorStop(0.72, color);
  inner.addColorStop(1, adjustHex(color, -82));
  ctx.beginPath();
  ctx.moveTo(x, y - radius + 9);
  ctx.lineTo(x + radius * 0.64, y - radius * 0.24);
  ctx.lineTo(x + radius * 0.48, y + radius * 0.46);
  ctx.lineTo(x, y + radius * 0.72);
  ctx.lineTo(x - radius * 0.48, y + radius * 0.46);
  ctx.lineTo(x - radius * 0.64, y - radius * 0.24);
  ctx.closePath();
  ctx.fillStyle = inner;
  ctx.fill();
  ctx.restore();
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

function drawCenteredFittedText(
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

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(text, x + maxWidth / 2, y);
}

type WrappedBlockOptions = {
  maxSize: number;
  minSize: number;
  color: string;
  fontFamily: string;
  fontStyle: "normal" | "italic";
  fontWeight: string;
  lineHeightRatio: number;
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
  let lineHeight = fontSize * options.lineHeightRatio;

  for (fontSize = options.maxSize; fontSize >= options.minSize; fontSize -= 1) {
    ctx.font = `${options.fontStyle} ${options.fontWeight} ${fontSize}px ${options.fontFamily}`;
    lineHeight = Math.floor(fontSize * options.lineHeightRatio);
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
  const visible = lines.slice(0, maxLines);
  if (lines.length > maxLines) {
    visible[visible.length - 1] = trimToWidth(
      ctx,
      `${visible[visible.length - 1] ?? ""}...`,
      width,
    );
  }

  visible.forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight);
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) {
  const lines: string[] = [];
  text.split(/\n/).forEach((paragraph) => {
    if (!paragraph.trim()) {
      lines.push("");
      return;
    }

    let current = "";
    for (const char of paragraph) {
      const next = current + char;
      if (ctx.measureText(next).width <= maxWidth || !current) {
        current = next;
      } else {
        lines.push(current);
        current = char;
      }
    }
    if (current) {
      lines.push(current);
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
  ctx.font = `900 ${size}px ${FONT_STACK}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.strokeStyle = stroke;
  ctx.lineWidth = strokeWidth;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
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

function adjustHex(hex: string, amount: number) {
  const normalized = /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : "#777777";
  const red = clamp(parseInt(normalized.slice(1, 3), 16) + amount, 0, 255);
  const green = clamp(parseInt(normalized.slice(3, 5), 16) + amount, 0, 255);
  const blue = clamp(parseInt(normalized.slice(5, 7), 16) + amount, 0, 255);

  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function toHex(value: number) {
  return value.toString(16).padStart(2, "0");
}

function isImageReady(image: HTMLImageElement | undefined): image is HTMLImageElement {
  return Boolean(image?.complete && image.naturalWidth > 0);
}
