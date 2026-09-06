import { config } from "dotenv";
config();

import { createClient } from "@sanity/client";
import { JSDOM } from "jsdom";
import { readFileSync, statSync } from "fs";
import { join } from "path";

const client = createClient({
  projectId: "6iq5dy0j",
  dataset: "production",
  useCdn: false,
  apiVersion: "2026-02-01",
  token: process.env.SANITY_TOKEN,
});

if (!process.env.SANITY_TOKEN) {
  console.error("ERROR: Set SANITY_TOKEN environment variable");
  console.error("Get it from https://www.sanity.io/manage/project/6iq5dy0j/api#tokens");
  process.exit(1);
}

const OLD_SITE = "/home/skolz/projects/danielzan.com.ar";

let _keyCounter = 0;
function nextKey() {
  return `k${++_keyCounter}`;
}

function htmlToPortableText(html: string) {
  const doc = new JSDOM(html).window.document;
  const body = doc.body;
  if (!body) return [];

  const blocks: Record<string, unknown>[] = [];
  for (const node of Array.from(body.childNodes)) {
    if (node.nodeType === 3) {
      const text = node.textContent?.trim();
      if (text) {
        blocks.push({
          _type: "block",
          _key: nextKey(),
          style: "normal",
          children: [{ _type: "span", _key: nextKey(), text, marks: [] }],
          markDefs: [],
        });
      }
      continue;
    }
    if (node.nodeType !== 1) continue;
    const el = node as Element;
    const tag = el.tagName.toLowerCase();

    if (tag === "p" || tag === "div") {
      const children = extractChildren(el);
      const text = children.map((c) => c.text).join("").trim();
      if (!text && children.length === 0) continue;
      blocks.push({
        _type: "block",
        _key: nextKey(),
        style: "normal",
        children: children.length > 0 ? children : [{ _type: "span", _key: nextKey(), text: "", marks: [] }],
        markDefs: [],
      });
    }
  }

  return blocks;
}

function extractChildren(el: Element) {
  const children: { _type: string; _key: string; text: string; marks: string[] }[] = [];

  function walk(node: Node, marks: string[] = []) {
    if (node.nodeType === 3) {
      const text = node.textContent || "";
      if (text.trim()) {
        children.push({ _type: "span", _key: nextKey(), text, marks: [...marks] });
      }
      return;
    }
    if (node.nodeType !== 1) return;
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    if (tag === "br") {
      children.push({ _type: "span", _key: nextKey(), text: "\n", marks: [...marks] });
      return;
    }
    if (tag === "b" || tag === "strong") {
      for (const child of Array.from(el.childNodes)) {
        walk(child, [...marks, "strong"]);
      }
      return;
    }
    if (tag === "i" || tag === "em") {
      for (const child of Array.from(el.childNodes)) {
        walk(child, [...marks, "em"]);
      }
      return;
    }
    if (tag === "u") {
      for (const child of Array.from(el.childNodes)) {
        walk(child, [...marks, "underline"]);
      }
      return;
    }
    // Default: recurse without adding marks
    for (const child of Array.from(el.childNodes)) {
      walk(child, marks);
    }
  }

  for (const child of Array.from(el.childNodes)) {
    walk(child);
  }

  return children;
}

async function uploadImage(filePath: string) {
  try {
    const buffer = readFileSync(filePath);
    const filename = filePath.split("/").pop() || "image";
    const asset = await client.assets.upload("image", buffer, { filename });
    return asset;
  } catch (e: any) {
    console.error(`  Failed to upload ${filePath}:`, e.message);
    return null;
  }
}

function parseHtml(html: string) {
  return new JSDOM(html).window.document;
}

