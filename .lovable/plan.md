Update Hero Design While Preserving 3D Scroll Effect

Objective

Modernize the landing page hero area while keeping the existing 3D scroll interaction. The current 3D scroll animation must NOT be removed. Instead, enhance it visually and insert a new modern HeroSection above it. The goal is to keep the interactive 3D scroll but upgrade the visual design to feel more premium, realistic, and modern (not cartoonish or amateur).

Important Rules

- Do NOT remove or break the existing 3D scroll component.

- Do NOT remove ContainerScroll logic or scroll interaction.

- The 3D behavior must remain exactly functional.

- Only modernize visuals and integrate a new hero section above it.

- The 3D visuals should feel realistic, premium, and polished rather than stylized or cartoon-like.

Summary of Changes

1. Keep the existing 3D scroll section (ContainerScroll)

2. Add a new modern HeroSection above it

3. Improve styling so the 3D scroll area feels realistic and premium

4. Update colors and typography to match a modern SaaS aesthetic

5. Maintain all current animations but improve visual presentation

---------------------------------------------------------------------

1. New File

src/components/ui/hero-section-dark.tsx

Create a modern HeroSection component inspired by the provided reference.

Requirements

- Remove "use client"

- Replace Next.js Image with standard <img>

- Include a subtle animated background (RetroGrid or soft grid)

- Support the following props:

  - title

  - subtitle

  - gradientSubtitle

  - description

  - CTA button

Design style

- Dark modern SaaS aesthetic

- Soft glowing gradients

- Elegant spacing

- Premium feel

Hero structure

Headline  

Large, elegant headline using a serif font.

Subtitle  

Gradient highlighted phrase.

Description  

Short SaaS positioning text.

CTA  

Single pill-shaped button.

This hero should sit ABOVE the 3D scroll section.

---------------------------------------------------------------------

2. Update Landing Page

src/pages/LandingPage.tsx

Goal

Add the new HeroSection without removing the current 3D scroll experience.

Steps

1. Import the new component

HeroSection from:

src/components/ui/hero-section-dark.tsx

2. Insert the HeroSection ABOVE the current ContainerScroll section.

Structure should become:

HeroSection (new modern section)

ContainerScroll (existing 3D scroll section)

3. DO NOT remove:

- ContainerScroll import

- ContainerScroll animation

- Scroll interaction logic

- Any framer-motion scroll hooks currently used

4. Only improve styling around the 3D scroll container so it feels more modern.

---------------------------------------------------------------------

3. Improve the 3D Scroll Visual Quality

The current 3D scroll effect must be upgraded visually.

Goals

- Make it look like a real product preview

- More realistic depth

- Premium lighting

- Modern shadows

- Smooth perspective transforms

Improvements

Add or improve:

- perspective depth

- subtle shadows

- soft lighting gradients

- glass / reflection effects

- blur depth layers

- smooth motion easing

Avoid:

- cartoon effects

- flat illustrations

- exaggerated animations

- low-quality shadows

The result should resemble a premium SaaS product showcase.

Think of styles similar to:

- Apple product pages

- Stripe landing animations

- [Linear.app](http://Linear.app) product sections

---------------------------------------------------------------------

4. Update Color Palette

src/index.css

Change the palette from vivid blue/purple to a softer modern gradient.

Primary color

Change:

217 91% 60%

To something softer such as:

280 30% 60%

Gradient text

Update .text-gradient-primary to use:

lavender  

rose  

soft cream

Example gradient flow

lavender → pink → light cream

Update any glow elements and shadows to match the new palette.

---------------------------------------------------------------------

5. Update Typography

Add a serif display font for the hero headline.

Suggested fonts

DM Serif Display  

or  

Playfair Display

Steps

Add Google Fonts import in:

index.html

Update:

tailwind.config.ts

Add a font family such as:

font-display

Apply this font ONLY to the hero headline for a premium look.

Keep the rest of the UI using the existing sans-serif font.

---------------------------------------------------------------------

6. Cleanup

Remove unused imports only if they are not part of the 3D scroll system.

DO NOT remove:

ContainerScroll component  

3D scroll logic  

scroll animations  

Only remove:

HeroAnimation if unused.

---------------------------------------------------------------------

7. Add Premium 3D Depth Enhancement

To make the 3D section feel more realistic and modern (not flat or amateur), apply additional visual depth improvements to the ContainerScroll section.

Enhancements to apply:

- Add stronger perspective context to the container:

perspective: 1400px

transform-style: preserve-3d

- Improve shadow realism:

Use layered shadows such as:

box-shadow:

0 40px 80px rgba(0,0,0,0.35),

0 20px 40px rgba(0,0,0,0.25)

- Add subtle glass reflection overlay:

background: linear-gradient(

  180deg,

  rgba(255,255,255,0.08),

  rgba(255,255,255,0.02)

)

- Add depth blur for background elements

filter: blur(20px)

- Add smooth motion easing for scroll transforms

transition:

transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)

These improvements should make the scroll animation look like a premium SaaS product preview instead of a flat animation.

---------------------------------------------------------------------

Final Expected Result

The landing page should now have:

1. A modern SaaS hero section

2. Elegant typography and gradients

3. A preserved 3D scroll interaction

4. A more realistic and premium 3D product showcase

5. A cohesive modern design system

Visual structure

HeroSection (modern, dark, premium)

3D Scroll Section (existing interaction but visually upgraded)

Remaining landing page sections unchanged.