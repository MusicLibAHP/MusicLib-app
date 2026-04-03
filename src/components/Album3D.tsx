// ============================================
// COMPOSANT — Album 3D
// ============================================
import { useEffect, useRef, useState } from "react";

const BASE_URL =
  "https://cdn.jsdelivr.net/gh/DjoAHP/cdn-ressources-albums@v1.1.64/images/";

interface Album3DProps {
  cdnPath: string;
  projectName: string;
  size?: string;
  albumOffset?: string;
  albumX?: string;
  albumY?: string;
}

interface LayerData {
  id: string;
  depth: number;
  imageUrl: string;
  shadows: ShadowData[];
}

interface ShadowData {
  imageUrl: string;
  blur: string;
}

async function resolveImageUrl(cdnPath: string, name: string): Promise<string> {
  const webpUrl = `${BASE_URL}${cdnPath}/${name}.webp`;
  const jpgUrl = `${BASE_URL}${cdnPath}/${name}.jpg`;
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(webpUrl);
    img.onerror = () => resolve(jpgUrl);
    img.src = webpUrl;
  });
}

export function Album3D({
  cdnPath,
  projectName,
  size = "55em",
  albumOffset = "2em",
  albumX = "0px",
  albumY = "0px",
}: Album3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [disabled, setDisabled] = useState(false);
  const [layers, setLayers] = useState<LayerData[]>([]);

  useEffect(() => {
    // Les deux layers définis dans l'original : background (depth 0) et 1plan (depth 10)
    const layerDefs = [
      { id: `${projectName}-background`, depth: 0 },
      { id: `${projectName}-1plan`, depth: 10 },
    ];

    async function buildLayers() {
      const resolved: LayerData[] = [];

      for (let i = 0; i < layerDefs.length; i++) {
        const layer = layerDefs[i];
        const imageUrl = await resolveImageUrl(cdnPath, layer.id);
        const shadows: ShadowData[] = [];

        // Pour chaque layer, créer des ombres depuis les layers derrière
        for (let j = i + 1; j < layerDefs.length; j++) {
          const backLayer = layerDefs[j];
          const shadowUrl = await resolveImageUrl(cdnPath, backLayer.id);
          shadows.push({
            imageUrl: shadowUrl,
            blur: `${(backLayer.depth - layer.depth) / 8}em`,
          });
        }

        resolved.push({ ...layer, imageUrl, shadows });
      }

      setLayers(resolved);
    }

    buildLayers();
  }, [cdnPath, projectName]);

  const handleClick = () => setDisabled((d) => !d);

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      style={
        {
          "--album-size": size,
          "--album-offset": albumOffset,
          "--album-x": albumX,
          "--album-y": albumY,
        } as React.CSSProperties
      }
      className={`album-container${disabled ? " disabled" : ""}`}
    >
      {layers.map((layer) => (
        <div
          key={layer.id}
          id={layer.id}
          style={
            {
              "--depth": disabled ? "0em" : `${layer.depth}em`,
              "--image": `url(${layer.imageUrl})`,
              backgroundImage: `url(${layer.imageUrl})`,
            } as React.CSSProperties
          }
          className="album-layer"
        >
          {layer.shadows.map((shadow, idx) => (
            <div
              key={idx}
              className="album-shadow"
              style={
                {
                  backgroundImage: `url(${shadow.imageUrl})`,
                  "--blur": shadow.blur,
                  "--image": `url(${shadow.imageUrl})`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      ))}
    </div>
  );
}
