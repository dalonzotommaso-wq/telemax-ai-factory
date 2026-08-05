# Gruppo AIR Blog — project structure

```
gruppo-air-blog/
├── style.css                 Theme metadata + scaffold styles
├── theme.json                Block theme settings
├── functions.php             Theme bootstrap (includes inc/*)
├── front-page.php            Homepage layout
├── index.php                 Blog index fallback
├── single.php                Single article layout
├── category.php              Category layout
├── archive.php               Archive layout
├── page.php                  Static page layout
├── header.php                Site header
├── footer.php                Site footer
├── sidebar.php               Primary sidebar
├── robots.txt                Crawler directives
├── manifest.webmanifest      Web app manifest
├── config/
│   ├── ads.config.json       Ad slot configuration
│   └── sitemap.config.json   Sitemap configuration
├── inc/
│   ├── seo.php               SEO helpers
│   ├── schema.php            Schema.org (NewsMediaOrganization)
│   ├── widgets.php           Widget areas
│   └── sitemap.php           Sitemap configuration
├── template-parts/
│   ├── navigation.php        Primary menu
│   ├── ads/                  Ad blocks (leaderboard, sidebar, in-article)
│   ├── seo/meta-tags.php     Open Graph / Twitter tags
│   └── schema/newsarticle.php NewsArticle JSON-LD
├── assets/images/            logos, icons, placeholders
└── docs/
    ├── PROJECT.md            Project overview
    └── NAMING-CONVENTIONS.md Naming conventions (from Knowledge Engine)
```
