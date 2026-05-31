import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

/**
 * Markdown-file blog (Simplicity First — no CMS). Posts live in `content/blog/*.md`
 * with frontmatter; these helpers run at build time inside server components / SSG.
 */
export interface PostMeta {
  slug: string;
  title: string;
  date: string; // ISO yyyy-mm-dd
  excerpt: string;
  readingTime: number; // minutes
}
export interface Post extends PostMeta {
  content: string; // raw markdown body
}

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

function readPost(file: string): Post {
  const slug = file.replace(/\.md$/, "");
  const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf8");
  const { data, content } = matter(raw);
  return {
    slug: (data.slug as string) ?? slug,
    title: data.title as string,
    date: String(data.date),
    excerpt: data.excerpt as string,
    readingTime: Number(data.readingTime) || estimateReadingTime(content),
    content,
  };
}

function estimateReadingTime(body: string): number {
  return Math.max(1, Math.round(body.split(/\s+/).length / 200));
}

/** All posts, newest first. */
export function getAllPosts(): PostMeta[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const { content, ...meta } = readPost(f);
      void content;
      return meta;
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

/** A single post, or null if the slug doesn't exist. */
export function getPost(slug: string): Post | null {
  const file = path.join(BLOG_DIR, `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  return readPost(`${slug}.md`);
}

export function getAllSlugs(): string[] {
  return getAllPosts().map((p) => p.slug);
}
