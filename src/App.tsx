import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Download,
  FileDown,
  FileUp,
  ImagePlus,
  Landmark,
  Palette,
  Trash2,
  Upload,
} from "lucide-react";
import { CARD_HEIGHT, CARD_WIDTH } from "./cardRenderer";
import {
  FLAVOR_EXPORT_HEIGHT,
  FLAVOR_EXPORT_WIDTH,
  type ExportMode,
  drawExportImage,
} from "./exportRenderer";
import type { CardDraft, CardType, Rarity, RenderAssets } from "./types";

const typeOptions: Array<{
  value: CardType;
  label: string;
  icon?: typeof Landmark;
}> = [
  { value: "monster", label: "ユニット" },
  { value: "spell", label: "スペル" },
  { value: "field", label: "フィールド", icon: Landmark },
];

const rarityOptions: Array<{ value: Rarity; label: string }> = [
  { value: "bronze", label: "ブロンズ" },
  { value: "silver", label: "シルバー" },
  { value: "gold", label: "ゴールド" },
  { value: "legendary", label: "レジェンド" },
];

const exportModeOptions: Array<{ value: ExportMode; label: string }> = [
  { value: "card", label: "カードのみ" },
  { value: "flavor", label: "全体" },
];

const typeLabels: Record<CardType, string> = {
  monster: "ユニット",
  spell: "スペル",
  field: "フィールド",
};

const rarityLabels: Record<Rarity, string> = {
  bronze: "ブロンズ",
  silver: "シルバー",
  gold: "ゴールド",
  legendary: "レジェンド",
};

const rarityAccentColors: Record<Rarity, { accent: string; soft: string; dark: string }> =
  {
    bronze: { accent: "#b77745", soft: "#f1c19a", dark: "#6f3d24" },
    silver: { accent: "#d4dbe5", soft: "#ffffff", dark: "#7e8897" },
    gold: { accent: "#f0b84f", soft: "#fff0bb", dark: "#8b561f" },
    legendary: { accent: "#f6f2ff", soft: "#fffdf3", dark: "#8d73df" },
  };

const generatedAssetPaths = {
  sceneBackground: "/assets/generated/scene-background.png",
  frames: {
    monster: {
      bronze: "/assets/generated/frame-monster-bronze.png",
      silver: "/assets/generated/frame-monster-silver.png",
      gold: "/assets/generated/frame-monster-gold.png",
      legendary: "/assets/generated/frame-monster-legendary.png",
    },
    spell: {
      bronze: "/assets/generated/frame-spell-bronze.png",
      silver: "/assets/generated/frame-spell-silver.png",
      gold: "/assets/generated/frame-spell-gold.png",
      legendary: "/assets/generated/frame-spell-legendary.png",
    },
    field: {
      bronze: "/assets/generated/frame-field-bronze.png",
      silver: "/assets/generated/frame-field-silver.png",
      gold: "/assets/generated/frame-field-gold.png",
      legendary: "/assets/generated/frame-field-legendary.png",
    },
  },
  status: {
    mana: "/assets/generated/status-mana.png",
    attack: "/assets/generated/status-attack.png",
    hp: "/assets/generated/status-hp.png",
  },
} satisfies {
  sceneBackground: string;
  frames: Record<CardType, Record<Rarity, string>>;
  status: Record<"mana" | "attack" | "hp", string>;
};

const defaultDraft: CardDraft = {
  name: "",
  type: "monster",
  cost: 0,
  attack: 0,
  hp: 0,
  text: "",
  flavorText: "",
  showClassName: true,
  showEffectText: true,
  showFlavorText: true,
  rarity: "silver",
  className: "",
};

