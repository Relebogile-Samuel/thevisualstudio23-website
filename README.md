# The Visual Studio — website

A static portfolio site for **The Visual Studio**, Vanderbijlpark.
It uses the studio's real Instagram archive — 124 photographs and 6 films across 7 categories.

## Open it

Double-click `index.html`. The site works straight from disk (no build step, no server required).

To preview it the way it will behave online, run a small local server from this folder:

```powershell
python -m http.server 4173
```

Then open <http://127.0.0.1:4173/>.

## What is inside

| Path | Purpose |
| --- | --- |
| `index.html` | Page structure and all written content |
| `css/style.css` | Design system, layout and responsive rules |
| `js/data.js` | The archive: 130 items, categories and featured assets |
| `js/app.js` | Filtering, gallery, lightbox, menu and booking form |
| `assets/media/full/` | Optimised full-size images (max 1600 px) |
| `assets/media/thumb/` | Gallery thumbnails (max 640 px) |
| `assets/media/video/` | Six MP4 films |
| `assets/fonts/` | Self-hosted Cormorant Garamond and Jost |
| `assets/img/` | Studio avatar and favicon |

## Categories

Weddings · Traditional & Makoti · Graduations · Portraits · Fashion & Pageants · Events · Celebrations

There is also a **Films only** toggle in the portfolio toolbar.

## Booking enquiries

The contact form does not use a backend. On submit it opens WhatsApp with a prefilled message
to **079 190 5643** (`+27791905643`). Nothing is stored by the site.

## Editing content

- **Text and sections:** edit `index.html`.
- **Photos, titles, categories:** edit `js/data.js`. Each item has `src` (full image), `thumb`,
  `title`, `desc`, `cat`, `date`, `w`/`h`, `orientation` and `alt`.
- **Colours and spacing:** the design tokens are at the top of `css/style.css`.
- **Phone / Instagram:** search for `27791905643` and `thevisualstudio23`.

If you add a new photo, place the full-size file in `assets/media/full/`, a thumbnail in
`assets/media/thumb/`, and add an object to the `items` array in `js/data.js`.

## Publishing

The folder is ready for any static host — Netlify Drop, Cloudflare Pages, GitHub Pages or
ordinary cPanel hosting. Upload the contents of this `website` folder; no configuration is needed.

Before publishing to a real domain, update the `og:image` meta tag in `index.html` to an absolute
URL (for example `https://yourdomain.co.za/assets/media/full/...jpg`) so link previews work.
