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
  FolderOpen,
  ImagePlus,
  Palette,
  Save,
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

const typeOptions: Array<{ value: CardType; label: string }> = [
  { value: "monster", label: "ユニット" },
  { value: "spell", label: "スペル" },
  { value: "field", label: "フィールド" },
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

const CARD_ARTWORK_WIDTH = 572;
const CARD_ARTWORK_HEIGHT = 792;
const SAVED_CARDS_STORAGE_KEY = "dcgmaker.savedCards.v1";

const typeLabels: Record<CardType, string> = {
  monster: "ユニット",
  spell: "スペル",
  field: "フィールド",
};

const nationOptions = [
  "ユニバーサル",
  "ハルシオン",
  "バルハザーク",
  "イカロスフィア",
] as const;

const customNationValue = "__custom";

const rarityAccentColors: Record<Rarity, { accent: string; soft: string; dark: string }> =
  {
    bronze: { accent: "#b77745", soft: "#f1c19a", dark: "#6f3d24" },
    silver: { accent: "#d4dbe5", soft: "#ffffff", dark: "#7e8897" },
    gold: { accent: "#f0b84f", soft: "#fff0bb", dark: "#8b561f" },
    legendary: { accent: "#f6f2ff", soft: "#fffdf3", dark: "#8d73df" },
  };

const assetPath = (path: string) => `${import.meta.env.BASE_URL}${path}`;

const generatedAssetPaths = {
  sceneBackground: assetPath("assets/generated/scene-background.png"),
  frames: {
    monster: {
      bronze: assetPath("assets/generated/frame-monster-bronze.png"),
      silver: assetPath("assets/generated/frame-monster-silver.png"),
      gold: assetPath("assets/generated/frame-monster-gold.png"),
      legendary: assetPath("assets/generated/frame-monster-legendary.png"),
    },
    spell: {
      bronze: assetPath("assets/generated/frame-spell-bronze.png"),
      silver: assetPath("assets/generated/frame-spell-silver.png"),
      gold: assetPath("assets/generated/frame-spell-gold.png"),
      legendary: assetPath("assets/generated/frame-spell-legendary.png"),
    },
    field: {
      bronze: assetPath("assets/generated/frame-field-bronze.png"),
      silver: assetPath("assets/generated/frame-field-silver.png"),
      gold: assetPath("assets/generated/frame-field-gold.png"),
      legendary: assetPath("assets/generated/frame-field-legendary.png"),
    },
  },
  status: {
    mana: assetPath("assets/generated/status-mana.png"),
    attack: assetPath("assets/generated/status-attack.png"),
    hp: assetPath("assets/generated/status-hp.png"),
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
  nation: "ユニバーサル",
  className: "",
};

type SavedCardEntry = {
  id: string;
  name: string;
  type: CardType;
  rarity: Rarity;
  updatedAt: number;
  draft: CardDraft;
};

export default function App() {
  const [draft, setDraft] = useState<CardDraft>(defaultDraft);
  const [exportMode, setExportMode] = useState<ExportMode>("flavor");
  const [editorWidth, setEditorWidth] = useState(360);
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [savedCards, setSavedCards] = useState<SavedCardEntry[]>(
    loadSavedCardsFromBrowser,
  );
  const [selectedSavedCardId, setSelectedSavedCardId] = useState("");
  const [libraryStatus, setLibraryStatus] = useState("");
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
    const centerX = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const centerY = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    if (!artworkImage) {
      setDraft((current) => ({
        ...current,
        artworkOffsetX: centerX,
        artworkOffsetY: centerY,
      }));
      return;
    }

    const offset = getArtworkOffsetFromCenter(
      artworkImage,
      centerX,
      centerY,
      draft.artworkScale ?? 1,
    );
    setDraft((current) => ({
      ...current,
      artworkOffsetX: offset.x,
      artworkOffsetY: offset.y,
    }));
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
        setDraft(normalizeCardDraft(parsed));
        setSelectedSavedCardId("");
        setLibraryStatus("読み込みました");
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

  const persistSavedCards = (entries: SavedCardEntry[]) => {
    writeSavedCardsToBrowser(entries);
    setSavedCards(entries);
  };

  const saveDraftToBrowser = () => {
    const existingEntry = savedCards.find(
      (entry) => entry.id === selectedSavedCardId,
    );
    const entryId = existingEntry?.id ?? createSavedCardId();
    const entry = createSavedCardEntry(entryId, draft);
    const nextCards = existingEntry
      ? [entry, ...savedCards.filter((card) => card.id !== entryId)]
      : [entry, ...savedCards];

    try {
      persistSavedCards(nextCards);
      setSelectedSavedCardId(entryId);
      setLibraryStatus("保存しました");
    } catch (error) {
      console.error("Failed to save card data in browser", error);
      window.alert("ブラウザへの保存に失敗しました。保存容量を確認してください。");
    }
  };

  const loadSelectedSavedCard = () => {
    const selectedEntry = savedCards.find(
      (entry) => entry.id === selectedSavedCardId,
    );
    if (!selectedEntry) {
      return;
    }

    setDraft(normalizeCardDraft(selectedEntry.draft));
    setLibraryStatus("読み込みました");
  };

  const deleteSelectedSavedCard = () => {
    const selectedEntry = savedCards.find(
      (entry) => entry.id === selectedSavedCardId,
    );
    if (!selectedEntry) {
      return;
    }

    const confirmed = window.confirm(`${selectedEntry.name}を削除しますか？`);
    if (!confirmed) {
      return;
    }

    const nextCards = savedCards.filter((entry) => entry.id !== selectedEntry.id);
    try {
      persistSavedCards(nextCards);
      setSelectedSavedCardId("");
      setLibraryStatus("削除しました");
    } catch (error) {
      console.error("Failed to delete saved card data", error);
      window.alert("保存カードの削除に失敗しました。もう一度お試しください。");
    }
  };

  const downloadPng = async () => {
    if (isExportingImage) {
      return;
    }

    setIsExportingImage(true);
    const exportCanvas = document.createElement("canvas");
    renderCanvas(exportCanvas, draft, artworkImage, exportMode, renderAssets);

    const fileName = `${createFileName(draft.name)}${
      exportMode === "flavor" ? "-all" : ""
    }.png`;

    try {
      const blob = await canvasToPngBlob(exportCanvas);
      const file = new File([blob], fileName, { type: "image/png" });
      const shareData: ShareDataWithFiles = { files: [file], title: fileName };
      const navigatorWithShare = window.navigator as NavigatorWithFileShare;

      if (
        isMobileDevice() &&
        typeof navigatorWithShare.share === "function" &&
        canShareFile(navigatorWithShare, shareData)
      ) {
        try {
          await navigatorWithShare.share?.(shareData);
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }
          console.error("Failed to share PNG image", error);
        }
      }

      if (isMobileDevice() && openBlobInNewTab(blob)) {
        window.alert("画像を新しいタブで開きました。共有メニューまたは長押しで保存してください。");
        return;
      }

      downloadBlob(blob, fileName);
    } catch (error) {
      console.error("Failed to export PNG image", error);
      window.alert("PNG画像の書き出しに失敗しました。もう一度お試しください。");
    } finally {
      setIsExportingImage(false);
    }
  };

  const exportSizeLabel =
    exportMode === "flavor"
      ? `${FLAVOR_EXPORT_WIDTH} x ${FLAVOR_EXPORT_HEIGHT}`
      : `${CARD_WIDTH} x ${CARD_HEIGHT}`;
  const workspaceStyle = {
    "--editor-width": `${editorWidth}px`,
  } as CSSProperties;
  const selectedNation = nationOptions.includes(
    draft.nation as (typeof nationOptions)[number],
  )
    ? draft.nation
    : customNationValue;

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

  const updateArtworkScale = (scale: number) => {
    setDraft((current) => {
      if (!artworkImage) {
        return { ...current, artworkScale: scale };
      }

      const center = getArtworkCenterFromOffset(
        artworkImage,
        current.artworkOffsetX ?? 0.5,
        current.artworkOffsetY ?? 0.5,
        current.artworkScale ?? 1,
      );
      const offset = getArtworkOffsetFromCenter(
        artworkImage,
        center.x,
        center.y,
        scale,
      );

      return {
        ...current,
        artworkScale: scale,
        artworkOffsetX: offset.x,
        artworkOffsetY: offset.y,
      };
    });
  };

  const artworkCenter = artworkImage
    ? getArtworkCenterFromOffset(
        artworkImage,
        draft.artworkOffsetX ?? 0.5,
        draft.artworkOffsetY ?? 0.5,
        draft.artworkScale ?? 1,
      )
    : { x: draft.artworkOffsetX ?? 0.5, y: draft.artworkOffsetY ?? 0.5 };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">DCGmaker</p>
          <h1>カード画像生成</h1>
        </div>
        <div className="export-actions">
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
          <button
            className="primary-action"
            disabled={isExportingImage}
            type="button"
            onClick={downloadPng}
          >
            <Download aria-hidden="true" size={20} />
            {isExportingImage ? "書き出し中" : "PNG書き出し"}
          </button>
        </div>
      </header>

      <div className="workspace" style={workspaceStyle}>
        <section className="editor-panel" aria-label="カード編集">
          <div className="section-heading">
            <Palette aria-hidden="true" size={20} />
            <h2>編集</h2>
          </div>

          <div className="library-panel">
            <label htmlFor="saved-card-select">保存カード</label>
            <select
              id="saved-card-select"
              value={selectedSavedCardId}
              onChange={(event) => {
                setSelectedSavedCardId(event.target.value);
                setLibraryStatus("");
              }}
            >
              <option value="">新しく保存</option>
              {savedCards.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {formatSavedCardOption(entry)}
                </option>
              ))}
            </select>
            <div className="library-actions">
              <button type="button" onClick={saveDraftToBrowser}>
                <Save aria-hidden="true" size={17} />
                保存
              </button>
              <button
                type="button"
                disabled={!selectedSavedCardId}
                onClick={loadSelectedSavedCard}
              >
                <FolderOpen aria-hidden="true" size={17} />
                読み込み
              </button>
              <button
                className="library-delete-button"
                type="button"
                disabled={!selectedSavedCardId}
                onClick={deleteSelectedSavedCard}
              >
                <Trash2 aria-hidden="true" size={17} />
                削除
              </button>
            </div>
            <p className="library-status" aria-live="polite">
              {libraryStatus}
            </p>
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
              {typeOptions.map((option) => (
                <button
                  className={draft.type === option.value ? "is-selected" : ""}
                  key={option.value}
                  type="button"
                  onClick={() => updateDraft("type", option.value)}
                >
                  {option.label}
                </button>
              ))}
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
            <label htmlFor="card-nation">国家</label>
            <select
              id="card-nation"
              value={selectedNation}
              onChange={(event) => {
                const value = event.target.value;
                updateDraft(
                  "nation",
                  value === customNationValue ? "" : value,
                );
              }}
            >
              {nationOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
              <option value={customNationValue}>任意入力</option>
            </select>
          </div>

          {selectedNation === customNationValue ? (
            <div className="control-group">
              <label htmlFor="card-nation-custom">国家名</label>
              <input
                id="card-nation-custom"
                value={draft.nation}
                onChange={(event) => updateDraft("nation", event.target.value)}
                placeholder="国家名"
              />
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
            <button type="button" disabled={isExportingImage} onClick={downloadPng}>
              <Upload aria-hidden="true" size={19} />
              {isExportingImage ? "保存中" : "保存"}
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
                    left: `${artworkCenter.x * 100}%`,
                    top: `${artworkCenter.y * 100}%`,
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
                    updateArtworkScale(Number.parseFloat(event.target.value))
                  }
                />
                <span className="artwork-zoom-value">
                  {(draft.artworkScale ?? 1).toFixed(2)}x
                </span>
              </label>
            </div>
          ) : null}

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
                    <div>
                      <dt>国家</dt>
                      <dd>{draft.nation.trim() || "ユニバーサル"}</dd>
                    </div>
                    {draft.showClassName ? (
                      <div>
                        <dt>分類</dt>
                        <dd>{draft.className.trim() || "未設定"}</dd>
                      </div>
                    ) : null}
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

