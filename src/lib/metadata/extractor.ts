import * as cheerio from "cheerio";
import { isSafeUrl } from "./ssrf";

export interface ExtractedMetadata {
  url: string;
  domain: string;
  title: string;
  description: string;
  type: "youtube" | "github" | "reddit" | "article" | "website";
  thumbnailUrl?: string | null;
  faviconUrl?: string | null;
  author?: string | null;
  duration?: number | null; // in minutes
  stars?: number | null;
  language?: string | null;
  extra?: Record<string, any>;
}

export async function extractMetadata(rawUrl: string): Promise<ExtractedMetadata> {
  // Normalize URL
  let targetUrl = rawUrl.trim();
  if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
    targetUrl = "https://" + targetUrl;
  }

  const safeCheck = isSafeUrl(targetUrl);
  if (!safeCheck.safe || !safeCheck.url) {
    throw new Error(safeCheck.reason || "Invalid or restricted URL");
  }

  const domain = safeCheck.url.hostname.replace(/^www\./, "");
  const defaultFavicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

  // 1. Specialized: YouTube
  if (domain.includes("youtube.com") || domain.includes("youtu.be")) {
    return extractYouTubeMetadata(targetUrl, domain, defaultFavicon);
  }

  // 2. Specialized: GitHub
  if (domain.includes("github.com")) {
    return extractGitHubMetadata(targetUrl, domain, defaultFavicon);
  }

  // 3. Specialized: Reddit
  if (domain.includes("reddit.com")) {
    return extractRedditMetadata(targetUrl, domain, defaultFavicon);
  }

  // 4. General HTML & OpenGraph metadata extraction
  return extractGeneralMetadata(targetUrl, domain, defaultFavicon);
}

// YouTube Extractor
async function extractYouTubeMetadata(
  url: string,
  domain: string,
  defaultFavicon: string
): Promise<ExtractedMetadata> {
  let videoId = "";
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      videoId = parsed.pathname.slice(1).split("?")[0];
    } else {
      videoId = parsed.searchParams.get("v") || "";
    }
  } catch {}

  const defaultThumbnail = videoId
    ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    : null;

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const res = await fetch(oembedUrl, {
      signal: AbortSignal.timeout(4000),
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
    });

    if (res.ok) {
      const data = await res.json();
      return {
        url,
        domain,
        title: data.title || "YouTube Video",
        description: `Video by ${data.author_name || "YouTube creator"}`,
        type: "youtube",
        thumbnailUrl: data.thumbnail_url || defaultThumbnail,
        faviconUrl: defaultFavicon,
        author: data.author_name || "YouTube",
        duration: 15, // Default estimated duration if not in oEmbed
        extra: { authorUrl: data.author_url },
      };
    }
  } catch (err) {
    console.warn("YouTube oEmbed fetch failed, using fallback:", err);
  }

  return {
    url,
    domain,
    title: videoId ? `YouTube Video (${videoId})` : "YouTube Video",
    description: "Watch on YouTube",
    type: "youtube",
    thumbnailUrl: defaultThumbnail,
    faviconUrl: defaultFavicon,
    author: "YouTube",
    duration: 15,
  };
}

// GitHub Extractor
async function extractGitHubMetadata(
  url: string,
  domain: string,
  defaultFavicon: string
): Promise<ExtractedMetadata> {
  const parsed = new URL(url);
  const segments = parsed.pathname.split("/").filter(Boolean);

  // If URL points to a repository (owner/repo)
  if (segments.length >= 2) {
    const owner = segments[0];
    const repo = segments[1];

    try {
      // Use public GitHub API
      const apiRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
          "User-Agent": "Lumora-App",
          Accept: "application/vnd.github.v3+json",
        },
        signal: AbortSignal.timeout(4000),
      });

      if (apiRes.ok) {
        const repoData = await apiRes.json();
        return {
          url,
          domain,
          title: `${owner}/${repo}`,
          description: repoData.description || "GitHub repository",
          type: "github",
          thumbnailUrl: repoData.owner?.avatar_url || `https://opengraph.githubassets.com/1/${owner}/${repo}`,
          faviconUrl: defaultFavicon,
          author: repoData.owner?.login || owner,
          stars: repoData.stargazers_count,
          language: repoData.language,
          duration: 10,
        };
      }
    } catch (err) {
      console.warn("GitHub API fetch failed, using fallback:", err);
    }

    return {
      url,
      domain,
      title: `${owner}/${repo}`,
      description: "GitHub repository",
      type: "github",
      thumbnailUrl: `https://opengraph.githubassets.com/1/${owner}/${repo}`,
      faviconUrl: defaultFavicon,
      author: owner,
      duration: 10,
    };
  }

  return extractGeneralMetadata(url, domain, defaultFavicon, "github");
}