async function migratePosts() {
  console.log("\n=== MIGRATING POSTS ===");
  const html = readFileSync(join(OLD_SITE, "index.html"), "latin1");
  const doc = parseHtml(html);
  const middle = doc.getElementById("middle");
  if (!middle) { console.log("  No #middle div found"); return; }

  const entries: { title: string; body: string; year: number | null; date: string | null }[] = [];
  let currentTitle = "";
  let currentBody: string[] = [];
  let currentYear: number | null = null;

  const children = Array.from(middle.children);
  for (const el of children) {
    const tag = el.tagName?.toLowerCase();

    if (tag === "h1") {
      if (currentTitle) {
        entries.push({ title: currentTitle, body: currentBody.join("\n"), year: currentYear, date: null });
      }
      currentTitle = el.textContent?.trim() || "";
      currentBody = [];
      currentYear = extractYear(currentTitle);
    } else if (tag === "p" || tag === "div") {
      currentBody.push(el.innerHTML);
      const text = el.textContent || "";
      if (!currentYear) currentYear = extractYear(text);
    }
  }
  if (currentTitle) {
    entries.push({ title: currentTitle, body: currentBody.join("\n"), year: currentYear, date: null });
  }

  console.log(`  Found ${entries.length} entries`);

  const authorDoc = await client.fetch(`*[_type == "author" && slug.current == "daniel-zanzotti"][0]._id`);

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];

    const existing = await client.fetch(`*[_type == "post" && title == $title][0]._id`, { title: e.title });
    if (existing) {
      console.log(`  SKIP [${i + 1}/${entries.length}]: "${e.title}" (already exists)`);
      continue;
    }

    _keyCounter = 0;
    try {
      const blocks = htmlToPortableText(e.body);

      await client.create({
        _type: "post",
        title: e.title,
        body: blocks,
        publishedAt: e.year
          ? new Date(e.year, 0, 1).toISOString()
          : new Date().toISOString(),
        author: authorDoc ? { _type: "reference", _ref: authorDoc } : undefined,
      });
      console.log(`  OK [${i + 1}/${entries.length}]: "${e.title}"`);
    } catch (err: any) {
      console.error(`  FAIL [${i + 1}/${entries.length}]: "${e.title}" - ${err.message}`);
    }
  }
}

function extractYear(text: string): number | null {
  const matches = text.match(/\b(20\d{2})\b/);
  return matches ? parseInt(matches[1]) : null;
}


async function migrateSeasons() {
  console.log("\n=== MIGRATING SEASONS ===");
  const seasons = [
    { year: 2009, finalPosition: "Campeón", category: "Super Sport 1050" },
    { year: 2010, finalPosition: "Subcampeón", category: "Super Sport 1050" },
    { year: 2011, finalPosition: "Subcampeón", category: "Super Sport 1050" },
    { year: 2012, finalPosition: "Subcampeón", category: "Sport Prototipo" },
    { year: 2013, finalPosition: "Campeón", category: "Sport Prototipo" },
    { year: 2014, finalPosition: "Subcampeón", category: "Sport Prototipo" },
    { year: 2015, finalPosition: "Campeón", category: "Sport Prototipo" },
    { year: 2016, finalPosition: "3°", category: "Sport Prototipo" },
    { year: 2017, finalPosition: "4°", category: "Sport Prototipo" },
    { year: 2018, finalPosition: "3°", category: "Sport Prototipo" },
  ];

  for (const s of seasons) {
    const existing = await client.fetch(`*[_type == "season" && year == $year][0]._id`, { year: s.year });
    if (existing) {
      console.log(`  SKIP: ${s.year} (already exists)`);
      continue;
    }
    await client.create({ _type: "season", ...s });
    console.log(`  OK: ${s.year} - ${s.finalPosition}`);
  }
}

