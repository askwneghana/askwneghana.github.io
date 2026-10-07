# ASKWNE Ghana Ltd — Premium Static Website

This build is structured for GitHub Pages with clean directory URLs.

## Main routes

- `/` — homepage
- `/about/` — company and credibility
- `/bitumen/` — bitumen supply desk
- `/building/` — building construction
- `/construction/` — road construction
- `/appointment/` — project appointment / enquiry

The old generic Services and Projects routes have been removed from the public navigation and replaced with the three focused business lanes above.

## Frameworks

Bootstrap 5.3.8 and the compiled Tailwind CSS 3.4.19 utility stylesheet are loaded from jsDelivr, while `assets/css/tailwind.css` contains a small local utility layer for site-specific composition. This keeps the deployed project zero-build and compatible with GitHub Pages.

## Clean URLs on GitHub Pages

The pages live in folders with their own `index.html` files. That is why a page is exposed as `/about/` rather than `/about.html`. The home page is simply `/`.

For the custom domain, point `www` and the apex according to the DNS instructions supplied by your domain/DNS provider, then enable HTTPS in GitHub Pages.

## Static appointment flow

The appointment form does not send data to a server. It prepares a message for WhatsApp or Email, which keeps the project compatible with free static hosting.