// Reddit Extractor
async function extractRedditMetadata(
  url: string,
  domain: string,
  defaultFavicon: string
): Promise<ExtractedMetadata> {
  try {
    const oembedUrl = `https://www.reddit.com/oembed?url=${encodeURIComponent(url)}`;
    const res = await fetch(oembedUrl, {
      signal: AbortSignal.timeout(4000),
      headers: { "User-Agent": "Lumora-App/1.0" },
    });

    if (res.ok) {
      const data = await res.json();
      return {
        url,
        domain,
        title: data.title || "Reddit Post",
        description: data.author_name ? `Discussion by u/${data.author_name}` : "Reddit discussion",
        type: "reddit",
        thumbnailUrl: data.thumbnail_url || null,
        faviconUrl: defaultFavicon,
        author: data.author_name || "Reddit",
        duration: 8,
      };
    }
  } catch (err) {
    console.warn("Reddit oEmbed fetch failed:", err);
  }

  return extractGeneralMetadata(url, domain, defaultFavicon, "reddit");
}

// General OpenGraph & HTML Extractor
async function extractGeneralMetadata(
  url: string,
  domain: string,
  defaultFavicon: string,
  forcedType?: "youtube" | "github" | "reddit" | "article" | "website"
): Promise<ExtractedMetadata> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!res.ok) {
      return fallbackMetadata(url, domain, defaultFavicon, forcedType);
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    const title =
      $('meta[property="og:title"]').attr("content") ||
      $('meta[name="twitter:title"]').attr("content") ||
      $("title").text().trim() ||
      domain;

    const description =
      $('meta[property="og:description"]').attr("content") ||
      $('meta[name="twitter:description"]').attr("content") ||
      $('meta[name="description"]').attr("content") ||
      "";

    let ogImage =
      $('meta[property="og:image"]').attr("content") ||
      $('meta[name="twitter:image"]').attr("content") ||
      null;

    if (ogImage && !ogImage.startsWith("http")) {
      try {
        ogImage = new URL(ogImage, url).toString();
      } catch {}
    }

    let favicon =
      $('link[rel="icon"]').attr("href") ||
      $('link[rel="shortcut icon"]').attr("href") ||
      $('link[rel="apple-touch-icon"]').attr("href") ||
      defaultFavicon;

    if (favicon && !favicon.startsWith("http")) {
      try {
        favicon = new URL(favicon, url).toString();
      } catch {
        favicon = defaultFavicon;
      }
    }

    const author =
      $('meta[name="author"]').attr("content") ||
      $('meta[property="article:author"]').attr("content") ||
      $('meta[property="og:site_name"]').attr("content") ||
      null;

    // Estimate read time based on word count
    const bodyText = $("body").text().replace(/\s+/g, " ").trim();
    const wordCount = bodyText.split(" ").length;
    const estimatedMinutes = Math.max(3, Math.min(60, Math.round(wordCount / 200)));

    const contentType =
      forcedType ||
      (ogImage || wordCount > 500 ? "article" : "website");

    return {
      url,
      domain,
      title: title.slice(0, 200),
      description: description.slice(0, 500),
      type: contentType,
      thumbnailUrl: ogImage,
      faviconUrl: favicon,
      author,
      duration: estimatedMinutes,
    };
  } catch (err) {
    console.warn("General metadata scrape failed, using fallback:", err);
    return fallbackMetadata(url, domain, defaultFavicon, forcedType);
  }
}

function fallbackMetadata(
  url: string,
  domain: string,
  defaultFavicon: string,
  type?: "youtube" | "github" | "reddit" | "article" | "website"
): ExtractedMetadata {
  // Graceful fallback allows user to manually edit
  let title = domain;
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.split("/").filter(Boolean).pop();
    if (pathname) {
      title = pathname.replace(/[-_]/g, " ").replace(/\.\w+$/, "");
      title = title.charAt(0).toUpperCase() + title.slice(1);
    }
  } catch {}

  return {
    url,
    domain,
    title,
    description: "",
    type: type || "website",
    thumbnailUrl: null,
    faviconUrl: defaultFavicon,
    duration: 5,
  };
}
