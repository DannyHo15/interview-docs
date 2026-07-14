import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: "Interview Notes",
  tagline:
    "Tài liệu ôn phỏng vấn — Fullstack · Backend · Frontend · React Native · System Design · DevOps · Behavioral",
  favicon: "img/favicon.ico",

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true,
  },

  // Set the production url of your site here
  url: "https://docs.danny.io.vn",
  // Set the /<baseUrl>/ pathname under which your site is served
  baseUrl: "/",

  onBrokenLinks: "warn",

  markdown: {
    hooks: {
      onBrokenMarkdownLinks: "warn",
    },
  },

  i18n: {
    defaultLocale: "vi",
    locales: ["vi"],
  },

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          // Remove editUrl to disable "edit this page" links
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: "Interview Notes",
      items: [
        { to: "/docs/study-plan", label: "📅 Study Plan", position: "left" },
        { to: "/docs/algorithms", label: "Algorithms", position: "left" },
        {
          type: "dropdown",
          label: "Frontend",
          position: "left",
          items: [
            { to: "/docs/frontend", label: "Frontend" },
            { to: "/docs/react-native", label: "React Native" },
            { to: "/docs/frontend-system-design", label: "FE System Design" },
          ],
        },
        {
          type: "dropdown",
          label: "Backend & Systems",
          position: "left",
          items: [
            { to: "/docs/backend", label: "Backend" },
            { to: "/docs/system-design", label: "System Design" },
            { to: "/docs/data-dashboard", label: "Data Dashboard" },
          ],
        },
        {
          type: "dropdown",
          label: "AI & DevOps",
          position: "left",
          items: [
            { to: "/docs/ai-engineering", label: "AI Engineering" },
            { to: "/docs/devops", label: "DevOps" },
            { to: "/docs/poc-ai-builder", label: "PoC AI Builder" },
          ],
        },
        {
          type: "dropdown",
          label: "Career",
          position: "left",
          items: [
            { to: "/docs/cv/cv-deep-dive", label: "CV" },
            { to: "/docs/behavioral", label: "Behavioral" },
          ],
        },
        { to: "/docs/case-studies", label: "Bài toán thực tế", position: "left" },
      ],
    },
    footer: {
      style: "dark",
      copyright: `Copyright © ${new Date().getFullYear()} Ho Thanh Danh. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ["bash", "json", "yaml", "tsx", "jsx"],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
