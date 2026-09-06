import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { AddIcon } from "@sanity/icons/Add";
import { ArrowDownIcon } from "@sanity/icons/ArrowDown";
import { ArrowUpIcon } from "@sanity/icons/ArrowUp";
import { Box, Button, Card, Flex, Spinner, Text } from "@sanity/ui";
import { useClient, useSchema } from "sanity";
import { usePaneRouter } from "sanity/structure";

const SCALAR_FIELD_TYPES = new Set([
  "string",
  "text",
  "url",
  "date",
  "datetime",
  "number",
  "boolean",
  "slug",
  "reference",
]);

interface DocumentTableProps {
  options?: Record<string, unknown>;
}

interface Column {
  key: string;
  title: string;
  type: string;
}

interface TableRow {
  _id: string;
  [key: string]: unknown;
}

interface SchemaTypeShape {
  fields?: Array<{
    name?: string;
    title?: unknown;
    deprecated?: unknown;
    type?: { name?: string; jsonType?: string };
  }>;
}

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  color: var(--card-fg-color);
`;

const Th = styled.th`
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 0.5625em 0.9375em;
  text-align: left;
  font-weight: 600;
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.035em;
  color: var(--card-muted-fg-color);
  background: var(--card-bg-color);
  border-bottom: 1px solid var(--card-hairline-soft-color);
  white-space: nowrap;
`;

const SortButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.4em;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  text-transform: inherit;
  letter-spacing: inherit;
  cursor: pointer;
  user-select: none;

  &:hover,
  &:focus-visible {
    color: var(--card-fg-color);
    text-decoration: underline;
    outline: none;
  }
`;

const Tr = styled.tr`
  cursor: pointer;

  &:hover td {
    background: var(--card-code-bg-color);
  }
`;

const Td = styled.td`
  padding: 0.5625em 0.9375em;
  font-size: 0.8125rem;
  line-height: 1.45;
  border-bottom: 1px solid var(--card-hairline-soft-color);
  vertical-align: middle;
  max-width: 24ch;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Muted = styled.span`
  color: var(--card-muted-fg-color);
`;

const Strong = styled.span`
  font-weight: 600;
