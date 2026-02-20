"""Color palettes and matplotlib styling for portfolio charts."""

# Primary palette (8 colors) — consistent with frontend recharts palette
PORTFOLIO_COLORS = [
    "#3b82f6",  # Blue
    "#10b981",  # Emerald
    "#f59e0b",  # Amber
    "#ef4444",  # Red
    "#8b5cf6",  # Violet
    "#ec4899",  # Pink
    "#06b6d4",  # Cyan
    "#84cc16",  # Lime
]

# Extended palette for 9-15 categories
PORTFOLIO_COLORS_EXTENDED = PORTFOLIO_COLORS + [
    "#f97316",  # Orange
    "#6366f1",  # Indigo
    "#14b8a6",  # Teal
    "#e11d48",  # Rose
    "#a855f7",  # Purple
    "#22c55e",  # Green
    "#eab308",  # Yellow
]


def get_colors(n: int) -> list[str]:
    """Return a list of n colors from the portfolio palette."""
    palette = PORTFOLIO_COLORS if n <= 8 else PORTFOLIO_COLORS_EXTENDED
    # Cycle if more categories than colors
    return [palette[i % len(palette)] for i in range(n)]


def apply_theme(fig, ax):
    """Apply consistent portfolio styling to a matplotlib figure/axes."""
    fig.patch.set_facecolor("white")
    ax.set_facecolor("white")

    # Grid
    ax.grid(True, axis="y", linestyle="--", alpha=0.3, color="#94a3b8")
    ax.set_axisbelow(True)

    # Spines
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["left"].set_color("#e2e8f0")
    ax.spines["bottom"].set_color("#e2e8f0")

    # Tick styling
    ax.tick_params(colors="#64748b", labelsize=9)