async function migrateRaceResults() {
  console.log("\n=== MIGRATING RACE RESULTS ===");
  const html = readFileSync(join(OLD_SITE, "index.html"), "latin1");
  const doc = parseHtml(html);
  const right = doc.getElementById("right");
  if (!right) { console.log("  No #right div found"); return; }

  let count = 0;
  const children = Array.from(right.children);

  for (let i = 0; i < children.length; i++) {
    const el = children[i];
    if (el.tagName?.toLowerCase() !== "h1") continue;

    const yearText = el.textContent || "";
    const year = extractYear(yearText);
    if (!year) continue;

    const category = (() => {
      const t = yearText.toLowerCase();
      if (t.includes("sport 1050") || t.includes("sport1050")) return "Super Sport 1050";
      if (t.includes("prototipo") || t.includes("sp")) return "Sport Prototipo";
      return "Sport Prototipo";
    })();

    // Collect all sibling uls until the next h1 (a season may span multiple lists)
    const uls: Element[] = [];
    let sibling = el.nextElementSibling;
    while (sibling && sibling.tagName?.toLowerCase() === "ul") {
      uls.push(sibling);
      sibling = sibling.nextElementSibling;
    }
    if (uls.length === 0) continue;

    for (const ul of uls) {
      const items = ul.querySelectorAll("li");
    for (const li of Array.from(items)) {
      const text = li.textContent?.trim() || "";
      if (!text) continue;

      // Format: "3º PUESTO - 10.03.18" or "1er PUESTO 05.08.18" or "abandono - 10.05.18"
      // Dates may use dots (10.03.18) or dashes (03-11-13).

      const dateMatch = text.match(/(\d{2})\.(\d{2})\.(\d{2})/) || text.match(/(\d{2})-(\d{2})-(\d{2})/);
      if (!dateMatch) continue;
      const date = `20${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;

      // Only inspect the text BEFORE the date, so digits in the date never leak into the position.
      const before = (dateMatch.index !== undefined ? text.slice(0, dateMatch.index) : "").toLowerCase();
      let position = "Ausente";

      if (before.includes("abandono")) position = "Abandono";
      else if (before.includes("ausente")) position = "Ausente";
      else if (before.includes("excluido")) position = "Excluido";
      else if (before.includes("no clasific") || before.includes("nc")) position = "No clasificó";
      else {
        const pm = before.match(/(\d{1,2})\s*(?:º|°|er|ro|do|to)?\s*puesto/);
        if (pm) position = `${parseInt(pm[1])}°`;
      }

      const existing = await client.fetch(
        `*[_type == "raceResult" && date == $date && position == $position][0]._id`,
        { date, position },
      );
      if (existing) {
        console.log(`  SKIP: ${date} ${position} (already exists)`);
        continue;
      }

      try {
        await client.create({
          _type: "raceResult",
          date,
          position,
          category,
          circuit: "",
        });
        count++;
      } catch (err: any) {
        console.error(`  FAIL: ${date} ${position} - ${err.message}`);
      }
    }
  }

  console.log(`  Created ${count} race results`);
}

async function migrateVideos() {
  console.log("\n=== MIGRATING VIDEOS ===");
  const html = readFileSync(join(OLD_SITE, "videos.html"), "latin1");
  const doc = parseHtml(html);
  const middle = doc.getElementById("middle");
  if (!middle) return;

  const youtubeIds: string[] = [];
  const embeds = middle.querySelectorAll("embed");
  for (const e of Array.from(embeds)) {
    const src = e.getAttribute("src") || "";
    const match = src.match(/youtube\.com\/v\/([a-zA-Z0-9_-]+)/);
    if (match && !youtubeIds.includes(match[1])) youtubeIds.push(match[1]);
  }

  for (const id of youtubeIds) {
    const url = `https://www.youtube.com/watch?v=${id}`;
    const existing = await client.fetch(`*[_type == "video" && youtubeUrl == $url][0]._id`, {
      url,
    });
    if (existing) {
      console.log(`  SKIP: ${id}`);
      continue;
    }
    await client.create({
      _type: "video",
      title: `Video ${id}`,
      youtubeUrl: url,
      category: "Sport Prototipo",
    });
    console.log(`  OK: ${id}`);
  }
}

async function migratePhotos() {
  console.log("\n=== MIGRATING PHOTO GALLERIES ===");
  const html = readFileSync(join(OLD_SITE, "photos.html"), "latin1");
  const doc = parseHtml(html);
  const middle = doc.getElementById("middle");
  if (!middle) return;

  const galleries: { title: string; category: string; images: string[] }[] = [];
  let currentGallery: { title: string; category: string; images: string[] } | null = null;

  const children = Array.from(middle.children);
  for (const el of children) {
    const tag = el.tagName?.toLowerCase();
    if (tag === "h1") {
      if (currentGallery && currentGallery.images.length > 0) {
        galleries.push(currentGallery);
      }
      const rawTitle = el.textContent?.trim() || "";
      const title = rawTitle.replace(/^-\s*/, "").replace(/^\d+\s*/, "").trim() || rawTitle;
      const category = title.replace(/^[^:]+:\s*/, "").trim() || "General";
      currentGallery = { title, category, images: [] };
    } else if (tag === "p" && currentGallery) {
      const imgs = el.querySelectorAll("img");
      for (const img of Array.from(imgs)) {
        const src = img.getAttribute("src") || "";
        if (src && !src.includes("logo") && !src.includes("banner")) {
          currentGallery.images.push(src);
        }
      }
    }
  }
  if (currentGallery && currentGallery.images.length > 0) {
    galleries.push(currentGallery);
  }

  for (const g of galleries) {
    const existing = await client.fetch(`*[_type == "photoGallery" && title == $title][0]._id`, { title: g.title });
    if (existing) {
      console.log(`  SKIP: "${g.title}"`);
      continue;
    }

    const photos = [];
    for (const imgPath of g.images.slice(0, 20)) {
      const fullPath = join(OLD_SITE, imgPath);
      if (!statSync(fullPath, { throwIfNoEntry: false })) {
        console.log(`  Image not found: ${imgPath}`);
        continue;
      }
      const asset = await uploadImage(fullPath);
      if (asset) {
        photos.push({
          _key: `ph_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          image: { _type: "image", asset: { _type: "reference", _ref: asset._id } },
          caption: g.title,
        });
      }
    }

    if (photos.length > 0) {
      await client.create({
        _type: "photoGallery",
        title: g.title,
        slug: { _type: "slug", current: g.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") },
        photos,
        category: g.category,
      });
      console.log(`  OK: "${g.title}" (${photos.length} photos)`);
    }
  }
}

async function migrateSongs() {
  console.log("\n=== MIGRATING SONGS ===");
  const mp3Path = join(OLD_SITE, "elcampeon.mp3");
  if (!statSync(mp3Path, { throwIfNoEntry: false })) {
    console.log("  elcampeon.mp3 not found");
    return;
  }

  const existing = await client.fetch(`*[_type == "song" && isFavorite == true][0]._id`);
  if (existing) {
    console.log("  SKIP: favorite song already exists");
    return;
  }

  try {
    const buffer = readFileSync(mp3Path);
    const asset = await client.assets.upload("file", buffer, { filename: "elcampeon.mp3" });
    await client.create({
      _type: "song",
      title: "Canción del Campeón",
      audio: { _type: "file", asset: { _type: "reference", _ref: asset._id } },
      isFavorite: true,
    });
    console.log("  OK: Canción del Campeón uploaded");
  } catch (err: any) {
    console.error(`  FAIL: ${err.message}`);
  }
}

async function migrateSponsors() {
  console.log("\n=== MIGRATING SPONSORS ===");
  const sponsors = [
    { name: "Boulevard Huidobro", url: "https://boulevardhuidobro.com" },
    { name: "Reflectar", url: "https://reflectar.com.ar" },
    { name: "Giusa", url: "https://giusa.com.ar" },
  ];

  for (const s of sponsors) {
    const existing = await client.fetch(`*[_type == "sponsor" && name == $name][0]._id`, { name: s.name });
    if (existing) {
      console.log(`  SKIP: ${s.name}`);
      continue;
    }
    await client.create({ _type: "sponsor", ...s });
    console.log(`  OK: ${s.name}`);
  }
}

async function migrateTeam() {
  console.log("\n=== MIGRATING TEAM ===");
  const existing = await client.fetch(`*[_type == "team"][0]._id`);
  if (existing) {
    console.log("  SKIP: team already exists");
    return;
  }

  const logoPath = join(OLD_SITE, "images", "logo becerra trabs.png");
  let logoRef = null;
  if (statSync(logoPath, { throwIfNoEntry: false })) {
    const asset = await uploadImage(logoPath);
    if (asset) logoRef = { _type: "reference", _ref: asset._id };
  }

  const createData: Record<string, unknown> = {
    _type: "team",
    name: "Becerra Racing",
    url: "",
  };
  if (logoRef) {
    createData.logo = { _type: "image", asset: logoRef };
  }

  await client.create(createData);
  console.log("  OK: Becerra Racing");
}

async function migrateAbout() {
  console.log("\n=== MIGRATING ABOUT ===");
  const existing = await client.fetch(`*[_type == "about"][0]._id`);
  if (existing) {
    console.log("  SKIP: about already exists");
    return;
  }

  const html = readFileSync(join(OLD_SITE, "index.html"), "latin1");
  const doc = parseHtml(html);
  const middle = doc.getElementById("middle");
  if (!middle) return;

  const headings = middle.querySelectorAll("h1");
  let aboutHtml = "";
  let found = false;

  for (const h of Array.from(headings)) {
    if (h.textContent?.toLowerCase().includes("35 a")) {
      found = true;
      let el = h.nextElementSibling;
      while (el && el.tagName?.toLowerCase() !== "h1") {
        aboutHtml += el.outerHTML || "";
        el = el.nextElementSibling;
      }
      break;
    }
  }

  if (!found) {
    console.log("  Using fallback text (about section not found)");
    aboutHtml =
      "<p>Daniel Zanzotti, conocido como 'Danielzan', es un piloto argentino de Sport Prototipo. Comenzó su carrera en 1979 en Fórmula Renault y ha competido durante más de 35 años.</p>";
  }

  _keyCounter = 0;
  const blocks = htmlToPortableText(aboutHtml);

  await client.create({
    _type: "about",
    title: "35 años subido a un formula",
    body: blocks,
  });
  console.log("  OK: About page created");
}

async function main() {
  console.log("Starting migration to Sanity...\n");

  await migratePosts();
  await migrateSeasons();
  await migrateRaceResults();
  await migrateVideos();
  await migratePhotos();
  await migrateSongs();
  await migrateSponsors();
  await migrateTeam();
  await migrateAbout();

  console.log("\n=== MIGRATION COMPLETE ===");
}

main().catch(console.error);
