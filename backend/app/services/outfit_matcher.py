from dataclasses import dataclass
from itertools import product

from app.models import ClothingItem, ClothingItemFeature


@dataclass
class MatchCandidate:
    item: ClothingItem
    feature: ClothingItemFeature


@dataclass
class OutfitMatch:
    score: int
    reason: str
    items: list[MatchCandidate]


def _base_score_for_tpo(tpo: str, avg_formality: float) -> int:
    if tpo == "office":
        return 30 if avg_formality >= 4 else 10
    if tpo == "date":
        return 25 if avg_formality >= 3 else 15
    if tpo == "active":
        return 30 if avg_formality <= 2 else 10
    return 20


def score_outfit(tpo: str, season: str | None, items: list[MatchCandidate]) -> tuple[int, str]:
    score = 40
    reasons: list[str] = []

    styles = [x.feature.style for x in items if x.feature.style]
    if len(set(styles)) <= 1 and styles:
        score += 20
        reasons.append("스타일 일관성")

    formalities = [x.feature.formality for x in items if x.feature.formality is not None]
    if formalities:
        avg_formality = sum(formalities) / len(formalities)
        score += _base_score_for_tpo(tpo, avg_formality)
        reasons.append(f"TPO 적합도({tpo})")

    if season:
        season_matches = [x for x in items if x.feature.season in (season, "all", None)]
        if len(season_matches) == len(items):
            score += 10
            reasons.append("시즌 적합")

    warmths = [x.feature.warmth for x in items if x.feature.warmth is not None]
    if warmths and max(warmths) - min(warmths) <= 2:
        score += 10
        reasons.append("두께감 균형")

    return min(100, score), ", ".join(reasons) if reasons else "기본 조합"


def build_outfit_combinations(
    tpo: str,
    season: str | None,
    tops: list[MatchCandidate],
    bottoms: list[MatchCandidate],
    outers: list[MatchCandidate],
    onepieces: list[MatchCandidate],
    limit: int = 12,
) -> list[OutfitMatch]:
    results: list[OutfitMatch] = []

    # onepiece + outer(optional)
    for one in onepieces:
        base_items = [one]
        score, reason = score_outfit(tpo, season, base_items)
        results.append(OutfitMatch(score=score, reason=reason, items=[one]))

        for outer in outers:
            candidates = [one, outer]
            score, reason = score_outfit(tpo, season, candidates)
            results.append(OutfitMatch(score=score, reason=reason, items=[one, outer]))

    # top + bottom + outer(optional)
    for top, bottom in product(tops, bottoms):
        base_candidates = [top, bottom]
        score, reason = score_outfit(tpo, season, base_candidates)
        results.append(OutfitMatch(score=score, reason=reason, items=[top, bottom]))

        for outer in outers:
            candidates = [top, bottom, outer]
            score, reason = score_outfit(tpo, season, candidates)
            results.append(OutfitMatch(score=score, reason=reason, items=[top, bottom, outer]))

    results.sort(key=lambda x: x.score, reverse=True)
    return results[:limit]
