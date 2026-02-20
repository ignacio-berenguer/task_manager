"""Formatting and data helper utilities for chart rendering."""

import math


def format_currency(value: float) -> str:
    """Format value as Spanish currency: 1.234.567 €."""
    if value is None or math.isnan(value):
        return "0 \u20ac"
    sign = "-" if value < 0 else ""
    abs_val = abs(value)
    integer_part = int(abs_val)
    formatted = f"{integer_part:,}".replace(",", ".")
    return f"{sign}{formatted} \u20ac"


def format_number(value: float) -> str:
    """Format value with Spanish thousands separator: 1.234.567."""
    if value is None or math.isnan(value):
        return "0"
    sign = "-" if value < 0 else ""
    abs_val = abs(value)
    integer_part = int(abs_val)
    formatted = f"{integer_part:,}".replace(",", ".")
    return f"{sign}{formatted}"


def format_compact(value: float) -> str:
    """Format large numbers compactly: 1,2 M€ or 534 k€."""
    if value is None or math.isnan(value):
        return "0 \u20ac"
    sign = "-" if value < 0 else ""
    abs_val = abs(value)
    if abs_val >= 1_000_000:
        compact = abs_val / 1_000_000
        if compact == int(compact):
            return f"{sign}{int(compact)} M\u20ac"
        return f"{sign}{compact:,.1f} M\u20ac".replace(",", "X").replace(".", ",").replace("X", ".")
    if abs_val >= 1_000:
        compact = abs_val / 1_000
        if compact == int(compact):
            return f"{sign}{int(compact)} k\u20ac"
        return f"{sign}{compact:,.1f} k\u20ac".replace(",", "X").replace(".", ",").replace("X", ".")
    return f"{sign}{abs_val:,.0f} \u20ac".replace(",", ".")


def format_value(value: float, fmt: str = "numero") -> str:
    """Format a value according to the specified format type."""
    if fmt == "moneda":
        return format_compact(value)
    if fmt == "porcentaje":
        return f"{value:.1f}%".replace(".", ",")
    return format_number(value)


def truncate_label(text: str, max_len: int = 25) -> str:
    """Truncate text with ellipsis if too long."""
    if text is None:
        return "(vacío)"
    text = str(text)
    if len(text) <= max_len:
        return text
    return text[: max_len - 1] + "\u2026"


def group_small_categories(
    data: list[dict],
    max_categories: int,
    other_label: str = "Otros",
) -> list[dict]:
    """Group tail entries into an 'Otros' category if too many.

    Expects data sorted by value descending.
    Each dict must have 'etiqueta' and 'valor' keys.
    """
    if len(data) <= max_categories:
        return data

    keep = data[: max_categories - 1]
    rest = data[max_categories - 1 :]
    otros_total = sum(item.get("valor", 0) or 0 for item in rest)
    keep.append({"etiqueta": other_label, "valor": otros_total})
    return keep