function loadSavedCardsFromBrowser() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(SAVED_CARDS_STORAGE_KEY);
    if (!rawValue) {
      return [];
    }

    const parsed: unknown = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map(normalizeSavedCardEntry)
      .filter((entry): entry is SavedCardEntry => entry !== null)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (error) {
    console.error("Failed to load saved cards from browser", error);
    return [];
  }
}

function writeSavedCardsToBrowser(entries: SavedCardEntry[]) {
  window.localStorage.setItem(SAVED_CARDS_STORAGE_KEY, JSON.stringify(entries));
}

function normalizeSavedCardEntry(value: unknown): SavedCardEntry | null {
  if (!isObjectRecord(value) || typeof value.id !== "string") {
    return null;
  }

  const draft = normalizeCardDraft(value.draft);
  const updatedAt = toFiniteNumber(value.updatedAt, Date.now());
  return {
    id: value.id,
    name: typeof value.name === "string" ? value.name : getDraftDisplayName(draft),
    type: isCardType(value.type) ? value.type : draft.type,
    rarity: isRarity(value.rarity) ? value.rarity : draft.rarity,
    updatedAt,
    draft,
  };
}

function normalizeCardDraft(value: unknown): CardDraft {
  const source = isObjectRecord(value) ? value : {};
  const artworkDataUrl =
    typeof source.artworkDataUrl === "string" ? source.artworkDataUrl : undefined;
  const artworkOffsetX = toOptionalFiniteNumber(source.artworkOffsetX);
  const artworkOffsetY = toOptionalFiniteNumber(source.artworkOffsetY);
  const artworkScale = toOptionalFiniteNumber(source.artworkScale);

  return {
    name: toStringValue(source.name, defaultDraft.name),
    type: isCardType(source.type) ? source.type : defaultDraft.type,
    cost: Math.max(0, Math.round(toFiniteNumber(source.cost, defaultDraft.cost))),
    attack: Math.max(
      0,
      Math.round(toFiniteNumber(source.attack, defaultDraft.attack)),
    ),
    hp: Math.max(0, Math.round(toFiniteNumber(source.hp, defaultDraft.hp))),
    text: toStringValue(source.text, defaultDraft.text),
    flavorText: toStringValue(source.flavorText, defaultDraft.flavorText),
    showClassName: toBooleanValue(source.showClassName, defaultDraft.showClassName),
    showEffectText: toBooleanValue(source.showEffectText, defaultDraft.showEffectText),
    showFlavorText: toBooleanValue(source.showFlavorText, defaultDraft.showFlavorText),
    rarity: isRarity(source.rarity) ? source.rarity : defaultDraft.rarity,
    nation: toStringValue(source.nation, defaultDraft.nation),
    className: toStringValue(source.className, defaultDraft.className),
    ...(artworkDataUrl ? { artworkDataUrl } : {}),
    ...(artworkOffsetX === undefined ? {} : { artworkOffsetX: clamp(artworkOffsetX, 0, 1) }),
    ...(artworkOffsetY === undefined ? {} : { artworkOffsetY: clamp(artworkOffsetY, 0, 1) }),
    ...(artworkScale === undefined ? {} : { artworkScale: Math.max(0.1, artworkScale) }),
  };
}

