import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useClient } from "sanity";
import type { ArrayOfObjectsInputProps } from "sanity";
import { Button, Card, Dialog, Flex, Grid, Stack, Text, TextInput } from "@sanity/ui";
import { UploadIcon } from "@sanity/icons/Upload";
import { ImageIcon } from "@sanity/icons/Image";

interface PhotoItem {
  _type: "image";
  _key: string;
  asset: { _type: "reference"; _ref: string };
}

interface Asset {
  _id: string;
  url: string;
  originalFilename?: string;
}

export function GalleryPhotosInput(props: ArrayOfObjectsInputProps) {
  const client = useClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [browsing, setBrowsing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const appendPhotos = useCallback(
    (items: PhotoItem[]) => {
      const currentItems = (props.value ?? []) as PhotoItem[];
      if (currentItems.length > 0) {
        const lastItem = currentItems[currentItems.length - 1];
        props.onInsert({
          items,
          position: "after",
          referenceItem: { _key: lastItem._key },
          open: false,
        });
      } else {
        props.onInsert({
          items,
          position: "after",
          referenceItem: -1,
          open: false,
        });
      }
    },
    [props],
  );

  const uploadFiles = useCallback(
    async (files: File[]) => {
      setUploading(true);
      try {
        const items: PhotoItem[] = [];
        for (const file of files) {
          const asset = await client.assets.upload("image", file, {
            filename: file.name,
          });
          items.push({
            _type: "image",
            _key: crypto.randomUUID(),
            asset: { _type: "reference", _ref: asset._id },
          });
        }
        appendPhotos(items);
      } finally {
        setUploading(false);
      }
    },
    [client, appendPhotos],
  );

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? []);
      event.target.value = "";
      if (files.length) void uploadFiles(files);
    },
    [uploadFiles],
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const files = Array.from(event.dataTransfer.files).filter((file) =>
        file.type.startsWith("image/"),
      );
      if (files.length) void uploadFiles(files);
    },
    [uploadFiles],
  );

  return (
    <Stack space={3}>
      <Card
        padding={3}
        radius={2}
        border
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <Flex gap={2} align="center" wrap="wrap">
          <Button
            text={uploading ? "Subiendo…" : "Subir fotos"}
            icon={UploadIcon}
            tone="primary"
            loading={uploading}
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          />
          <Button
            text="Seleccionar existentes"
            icon={ImageIcon}
            onClick={() => setBrowsing(true)}
          />
          <Text size={1} muted>
            o arrastrá una o más imágenes acá
          </Text>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            hidden
            onChange={handleFileChange}
          />
        </Flex>
      </Card>

      {props.renderDefault({ ...props, arrayFunctions: () => null })}

      {browsing && (
        <ExistingPhotosDialog
          onClose={() => setBrowsing(false)}
          onSelect={(refs) => {
            appendPhotos(
              refs.map((ref) => ({
                _type: "image",
                _key: crypto.randomUUID(),
                asset: { _type: "reference", _ref: ref },
              })),
            );
            setBrowsing(false);
          }}
        />
      )}
    </Stack>
  );
}

function ExistingPhotosDialog({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (refs: string[]) => void;
}) {
  const client = useClient();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    client
      .fetch(
        `*[_type == "sanity.imageAsset"] | order(_createdAt desc)[0...200] { _id, url, originalFilename }`,
      )
      .then(setAssets);
  }, [client]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return assets;
    return assets.filter((asset) =>
      (asset.originalFilename ?? "").toLowerCase().includes(q),
    );
  }, [assets, query]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <Dialog
      id="existing-photos-dialog"
      header="Seleccionar imágenes existentes"
      onClose={onClose}
      width={2}
      footer={
        <Card borderTop padding={3} radius={0} style={{ borderLeft: 0, borderRight: 0, borderBottom: 0 }}>
          <Flex justify="space-between" align="center" gap={2}>
            <Text size={1} muted>
              {selected.size} seleccionada{selected.size === 1 ? "" : "s"}
            </Text>
            <Flex gap={2}>
              <Button text="Cancelar" onClick={onClose} />
              <Button
                text="Agregar"
                tone="primary"
                disabled={selected.size === 0}
                onClick={() => onSelect(Array.from(selected))}
              />
            </Flex>
          </Flex>
        </Card>
      }
    >
      <Stack space={3}>
        <TextInput
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          placeholder="Buscar por nombre de archivo…"
        />
        {filtered.length === 0 ? (
          <Text size={1} muted>
            No hay imágenes subidas todavía. Usá «Subir fotos» primero.
          </Text>
        ) : (
          <Grid columns={[2, 3, 4]} gap={2}>
            {filtered.map((asset) => {
              const isSelected = selected.has(asset._id);
              return (
                <Card
                  key={asset._id}
                  as="button"
                  type="button"
                  onClick={() => toggle(asset._id)}
                  padding={0}
                  radius={1}
                  selected={isSelected}
                  title={asset.originalFilename}
                  style={{ cursor: "pointer", overflow: "hidden", position: "relative" }}
                >
                  <img
                    src={`${asset.url}?w=400&fit=max`}
                    alt=""
                    loading="lazy"
                    style={{
                      display: "block",
                      width: "100%",
                      aspectRatio: "1 / 1",
                      objectFit: "cover",
                    }}
                  />
                  {isSelected && (
                    <div
                      style={{
                        position: "absolute",
                        top: 6,
                        right: 6,
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        background: "#2563eb",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path
                          d="M2.5 6.5L5 9L9.5 3"
                          stroke="white"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  )}
                </Card>
              );
            })}
          </Grid>
        )}
      </Stack>
    </Dialog>
  );
}
