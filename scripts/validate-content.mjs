#!/usr/bin/env node
// Checks every content JSON file in src/content against the schema used by the app.
// Run: npm run validate   (or node scripts/validate-content.mjs [file ...])
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const TRACK_DIR = join(ROOT, "src", "content", "tracks");
const AREAS = ["fundamentals", "frontend", "backend", "database", "devops", "career"];
const LEVELS = ["beginner", "intermediate", "advanced"];
const TYPES = ["mcq", "truefalse", "multi", "interview", "fill"];
const SMART = /[‘’“”–—…​‌‍﻿]/;

const errors = [];
const warnings = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const str = (v) => typeof v === "string" && v.trim().length > 0;
const allIds = new Map();
const claim = (id, where) => {
  if (allIds.has(id)) err(where, `duplicate id "${id}" (also in ${allIds.get(id)})`);
  else allIds.set(id, where);
};

function checkText(where, value) {
  if (typeof value === "string" && SMART.test(value)) err(where, "contains smart quotes, en/em dash, ellipsis or zero-width characters");
}
function walkText(where, node) {
  if (typeof node === "string") checkText(where, node);
  else if (Array.isArray(node)) node.forEach((n, i) => walkText(`${where}[${i}]`, n));
  else if (node && typeof node === "object") for (const [k, v] of Object.entries(node)) walkText(`${where}.${k}`, v);
}

function checkQuestion(q, where) {
  if (!str(q.id)) return err(where, "question.id missing");
  claim(q.id, where);
  const w = `${where} ${q.id}`;
  if (!TYPES.includes(q.type)) err(w, `type must be one of ${TYPES.join("|")}`);
  if (!str(q.prompt)) err(w, "prompt missing");
  if (q.code !== undefined && typeof q.code !== "string") err(w, "code must be a string");
  if (q.level !== undefined && !LEVELS.includes(q.level)) err(w, "level invalid");
  if (q.top !== undefined && typeof q.top !== "boolean") err(w, "top must be true or false");
  if (q.type === "mcq") {
    if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 6) err(w, "mcq needs 2-6 options");
    else if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) err(w, "mcq answer must be a valid option index");
    if (Array.isArray(q.options) && new Set(q.options).size !== q.options.length) err(w, "duplicate options");
  }
  if (q.type === "multi") {
    if (!Array.isArray(q.options) || q.options.length < 3) err(w, "multi needs 3+ options");
    else if (!Array.isArray(q.answers) || q.answers.length < 1 || q.answers.some((a) => !Number.isInteger(a) || a < 0 || a >= q.options.length))
      err(w, "multi answers must be valid option indexes");
  }
  if (q.type === "truefalse" && typeof q.answer !== "boolean") err(w, "truefalse answer must be boolean");
  if (q.type === "fill") {
    if (!Array.isArray(q.accept) || q.accept.length < 1 || !q.accept.every(str)) err(w, "fill needs accept: string[]");
  }
  if (q.type === "interview") {
    if (!str(q.answer)) err(w, "interview answer (model answer) missing");
  } else if (!str(q.explanation)) err(w, "explanation missing");
}

function checkTrack(file) {
  const where = relative(ROOT, file);
  let t;
  try {
    t = JSON.parse(readFileSync(file, "utf8"));
  } catch (e) {
    return err(where, `invalid JSON: ${e.message}`);
  }
  walkText(where, t);
  for (const k of ["id", "title", "description", "icon", "color"]) if (!str(t[k])) err(where, `track.${k} missing`);
  if (!AREAS.includes(t.area)) err(where, `area must be one of ${AREAS.join("|")}`);
  if (!Number.isFinite(t.order)) err(where, "order must be a number");
  if (!/^#[0-9a-fA-F]{6}$/.test(t.color ?? "")) err(where, "color must be #rrggbb");
  if (!Array.isArray(t.chapters) || t.chapters.length === 0) return err(where, "chapters missing");
  let qCount = 0;
  for (const c of t.chapters) {
    const cw = `${where} > ${c.id ?? "?"}`;
    if (!str(c.id)) err(cw, "chapter.id missing");
    else claim(c.id, cw);
    for (const k of ["title", "summary"]) if (!str(c[k])) err(cw, `${k} missing`);
    if (!LEVELS.includes(c.level)) err(cw, "level invalid");
    if (!Number.isFinite(c.estMinutes)) err(cw, "estMinutes missing");
    if (!Array.isArray(c.lesson) || c.lesson.length < 2) err(cw, "lesson needs 2+ sections");
    else
      c.lesson.forEach((s, i) => {
        if (!str(s.heading) || !str(s.body)) err(cw, `lesson[${i}] needs heading and body`);
        if (s.code && (!str(s.code.lang) || !str(s.code.source))) err(cw, `lesson[${i}].code needs lang and source`);
      });
    if (!Array.isArray(c.keyPoints) || c.keyPoints.length < 2) err(cw, "keyPoints needs 2+ items");
    if (c.resources !== undefined && (!Array.isArray(c.resources) || c.resources.some((r) => !str(r.title) || !/^https:\/\//.test(r.url ?? ""))))
      err(cw, "resources need title and https url");
    if (!Array.isArray(c.questions) || c.questions.length < 5) err(cw, "questions needs 5+ items");
    else c.questions.forEach((q) => checkQuestion(q, cw));
    qCount += c.questions?.length ?? 0;
  }
  return { id: t.id, chapters: t.chapters.length, questions: qCount };
}

const files = process.argv.slice(2).length
  ? process.argv.slice(2).map((f) => join(ROOT, f))
  : readdirSync(TRACK_DIR)
      .filter((f) => f.endsWith(".json"))
      .map((f) => join(TRACK_DIR, f));

const stats = files.map(checkTrack).filter(Boolean);

if (!process.argv.slice(2).length) {
  try {
    const goals = JSON.parse(readFileSync(join(ROOT, "src", "content", "goals.json"), "utf8"));
    const trackIds = new Set(stats.map((s) => s.id));
    for (const g of goals) for (const id of g.trackIds) if (!trackIds.has(id)) warnings.push(`goals.json: goal "${g.id}" lists track "${id}" which has no file yet (hidden in the app until it exists)`);
  } catch (e) {
    err("goals.json", e.message);
  }
}

for (const s of stats) console.log(`  ${s.id.padEnd(22)} ${String(s.chapters).padStart(3)} chapters ${String(s.questions).padStart(5)} questions`);
const total = stats.reduce((a, s) => a + s.questions, 0);
console.log(`\n${stats.length} tracks, ${stats.reduce((a, s) => a + s.chapters, 0)} chapters, ${total} questions`);
if (warnings.length) {
  const missing = [...new Set(warnings.map((w) => w.match(/track "([^"]+)"/)[1]))];
  console.warn(`
Pending tracks referenced by goals: ${missing.join(", ")}`);
}
if (errors.length) {
  console.error(`\n${errors.length} problem(s):`);
  for (const e of errors.slice(0, 200)) console.error("  - " + e);
  process.exit(1);
}
console.log("Content OK");