function createSavedCardEntry(id: string, draft: CardDraft): SavedCardEntry {
  const normalizedDraft = normalizeCardDraft(draft);
  return {
    id,
    name: getDraftDisplayName(normalizedDraft),
    type: normalizedDraft.type,
    rarity: normalizedDraft.rarity,
    updatedAt: Date.now(),
    draft: normalizedDraft,
  };
}

function createSavedCardId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `card-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatSavedCardOption(entry: SavedCardEntry) {
  const updatedAt = new Date(entry.updatedAt);
  const timestamp = Number.isNaN(updatedAt.getTime())
    ? ""
    : updatedAt.toLocaleString("ja-JP", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });

  return `${entry.name} / ${typeLabels[entry.type]}${timestamp ? ` / ${timestamp}` : ""}`;
}

function getDraftDisplayName(draft: CardDraft) {
  return draft.name.trim() || "無題のカード";
}

function isCardType(value: unknown): value is CardType {
  return value === "monster" || value === "spell" || value === "field";
}

function isRarity(value: unknown): value is Rarity {
  return (
    value === "bronze" ||
    value === "silver" ||
    value === "gold" ||
    value === "legendary"
  );
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toStringValue(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

function toBooleanValue(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function toFiniteNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function toOptionalFiniteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

type ShareDataWithFiles = ShareData & {
  files: File[];
};

type NavigatorWithFileShare = Navigator & {
  canShare?: (data: ShareDataWithFiles) => boolean;
  share?: (data: ShareDataWithFiles) => Promise<void>;
};

function canvasToPngBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    if (canvas.toBlob) {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
          return;
        }
        reject(new Error("Canvas returned an empty PNG blob."));
      }, "image/png");
      return;
    }

    try {
      resolve(dataUrlToBlob(canvas.toDataURL("image/png")));
    } catch (error) {
      reject(error instanceof Error ? error : new Error("Failed to export canvas."));
    }
  });
}

function dataUrlToBlob(dataUrl: string) {
  const [metadata, payload] = dataUrl.split(",");
  if (!metadata || !payload) {
    throw new Error("Invalid image data URL.");
  }

  const mimeMatch = metadata.match(/^data:([^;]+);base64$/);
  const mime = mimeMatch?.[1] ?? "application/octet-stream";
  const binary = window.atob(payload);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mime });
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

function openBlobInNewTab(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (!opened) {
    URL.revokeObjectURL(url);
    return false;
  }

  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return true;
}

function canShareFile(
  navigatorWithShare: NavigatorWithFileShare,
  shareData: ShareDataWithFiles,
) {
  if (typeof navigatorWithShare.canShare !== "function") {
    return true;
  }

  try {
    return navigatorWithShare.canShare(shareData);
  } catch {
    return false;
  }
}

function isMobileDevice() {
  return (
    /Android|iPhone|iPad|iPod|Mobile/i.test(window.navigator.userAgent) ||
    (window.navigator.userAgent.includes("Macintosh") &&
      window.navigator.maxTouchPoints > 1)
  );
}

function getArtworkCenterFromOffset(
  image: HTMLImageElement,
  offsetX: number,
  offsetY: number,
  scale: number,
) {
  const geometry = getArtworkCoverGeometry(image, scale);
  return {
    x: clamp(
      (CARD_ARTWORK_WIDTH / 2 - geometry.slackX * offsetX) / geometry.drawWidth,
      0,
      1,
    ),
    y: clamp(
      (CARD_ARTWORK_HEIGHT / 2 - geometry.slackY * offsetY) / geometry.drawHeight,
      0,
      1,
    ),
  };
}

function getArtworkOffsetFromCenter(
  image: HTMLImageElement,
  centerX: number,
  centerY: number,
  scale: number,
) {
  const geometry = getArtworkCoverGeometry(image, scale);
  return {
    x: solveOffset(CARD_ARTWORK_WIDTH, geometry.drawWidth, geometry.slackX, centerX),
    y: solveOffset(CARD_ARTWORK_HEIGHT, geometry.drawHeight, geometry.slackY, centerY),
  };
}

function getArtworkCoverGeometry(image: HTMLImageElement, scale: number) {
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const targetRatio = CARD_ARTWORK_WIDTH / CARD_ARTWORK_HEIGHT;
  let coverWidth = CARD_ARTWORK_WIDTH;
  let coverHeight = CARD_ARTWORK_HEIGHT;

  if (imageRatio > targetRatio) {
    coverHeight = CARD_ARTWORK_HEIGHT;
    coverWidth = CARD_ARTWORK_HEIGHT * imageRatio;
  } else {
    coverWidth = CARD_ARTWORK_WIDTH;
    coverHeight = CARD_ARTWORK_WIDTH / imageRatio;
  }

  const safeScale = Math.max(0.1, scale);
  const drawWidth = coverWidth * safeScale;
  const drawHeight = coverHeight * safeScale;

  return {
    drawWidth,
    drawHeight,
    slackX: CARD_ARTWORK_WIDTH - drawWidth,
    slackY: CARD_ARTWORK_HEIGHT - drawHeight,
  };
}

function solveOffset(
  targetSize: number,
  drawSize: number,
  slack: number,
  center: number,
) {
  if (Math.abs(slack) < 0.0001) {
    return 0.5;
  }

  return clamp((targetSize / 2 - center * drawSize) / slack, 0, 1);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function createFileName(name: string) {
  const sanitized = name
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "");

  return sanitized || "dcg-card";
}
