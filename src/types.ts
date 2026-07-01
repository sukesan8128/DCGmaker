export type CardType = "monster" | "spell" | "field";

export type Rarity = "bronze" | "silver" | "gold" | "legendary";

export type CardDraft = {
  name: string;
  type: CardType;
  cost: number;
  attack: number;
  hp: number;
  text: string;
  flavorText: string;
  showClassName: boolean;
  showEffectText: boolean;
  showFlavorText: boolean;
  rarity: Rarity;
  nation: string;
  className: string;
  artworkDataUrl?: string;
  artworkOffsetX?: number;
  artworkOffsetY?: number;
  artworkScale?: number;
};

export type RenderAssets = {
  sceneBackground?: HTMLImageElement;
  frames?: Partial<Record<CardType, Partial<Record<Rarity, HTMLImageElement>>>>;
  status?: {
    mana?: HTMLImageElement;
    attack?: HTMLImageElement;
    hp?: HTMLImageElement;
  };
};
