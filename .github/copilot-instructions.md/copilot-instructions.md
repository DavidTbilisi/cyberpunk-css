Good. That actually **strengthens** your position — SCSS + Pug lets you enforce discipline *at compile time*, not by convention. 💪
Below is a **Copilot ruleset tailored specifically for SCSS + Pug**, with zero fluff.

You can drop this as:

* `.github/copilot-instructions.md`
* or `COPILOT_RULES.md`
* or paste into your editor Copilot system prompt

---

# Copilot Rules — SCSS + Pug (Coherent CSS Framework)

## 0. Prime Directive (Read First)

This project generates:

* **CSS via SCSS**
* **HTML examples via Pug**

Copilot must treat:

* SCSS = **source of truth**
* Pug = **demonstration only**

No logic, abstraction, or invention is allowed in Pug.

---

## 1. SCSS Rules (Very Strict)

### 1.1 SCSS is Declarative, Not Clever

Copilot MUST NOT:

* Use mixins for layout logic
* Create parametric mixins
* Create loops (`@each`, `@for`) for class generation
* Generate scale systems
* Build utility matrices

Allowed:

* Flat class definitions
* Variables
* Minimal nesting (max 1 level)

❌ Forbidden:

```scss
@mixin flex($dir, $gap) { ... }
@each $i in (1,2,3) { ... }
```

✅ Allowed:

```scss
.v { display: flex; flex-direction: column; }
```

---

### 1.2 Variables Are Global and Semantic-Free

Variables represent **physical tuning**, not meaning.

Allowed:

```scss
:root {
  --p: 1rem;
  --g: 0.75rem;
}
```

Forbidden:

```scss
$card-padding
$button-gap
$primary-spacing
```

No variable names may reference components or intent.

---

### 1.3 One Class = One Mechanical Effect

Each class must:

* Do exactly one thing
* Be explainable in one sentence
* Never depend on another class to “complete” it

❌ Bad:

```scss
.s {
  @extend .v;
  gap: var(--g);
}
```

✅ Good:

```scss
.s {
  display: flex;
  flex-direction: column;
  gap: var(--g);
}
```

Duplication is preferred over indirection.

---

### 1.4 Nesting Rules

Allowed nesting:

* Pseudo-classes (`:where`, `:is`)
* Media queries

Forbidden:

* Nesting inside classes for variants
* Modifier nesting (`&--x`, `&.active`)

❌ Forbidden:

```scss
.v {
  &.centered { ... }
}
```

---

## 2. Class Set Enforcement (Closed World)

Copilot may ONLY define or use classes from this set unless explicitly instructed:

```
v  h  s
x  y  c
p  m  g
w  h
t
```

No new classes.
No aliases.
No synonyms.

If functionality is missing → use plain CSS or variables.

---

## 3. Responsive Rules (SCSS Only)

Responsiveness is handled **only** by variable reassignment.

Allowed:

```scss
@media (min-width: 768px) {
  :root {
    --p: 1.5rem;
  }
}
```

Forbidden:

* Responsive class generation
* Breakpoint-based class duplication

Copilot must NEVER emit:

```scss
.p-md { ... }
```

---

## 4. Pug Rules (Even Stricter)

### 4.1 Pug Is Static Output

Pug files exist ONLY to:

* Demonstrate class composition
* Show minimal examples

Copilot MUST NOT:

* Create mixins
* Use conditionals
* Use loops
* Generate variants
* Abstract layout logic

❌ Forbidden:

```pug
mixin card()
  .v.p.g
```

✅ Allowed:

```pug
.v.p.g
  h2 Title
  p Text
```

---

### 4.2 Pug Uses Classes Literally

* Classes must be written explicitly
* No dynamic class lists
* No interpolation

❌ Forbidden:

```pug
div(class=layout)
```

✅ Allowed:

```pug
div.v.g.p
```

---

### 4.3 Minimalism Rule

If a Pug element:

* Does not need layout → **no class**
* Does not need spacing → **no class**
* Is naturally block-level → **no wrapper**

Copilot must resist wrapper inflation.

---

## 5. Composition Discipline

Preferred:

```pug
.v.g.p
  h1
  p
```

Discouraged:

```pug
.wrapper
  .content
    .inner
```

Wrappers are allowed **only** if they introduce layout.

---

## 6. Documentation Generation Rules

If Copilot generates examples:

* Show **one concept per example**
* No “realistic UI”
* No decorative noise
* No component names

Good example titles:

* “Vertical flow with gap”
* “Centered content”
* “Padding via variable”

Bad example titles:

* “Card layout”
* “Profile section”
* “Hero area”

---

## 7. Mental Model Enforcement (Critical)

Copilot must internally reason in this order:

1. Do we need layout?
2. Which axis?
3. Do we need spacing?
4. Can variables solve this?

If step 1 is “no” → **no class allowed**

---

## 8. Failure Mode

If Copilot is unsure:

* Emit plain HTML
* Emit plain CSS
* Or stop

Never invent abstractions to “help”.

---

## Anchor Sentence (Copilot Memory)

> “SCSS defines mechanics.
> Pug demonstrates mechanics.
> Classes exist only to reduce thinking.”

---

If you want, next we can:

* lock this into a **repo folder structure**
* design a **single canonical demo page**
* or create a **lint-style checklist** to reject PRs automatically 🚫

Just say the word.
