# Creator Protection Features

This document covers the image protection system designed to help visual artists protect their work from unauthorized use, including watermarking, download prevention, and AI training opt-out features.

## Overview

The creator protection system provides multiple layers of defense for artists' work:

1. **Watermarking** - Permanent watermarks applied during upload
2. **Download Prevention** - Client-side measures to deter casual downloading
3. **AI Training Opt-Out** - Signals to AI crawlers to not use content for training

> **Important**: These protections are deterrents, not guarantees. Determined users can still capture images via screenshots or other methods. The goal is to make unauthorized use more difficult and signal clear ownership.

## User Settings

Artists can configure their protection preferences in the profile settings (`/profile/edit`). All settings are stored in the `User` model:

| Setting | Field | Default | Description |
|---------|-------|---------|-------------|
| Watermark | `enableWatermark` | `false` | Apply watermark to uploaded images |
| Watermark Position | `watermarkPosition` | `"bottom-right"` | Corner placement for watermark |
| Download Prevention | `protectFromDownload` | `true` | Enable client-side download deterrents |
| AI Protection | `protectFromAI` | `true` | Request AI models not train on work |

### Watermark Position Options

- `"bottom-right"` (default)
- `"bottom-left"`
- `"top-right"`
- `"top-left"`

## Watermarking System

### How It Works

Watermarks are applied **server-side during upload**, making them permanent and non-removable:

```
┌──────────────┐     ┌─────────────────┐     ┌────────────────┐
│   Browser    │────▶│  /api/upload    │────▶│  Sharp Library │
│  (file)      │     │                 │     │  (watermark)   │
└──────────────┘     └─────────────────┘     └────────────────┘
                                                     │
                                                     ▼
                                             ┌────────────────┐
                                             │  Cloudflare R2 │
                                             │  (watermarked  │
                                             │   image stored)│
                                             └────────────────┘
```

### Key Characteristics

- **Destructive**: The original unwatermarked image is NOT stored
- **Permanent**: To remove or change a watermark, the user must re-upload the original image
- **Corner Placement**: Watermarks are positioned in a corner, not overlaying the entire image
- **Proportional Sizing**: Watermark size scales based on image dimensions (12% of shorter dimension)
- **Semi-Transparent**: 50% opacity by default

### Supported Formats

Watermarking is applied to:
- JPEG/JPG
- PNG
- WebP

**Not supported**: GIF (animated images cannot be reliably watermarked)

### Upload Flow with Watermarking

When a user has watermarking enabled:

1. **Presign Route Check**: The `/api/upload/presign` endpoint detects watermarking is enabled
2. **Server Upload Redirect**: Returns `{ useServerUpload: true }` to signal client
3. **Server-Side Processing**: Client uploads to `/api/upload` instead of direct R2 upload
4. **Watermark Applied**: Sharp library applies watermark before storing in R2
5. **Metadata Injection**: If AI protection is enabled, copyright metadata is embedded

```typescript
// Client-side handling
const presignData = await presignResponse.json();

if (presignData.useServerUpload) {
  // Fall back to server-side upload for watermarking
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", "submission");
  
  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });
}
```

### Watermark Implementation

The watermark utility (`lib/watermark.ts`) provides:

```typescript
// Apply watermark with margin
const watermarkedBuffer = await applyWatermarkWithMargin(imageBuffer, {
  position: "bottom-right",  // Corner position
  opacity: 0.5,              // Semi-transparent
  sizeRatio: 0.12,           // 12% of shorter dimension
  marginRatio: 0.2,          // 20% margin from edge
});

// Add copyright metadata
const finalBuffer = await addImageMetadata(watermarkedBuffer, artistName);
```

### UI Indicator

When watermarking is enabled, users see an indicator below upload areas:

- **Submission Slots** (`/prompt/play`): Shows shield icon with "Watermark will be applied to uploads" and link to settings
- **Portfolio Item Form**: Same indicator when creating/editing portfolio items

## Download Prevention

### Client-Side Measures

The `ProtectedImage` component (`components/protected-image.tsx`) applies several deterrents:

| Technique | Purpose |
|-----------|---------|
| `onContextMenu` prevention | Blocks right-click context menu |
| `draggable={false}` | Prevents drag-and-drop saving |
| `user-select: none` | Prevents selection |
| `pointer-events: none` | Blocks direct interaction |
| `-webkit-touch-callout: none` | Prevents iOS long-press save |
| Transparent overlay | Intercepts click/touch events |

### Implementation

```tsx
import { ProtectedImage } from "@/components/protected-image";

// Next.js Image with protection
<ProtectedImage
  src={imageUrl}
  alt="Artwork"
  width={800}
  height={600}
  protectionEnabled={true}  // Toggle protection
/>

// Native img with protection
<ProtectedNativeImg
  src={imageUrl}
  alt="Artwork"
  protectionEnabled={true}
/>
```

### Protected Components

These components have download prevention built-in:

- `components/submission-image.tsx`
- `components/submission-lightbox.tsx`
- `components/image-lightbox.tsx`
- `components/portfolio-grid.tsx`
- `app/prompt/this-week/gallery-grid.tsx`

### Global CSS

Additional protection via `app/globals.css`:

```css
.protected-image-wrapper img {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  user-select: none;
}
```

