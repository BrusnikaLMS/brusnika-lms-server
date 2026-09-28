import csv
import io
from datetime import datetime, UTC
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models import User, Course, CourseCompletion
from app.schemas import CompletionIn, CompletionOut
from app.auth import get_current_user

router = APIRouter(prefix="/analytics", tags=["analytics"])

PRO_PLANS = {"pro", "enterprise", "admin"}


@router.post("/completions", response_model=CompletionOut)
async def record_completion(body: CompletionIn, db: AsyncSession = Depends(get_db)):
    # Verify the course exists and is published before accepting completion data
    course = await db.get(Course, body.course_id)
    if not course or not course.published:
        raise HTTPException(status_code=404, detail="Course not found")
    completion = CourseCompletion(
        course_id=body.course_id,
        learner_id=body.learner_id,
        learner_name=body.learner_name,
        score=body.score,
        max_score=body.max_score,
        completed=body.completed,
        progress=body.progress,
        completed_at=datetime.now(UTC) if body.completed else None,
    )
    db.add(completion)
    await db.commit()
    await db.refresh(completion)
    return completion


@router.get("/courses/{course_id}", response_model=dict)
async def course_analytics(
    course_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.plan not in PRO_PLANS:
        raise HTTPException(status_code=403, detail="Analytics requires Pro plan")

    course = await db.get(Course, course_id)
    if not course or course.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Course not found")

    result = await db.execute(
        select(
            func.count(CourseCompletion.id).label("total_starts"),
            func.count(CourseCompletion.completed_at).label("total_completions"),
            func.avg(CourseCompletion.score).label("avg_score"),
        ).where(CourseCompletion.course_id == course_id)
    )
    row = result.one()

    completions_result = await db.execute(
        select(CourseCompletion)
        .where(CourseCompletion.course_id == course_id)
        .order_by(CourseCompletion.started_at.desc())
        .limit(100)
    )
    completions = completions_result.scalars().all()

    total_starts = row.total_starts or 0

    screens = []
    content = course.content or {}
    if isinstance(content, dict):
        screens = content.get("screens", [])

    screen_funnel = []
    for screen in screens:
        sid = screen.get("id", "")
        title = screen.get("title", "Untitled")
        visits = sum(
            1 for c in completions
            if isinstance(c.progress, dict)
            and sid in (c.progress.get("visitedScreens") or [])
        )
        pct = round(visits / max(total_starts, 1) * 100, 1)
        screen_funnel.append({"screen_id": sid, "title": title, "visits": visits, "pct": pct})

    quiz_components: list[dict] = []
    for screen in screens:
        for comp in screen.get("components", []):
            if comp.get("type") in ("quiz-single", "quiz-multi", "true-false"):
                quiz_components.append(comp)

    quiz_map: dict[str, dict] = {}
    for comp in quiz_components:
        qid = comp.get("id", "")
        question_text = comp.get("question", comp.get("props", {}).get("question", qid))
        quiz_map[qid] = {"question_id": qid, "question_text": question_text, "correct_count": 0, "total_answers": 0}

    for c in completions:
        if not isinstance(c.progress, dict):
            continue
        quiz_answers = c.progress.get("quizAnswers") or {}
        for qid, answer in quiz_answers.items():
            if qid not in quiz_map:
                quiz_map[qid] = {"question_id": qid, "question_text": qid, "correct_count": 0, "total_answers": 0}
            quiz_map[qid]["total_answers"] += 1
            if isinstance(answer, dict) and answer.get("correct"):
                quiz_map[qid]["correct_count"] += 1
            elif answer is True:
                quiz_map[qid]["correct_count"] += 1

    quiz_breakdown = []
    for item in quiz_map.values():
        total = item["total_answers"]
        pct = round(item["correct_count"] / max(total, 1) * 100, 1) if total > 0 else 0.0
        quiz_breakdown.append({
            "question_id": item["question_id"],
            "question_text": item["question_text"],
            "correct_count": item["correct_count"],
            "total_answers": total,
            "pct_correct": pct,
        })

    # Compute average time per screen from screenTimes data in progress JSON
    screen_time_totals: dict[str, list[float]] = {}
    for c in completions:
        if not isinstance(c.progress, dict):
            continue
        screen_times = c.progress.get("screenTimes") or {}
        if not isinstance(screen_times, dict):
            continue
        for sid, ms in screen_times.items():
            if isinstance(ms, (int, float)) and ms > 0:
                if sid not in screen_time_totals:
                    screen_time_totals[sid] = []
                screen_time_totals[sid].append(float(ms))

    # Build screen title lookup
    screen_title_map = {s.get("id", ""): s.get("title", "Untitled") for s in screens}

    avg_screen_times = []
    for sid, times in screen_time_totals.items():
        avg_ms = sum(times) / len(times)
        avg_screen_times.append({
            "screen_id": sid,
            "title": screen_title_map.get(sid, sid),
            "avg_ms": round(avg_ms, 1),
        })
    # Sort by screen order in the course
    screen_order = {s.get("id", ""): i for i, s in enumerate(screens)}
    avg_screen_times.sort(key=lambda x: screen_order.get(x["screen_id"], 9999))

    return {
        "course_id": course_id,
        "view_count": course.view_count or 0,
        "total_starts": total_starts,
        "total_completions": row.total_completions or 0,
        "completion_rate": round((row.total_completions or 0) / max(total_starts, 1) * 100, 1),
        "avg_score": round(float(row.avg_score or 0), 1),
        "quiz_breakdown": quiz_breakdown,
        "screen_funnel": screen_funnel,
        "avg_screen_times": avg_screen_times,
        "learners": [
            {
                "id": c.learner_id,
                "name": c.learner_name,
                "score": c.score,
                "max_score": c.max_score,
                "completed": c.completed,
                "started_at": c.started_at,
                "completed_at": c.completed_at,
            }
            for c in completions
        ],
    }


@router.get("/courses/{course_id}/export.csv")
async def export_analytics_csv(
    course_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.plan not in PRO_PLANS:
        raise HTTPException(status_code=403, detail="Analytics requires Pro plan")

    course = await db.get(Course, course_id)
    if not course or course.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Course not found")

    completions_result = await db.execute(
        select(CourseCompletion)
        .where(CourseCompletion.course_id == course_id)
        .order_by(CourseCompletion.started_at.desc())
        .limit(10000)
    )
    completions = completions_result.scalars().all()

    screens = []
    content = course.content or {}
    if isinstance(content, dict):
        screens = content.get("screens", [])
    total_screens = max(len(screens), 1)

    # Compute per-screen avg times for CSV
    screen_time_totals_csv: dict[str, list[float]] = {}
    for c in completions:
        if not isinstance(c.progress, dict):
            continue
        screen_times = c.progress.get("screenTimes") or {}
        if not isinstance(screen_times, dict):
            continue
        for sid, ms in screen_times.items():
            if isinstance(ms, (int, float)) and ms > 0:
                if sid not in screen_time_totals_csv:
                    screen_time_totals_csv[sid] = []
                screen_time_totals_csv[sid].append(float(ms))

    screen_title_map_csv = {s.get("id", ""): s.get("title", "Untitled") for s in screens}

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["learner_name", "learner_id", "score", "max_score", "completed", "started_at", "completed_at", "percent_screens_visited"])

    for c in completions:
        visited = 0
        if isinstance(c.progress, dict):
            visited = len(c.progress.get("visitedScreens") or [])
        pct_visited = round(visited / total_screens * 100, 1)
        writer.writerow([
            c.learner_name or "",
            c.learner_id or "",
            c.score,
            c.max_score,
            c.completed,
            c.started_at.isoformat() if c.started_at else "",
            c.completed_at.isoformat() if c.completed_at else "",
            pct_visited,
        ])

    # Append avg screen times section
    if screen_time_totals_csv:
        writer.writerow([])
        writer.writerow(["screen_id", "screen_title", "avg_time_ms", "avg_time_formatted"])
        for sid, times in screen_time_totals_csv.items():
            avg_ms = sum(times) / len(times)
            total_s = int(avg_ms / 1000)
            mins = total_s // 60
            secs = total_s % 60
            formatted = f"{mins}m {secs}s"
            writer.writerow([sid, screen_title_map_csv.get(sid, sid), round(avg_ms, 1), formatted])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=\"analytics_{course_id}.csv\""},
    )