`;

function getRawValue(row: TableRow, column: Column, refTitles: Record<string, string>): unknown {
  const value = row[column.key];
  if (value == null) return null;
  if (column.type === "reference") {
    if (typeof value === "object" && "_ref" in (value as Record<string, unknown>)) {
      const ref = (value as { _ref: string })._ref;
      return refTitles[ref] ?? ref;
    }
    return null;
  }
  if (column.type === "slug") {
    if (typeof value === "object" && "current" in (value as Record<string, unknown>)) {
      return (value as { current: unknown }).current;
    }
    return null;
  }
  return value;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-AR");
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCellValue(row: TableRow, column: Column, refTitles: Record<string, string>): string {
  const raw = getRawValue(row, column, refTitles);
  if (raw == null || raw === "") return "";
  switch (column.type) {
    case "boolean":
      return raw ? "Sí" : "No";
    case "date":
      return formatDate(String(raw));
    case "datetime":
      return formatDateTime(String(raw));
    default:
      if (typeof raw === "object") return JSON.stringify(raw).slice(0, 60);
      return String(raw);
  }
}

export function DocumentTable(props: DocumentTableProps) {
  const rawType = props.options?.type;
  const type = typeof rawType === "string" ? rawType : "";
  const client = useClient();
  const schema = useSchema();
  const paneRouter = usePaneRouter();

  const previewClient = useMemo(
    () => client.withConfig({ perspective: "previewDrafts" }),
    [client]
  );

  const columns = useMemo<Column[]>(() => {
    if (!type) return [];
    const schemaType = schema.get(type) as SchemaTypeShape | undefined;
    const fields = schemaType?.fields ?? [];
    const columns: Column[] = [];
    for (const field of fields) {
      const name = field.name;
      const typeName =
        typeof field.type?.name === "string" && field.type.name.length > 0
          ? field.type.name
          : field.type?.jsonType;
      if (!name || typeof typeName !== "string" || !SCALAR_FIELD_TYPES.has(typeName)) continue;
      if (field.deprecated) continue;
      const title =
        typeof field.title === "string" && field.title.length > 0 && field.title !== "undefined"
          ? field.title
          : name;
      columns.push({ key: name, title, type: typeName });
    }
    return columns;
  }, [schema, type]);

  const [rows, setRows] = useState<TableRow[] | null>(null);
  const [refTitles, setRefTitles] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    if (!type) return;
    let cancelled = false;
    setRows(null);
    setRefTitles({});
    setError(null);

    previewClient
      .fetch<TableRow[]>(`*[_type == $type] | order(_updatedAt desc)`, { type })
      .then((result) => {
        if (cancelled) return;
        setRows(result);

        const referenceKeys = columns
          .filter((column) => column.type === "reference")
          .map((column) => column.key);
        const refIds = new Set<string>();
        for (const row of result) {
          for (const key of referenceKeys) {
            const value = row[key];
            if (value && typeof value === "object" && "_ref" in (value as Record<string, unknown>)) {
              refIds.add((value as { _ref: string })._ref);
            }
          }
        }
        if (refIds.size === 0) return;

        return previewClient
          .fetch<Array<{ _id: string; title?: string; name?: string }>>(`*[_id in $ids]`, {
            ids: [...refIds],
          })
          .then((references) => {
            if (cancelled) return;
            const map: Record<string, string> = {};
            for (const reference of references) {
              map[reference._id] = reference.title ?? reference.name ?? reference._id;
            }
            setRefTitles(map);
          })
          .catch(() => {
            if (!cancelled) setRefTitles({});
          });
      })
      .catch(() => {
        if (!cancelled) setError("No se pudieron cargar los documentos.");
      });

    return () => {
      cancelled = true;
    };
  }, [columns, previewClient, type]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortedRows = useMemo(() => {
    if (!rows || !sortKey) return rows ?? [];
    const column = columns.find((candidate) => candidate.key === sortKey);
    const copy = [...rows];
    copy.sort((a, b) => {
      const aValue = column ? getRawValue(a, column, refTitles) : null;
      const bValue = column ? getRawValue(b, column, refTitles) : null;
      const aEmpty = aValue == null || aValue === "";
      const bEmpty = bValue == null || bValue === "";
      if (aEmpty && bEmpty) return 0;
      if (aEmpty) return 1;
      if (bEmpty) return -1;
      let comparison: number;
      if (typeof aValue === "number" && typeof bValue === "number") {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue), "es", {
          sensitivity: "base",
          numeric: true,
        });
      }
      return sortDir === "asc" ? comparison : -comparison;
    });
    return copy;
  }, [columns, refTitles, rows, sortDir, sortKey]);

  if (!type) {
    return (
      <Box padding={4}>
        <Text size={1} muted>
          Faltan opciones de configuración para esta vista.
        </Text>
      </Box>
    );
  }

  return (
    <Box padding={3}>
      <Toolbar>
        <Text size={1} muted>
          {rows ? `${rows.length} documento${rows.length === 1 ? "" : "s"}` : "\u00A0"}
        </Text>
        <Button
          text="Nuevo"
          icon={AddIcon}
          tone="primary"
          onClick={() => paneRouter.navigateIntent("create", { type })}
        />
      </Toolbar>

      {error ? (
        <Card tone="critical" padding={3} radius={2}>
          <Text size={1}>{error}</Text>
        </Card>
      ) : rows === null ? (
        <Flex align="center" justify="center" padding={4}>
          <Spinner />
        </Flex>
      ) : rows.length === 0 ? (
        <Card padding={4} radius={2}>
          <Text size={1} muted>
            No hay documentos todavía.
          </Text>
        </Card>
      ) : (
        <Card border radius={2}>
          <Table>
            <thead>
              <tr>
                {columns.map((column) => {
                  const isActive = sortKey === column.key;
                  return (
                    <Th key={column.key}>
                      <SortButton type="button" onClick={() => handleSort(column.key)}>
                        <span>{column.title}</span>
                        {isActive &&
                          (sortDir === "asc" ? (
                            <ArrowUpIcon fontSize={13} />
                          ) : (
                            <ArrowDownIcon fontSize={13} />
                          ))}
                      </SortButton>
                    </Th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row, rowIndex) => (
                <Tr key={row._id} onClick={() => paneRouter.navigateIntent("edit", { id: row._id })}>
                  {columns.map((column, columnIndex) => {
                    const text = formatCellValue(row, column, refTitles);
                    return (
                      <Td key={column.key} title={`Fila ${rowIndex + 1} · ${row._id}`}>
                        {text ? (
                          columnIndex === 0 ? (
                            <Strong>{text}</Strong>
                          ) : (
                            text
                          )
                        ) : (
                          <Muted>—</Muted>
                        )}
                      </Td>
                    );
                  })}
                </Tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </Box>
  );
}