## AI Training Opt-Out

### Multi-Layer Approach

AI opt-out signals are implemented at multiple levels:

1. **robots.txt** - Crawler-level blocking
2. **HTTP Headers** - Page-level signals via `X-Robots-Tag`
3. **Image Metadata** - File-level copyright information

### robots.txt

The `public/robots.txt` file blocks known AI training crawlers:

```
# AI Training Crawlers - Explicitly Disallowed
User-agent: GPTBot
Disallow: /

User-agent: ChatGPT-User
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: anthropic-ai
Disallow: /

User-agent: Claude-Web
Disallow: /

# ... additional AI bots
```

**Blocked Crawlers:**
- GPTBot, ChatGPT-User (OpenAI)
- Google-Extended (Google AI)
- CCBot (Common Crawl)
- anthropic-ai, Claude-Web (Anthropic)
- Cohere-ai
- PerplexityBot
- Bytespider (ByteDance)
- FacebookBot, meta-externalagent (Meta)
- Applebot-Extended (Apple)
- img2dataset
- Diffbot
- Omgili, omgilibot
- YouBot

### HTTP Headers

The `proxy.ts` file adds `X-Robots-Tag` headers to user content pages:

```typescript
// Protected paths
const AI_PROTECTED_PATHS = [
  "/s/",           // Submission pages
  "/profile/",     // Profile pages
  "/this-week",    // Gallery pages
  "/prompt/",      // Prompt-related pages
  "/portfolio/",   // Portfolio pages
  "/exhibit/",     // Exhibit pages
];

// Header added to responses
response.headers.set("X-Robots-Tag", "noai, noimageai");
```

### Image Metadata

When AI protection is enabled, copyright metadata is embedded in images:

```typescript
// EXIF metadata injection
await sharp(imageBuffer).withMetadata({
  exif: {
    IFD0: {
      Copyright: `© ${year} ${artistName}. All rights reserved. AI training prohibited.`,
      Artist: artistName,
      Software: "CreateSpot",
    },
  },
});
```

This metadata persists even if images are downloaded and redistributed.

## Database Schema

```prisma
model User {
  // ... existing fields
  
  // Image protection settings
  enableWatermark      Boolean  @default(false)
  watermarkPosition    String   @default("bottom-right")
  protectFromDownload  Boolean  @default(true)
  protectFromAI        Boolean  @default(true)
}
```

## API Endpoints

### Update Protection Settings

**PUT** `/api/profile`

```typescript
// Request body (partial update)
{
  enableWatermark: true,
  watermarkPosition: "bottom-left",
  protectFromDownload: true,
  protectFromAI: true
}
```

### Get Protection Settings

**GET** `/api/profile`

Returns user profile including protection settings.

## Files Reference

| File | Purpose |
|------|---------|
| `lib/watermark.ts` | Watermark generation and metadata injection |
| `components/protected-image.tsx` | Download prevention wrapper component |
| `app/api/upload/route.ts` | Server-side upload with watermarking |
| `app/api/upload/presign/route.ts` | Presign route with watermark detection |
| `proxy.ts` | HTTP headers for AI opt-out |
| `public/robots.txt` | AI crawler blocking rules |
| `app/profile/edit/profile-edit-form.tsx` | Protection settings UI |

## Limitations & Considerations

### What These Protections Cannot Prevent

1. **Screenshots**: Users can always take screenshots
2. **Browser DevTools**: Technically savvy users can extract images
3. **Screen Recording**: Video capture of the browser window
4. **Non-Compliant Crawlers**: Some AI systems may ignore robots.txt

### Best Practices for Artists

1. **Enable Watermarking**: Most effective deterrent against direct reuse
2. **Use Corner Watermarks**: Less intrusive but still visible
3. **Upload High-Quality Originals**: Keep unwatermarked masters locally
4. **Monitor Usage**: Periodically search for your work online
5. **Document Ownership**: Keep dated records of your original work

## Translations

Translation keys for protection features are in `messages/{locale}.json` under:

- `profile.imageProtection.*` - Settings UI labels
- `upload.watermarkEnabled` - Upload area indicator
- `upload.changeSettings` - Link to settings

### English (`en.json`)

```json
{
  "profile": {
    "imageProtection": "Image Protection",
    "enableWatermark": "Add watermark to submissions",
    "watermarkWarningTitle": "Important: Watermarks are permanent",
    "watermarkWarningMessage": "Watermarks are applied when you upload. The original unwatermarked image is not stored. To remove or change a watermark, you'll need to re-upload your original image.",
    "watermarkPosition": "Watermark position",
    "bottomRight": "Bottom Right",
    "bottomLeft": "Bottom Left",
    "topRight": "Top Right",
    "topLeft": "Top Left",
    "preventDownloads": "Prevent easy image downloads",
    "preventAITraining": "Request AI models not train on my work",
    "protectionSettingsSaved": "Protection settings saved",
    "protectionDisclaimer": "Note: These protections help deter unauthorized use but cannot prevent all forms of image capture (like screenshots). Watermarks provide the strongest protection."
  },
  "upload": {
    "watermarkEnabled": "Watermark will be applied to uploads.",
    "changeSettings": "Change settings"
  }
}
```
