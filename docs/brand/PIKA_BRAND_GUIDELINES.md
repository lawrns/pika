# Pika Brand Guidelines

This document establishes the visual, verbal, and product-brand system for Pika. It is written so designers and IDE agents can implement the landing page, mobile web payer flow, and app UI consistently.

## 1. Brand position

Pika is the social payment-request layer for Mexico: the simplest way to ask for and receive money by phone. The core behavior is not “send money.” The core behavior is “mándame un Pika”: a social, WhatsApp-native request that makes collecting money feel like sending a message.

Pika is not a bank, wallet, neobank, or balance product at launch. It is a UX and orchestration layer on top of SPEI / DiMo through a licensed partner. The payer should never need to install Pika to pay.

## 2. Brand personality

Pika should feel fast, social, safe, Mexican, young, and friendly without becoming childish.

Primary traits:
- Instant: everything should feel one tap away.
- Social: payment requests live inside WhatsApp conversations.
- Low-friction: no CLABE complexity in the public message; no app install for payers.
- Playful: bright color, stickers, confetti, and simple illustrations.
- Trustworthy: clear identity, amount, concept, status, and receipt states.

Avoid:
- Bank-like coldness.
- Crypto / fintech darkness.
- Corporate-blue sameness.
- Overly technical payment language in consumer surfaces.
- Generic “wallet” positioning.

## 3. Visual reference direction

The supplied reference image defines the first visual direction:

- Bright purple full-bleed background.
- White rounded logotype.
- Green primary registration CTA.
- Yellow payment CTA.
- Rounded, soft interface edges.
- Friendly flat illustration of a person using a phone.
- Confetti, flowers, stars, dots, and leaf shapes as a recurring decorative system.
- High contrast, simple hierarchy, mobile-first composition.

The final product should feel like the reference, but cleaner and more usable for an actual fintech product.

## 4. Logo system

Wordmark: `pika` in lowercase.

Symbol: four-petal abstract mark, similar to a butterfly / sparkle / flower. It should imply lightness, movement, and social spread.

Usage:
- Primary logo: white symbol + white `pika` on purple.
- Secondary logo: purple symbol + purple `pika` on white.
- Small spaces: symbol only.
- Never use all caps for the wordmark.
- Never add financial icons inside the logo.

Clear space: keep at least the height of the symbol around the full logo.

Minimum sizes:
- Full logo web: 96 px wide.
- Full logo mobile: 84 px wide.
- Icon only: 32 px.

## 5. Color system

Use these tokens exactly unless design review replaces them.

```css
:root {
  --pika-purple-950: #24004F;
  --pika-purple-900: #3B078F;
  --pika-purple-800: #4F12B8;
  --pika-purple-700: #6419D6;
  --pika-purple-600: #7427E8;
  --pika-purple-500: #7B2FF2;
  --pika-purple-400: #9B63FF;
  --pika-purple-100: #EFE4FF;

  --pika-yellow-500: #FFC52E;
  --pika-yellow-400: #FFD65C;
  --pika-yellow-100: #FFF2BF;

  --pika-green-600: #22A952;
  --pika-green-500: #2FCB67;
  --pika-green-100: #DDF8E7;

  --pika-orange-500: #FF7A3D;
  --pika-coral-500: #FF5D5D;
  --pika-teal-500: #20B8C8;

  --pika-ink-950: #17102A;
  --pika-ink-800: #2A2140;
  --pika-ink-600: #5B5270;
  --pika-ink-400: #8F88A2;
  --pika-ink-100: #F6F3FA;
  --pika-white: #FFFFFF;
}
```

Primary brand background: purple 500 / 600 gradient.

Recommended hero gradient:

```css
background:
  radial-gradient(circle at 16% 18%, rgba(255, 197, 46, 0.22) 0 8%, transparent 18%),
  radial-gradient(circle at 84% 20%, rgba(47, 203, 103, 0.20) 0 7%, transparent 18%),
  linear-gradient(135deg, #6419D6 0%, #7B2FF2 48%, #4F12B8 100%);
```

CTA colors:
- Primary payment action: yellow background, ink text.
- Registration / secondary conversion: green background, white text.
- Destructive or warning: coral only for actual risk / error states.

Accessibility:
- White text on purple is acceptable.
- Ink text on yellow is preferred over white on yellow.
- Green buttons require white text and a darker hover.
- Do not place small yellow text on purple.

## 6. Typography

Use a rounded sans-serif with strong readability. Preferred stack:

```css
--font-display: "Nunito Sans", "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
--font-body: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

If a single family is required, use Nunito Sans across all UI.

Hero display:
- Weight: 800–900.
- Tracking: -0.03em.
- Line height: 0.95–1.05.

Body:
- Weight: 500–600 for consumer marketing copy.
- Line height: 1.35–1.55.

UI labels:
- Weight: 700 for buttons and key labels.
- Avoid thin weights.

## 7. Shape language

Pika is rounded and soft.

```css
--radius-xs: 8px;
--radius-sm: 12px;
--radius-md: 18px;
--radius-lg: 28px;
--radius-xl: 36px;
--radius-pill: 999px;
```

Buttons: pill radius.
Cards: 24–32 px radius.
Phone mockups: 36–44 px radius.
Inputs: 16–20 px radius.

Avoid sharp corners except in technical backend/admin surfaces.

## 8. Illustration style

Flat vector illustration. Use bold color fills, simple face details, minimal shadowing, and friendly human scenes.

Characters:
- Rounded features.
- Warm skin tones.
- Casual clothing.
- Holding phones or interacting with friends.
- Avoid overly corporate SaaS characters.

Decorative elements:
- Confetti dots.
- Small leaves.
- Four-petal flowers.
- Starbursts.
- Hearts for successful social payment moments.
- Lightweight money cues only when necessary: coins, receipts, QR, phone, check marks.

Do not overuse bank icons, cards, vaults, crypto, or money bags.

## 9. Iconography

Use thick, rounded line icons or filled friendly icons. Stroke width: 2.25–2.75 px at 24 px.

Core icons:
- Phone.
- WhatsApp / chat bubble.
- QR.
- Check circle.
- Clock / pending.
- Bell / reminder.
- Shield / verified.
- Split bill.
- Link.

## 10. Motion language

Motion should be fast, elastic, and reassuring.

Recommended timings:
- Tap feedback: 80–120 ms.
- Page transition: 180–260 ms.
- Success animation: 500–900 ms.
- Confetti burst on paid confirmation: 700–1100 ms.

Motion rules:
- Use small scale bounces for buttons.
- Use checkmark draw animation on payment success.
- Use subtle floating confetti in hero only if performance is not harmed.
- Never animate critical payment information in a way that reduces readability.

## 11. Voice and copy

Language: Spanish-first for Mexico. English can exist in internal docs, investor pages, or developer surfaces only.

Core sentence: `Mándame un Pika.`

Primary copy territory:
- “Envía tu pago con Pika.”
- “La app para pagarle a tus amigos al instante.”
- “Divide la cuenta sin hacerla de tos.”
- “Sin CLABE, sin rollo. Solo tu número.”
- “Te mando un Pika y listo.”

Tone:
- Direct.
- Casual Mexican Spanish.
- Short sentences.
- Friendly, not childish.
- Do not overexplain rails on consumer pages.

Avoid:
- “Wallet.”
- “Custodia.”
- “Institución financiera.”
- “Transferencia interbancaria SPEI liquidada…” on consumer UI unless legally required.

## 12. Product trust copy

Always show:
- Who is asking.
- Amount.
- Concept.
- Expiration / status.
- Payment destination / verified identity when available.

Suggested payer page copy:

Title: `{{requester_name}} te está cobrando {{amount}}`

Subtitle: `Por: {{concept}}`

Primary CTA: `Pagar ahora`

Trust note: `Pagas desde tu banco. Pika no guarda tu dinero.`

After payment: `Listo. Tu pago fue enviado.`

Pending state: `Estamos confirmando tu pago.`

Failed state: `No se pudo confirmar el pago. Intenta de nuevo o revisa tu banco.`

## 13. UI layout principles

Mobile-first. Payer flow must be fastest on phone.

Hierarchy:
1. Amount.
2. Requester identity.
3. Concept.
4. Primary CTA.
5. Trust / receipt information.

Landing page hierarchy:
1. Logo.
2. Hero claim.
3. Benefit line.
4. Primary action.
5. App / phone visual.
6. Social proof / use cases.

Use generous spacing and large buttons. Minimum tap target: 48 x 48 px.

## 14. Brand components

Primary Button:
- Background: yellow 500.
- Text: ink 950.
- Radius: pill.
- Height: 56 px mobile, 60 px desktop.
- Font: 700 / 18 px.
- Shadow: `0 10px 24px rgba(23, 16, 42, 0.18)`.

Secondary Button:
- Background: green 600.
- Text: white.
- Radius: pill.
- Height: 52–56 px.

Pill badge:
- Background: purple 100 or green 100.
- Text: purple 900 or green 600.
- Radius: pill.

Payment request card:
- White background.
- Radius: 28 px.
- Padding: 24 px.
- Amount large and bold.
- Concept as secondary text.
- Status pill.

## 15. Landing page visual spec

Desktop hero:
- Full viewport min-height: 720 px.
- Purple gradient background.
- Decorative confetti layer absolute positioned.
- Navigation top: logo left, registration CTA right.
- Hero content centered or left-center depending layout.
- Main headline max width: 760 px.
- CTA directly below subtitle.
- Character illustration and phone mockup should reinforce the payment moment.

Mobile hero:
- Single column.
- Logo top left.
- Optional menu or register button top right.
- Headline 48–56 px if possible; minimum 42 px.
- CTA 100% width or 280 px centered.
- Phone mockup below CTA.
- Keep above-the-fold action visible on 390 x 844 viewport.

## 16. Responsive breakpoints

```css
--bp-xs: 360px;
--bp-sm: 480px;
--bp-md: 768px;
--bp-lg: 1024px;
--bp-xl: 1280px;
--bp-2xl: 1536px;
```

## 17. CSS token starter

```css
.pika-button-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 56px;
  padding: 0 32px;
  border: 0;
  border-radius: 999px;
  background: var(--pika-yellow-500);
  color: var(--pika-ink-950);
  font: 800 18px/1 var(--font-display);
  box-shadow: 0 10px 24px rgba(23, 16, 42, 0.18);
  cursor: pointer;
  transition: transform 120ms ease, box-shadow 120ms ease, background 120ms ease;
}

.pika-button-primary:hover {
  background: var(--pika-yellow-400);
  transform: translateY(-1px);
  box-shadow: 0 14px 30px rgba(23, 16, 42, 0.22);
}

.pika-button-primary:active {
  transform: translateY(1px) scale(0.99);
}
```

## 18. Design QA checklist

Before shipping any Pika consumer UI:
- Is it Spanish-first?
- Does it avoid wallet/bank positioning?
- Does the payer understand who is asking and why?
- Is the primary CTA visible in the first viewport?
- Does it work on a 390 px wide phone?
- Are all buttons at least 48 px tall?
- Is the page still usable without illustration assets?
- Are trust states clear: pending, paid, failed, expired?
- Does it feel like WhatsApp-native social payment, not a bank portal?