export default function App() {
  const [draft, setDraft] = useState<CardDraft>(defaultDraft);
  const [exportMode, setExportMode] = useState<ExportMode>("flavor");
  const [editorWidth, setEditorWidth] = useState(360);
  const [artworkImage, setArtworkImage] = useState<HTMLImageElement | null>(null);
  const [artworkPreviewUrl, setArtworkPreviewUrl] = useState<string | null>(null);
  const [renderAssets, setRenderAssets] = useState<RenderAssets>({});
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dataFileInputRef = useRef<HTMLInputElement | null>(null);
  const artworkPickerRef = useRef<HTMLDivElement | null>(null);

  const rarityAccent = rarityAccentColors[draft.rarity];
  const frameAccentStyle = {
    "--rarity-color": rarityAccent.accent,
    "--rarity-soft": rarityAccent.soft,
    "--rarity-dark": rarityAccent.dark,
  } as CSSProperties;

  useEffect(() => {
    let cancelled = false;

    const loadAssets = async () => {
      await document.fonts.ready;

      const frameEntries = (
        Object.entries(generatedAssetPaths.frames) as Array<
          [CardType, Record<Rarity, string>]
        >
      ).flatMap(([type, rarityPaths]) =>
        (Object.entries(rarityPaths) as Array<[Rarity, string]>).map(
          ([rarity, src]) => ({ type, rarity, src }),
        ),
      );

      const [
        sceneBackground,
        manaStatus,
        attackStatus,
        hpStatus,
        ...frameImages
      ] = await Promise.all([
        loadImage(generatedAssetPaths.sceneBackground),
        loadImage(generatedAssetPaths.status.mana),
        loadImage(generatedAssetPaths.status.attack),
        loadImage(generatedAssetPaths.status.hp),
        ...frameEntries.map((entry) => loadImage(entry.src)),
      ]);

      if (cancelled) {
        return;
      }

      const frames = frameEntries.reduce<NonNullable<RenderAssets["frames"]>>(
        (current, entry, index) => ({
          ...current,
          [entry.type]: {
            ...(current[entry.type] ?? {}),
            [entry.rarity]: frameImages[index],
          },
        }),
        {},
      );

      setRenderAssets({
        sceneBackground,
        frames,
        status: {
          mana: manaStatus,
          attack: attackStatus,
          hp: hpStatus,
        },
      });
    };

    void loadAssets();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!draft.artworkDataUrl) {
      setArtworkImage(null);
      setArtworkPreviewUrl(null);
      return;
    }

    const image = new Image();
    image.onload = () => {
      setArtworkImage(image);
      setArtworkPreviewUrl(createRoughPreview(image));
    };
    image.src = draft.artworkDataUrl;
  }, [draft.artworkDataUrl]);

  useEffect(() => {
    if (canvasRef.current) {
      renderCanvas(canvasRef.current, draft, artworkImage, exportMode, renderAssets);
    }
  }, [artworkImage, draft, exportMode, renderAssets]);

  const updateDraft = <Key extends keyof CardDraft>(
    key: Key,
    value: CardDraft[Key],
  ) => {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const updateNumber = (
    key: "cost" | "attack" | "hp",
    rawValue: string,
    minimum: number,
  ) => {
    const parsed = Number.parseInt(rawValue, 10);
    updateDraft(key, Number.isFinite(parsed) ? Math.max(minimum, parsed) : minimum);
  };

  const handleArtworkUpload = (file: File | undefined) => {
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setDraft((current) => ({
          ...current,
          artworkDataUrl: reader.result as string,
          artworkOffsetX: 0.5,
          artworkOffsetY: 0.5,
          artworkScale: 1,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleArtworkRemove = () => {
    setDraft((current) => ({
      ...current,
      artworkDataUrl: undefined,
      artworkOffsetX: undefined,
      artworkOffsetY: undefined,
      artworkScale: undefined,
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const updateArtworkOffsetFromPoint = (clientX: number, clientY: number) => {
    const el = artworkPickerRef.current;
    if (!el) {
      return;
    }

    const rect = el.getBoundingClientRect();
    const offsetX = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const offsetY = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    setDraft((current) => ({ ...current, artworkOffsetX: offsetX, artworkOffsetY: offsetY }));
  };

  const startArtworkOffsetDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    updateArtworkOffsetFromPoint(event.clientX, event.clientY);

    const handleMove = (moveEvent: PointerEvent) => {
      updateArtworkOffsetFromPoint(moveEvent.clientX, moveEvent.clientY);
    };

    const stopDrag = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", stopDrag);
      window.removeEventListener("pointercancel", stopDrag);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", stopDrag);
    window.addEventListener("pointercancel", stopDrag);
  };

  const downloadDraftJson = () => {
    const payload = JSON.stringify(draft, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${createFileName(draft.name)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDraftImport = (file: File | undefined) => {
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        return;
      }

      try {
        const parsed: unknown = JSON.parse(reader.result);
        if (typeof parsed !== "object" || parsed === null) {
          throw new Error("invalid card data");
        }
        setDraft({ ...defaultDraft, ...(parsed as Partial<CardDraft>) });
      } catch (error) {
        console.error("Failed to import card data", error);
        window.alert("データの読み込みに失敗しました。ファイル形式を確認してください。");
      }
    };
    reader.readAsText(file);

    if (dataFileInputRef.current) {
      dataFileInputRef.current.value = "";
    }
  };

  const downloadPng = () => {
    const exportCanvas = document.createElement("canvas");
    renderCanvas(exportCanvas, draft, artworkImage, exportMode, renderAssets);

    const link = document.createElement("a");
    link.href = exportCanvas.toDataURL("image/png");
    link.download = `${createFileName(draft.name)}${
      exportMode === "flavor" ? "-all" : ""
    }.png`;
    link.click();
  };

  const exportSizeLabel =
    exportMode === "flavor"
      ? `${FLAVOR_EXPORT_WIDTH} x ${FLAVOR_EXPORT_HEIGHT}`
      : `${CARD_WIDTH} x ${CARD_HEIGHT}`;
  const workspaceStyle = {
    "--editor-width": `${editorWidth}px`,
  } as CSSProperties;

  const startEditorResize = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();

    const startX = event.clientX;
    const startWidth = editorWidth;
    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const handleMove = (moveEvent: PointerEvent) => {
      const nextWidth = startWidth + moveEvent.clientX - startX;
      setEditorWidth(Math.min(520, Math.max(260, nextWidth)));
    };

    const stopResize = () => {
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", stopResize);
      window.removeEventListener("pointercancel", stopResize);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", stopResize);
    window.addEventListener("pointercancel", stopResize);
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">DCGmaker</p>
          <h1>カード画像生成</h1>
        </div>
        <div className="export-actions">
          <label className="topbar-select" htmlFor="topbar-export-mode">
            <span>画像出力</span>
            <select
              id="topbar-export-mode"
              value={exportMode}
              onChange={(event) => setExportMode(event.target.value as ExportMode)}
            >
              {exportModeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <input
            accept="application/json"
            className="file-input"
            ref={dataFileInputRef}
            type="file"
            onChange={(event) => handleDraftImport(event.target.files?.[0])}
          />
          <button
            className="secondary-action"
            type="button"
            onClick={() => dataFileInputRef.current?.click()}
          >
            <FileUp aria-hidden="true" size={18} />
            データ読み込み
          </button>
          <button className="secondary-action" type="button" onClick={downloadDraftJson}>
            <FileDown aria-hidden="true" size={18} />
            データ書き出し
          </button>
          <button className="primary-action" type="button" onClick={downloadPng}>
            <Download aria-hidden="true" size={20} />
            PNG書き出し
          </button>
        </div>
      </header>

      <div className="workspace" style={workspaceStyle}>
        <section className="editor-panel" aria-label="カード編集">
          <div className="section-heading">
            <Palette aria-hidden="true" size={20} />
            <h2>編集</h2>
          </div>

          <div className="control-group">
            <label htmlFor="card-name">カード名</label>
            <input
              id="card-name"
              value={draft.name}
              onChange={(event) => updateDraft("name", event.target.value)}
              placeholder="カード名"
            />
          </div>

          <div className="control-group">
            <span className="field-label">カード種類</span>
            <div className="segmented-control" role="group" aria-label="カード種類">
              {typeOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    className={draft.type === option.value ? "is-selected" : ""}
                    key={option.value}
                    type="button"
                    onClick={() => updateDraft("type", option.value)}
                  >
                    {Icon ? <Icon aria-hidden="true" size={18} /> : null}
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="control-grid">
            <div className="control-group">
              <label htmlFor="card-cost">マナ</label>
              <input
                id="card-cost"
                min={0}
                type="number"
                value={draft.cost}
                onChange={(event) => updateNumber("cost", event.target.value, 0)}
              />
            </div>

            <div className="control-group">
              <label htmlFor="card-rarity">レアリティ</label>
              <select
                id="card-rarity"
                value={draft.rarity}
                onChange={(event) => updateDraft("rarity", event.target.value as Rarity)}
              >
                {rarityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="control-group">
            <label htmlFor="export-mode">画像出力</label>
            <select
              id="export-mode"
              value={exportMode}
              onChange={(event) => setExportMode(event.target.value as ExportMode)}
            >
              {exportModeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {draft.type === "monster" ? (
            <div className="control-grid">
              <div className="control-group">
                <label htmlFor="card-attack">攻撃</label>
                <input
                  id="card-attack"
                  min={0}
                  type="number"
                  value={draft.attack}
                  onChange={(event) => updateNumber("attack", event.target.value, 0)}
                />
              </div>

              <div className="control-group">
                <label htmlFor="card-hp">HP</label>
                <input
                  id="card-hp"
                  min={0}
                  type="number"
                  value={draft.hp}
                  onChange={(event) => updateNumber("hp", event.target.value, 0)}
                />
              </div>
            </div>
          ) : null}

          <div className="control-group">
            <label htmlFor="card-class">分類</label>
            <input
              id="card-class"
              value={draft.className}
              onChange={(event) => updateDraft("className", event.target.value)}
              placeholder="クラス、属性、勢力"
            />
          </div>

          <div className="control-group">
            <label htmlFor="card-text">効果本文</label>
            <textarea
              id="card-text"
              rows={5}
              value={draft.text}
              onChange={(event) => updateDraft("text", event.target.value)}
              placeholder="カード効果"
            />
          </div>

          <div className="toggle-row" role="group" aria-label="ウィンドウ表示">
            <label className="checkbox-control">
              <input
                checked={draft.showClassName}
                type="checkbox"
                onChange={(event) =>
                  updateDraft("showClassName", event.target.checked)
                }
              />
              分類を表示
            </label>
            <label className="checkbox-control">
              <input
                checked={draft.showEffectText}
                type="checkbox"
                onChange={(event) =>
                  updateDraft("showEffectText", event.target.checked)
                }
              />
              カード効果を表示
            </label>
            <label className="checkbox-control">
              <input
                checked={draft.showFlavorText}
                type="checkbox"
                onChange={(event) =>
                  updateDraft("showFlavorText", event.target.checked)
                }
              />
              フレーバーを表示
            </label>
          </div>

          <div className="control-group">
            <label htmlFor="card-flavor">フレーバーテキスト</label>
            <textarea
              id="card-flavor"
              rows={3}
              value={draft.flavorText}
              onChange={(event) => updateDraft("flavorText", event.target.value)}
              placeholder=""
            />
          </div>

          <div className="asset-actions">
            <input
              accept="image/*"
              className="file-input"
              ref={fileInputRef}
              type="file"
              onChange={(event) => handleArtworkUpload(event.target.files?.[0])}
            />
            <button type="button" onClick={() => fileInputRef.current?.click()}>
              <ImagePlus aria-hidden="true" size={19} />
              イラスト選択
            </button>
            <button type="button" onClick={downloadPng}>
              <Upload aria-hidden="true" size={19} />
              保存
            </button>
          </div>

          {draft.artworkDataUrl ? (
            <div className="control-group">
              <div className="artwork-position-header">
                <span className="field-label">イラストの表示位置</span>
                <button
                  className="artwork-remove-button"
                  type="button"
                  onClick={handleArtworkRemove}
                >
                  <Trash2 aria-hidden="true" size={15} />
                  画像を削除
                </button>
              </div>
              <div
                className="artwork-position-picker"
                ref={artworkPickerRef}
                onPointerDown={startArtworkOffsetDrag}
                style={
                  artworkImage
                    ? {
                        aspectRatio: `${artworkImage.naturalWidth} / ${artworkImage.naturalHeight}`,
                      }
                    : undefined
                }
              >
                <img
                  alt=""
                  draggable={false}
                  src={artworkPreviewUrl ?? draft.artworkDataUrl}
                />
                <div
                  className="artwork-position-marker"
                  style={{
                    left: `${(draft.artworkOffsetX ?? 0.5) * 100}%`,
                    top: `${(draft.artworkOffsetY ?? 0.5) * 100}%`,
                  }}
                />
              </div>
              <p className="artwork-position-hint">
                クリックまたはドラッグでカードに使う位置を選べます
              </p>

              <label className="artwork-zoom-row" htmlFor="artwork-zoom">
                <span>拡大</span>
                <input
                  id="artwork-zoom"
                  max={4}
                  min={0.4}
                  step={0.02}
                  type="range"
                  value={draft.artworkScale ?? 1}
                  onChange={(event) =>
                    updateDraft("artworkScale", Number.parseFloat(event.target.value))
                  }
                />
                <span className="artwork-zoom-value">
                  {(draft.artworkScale ?? 1).toFixed(2)}x
                </span>
              </label>
            </div>
          ) : null}
        </section>

        <button
          aria-label="編集エリアの幅を変更"
          className="pane-resizer"
          onPointerDown={startEditorResize}
          title="編集エリアの幅を変更"
          type="button"
        />

        <section className="preview-panel" aria-label="カードプレビュー">
          <div className="preview-heading">
            <div>
              <p className="eyebrow">Preview</p>
              <h2>{draft.name.trim()}</h2>
            </div>
            <div className="format-badge">
              {exportSizeLabel}
            </div>
          </div>

          <div className="preview-stage">
            <div className="preview-layout">
              <canvas
                aria-label="生成カードプレビュー"
                className={
                  exportMode === "flavor" ? "export-canvas" : "card-canvas"
                }
                height={
                  exportMode === "flavor" ? FLAVOR_EXPORT_HEIGHT : CARD_HEIGHT
                }
                ref={canvasRef}
                width={exportMode === "flavor" ? FLAVOR_EXPORT_WIDTH : CARD_WIDTH}
              />

              {exportMode === "card" ? (
                <aside
                  aria-label="カード詳細ウィンドウ"
                  className="flavor-window"
                  style={frameAccentStyle}
                >
                  <div className="flavor-window__header">
                    <div>
                      <h3>{draft.name.trim()}</h3>
                    </div>
                  </div>

                  <dl className="detail-list">
                    <div>
                      <dt>種類</dt>
                      <dd>{typeLabels[draft.type]}</dd>
                    </div>
                    {draft.showClassName ? (
                      <div>
                        <dt>分類</dt>
                        <dd>{draft.className.trim() || "未設定"}</dd>
                      </div>
                    ) : null}
                    <div>
                      <dt>レアリティ</dt>
                      <dd>{rarityLabels[draft.rarity]}</dd>
                    </div>
                  </dl>

                  {draft.showEffectText ? (
                    <div className="flavor-copy">
                      <span>カード効果</span>
                      <p>{draft.text}</p>
                    </div>
                  ) : null}

                  {draft.showFlavorText ? (
                    <div className="flavor-copy">
                      <span>フレーバーテキスト</span>
                      <p>{draft.flavorText}</p>
                    </div>
                  ) : null}

                </aside>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    image.src = src;
  });
}

function createRoughPreview(image: HTMLImageElement, maxSize = 360) {
  const ratio = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return image.src;
  }

  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.55);
}

function renderCanvas(
  canvas: HTMLCanvasElement,
  draft: CardDraft,
  artworkImage: HTMLImageElement | null,
  exportMode: ExportMode,
  renderAssets: RenderAssets,
) {
  try {
    drawExportImage(canvas, draft, artworkImage, exportMode, renderAssets);
  } catch (error) {
    console.error("Failed to render card image", error);
    canvas.width = exportMode === "flavor" ? FLAVOR_EXPORT_WIDTH : CARD_WIDTH;
    canvas.height = exportMode === "flavor" ? FLAVOR_EXPORT_HEIGHT : CARD_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    if (
      exportMode === "flavor" &&
      renderAssets.sceneBackground?.complete &&
      renderAssets.sceneBackground.naturalWidth > 0
    ) {
      ctx.drawImage(renderAssets.sceneBackground, 0, 0, canvas.width, canvas.height);
      return;
    }

    const fill = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    fill.addColorStop(0, exportMode === "flavor" ? "#06111d" : "#202631");
    fill.addColorStop(1, exportMode === "flavor" ? "#02050a" : "#111722");
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function createFileName(name: string) {
  const sanitized = name
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "");

  return sanitized || "dcg-card";
}
