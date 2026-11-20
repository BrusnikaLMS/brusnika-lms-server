"""Seed 5 blog articles. Run: python seed_blog.py"""
import asyncio, uuid, sys, os
sys.path.insert(0, os.path.dirname(__file__))

from datetime import datetime, timedelta

ARTICLES = [
    {
        "title": "Best SCORM Authoring Tools in 2026 (Free & Paid)",
        "slug": "best-scorm-authoring-tools-2026",
        "excerpt": "SCORM isn't dead — but most tools feel stuck in 2005. We compare the best SCORM authoring tools in 2026 by usability, flexibility, and cost.",
        "cover_image": "/uploads/blog/best-scorm-authoring-tools.svg",
        "tags": "scorm,authoring tools,e-learning,comparison",
        "published": True,
        "content": """## Introduction

SCORM isn't dead — but most tools that create SCORM courses feel like they are stuck in 2005.

If you've ever used traditional authoring tools, you know the pain:

- Complex timelines
- Slow production
- Expensive licenses
- Steep learning curve

In this guide, we'll break down the **best SCORM authoring tools in 2026**, comparing usability, flexibility, and cost — and what actually works today.

## What is a SCORM authoring tool?

A SCORM authoring tool allows you to:

- Create e-learning content
- Export it as SCORM 1.2 or 2004
- Upload it into an LMS

But the key difference today is not SCORM support — it's **how fast and flexible** you can build content.

## Top SCORM authoring tools

### 1. cforj — fastest way to build interactive SCORM courses

**Best for:** modern teams, fast production, interactive learning

cforj represents a new generation of authoring tools:

- Block-based editor (no timelines)
- AI course generation
- Interactive simulations (dialogues, hotspots, scenarios)
- SCORM + xAPI export in one click
- Works in browser, no installation

Instead of designing slides, you build **interactive learning flows**.

> **Key advantage: speed + flexibility**
> You can go from idea → working course in minutes, not days.

### 2. Articulate Storyline

**Best for:** experienced instructional designers

- Powerful timeline-based editor
- Deep customization
- Strong community

**Cons:**
- Complex interface
- Expensive (~$1,399/year)
- Slow production

Feels like PowerPoint on steroids.

### 3. Adobe Captivate

**Best for:** software simulations

- Screen recording
- Responsive projects

**Cons:**
- Outdated UX
- Steep learning curve

### 4. iSpring Suite

**Best for:** PowerPoint users

- Works inside PowerPoint
- Easy to start

**Cons:**
- Limited interactivity
- Not scalable for complex scenarios

### 5. Elucidat

**Best for:** large teams

- Cloud-based
- Collaboration features

**Cons:**
- Expensive
- Less flexible for complex logic

## What actually matters in 2026

Forget feature lists. The real criteria:

### 1. Speed of production
Can you build a course in hours, not weeks?

### 2. Interactivity
Slides ≠ learning. Scenarios and decisions = learning.

### 3. Flexibility
Can you build beyond linear slides?

## Final verdict

- If you need legacy workflows → **Storyline**
- If you want speed + modern UX → **cforj**
- If you want PowerPoint-based → **iSpring**

The trend is clear: **from slide-based → to interactive app-based learning.**""",
    },
    {
        "title": "Storyline Alternatives: 7 Tools That Are Faster and Simpler",
        "slug": "storyline-alternatives",
        "excerpt": "Articulate Storyline is powerful — but too complex for most teams. Here are modern alternatives that are faster, simpler, and more interactive.",
        "cover_image": "/uploads/blog/storyline-alternatives.svg",
        "tags": "storyline,alternatives,authoring tools,comparison",
        "published": True,
        "content": """## Why people look for Storyline alternatives

Articulate Storyline is powerful — but:

- Too complex for most teams
- Slow to build with
- Expensive
- Outdated UX model (timeline-based)

**The real question:** Do you actually need that complexity?

## What to look for instead

A modern alternative should have:

- No timeline
- Faster content creation
- Interactive logic (branching)
- Browser-based workflow

## Best Storyline alternatives

### 1. cforj — the modern approach

Instead of slides + timeline → you get:

- **Blocks** — modular content components
- **Logic** — event-driven interactions
- **Scenarios** — branching dialogues and simulations

You build learning like a product, not a presentation.

### 2. Rise 360

- Very easy to use
- Modern UI

**Limitation:** linear only, weak interactivity.

### 3. iSpring

- Simple
- PowerPoint-based

**Limitation:** not flexible for complex scenarios.

### 4. Adapt Learning

- Open-source
- Customizable

**Limitation:** requires dev skills.

### 5. Elucidat

- Enterprise tool
- Collaboration features

**Limitation:** expensive.

## Key shift: timeline → blocks

Storyline forces you to think in:
- Slides
- Animations

Modern tools shift to:
- **Blocks**
- **Logic**
- **Interaction**

This is the same evolution as:
- Photoshop → **Figma**
- Coding → **No-code**

## Final takeaway

Storyline isn't "bad" — it's just **built for a different era**.

If you want:
- ⚡ Speed
- 🎯 Interactivity
- 📈 Scalability

You need a different paradigm.""",
    },
    {
        "title": "How to Create an Online Course (Step-by-Step Guide)",
        "slug": "how-to-create-online-course",
        "excerpt": "A practical, no-fluff guide to creating an online course — from defining outcomes to publishing and iterating.",
        "cover_image": "/uploads/blog/how-to-create-online-course.svg",
        "tags": "online course,guide,tutorial,e-learning",
        "published": True,
        "content": """## Step 1. Define the outcome (not content)

**Wrong:**
> "We need a course about product X"

**Right:**
> "User should be able to do Y"

Start with what the learner should **be able to do** after the course, not what topics to cover.

## Step 2. Choose format

Options:
- Video
- Slides
- **Interactive scenarios** (best for engagement)

The more decisions the user makes → the better the learning.

## Step 3. Structure the course

Basic structure:

1. **Intro** — set context and expectations
2. **Core content** — teach the key concepts
3. **Practice** — let users apply knowledge
4. **Assessment** — verify understanding

With modern tools, this becomes a **flow**, not slides.

## Step 4. Add interactivity

Instead of:
- Reading
- Watching

Use:
- **Decisions** — choose between options
- **Simulations** — practice in safe environment
- **Dialogues** — train communication skills

## Step 5. Build the course

**Traditional way:**
1. Storyboard
2. Design
3. Development
*(weeks or months)*

**Modern way:**
1. Generate draft (AI)
2. Edit
3. Publish
*(hours or days)*

## Step 6. Publish

Options:
- **LMS** (SCORM) — track via learning management system
- **Website** (embed) — 2-click iframe integration
- **Standalone** — share direct link

## Step 7. Iterate

Track:
- Completion rates
- Common mistakes
- Drop-off points

Improve continuously based on real data.

## Key insight

> Courses fail not because of content — but because of **lack of interaction**.

The best courses are the ones where learners make decisions, not just consume information.""",
    },
    {
        "title": "Interactive Learning Examples (That Actually Work)",
        "slug": "interactive-learning-examples",
        "excerpt": "People don't learn by watching — they learn by doing. Here are 5 interactive learning formats that drive real engagement and retention.",
        "cover_image": "/uploads/blog/interactive-learning-examples.svg",
        "tags": "interactive learning,examples,engagement,e-learning",
        "published": True,
        "content": """## Why most courses fail

Because they are:
- Passive
- Linear
- Predictable

**People don't learn by watching — they learn by doing.**

## Example 1: Dialogue simulation

**Use case:** sales training, customer support

The user:
- Chooses a response
- Sees consequences
- Trains real behavior

Instead of reading "how to handle an objection", the learner **practices handling it**.

## Example 2: Branching scenario

User decisions:
- Lead to **different outcomes**
- Mimic **real-life situations**

Great for compliance, onboarding, and soft skills training. Every choice matters.

## Example 3: Software simulation

- Click through UI
- Practice real tasks
- Best for onboarding and tool training

Instead of a screenshot tutorial, users **actually interact** with a simulated interface.

## Example 4: Hotspot interaction

- Explore an image
- Find and click on elements
- Good for technical training, equipment, safety

Turns static images into **interactive discovery experiences**.

## Example 5: Drag & drop

- Match concepts
- Build sequences
- Sort categories

Simple but effective. Works great for vocabulary, processes, and classification exercises.

## Key takeaway

> The best learning experiences **feel like interaction, not content**.

When learners are making choices, solving problems, and exploring — that's when real learning happens. Stop building slides. Start building experiences.""",
    },
    {
        "title": "Branching Scenarios Guide (Complete + Examples)",
        "slug": "branching-scenarios-guide",
        "excerpt": "A complete guide to branching scenarios — what they are, why they work, types, examples, and how to build your first one.",
        "cover_image": "/uploads/blog/branching-scenarios-guide.svg",
        "tags": "branching scenarios,guide,interactive,e-learning",
        "published": True,
        "content": """## What is a branching scenario?

A branching scenario is **a learning experience where user decisions change the outcome**.

Instead of a linear path, you get:
- Multiple paths
- Real consequences
- Unique endings based on choices

## Why branching works

Because it:
- **Simulates real situations** — closest to on-the-job experience
- **Forces decision-making** — active, not passive
- **Creates emotional engagement** — choices feel personal

## Basic structure

Every branching scenario follows this pattern:

1. **Situation** — set the scene
2. **Choice** — present options
3. **Outcome** — show consequences
4. **Next step** — continue the flow

## Example: angry customer

**Scenario:** A customer calls, furious about a delayed delivery.

**Choice:**
- A) Apologize and offer solution
- B) Argue that it's not your fault
- C) Ignore and transfer to another department

**Each leads to a different outcome** — and a different learning moment.

## Types of branching

### 1. Simple branching
- Few choices (2-3 per decision point)
- Short paths
- Good for beginners

### 2. Complex branching
- Multiple interconnected paths
- Longer scenarios
- More realistic

### 3. Adaptive scenarios
- Based on cumulative user behavior
- Dynamic difficulty
- Most engaging but hardest to build

## How to build branching scenarios

### Step 1: Define the situation
What real-world challenge are you simulating?

### Step 2: Define key decisions
What are the 2-3 critical choices at each point?

### Step 3: Map outcomes
What happens after each choice? What's the consequence?

### Step 4: Connect the flow
Build the branching tree. Keep it manageable.

## Common mistakes

- **Too many branches** — exponential complexity, hard to maintain
- **No real consequences** — all paths lead to same ending = no learning
- **Unrealistic scenarios** — learners disengage if it doesn't feel real

## Pro tip

> Start simple: **3 choices → 3 outcomes**.
> You can always add complexity later.

## Final insight

> Branching scenarios are **the closest thing to real experience** in digital learning.

They turn passive consumption into active decision-making. That's where real behavior change happens.""",
    },
]


async def main():
    from app.database import engine, AsyncSessionLocal
    from app.models import BlogPost, User
    from sqlalchemy import select

    async with AsyncSessionLocal() as db:
        # Get admin user
        result = await db.execute(select(User).where(User.plan == "admin"))
        admin = result.scalar_one_or_none()
        if not admin:
            # fallback: get first user
            result = await db.execute(select(User).limit(1))
            admin = result.scalar_one_or_none()

        if not admin:
            print("No users found. Create a user first.")
            return

        print(f"Using author: {admin.name} ({admin.email})")

        for i, article in enumerate(ARTICLES):
            # Check if slug exists
            existing = await db.execute(
                select(BlogPost).where(BlogPost.slug == article["slug"])
            )
            if existing.scalar_one_or_none():
                print(f"  SKIP: '{article['title']}' (already exists)")
                continue

            post = BlogPost(
                id=str(uuid.uuid4()),
                slug=article["slug"],
                title=article["title"],
                excerpt=article["excerpt"],
                content=article["content"],
                cover_image=article["cover_image"],
                tags=article["tags"],
                published=article["published"],
                author_id=admin.id,
                created_at=datetime.utcnow() - timedelta(days=5 - i),
                updated_at=datetime.utcnow() - timedelta(days=5 - i),
            )
            db.add(post)
            print(f"  ADD: '{article['title']}'")

        await db.commit()
        print("\nDone! 5 articles seeded.")


if __name__ == "__main__":
    asyncio.run(main())
